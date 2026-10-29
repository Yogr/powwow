"""Run separately from ASGI: python -m powwow.worker.

PostgreSQL leases are fenced by generation. Browser disconnects have no effect on
job execution. Recoverable Runpod requests reconcile their saved request ID.
"""
import base64
import json
import logging
import signal
import socket
import threading
import time
from datetime import timedelta

from sqlalchemy import or_, select
from sqlalchemy.exc import SQLAlchemyError

from .config import settings
from .db import SessionLocal, init_db, now, uid
from .models import Artifact, Message, Run, StageAttempt
from .providers import Cancelled, ProviderFailure, chat_messages, fixture_result, local_media, ollama_chat, runpod
from .hosted_chat import openai_chat
from .registry import SKILLS, run_skill_ids
from .service import TERMINAL, account_for_update, emit, settle_usage
from .storage import MIME_EXT, Storage, digest, kind_for, validate_content
from .search import SearchUnavailable, web_search

log = logging.getLogger("powwow.worker")
WORKER_ID = f"{socket.gethostname()}-{uid()[:8]}"
STOP = threading.Event()
PUBLIC_ERRORS = {
    "submission_uncertain": "We could not confirm whether generation started. This request needs review before it can be retried.",
    "cancellation_unconfirmed": "Cancellation has not been confirmed. Please wait before starting another request.",
    "worker_interrupted": "Generation was interrupted. You can retry this request.",
    "provider_offline": "Powwow's generation service is temporarily unavailable. Please try again shortly.",
    "provider_unavailable": "This capability is temporarily unavailable. Please try again later.",
    "provider_error": "Powwow could not start generation. Please try again shortly.",
    "provider_rejected": "Powwow could not start generation. Please try again shortly.",
    "model_error": "Powwow could not finish this request. You can retry or adjust your brief.",
    "invalid_output": "The generated file did not pass validation. You can retry this request.",
    "empty_output": "Generation finished without a usable file. Please try again.",
    "empty_response": "Powwow received an empty response. Please try again.",
    "invalid_language_reply": "Your conversation partner's reply could not be prepared with reliable translations. Your message is saved; retry to continue.",
    "postprocessing_failed": "The 3D model was created, but its final checks did not finish. Your raw file is saved in Outputs.",
    "execution_error": "Powwow could not finish this request. Please try again.",
}


def finish_project_update(db, current):
    """Resume a saved reply's local writes without submitting to a provider."""
    run_id = current.id
    try:
        from .project_experience import ProjectReply, apply_reply
        applied = apply_reply(db, current, ProjectReply.model_validate(current.model_provenance["project_reply"]))
        current.model_provenance = {**current.model_provenance, "project_update": applied}
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise  # The durable pending marker allows a later local-only attempt.
    except Exception:
        db.rollback()
        current = db.scalar(select(Run).where(Run.id == run_id).with_for_update())
        current.model_provenance = {**current.model_provenance, "project_update": {"status": "needs_review", "message": "Your reply is saved. The proposed project updates need review because the project changed or an update failed validation."}}
        db.commit()
        log.warning("Project update needs review for run %s", run_id)


def claim() -> tuple[str, int] | None:
    with SessionLocal() as db:
        pending = db.scalar(select(Run).where(Run.status == "succeeded", Run.model_provenance["project_update"]["status"].as_string() == "pending").order_by(Run.completed_at).with_for_update(skip_locked=True).limit(1))
        if pending:
            finish_project_update(db, pending)
        stale = Run.status.in_(["preparing", "running", "postprocessing", "cancel_requested"]) & (Run.lease_expires_at < now())
        query = select(Run).where(or_(Run.status == "queued", stale))
        if settings().worker_capabilities:
            query = query.where(Run.capability.in_([item.strip() for item in settings().worker_capabilities.split(",")]))
        run = db.scalar(query.order_by(Run.created_at).with_for_update(skip_locked=True).limit(1))
        if not run:
            return None
        expired = run.status != "queued"
        if expired and run.submission_started and (run.workflow_id == 'asset.production.v1' or run.provider == "openai" or (run.provider == "runpod" and not run.external_request_id)):
            run.status, run.stage = "failed", "failed"
            run.error = {"code": "submission_uncertain", "message": PUBLIC_ERRORS["submission_uncertain"]}
            run.completed_at = now()
            emit(db, run, "run.failed", {"error": run.error})
            db.commit()
            return None
        if expired and run.lease_generation >= 2 and not run.external_request_id:
            run.status, run.stage = "failed", "failed"
            run.error = {"code": "worker_interrupted", "message": PUBLIC_ERRORS["worker_interrupted"]}
            run.completed_at = now()
            settle_usage(db, run, 0, run.actual_cost_usd, "worker interrupted; completed stages retained")
            emit(db, run, "run.failed", {"error": run.error})
            db.commit()
            return None
        run.lease_owner = WORKER_ID
        run.lease_generation += 1
        run.lease_expires_at = now() + timedelta(seconds=settings().worker_lease_seconds)
        if run.status != "cancel_requested":
            run.status, run.stage = "preparing", "prepare"
        run.started_at = run.started_at or now()
        emit(db, run, "run.preparing", {"status": run.status, "recovered": expired, "lease_generation": run.lease_generation})
        db.commit()
        return run.id, run.lease_generation


