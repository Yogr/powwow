"""Bounded live request-planner evaluation through normal durable admission.

Run only after the API/worker have the planner_evaluation checkpoint installed:
  .venv-api/Scripts/python.exe scripts/evaluate-request-planner.py --run

The default invocation validates this suite without network requests. Live runs
use the ignored primary QA credentials, never print credentials, and stop at the
first failed/uncertain case. A saved ledger prevents silently restarting a suite.
No media, response generation, or workspace changes are allowed after planning.
"""
import argparse
import hashlib
import io
import json
import os
import statistics
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAX_CASES, CASE_BUDGET, TOTAL_BUDGET = 6, 0.4, 2.4
TERMINAL = {"succeeded", "failed", "cancelled"}


class EvaluationStopped(Exception):
    """Only deliberately public error codes reach the report/console."""


def utc():
    return datetime.now(timezone.utc).isoformat()


def save_report(path, report):
    report["updated_at"] = utc()
    pending = path.with_suffix(path.suffix + ".tmp")
    pending.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    pending.replace(path)


def matches_concepts(text, groups):
    normalized = text.casefold().replace("’", "'").replace("‑", "-")
    return [any(term.casefold() in normalized for term in group) for group in groups]


def judge(case, output, fixture_id):
    expected = case["expect"]
    media = output.get("media")
    checks = {"action": output.get("action") == expected["action"]}
    if expected["action"] == "media":
        media = media or {}
        checks.update(workflow=media.get("workflow") == expected["workflow"],
                      output_name=media.get("output_name") == expected["output_name"],
                      source_ids=media.get("source_image_ids") == ([fixture_id] if expected["source"] == "fixture" else []),
                      no_response_stage=output.get("needs_response") is False)
        for index, passed in enumerate(matches_concepts(media.get("brief", ""), expected.get("brief_concepts", [])), 1):
            checks[f"brief_concept_{index}"] = passed
    else:
        checks["no_media_plan"] = media is None
    if "needs_response" in expected:
        checks["needs_response"] = output.get("needs_response") == expected["needs_response"]
    if expected["action"] == "clarify":
        clarification = output.get("clarification") or ""
        checks["clarification_present"] = bool(clarification.strip())
        for index, passed in enumerate(matches_concepts(clarification, expected.get("clarification_concepts", [])), 1):
            checks[f"clarification_concept_{index}"] = passed
    return checks


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run", action="store_true", help="Authorize this bounded live suite; default is offline validation only")
    parser.add_argument("--base", default="http://127.0.0.1:8000")
    parser.add_argument("--suite", type=Path, default=ROOT / "evals/request-planner-quality.json")
    parser.add_argument("--report", type=Path, default=ROOT / "evals/reports/request-planner-live.json")
    parser.add_argument("--timeout-seconds", type=int, default=900)
    args = parser.parse_args()
    report_path = args.report.resolve()
    suite = json.loads(args.suite.read_text(encoding="utf-8"))
    cases = suite["cases"]
    if not 1 <= len(cases) <= MAX_CASES or suite["budget_per_case_usd"] != CASE_BUDGET or suite["maximum_total_budget_usd"] > TOTAL_BUDGET:
        raise EvaluationStopped("invalid_suite_budget")
    if len({case["id"] for case in cases}) != len(cases):
        raise EvaluationStopped("duplicate_case_ids")
    if not args.run:
        print(f"Validated {len(cases)} cases. Live maximum ${len(cases) * CASE_BUDGET:.2f}; no requests submitted.")
        return 0

    # Match the server's relative .env and storage paths before importing its DB.
    os.chdir(ROOT / "apps/api")
    sys.path.insert(0, str(ROOT / "apps/api"))
    import httpx
    from PIL import Image, ImageDraw
    from sqlalchemy import select
    from powwow.config import settings
    from powwow.db import SessionLocal
    from powwow.models import Project, Run, UsageEntry
    from powwow.project_experience import ExperienceIntent
    from powwow.schemas import RunCreate
    from powwow.service import submit_run
    from powwow.intelligence import CLASSIFIER_POLICY

    cfg = settings()
    if cfg.app_env == "test" or cfg.enable_test_provider or not cfg.openai_api_key.get_secret_value():
        raise EvaluationStopped("live_hosted_model_not_configured")
    if args.timeout_seconds < 1:
        raise EvaluationStopped("invalid_timeout")
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report = {"suite": suite["version"], "session_id": uuid.uuid4().hex, "created_at": utc(),
              "status": "initializing", "qualification": "candidate", "owner_review": "pending",
              "scope": suite["scope"], "maximum_total_budget_usd": round(len(cases) * CASE_BUDGET, 2),
              "per_case_budget_usd": CASE_BUDGET, "candidate_policy": dict(CLASSIFIER_POLICY), "cases": []}
    try:
        with report_path.open("x", encoding="utf-8") as stream:
            json.dump(report, stream, indent=2)
    except FileExistsError:
        raise EvaluationStopped("report_exists_inspect_existing_runs_before_starting_a_new_suite") from None

    def checkpoint():
        save_report(report_path, report)

    client = httpx.Client(base_url=args.base, timeout=45)

    def call(method, path, **kwargs):
        response = client.request(method, path, **kwargs)
        if not response.is_success:
            raise EvaluationStopped(f"api_http_{response.status_code}")
        return response.json()

    try:
        config = call("GET", "/v1/config")
        if config.get("auth_mode") != "supabase":
            raise EvaluationStopped("expected_verified_supabase_auth")
        credentials = json.loads((ROOT / ".data/supabase-qa.json").read_text(encoding="utf-8-sig"))["primary"]
        with httpx.Client(timeout=30) as auth:
            login = auth.post(config["supabase_url"] + "/auth/v1/token?grant_type=password",
                              headers={"apikey": config["supabase_anon_key"]},
                              json={"email": credentials["email"], "password": credentials["password"]})
            if not login.is_success:
                raise EvaluationStopped("qa_login_failed")
            token = login.json()["access_token"]
            user = auth.get(config["supabase_url"] + "/auth/v1/user",
                            headers={"apikey": config["supabase_anon_key"], "Authorization": "Bearer " + token})
            if not user.is_success:
                raise EvaluationStopped("qa_identity_verification_failed")
            owner = user.json()["id"]
        del credentials
        client.headers["Authorization"] = "Bearer " + token
        del token
        project = call("POST", "/v1/projects", json={"name": "Planner evaluation " + report["session_id"][:8],
                       "instructions": "Dedicated synthetic planner evaluation. Preserve this project's saved record identities and categories.", "storage_mode": "cloud"})
        report["project_id"] = project["id"]
        checkpoint()
        with SessionLocal() as db:
            if db.get(Project, project["id"]).owner_id != owner:
                raise EvaluationStopped("api_database_owner_mismatch")
        envelope = call("GET", f"/v1/projects/{project['id']}/workspace")
        envelope["workspace"].update(kind="game", initialized=True,
            brief="A fictional game set on Mars. Mara is a flight surgeon who refuses to carry a weapon.",
            components=["details", "design", "tasks", "assets"],
            detail_categories=[{"id": "characters", "name": "Characters"}, {"id": "detail-vehicles", "name": "Vehicles"}],
            records={"characters": [{"id": "mara-existing", "title": "Mara", "fields": {"description": "Flight surgeon. Refuses to carry a weapon."}}], "detail-vehicles": []})
        baseline = call("PUT", f"/v1/projects/{project['id']}/workspace", json=envelope)
        baseline_digest = hashlib.sha256(json.dumps(baseline, sort_keys=True).encode()).hexdigest()
        image = Image.new("RGB", (128, 128), "white")
        drawing = ImageDraw.Draw(image)
        drawing.ellipse((51, 12, 77, 38), fill="#b7d5ed")
        drawing.rectangle((49, 40, 79, 87), fill="#377bb5")
        drawing.rectangle((20, 43, 108, 56), fill="#377bb5")
        drawing.rectangle((49, 85, 61, 118), fill="#377bb5")
        drawing.rectangle((67, 85, 79, 118), fill="#377bb5")
        buffer = io.BytesIO()
        image.save(buffer, "PNG")
        fixture = call("POST", "/v1/uploads", data={"project_id": project["id"]}, files={"file": ("Soldier-reference-fixture.png", buffer.getvalue(), "image/png")})
        report["fixture"] = {"artifact_id": fixture["id"], "sha256": hashlib.sha256(buffer.getvalue()).hexdigest(),
                             "kind": "procedural synthetic reference; never a model-quality image result"}
        report["status"] = "running"
        checkpoint()
        for case in cases:
            if case.get("component"):
                chat = call("PUT", f"/v1/projects/{project['id']}/components/{case['component']}/chat")
            else:
                chat = call("POST", "/v1/chats", json={"project_id": project["id"], "title": case["id"]})
            ids = [fixture["id"]] if case.get("attach_fixture") else []
            message = call("POST", f"/v1/chats/{chat['id']}/messages", json={"content": case["prompt"], "attachment_ids": ids})
            entry = {"case_id": case["id"], "chat_id": chat["id"], "message_id": message["id"],
                     "idempotency_key": "planner-eval-" + report["session_id"] + "-" + case["id"],
                     "budget_usd": CASE_BUDGET, "status": "submission_pending", "prompt": case["prompt"], "expected": case["expect"]}
            report["cases"].append(entry)
            checkpoint()  # Recovery identifiers exist before any potentially paid admission.
            request = RunCreate(chat_id=chat["id"], message_id=message["id"], capability="auto", attachment_ids=ids,
                                idempotency_key=entry["idempotency_key"], budget_usd=CASE_BUDGET,
                                settings={"web_search": False, "intelligence": "basic", "media_budget_usd": 0})
            started = time.monotonic()
            with SessionLocal() as db:
                run = submit_run(db, owner, request, internal_settings={"planner_evaluation": True})
                entry.update(run_id=run.id, status=run.status)
            checkpoint()
            print(f"Submitted {case['id']} {entry['run_id']}", flush=True)
            while True:
                run = call("GET", "/v1/runs/" + entry["run_id"])
                if run["status"] in TERMINAL:
                    break
                if time.monotonic() - started > args.timeout_seconds:
                    entry["status"] = "poll_timeout_run_may_still_be_active"
                    checkpoint()
                    raise EvaluationStopped("poll_timeout_no_retry")
                time.sleep(2)
            entry.update(status=run["status"], latency_seconds=round(time.monotonic() - started, 3),
                         model=run["model"], actual_cost_usd=run["actual_cost_usd"],
                         error=run.get("error"), artifact_ids=run["artifact_ids"])
            classifier = run["model_provenance"].get("classifier", {})
            provenance = classifier.get("provenance", {})
            entry["classifier"] = {"model": classifier.get("model"), "usage": classifier.get("metrics", {}),
                "policy": provenance.get("policy", {}), "response_id": provenance.get("response_id"),
                "status": provenance.get("status"), "input_token_count": provenance.get("input_token_count")}
            entry["reasoning_effort"] = provenance.get("policy", {}).get("reasoning_effort") or run["settings"].get("intelligence_policy", {}).get("reasoning_effort")
            checkpoint()
            if run["status"] != "succeeded":
                raise EvaluationStopped("run_failed_or_uncertain_no_retry")
            output = ExperienceIntent.model_validate_json(run["output_text"]).model_dump()
            checks = judge(case, output, fixture["id"])
            checks["schema_valid"] = True
            checks["no_generated_artifacts"] = not run["artifact_ids"]
            checks["evaluation_setting_preserved"] = run["settings"].get("planner_evaluation") is True
            checks["high_reasoning"] = entry["reasoning_effort"] == "high"
            checks["budget_respected"] = run["actual_cost_usd"] <= CASE_BUDGET
            events = call("GET", "/v1/runs/" + run["id"] + "/events")
            checks["one_paid_classifier_submission"] = len([event for event in events if event["type"] == "provider.submitted"]) == 1
            checks["no_response_or_workspace_stage"] = not any(event.get("stage_id") in {"interpret", "experience_setup"} for event in events)
            current = call("GET", f"/v1/projects/{project['id']}/workspace")
            checks["workspace_unchanged"] = hashlib.sha256(json.dumps(current, sort_keys=True).encode()).hexdigest() == baseline_digest
            with SessionLocal() as db:
                saved = db.get(Run, run["id"])
                ledger = db.scalar(select(UsageEntry).where(UsageEntry.run_id == run["id"]))
                checks["known_cost_settled_once"] = bool(ledger and abs(ledger.actual_cost_usd - saved.actual_cost_usd) < 1e-9)
            entry.update(classification=output, judgments=checks, passed=all(checks.values()))
            checkpoint()
            print(f"{case['id']}: {'PASS' if entry['passed'] else 'FAIL'}; ${entry['actual_cost_usd']:.6f}; {entry['latency_seconds']:.1f}s", flush=True)
            if not entry["passed"]:
                raise EvaluationStopped("quality_or_execution_guard_failure_no_retry")
        report["status"] = "automated_checks_passed_owner_review_pending"
        report["total_actual_cost_usd"] = round(sum(entry.get("actual_cost_usd", 0) for entry in report["cases"]), 6)
        latencies = sorted(entry["latency_seconds"] for entry in report["cases"])
        report["latency_summary_seconds"] = {"median": statistics.median(latencies), "p95_nearest_rank": latencies[-1]}
        checkpoint()
        return 0
    except Exception as error:
        report["status"] = "stopped"
        report["stop_reason"] = str(error) if isinstance(error, EvaluationStopped) else type(error).__name__
        report["total_known_cost_usd"] = round(sum(entry.get("actual_cost_usd", 0) for entry in report["cases"]), 6)
        report["recovery"] = "Inspect the saved run IDs and idempotency keys. No failed, interrupted, or uncertain paid request was automatically repeated. Unknown runs may still be active."
        checkpoint()
        print("Planner evaluation stopped: " + report["stop_reason"], flush=True)
        return 1
    finally:
        client.close()


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except EvaluationStopped as error:
        print("Planner evaluation not started: " + str(error), flush=True)
        raise SystemExit(1)
    except Exception as error:
        # Configuration/DB errors may include connection details in their text.
        print("Planner evaluation not started: " + type(error).__name__, flush=True)
        raise SystemExit(1)