def locked(db, run_id: str, generation: int):
    run = db.scalar(select(Run).where(Run.id == run_id).with_for_update())
    if run is None or run.lease_generation != generation or run.lease_owner != WORKER_ID or run.status in TERMINAL:
        raise ProviderFailure("lease_lost", "A newer worker owns this run.")
    return run


def execute(run_id: str, generation: int):
    cancellation, finished, lease_lost = threading.Event(), threading.Event(), threading.Event()
    started = time.monotonic()

    def heartbeat():
        while not finished.wait(max(1, settings().worker_lease_seconds / 4)):
            try:
                with SessionLocal() as db:
                    current = locked(db, run_id, generation)
                    if current.status == "cancel_requested":
                        cancellation.set()
                    current.lease_expires_at = now() + timedelta(seconds=settings().worker_lease_seconds)
                    db.commit()
            except ProviderFailure:
                lease_lost.set()
                cancellation.set()
                return
            except Exception:
                log.exception("Worker heartbeat failed for %s", run_id)
                # Stop accepting results when the lease cannot be renewed.
                lease_lost.set()
                cancellation.set()
                return

    thread = threading.Thread(target=heartbeat, daemon=True)
    thread.start()

    def check_cancelled():
        if lease_lost.is_set():
            raise ProviderFailure("lease_lost", "A newer worker owns this run.")
        with SessionLocal() as db:
            current = locked(db, run_id, generation)
            if current.status == "cancel_requested":
                cancellation.set()
        return cancellation.is_set()

    def stage(stage_id: str, payload: dict | None = None):
        with SessionLocal() as db:
            run = locked(db, run_id, generation)
            if stage_id not in {"validate", "save"}:
                from .collaboration import guard_run_access
                guard_run_access(db, run, (payload or {}).get("model"))
            if run.status == "cancel_requested":
                cancellation.set()
                raise Cancelled()
            run.stage = stage_id
            run.status = "postprocessing" if stage_id in ["validate", "save"] else "running"
            for previous in db.scalars(select(StageAttempt).where(StageAttempt.run_id == run.id, StageAttempt.status == "running")):
                previous.status, previous.completed_at = "succeeded", now()
            emit(db, run, "stage.changed", {"stage": stage_id, "status": run.status, **(payload or {})})
            db.add(StageAttempt(run_id=run.id, stage_id=stage_id, attempt=generation, status="running", details=payload or {}))
            db.commit()

    def on_text(delta: str):
        with SessionLocal() as db:
            run = locked(db, run_id, generation)
            if run.status == "cancel_requested":
                cancellation.set()
                raise Cancelled()
            run.output_text += delta
            emit(db, run, "text.delta", {"delta": delta})
            db.commit()

    def external_id(value: str):
        with SessionLocal() as db:
            run = locked(db, run_id, generation)
            run.external_request_id = value
            emit(db, run, "provider.submitted", {"provider": "runpod", "request_id": value})
            db.commit()

    result = None
    def mark_hosted_submitted():
        with SessionLocal() as db:
            current = locked(db, run_id, generation)
            from .collaboration import guard_run_access
            guard_run_access(db, current, run.settings.get("intelligence_policy", {}).get("model"))
            if current.status == "cancel_requested":
                raise Cancelled()
            if run.settings.get("project_experience") and "hosted_input_tokens" in run.settings:
                from .intelligence import maximum_cost
                tokens = run.settings["hosted_input_tokens"]
                policy = {**run.settings["intelligence_policy"], "max_input_tokens": tokens}
                required = maximum_cost(policy)
                if settings().spending_limits_enabled and current.actual_cost_usd + required > current.budget_usd + 1e-9:
                    raise ProviderFailure("budget_too_low", "This request exceeds the available processing budget. No response was submitted.")
                extra = max(0, required - current.reservation_usd)
                account = account_for_update(db, current.owner_id)
                if settings().spending_limits_enabled and account.spent_usd + account.reserved_usd + extra > account.budget_usd + 1e-9:
                    raise ProviderFailure("account_budget", "Your processing allowance is used or reserved by work in progress. No response was submitted.")
                account.reserved_usd += extra
                current.reservation_usd += extra
                current.settings = {**current.settings, "hosted_input_tokens": tokens, "intelligence_policy": run.settings["intelligence_policy"]}
                current.model_provenance = {**current.model_provenance, "input_estimate": {"tokens": tokens, "source": "openai-input-tokens", "stage": current.settings.get("experience_stage")}}
            current.submission_started = True
            emit(db, current, "provider.submitted", {"provider": "openai"})
            db.commit()

    def experience_checkpoint(run, updates, classified=None):
        with SessionLocal() as db:
            current = locked(db, run_id, generation)
            if current.status == "cancel_requested":
                raise Cancelled()
            current.settings = {**current.settings, **updates}
            if updates.get("experience_stage"):
                current.settings.pop("hosted_input_tokens", None)
            run.settings = current.settings
            if classified is not None:
                # Charge the completed classifier now. Retain the remaining
                # reservation if the response submission later becomes unknown.
                cost = classified.get("metrics", {}).get("cost_estimate_usd", 0)
                account = account_for_update(db, current.owner_id)
                account.spent_usd += cost
                account.reserved_usd = max(0, account.reserved_usd - cost)
                current.actual_cost_usd += cost
                current.reservation_usd = max(0, current.reservation_usd - cost)
                current.submission_started = False
                current.model_provenance = {**current.model_provenance, "classifier": classified}
                run.model_provenance = current.model_provenance
            if updates.get("experience_intro"):
                current.output_text = updates["experience_intro"]
            if updates.get("experience_destination"):
                current.model_provenance = {**current.model_provenance, "experience_destination": updates["experience_destination"]}
            if updates.get("intelligence_policy"):
                current.model = updates["intelligence_policy"]["model"]
                run.model = current.model
            db.commit()

    try:
        with SessionLocal() as db:
            run = locked(db, run_id, generation)
            db.expunge(run)
        if run.status == "cancel_requested":
            if run.provider == "runpod" and run.external_request_id:
                # A recovered worker must cancel the already-submitted GPU job.
                runpod(run, {}, external_id, check_cancelled, stage)
            raise Cancelled()
        if run.settings.get("project_experience"):
            from .project_experience import ExperienceIntent, validate_intent
            from .intelligence import CLASSIFIER_POLICY
            if run.provider not in {"openai", "test"}:
                raise ProviderFailure("provider_unavailable", "Request planning requires the configured hosted model.")
            if not run.settings.get("experience_intent"):
                stage("classify", {"model": CLASSIFIER_POLICY["model"]})
                experience_checkpoint(run, {"experience_stage": "classify", "intelligence_policy": CLASSIFIER_POLICY})
                result = openai_chat(run, check_cancelled, mark_hosted_submitted) if run.provider == "openai" else fixture_result(run)
                if result.get("error"):
                    raise ProviderFailure(result.get("error_code") or "model_error", result["error"])
                intent = validate_intent(result["text"])
                experience_checkpoint(run, {"experience_intent": intent.model_dump()}, classified=result)
                result = None
            intent = ExperienceIntent.model_validate(run.settings["experience_intent"])
            if intent.action == "media" and not run.settings.get("planner_evaluation"):
                from .media_planning import activate_media
                with SessionLocal() as db:
                    current = locked(db, run_id, generation)
                    activate_media(db, current, intent.media)
                    db.refresh(current)
                    db.expunge(current)
                    run = current
        if run.settings.get('task_plan'):
            from .task_execution import execute as execute_tasks
            result = execute_tasks(run, generation, locked, stage, check_cancelled)
            with SessionLocal() as db:
                current = locked(db, run_id, generation)
                current.output_text = result['text']
                current.status, current.stage, current.progress = 'succeeded', 'complete', 1.0
                current.completed_at = now()
                current.lease_expires_at = None
                current.submission_started = False
                if not db.scalar(select(Message).where(Message.run_id == current.id)):
                    db.add(Message(owner_id=current.owner_id, chat_id=current.chat_id, role='assistant', content=current.output_text, attachment_ids=current.artifact_ids, run_id=current.id))
                settle_usage(db, current, time.monotonic() - started, current.actual_cost_usd, 'per-task model usage; invoice reconciliation required')
                emit(db, current, 'run.succeeded', {'status': 'succeeded', 'artifact_ids': current.artifact_ids, 'output_text': current.output_text})
                db.commit()
            return
        skill_ids = run_skill_ids(run)
        if run.settings.get("language_learning") and run.provider not in {"openai", "test"}:
            raise ProviderFailure("language_model_required", "This saved request uses a model below the language quality baseline. Retry after connecting the hosted language model.")
        stage("prepare", {"skills": skill_ids, "context_source_count": len(run.context_snapshot)})
        if run.capability == "chat" and run.settings.get("web_search"):
            prior_sources = [s for s in run.context_snapshot if s.get("source_type") == "web"]
            if not prior_sources:
                stage("lookup", {"provider": "Brave" if settings().brave_api_key else "Wikipedia"})
                try:
                    query = run.model_provenance.get("routing", {}).get("search_query") or run.prompt
                    sources = web_search(query, settings().brave_api_key)
                except SearchUnavailable as exc:
                    raise ProviderFailure("search_unavailable", str(exc)) from exc
                run.context_snapshot = run.context_snapshot + sources
                with SessionLocal() as db:
                    current = locked(db, run_id, generation)
                    current.context_snapshot = run.context_snapshot
                    emit(db, current, "sources.retrieved", {"sources": sources, "count": len(sources)})
                    db.commit()
        prepared_prompt = run.settings.get("media_plan", {}).get("brief") or run.prompt
        if run.capability == "text_to_image":
            prepared_prompt = " ".join(prepared_prompt.split()) + "\nCreative direction: preserve all requested subjects, exact quoted lettering, style, composition, and constraints. Use cohesive lighting and a clear focal point where compatible with the brief."
        elif run.capability == "image_to_video":
            prepared_prompt = " ".join(prepared_prompt.split()) + "\nMotion direction: preserve the source subject's appearance and scene. Keep camera and subject motion coherent. Avoid unintended identity changes, scene cuts, or extra subjects."
        with SessionLocal() as db:
            current = locked(db, run_id, generation)
            current.model_provenance = {**current.model_provenance, "original_prompt": run.prompt, "prepared_prompt": prepared_prompt, "preparation": "versioned skill instructions@1"}
            db.commit()
        payload = {"capability": run.capability, "prompt": prepared_prompt, "settings": run.settings, "skills": [{"id": skill["id"], "instructions": skill["instructions"]} for skill in SKILLS if skill["id"] in skill_ids]}
        if run.capability == "chat":
            payload["messages"] = chat_messages(run)
        if run.capability in ["image_to_video", "image_to_3d"] or run.settings.get("media_operation") == "edit":
            source_ids = run.settings.get("media_source_ids", run.attachment_ids)
            with SessionLocal() as db:
                from .service import check_attachments
                images = {item.id: item for item in check_attachments(db, run.owner_id, source_ids) if item.kind == "image"}
                artifact = next((images[item_id] for item_id in source_ids if item_id in images), None)
                if not artifact:
                    raise ProviderFailure("image_missing", "The source image is unavailable.")
                references = [{"base64": base64.b64encode(Storage().read(images[item_id].storage_key)).decode(), "mime_type": images[item_id].mime_type, "artifact_id": item_id} for item_id in source_ids if item_id in images]
                if run.settings.get("media_operation") == "edit":
                    payload["source_images"] = references
                else:
                    payload["source_image"] = references[0]
        output_mime = {"text_to_image": "image/png", "image_to_video": "video/mp4", "image_to_3d": "model/gltf-binary"}.get(run.capability)
        expected_output_key = f"{run.owner_id}/runs/{run.id}/output{MIME_EXT[output_mime]}" if output_mime else None
        allowed_output_keys = {expected_output_key} if expected_output_key else set()
        if output_mime and run.provider in ["runpod", "local_media"]:
            signed = Storage().sign_output(expected_output_key, output_mime)
            if signed:
                payload["output_upload"] = signed
                if run.capability == "image_to_3d":
                    raw_key = f"{run.owner_id}/runs/{run.id}/raw.glb"
                    allowed_output_keys.add(raw_key)
                    payload["output_uploads"] = {"raw": Storage().sign_output(raw_key, output_mime), "final": signed}
        stage("generate", {"model": run.model, "provider": run.provider})
        if run.settings.get("project_experience"):
            from .project_experience import DESTINATIONS, ExperienceIntent, ProjectReply, setup_experience, validate_intent
            from .intelligence import CLASSIFIER_POLICY, project_policy
            if run.provider not in {"openai", "test"}:
                raise ProviderFailure("provider_unavailable", "Project experiences require the configured hosted models.")
            intent = ExperienceIntent.model_validate(run.settings["experience_intent"])
            if not run.settings.get("experience_ready") and not run.settings.get("planner_evaluation"):
                stage("experience_setup")
                with SessionLocal() as db:
                    envelope, intro = setup_experience(db, run, intent)
                destination = DESTINATIONS[intent.kind] if intent.action == "setup" else None
                experience_checkpoint(run, {"experience_ready": True, "experience_snapshot": envelope,
                    "experience_intro": intro, "experience_destination": destination})
            intro = run.settings.get("experience_intro", "")
            classifier = run.model_provenance.get("classifier", {})
            prior_cost = classifier.get("metrics", {}).get("cost_estimate_usd", 0)
            if run.settings.get("planner_evaluation"):
                result = {"text": intent.model_dump_json(), "model": classifier.get("model", CLASSIFIER_POLICY["model"]),
                          "artifacts": [], "metrics": {"cost_estimate_usd": prior_cost},
                          "provenance": {"classifier": classifier, "qualification": "candidate", "planner_evaluation": True}}
            elif intent.action == "clarify" or (intent.action == "setup" and not intent.needs_response):
                result = {"text": intent.clarification if intent.action == "clarify" else intro,
                          "model": classifier.get("model", CLASSIFIER_POLICY["model"]), "artifacts": [],
                          "metrics": {"cost_estimate_usd": prior_cost},
                          "provenance": {"response_source": "clarification" if intent.action == "clarify" else "authored_experience_intro",
                                         "classifier": classifier, "qualification": "candidate"}}
            else:
                policy = project_policy(run.settings.get("intelligence", "basic"), intent.complexity)
                stage("interpret", {"model": policy["model"], "reasoning_effort": policy["reasoning_effort"]})
                experience_checkpoint(run, {"experience_stage": "respond", "intelligence_policy": policy})
                result = openai_chat(run, check_cancelled, mark_hosted_submitted) if run.provider == "openai" else fixture_result(run)
                result["metrics"] = {**result.get("metrics", {}), "cost_estimate_usd": prior_cost + result.get("metrics", {}).get("cost_estimate_usd", 0)}
                if result.get("error"):
                    raise ProviderFailure(result.get("error_code") or "model_error", result["error"])
                reply = ProjectReply.model_validate_json(result["text"])
                result["provenance"] = {**result.get("provenance", {}), "project_reply": reply.model_dump(), "classifier": classifier}
                result["text"] = "\n\n".join(part for part in [intro, reply.reply] if part)
        elif run.workflow_id == 'asset.production.v1':
            from .production import execute as execute_production
            result = execute_production(run, generation, locked, stage, check_cancelled)
        elif run.provider == "ollama":
            result = ollama_chat(run, on_text, check_cancelled)
        elif run.provider == "openai":
            result = openai_chat(run, check_cancelled, mark_hosted_submitted)
        elif run.provider == "local_media":
            result = local_media(run, payload, check_cancelled)
        elif run.provider == "runpod":
            with SessionLocal() as db:
                current = locked(db, run_id, generation)
                from .collaboration import guard_run_access
                guard_run_access(db, current)
                current.submission_started = True
                db.commit()
            result = runpod(run, payload, external_id, check_cancelled, stage)
        elif run.provider == "test" and settings().app_env == "test" and settings().enable_test_provider:
            result = fixture_result(run)
        else:
            raise ProviderFailure("provider_unavailable", "This provider has not been configured.")
        if cancellation.is_set():
            raise Cancelled()
        partial_error = result.get("error")
        if partial_error and not (run.capability == "image_to_3d" and result.get("artifacts")):
            raise ProviderFailure("model_error", str(result["error"])[:600])
        stage("validate")
        language_reply = None
        if run.settings.get("language_learning"):
            from .language import parse_reply
            try:
                language_reply = parse_reply(result.get("text", ""))
                if run.settings.get("language_action") == "help":
                    if not language_reply.explanation or not language_reply.explanation.strip():
                        raise ValueError("Help needs a brief explanation in the fluent language.")
                    language_reply.show_translation_tip = True
            except (ValueError, TypeError) as exc:
                raise ProviderFailure("invalid_language_reply", "The structured conversation response or contextual translations did not pass validation.") from exc
        prepared = []
        outputs = result.get("artifacts", [])
        if len(outputs) > (2 if run.capability == "image_to_3d" else 1):
            raise ProviderFailure("invalid_output", "The model returned too many artifacts.")
        seen_keys = set()
        for index, output in enumerate(outputs):
            if run.workflow_id == 'asset.production.v1' and output.get('artifact_id'):
                with SessionLocal() as db:
                    saved = db.get(Artifact, output['artifact_id'])
                    if not saved or saved.run_id not in {run.id, run.settings.get('production_resume_run_id')} or saved.owner_id != run.owner_id or saved.details.get('quality_review', {}).get('passed') is not True:
                        raise ProviderFailure('invalid_output', 'The finished model has no successful quality checkpoint.')
                    validate_content(Storage().read(saved.storage_key), saved.mime_type, settings().max_generated_artifact_bytes)
                    prepared.append({key: getattr(saved, key) for key in ('storage_key', 'name', 'mime_type', 'size_bytes', 'sha256', 'kind', 'details')})
                continue
            mime = output.get("mime_type", "")
            if mime != output_mime:
                raise ProviderFailure("invalid_output", "The model returned an artifact of the wrong type.")
            uploaded_key = output.get("storage_key")
            if uploaded_key:
                if uploaded_key not in allowed_output_keys or uploaded_key in seen_keys or settings().storage_backend != "supabase":
                    raise ProviderFailure("invalid_output", "The model returned an unauthorized storage reference.")
                seen_keys.add(uploaded_key)
                data = Storage().read(uploaded_key)
            else:
                data = base64.b64decode(output.get("base64", ""), validate=True)
            details = validate_content(data, mime, max_bytes=settings().max_generated_artifact_bytes)
            worker_metadata = {key: value for key, value in output.get("metadata", {}).items()
                               if key not in {"storage_mode", "expires_at", "local_saved_at", "staging_deleted_at"}}
            if run.settings.get("media_operation") == "edit" and run.provider != "test":
                references = worker_metadata.get("reference_images", [])
                expected = {(item_id, images[item_id].sha256) for item_id in source_ids if item_id in images}
                received = {(item.get("artifact_id"), item.get("sha256")) for item in references if isinstance(item, dict)}
                if worker_metadata.get("media_operation") != "edit" or received != expected:
                    raise ProviderFailure("reference_edit_unverified", "The image worker did not confirm using the selected reference images. Update the image worker before retrying.")
            if run.settings.get("storage_mode") in {"local", "cloud"}:
                from .account_preferences import storage_metadata
                details.update(storage_metadata(run.settings["storage_mode"]))
            if partial_error and worker_metadata.get("variant") != "raw":
                raise ProviderFailure("invalid_output", "A failed 3D validation may preserve only the raw asset.")
            if mime == "model/gltf-binary":
                report = worker_metadata.get("blender_validation", {})
                details["blender_validated"] = bool(report.get("tool") == "Blender" and isinstance(report.get("mesh_objects"), int) and report["mesh_objects"] > 0 and report.get("version"))
            if mime == "video/mp4" and worker_metadata.get("validation"):
                details["worker_validation"] = worker_metadata["validation"]
            key = uploaded_key or f"{run.owner_id}/runs/{run.id}/{index}{MIME_EXT[mime]}"
            if not uploaded_key:
                Storage().put(key, data, mime)
            from .asset_names import generated_name
            prepared.append({"storage_key": key, "name": generated_name(run, mime, worker_metadata, index), "mime_type": mime, "size_bytes": len(data), "sha256": digest(data), "kind": kind_for(mime), "details": {**worker_metadata, **details, "creation_brief": run.prompt[:2000], "name_source": "requested-filename" if run.settings.get("requested_filename") else "creation-brief-v2", "model": result.get("model", run.model), "provider": run.provider, "settings": run.settings, "workflow_id": run.workflow_id, "metrics": result.get("metrics", {}), "simulated": run.provider == "test"}})
        if partial_error:
            with SessionLocal() as db:
                current = locked(db, run_id, generation)
                if current.status == "cancel_requested":
                    raise Cancelled()
                if prepared and current.settings.get("storage_mode"):
                    from .account_preferences import admit_storage
                    additional = sum(item["size_bytes"] for item in prepared if not db.scalar(select(Artifact.id).where(Artifact.storage_key == item["storage_key"])))
                    from .collaboration import admit_organization_storage
                    from .models import Project
                    account_for_update(db, current.owner_id)
                    admit_organization_storage(db, db.get(Project, current.project_id) if current.project_id else None, additional, current.id)
                    admit_storage(db, current.owner_id, additional, current.settings["storage_mode"], current.id)
                artifact_ids = []
                for item in prepared:
                    artifact = db.scalar(select(Artifact).where(Artifact.storage_key == item["storage_key"]))
                    if artifact is None:
                        artifact = Artifact(owner_id=current.owner_id, project_id=current.project_id, chat_id=current.chat_id, run_id=current.id, lineage_ids=current.attachment_ids, **item)
                        db.add(artifact)
                        db.flush()
                    artifact_ids.append(artifact.id)
                current.artifact_ids = artifact_ids
                current.model_provenance = {**current.model_provenance, **result.get("provenance", {}), "metrics": result.get("metrics", {}), "skills": skill_ids}
                emit(db, current, "artifacts.preserved", {"artifact_ids": artifact_ids, "reason": "3D postprocessing failed; raw output retained"})
                db.commit()
            raise ProviderFailure("postprocessing_failed", str(partial_error)[:600])
        if output_mime and not prepared:
            raise ProviderFailure("empty_output", "The model worker completed without returning an artifact.")
        stage("save")
        with SessionLocal() as db:
            current = locked(db, run_id, generation)
            if current.status == "cancel_requested":
                raise Cancelled()
            if prepared and current.settings.get("storage_mode"):
                from .account_preferences import admit_storage
                additional = sum(item["size_bytes"] for item in prepared if not db.scalar(select(Artifact.id).where(Artifact.storage_key == item["storage_key"])))
                from .collaboration import admit_organization_storage
                from .models import Project
                account_for_update(db, current.owner_id)
                admit_organization_storage(db, db.get(Project, current.project_id) if current.project_id else None, additional, current.id)
                admit_storage(db, current.owner_id, additional, current.settings["storage_mode"], current.id)
            artifact_ids = []
            raw_id = None
            for item in sorted(prepared, key=lambda item: item["details"].get("variant") != "raw"):
                artifact = db.scalar(select(Artifact).where(Artifact.storage_key == item["storage_key"]))
                if artifact is None:
                    lineage = list(current.attachment_ids)
                    if raw_id and item["details"].get("variant") == "validated":
                        lineage.append(raw_id)
                    artifact = Artifact(owner_id=current.owner_id, project_id=current.project_id, chat_id=current.chat_id, run_id=current.id, lineage_ids=lineage, **item)
                    db.add(artifact)
                    db.flush()
                if item["details"].get("variant") == "raw":
                    raw_id = artifact.id
                artifact_ids.append(artifact.id)
            current.artifact_ids = artifact_ids
            current.output_text = result.get("text") or ("Your image is ready." if current.capability == "text_to_image" else "Your video is ready." if current.capability == "image_to_video" else "Your 3D asset is ready. Review its validation details before production use.")
            current.model = result.get("model", current.model)
            current.model_provenance = {**current.model_provenance, **result.get("provenance", {}), "metrics": result.get("metrics", {}), "skills": skill_ids}
            if current.settings.get("entry_image"):
                from .entry_images import attach_entry_image
                attach_entry_image(db, current)
            if current.settings.get("project_experience") and current.model_provenance.get("project_reply"):
                current.model_provenance = {**current.model_provenance, "project_update": {"status": "pending"}}
            if language_reply is not None:
                current.model_provenance = {**current.model_provenance, "language_reply": language_reply.model_dump()}
            current.status, current.stage, current.progress = "succeeded", "complete", 1.0
            current.completed_at = now()
            current.lease_expires_at = None
            if not db.scalar(select(Message).where(Message.run_id == current.id)):
                db.add(Message(owner_id=current.owner_id, chat_id=current.chat_id, role="assistant", content=current.output_text, attachment_ids=artifact_ids, run_id=current.id))
            cost = result.get("metrics", {}).get("cost_estimate_usd", 0) if current.provider in {"runpod", "openai"} else 0
            if current.settings.get("media_plan") or current.workflow_id == 'asset.production.v1':
                cost += current.actual_cost_usd
            measurement = "provider tokens × conservative published rates; invoice reconciliation required" if current.provider == "openai" else "provider duration × configured rate (estimated)" if current.provider == "runpod" else "local wall time; electricity/hardware not measured"
            settle_usage(db, current, time.monotonic() - started, cost, measurement)
            for attempt in db.scalars(select(StageAttempt).where(StageAttempt.run_id == current.id, StageAttempt.status == "running")):
                attempt.status, attempt.completed_at = "succeeded", now()
            emit(db, current, "run.succeeded", {"status": "succeeded", "artifact_ids": artifact_ids, "output_text": current.output_text})
            db.commit()
            if current.settings.get("project_experience") and current.model_provenance.get("project_reply"):
                # The paid result and billing are committed first. A workspace
                # conflict must never fail or repeat the completed request.
                current = db.scalar(select(Run).where(Run.id == run_id).with_for_update())
                if current.model_provenance.get("project_update", {}).get("status") == "pending":
                    finish_project_update(db, current)
    except Exception as exc:
        if lease_lost.is_set() or (isinstance(exc, ProviderFailure) and exc.code == "lease_lost"):
            log.warning("Discarded superseded result for %s", run_id)
            return
        if isinstance(exc, SQLAlchemyError):
            # Retain the lease and saved provider ID for recovery; do not turn an
            # interrupted status write into a second paid model submission.
            log.exception("Database interrupted run %s; its lease will recover", run_id)
            return
        code = exc.code if isinstance(exc, ProviderFailure) else "execution_error"
        message = PUBLIC_ERRORS.get(code, str(exc)[:600] if isinstance(exc, ProviderFailure) else PUBLIC_ERRORS["execution_error"])
        if isinstance(exc, (ProviderFailure, ValueError)):
            log.warning("Run %s failed [%s]: %s", run_id, code, str(exc)[:1000])
        if not isinstance(exc, (ProviderFailure, ValueError)):
            log.exception("Run %s failed", run_id)
        with SessionLocal() as db:
            try:
                current = locked(db, run_id, generation)
            except ProviderFailure:
                return
            if current.provider == "runpod" and current.external_request_id and result is None and code == "execution_error":
                current.lease_expires_at = now() + timedelta(seconds=5)
                emit(db, current, "provider.recovering", {"message": "Provider status interrupted; resuming the saved request."})
                db.commit()
                return
            if (current.provider == "openai" or current.workflow_id == 'asset.production.v1') and current.submission_started and result is None and code not in {"hosted_rejected", "input_limit", "provider_unavailable"}:
                # Unknown billing must remain visible even if cancellation was requested.
                code, message = "submission_uncertain", PUBLIC_ERRORS["submission_uncertain"]
            current.status = "cancelled" if code != "submission_uncertain" and (code == "cancelled" or current.status == "cancel_requested") else "failed"
            current.stage = current.status
            current.error = None if current.status == "cancelled" else {"code": code, "message": message}
            if isinstance(exc, ProviderFailure) and exc.details:
                current.model_provenance = {**current.model_provenance, "provider_error": {**exc.details, "stage": current.settings.get("experience_stage")}}
            current.completed_at = now()
            current.lease_expires_at = None
            if current.provider == "openai":
                if result is not None and not current.settings.get('task_plan'):
                    current.model_provenance = {**current.model_provenance, **result.get("provenance", {}), "metrics": result.get("metrics", {})}
                    if code == "response_incomplete":
                        # Keep paid partial output for review/recovery, but never
                        # apply an incomplete structured document to the project.
                        current.model_provenance = {**current.model_provenance, "partial_response_text": result.get("text", "")}
                    settle_usage(db, current, time.monotonic() - started, result["metrics"]["cost_estimate_usd"], "provider tokens × conservative published rates; invoice reconciliation required")
                elif code != "submission_uncertain":
                    settle_usage(db, current, time.monotonic() - started, current.actual_cost_usd, "completed stages charged; current request not submitted or definitively rejected")
            elif current.provider != "runpod" and code not in {'submission_uncertain', 'cancellation_unconfirmed'}:
                settle_usage(db, current, time.monotonic() - started, current.actual_cost_usd, "completed hosted stages; local hardware not measured")
            elif code not in ["submission_uncertain", "cancellation_unconfirmed"]:
                # Retain provider-compute estimate on failed/cancelled requests; invoice reconciliation remains required.
                duration = time.monotonic() - started
                estimate = duration / 3600 * settings().runpod_hourly_rate_usd if current.submission_started and code != "provider_rejected" else 0
                if settings().spending_limits_enabled:
                    estimate = min(max(0, current.budget_usd - current.actual_cost_usd), estimate)
                settle_usage(db, current, duration, current.actual_cost_usd + estimate, "upper estimate from wall time; provider invoice reconciliation required")
            for attempt in db.scalars(select(StageAttempt).where(StageAttempt.run_id == current.id, StageAttempt.status == "running")):
                attempt.status, attempt.completed_at = current.status, now()
            emit(db, current, "run." + current.status, {"status": current.status, "error": current.error})
            db.commit()
    finally:
        finished.set()
        thread.join(timeout=2)


def main():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    settings().validate_runtime()
    init_db()
    for signum in [signal.SIGINT, signal.SIGTERM]:
        signal.signal(signum, lambda *_: STOP.set())
    log.info("Worker %s ready; model requests execute outside API processes", WORKER_ID)
    last_staging_cleanup = 0
    while not STOP.is_set():
        try:
            if time.monotonic() - last_staging_cleanup >= 60:
                from .account_preferences import expire_local_staging
                with SessionLocal() as db:
                    expire_local_staging(db)
                last_staging_cleanup = time.monotonic()
            claimed = claim()
            if claimed:
                execute(*claimed)
            else:
                STOP.wait(settings().worker_poll_seconds)
        except Exception:
            log.exception("Worker loop failed; retrying after pause")
            STOP.wait(3)


if __name__ == "__main__":
    main()
