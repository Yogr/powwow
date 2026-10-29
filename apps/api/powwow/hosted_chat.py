"""One hosted request per durable stage; no repairs or automatic downgrades."""
import json
import re
import time

import httpx

from .config import settings
from .language_schemas import LanguageReply
from .providers import Cancelled, ProviderFailure, chat_messages

OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"


def rejection(response: httpx.Response) -> ProviderFailure:
    """Retain machine codes and redacted diagnostics without credential values."""
    messages = {
        "billing_not_active": "OpenAI reports that API billing is not active for the account associated with the server key. The operator must check that account's API billing settings. Your Powwow allowance was not the cause.",
        "credit_balance_exhausted": "The AI provider reports that its API credit balance is exhausted. This is not your Powwow allowance.",
        "organization_spend_limit_exceeded": "The AI provider's organization spending limit was reached. This is not your Powwow allowance.",
        "project_spend_limit_exceeded": "The AI provider's project spending limit was reached. This is not your Powwow allowance.",
        "organization_usage_limit_exceeded": "The AI provider's organization usage limit was reached. This is not your Powwow allowance.",
        "insufficient_quota": "The AI provider reports insufficient API quota. The operator must check the API account's billing and limits; your Powwow allowance was not the cause.",
        "rate_limit_exceeded": "The AI provider is temporarily rate-limiting requests. Wait before trying again; your Powwow allowance was not the cause.",
        "slow_down": "The AI provider asked us to slow down. Wait before trying again; your Powwow allowance was not the cause.",
    }
    data = {}
    try:
        data = response.json()
        error = data.get("error", {}) if isinstance(data, dict) else {}
        error = error if isinstance(error, dict) else {}
    except ValueError:
        error = {}
    allowed = set(messages) | {"invalid_api_key", "model_not_found", "invalid_request_error", "authentication_error", "rate_limit_error", "permission_denied"}
    def diagnostic_code(value):
        return value if isinstance(value, str) and re.fullmatch(r"[a-z][a-z0-9_]{0,79}", value) else None
    code = diagnostic_code(error.get("code"))
    kind = diagnostic_code(error.get("type"))
    details = {"provider": "openai", "http_status": response.status_code, "code": code, "type": kind}
    # Preserve useful evidence even for a nonstandard response envelope.
    # It remains attached to the owner's run; never retain credential values.
    diagnostic = error.get("message") or (data.get("message") or data.get("detail") or data.get("error") if isinstance(data, dict) else None)
    if isinstance(diagnostic, str) and code not in allowed and kind not in allowed:
        secret = settings().openai_api_key.get_secret_value()
        if secret:
            diagnostic = diagnostic.replace(secret, "[redacted]")
        for value in (error.get("code"), error.get("type")):
            if isinstance(value, str) and value and not diagnostic_code(value):
                diagnostic = diagnostic.replace(value, "[redacted]")
        diagnostic = re.sub(r"(?i)(?:sk-[a-z0-9_.-]+|bearer\s+\S+|(?:org|proj)[_-][a-z0-9_-]+)", "[redacted]", diagnostic)
        details["diagnostic"] = diagnostic[:1500]
    delay = response.headers.get("retry-after", "")
    if delay.isdigit() and len(delay) <= 5 and int(delay) <= 86400:
        details["retry_after_seconds"] = int(delay)
    message = {
        401: "The server's OpenAI API key was rejected. The operator must check the configured key.",
        403: "OpenAI denied this API request. The operator must check project permissions and model access.",
        404: "OpenAI could not find the requested model or resource. The operator must check model access and configuration.",
        429: "The API request returned HTTP 429. Powwow could not classify the provider's error. This is separate from your Powwow allowance.",
    }.get(response.status_code, "The hosted model rejected this request. Review the configured model and response schema.")
    if response.status_code == 429:
        message = messages.get(code, messages.get(kind, message))
        if code not in messages and kind == "rate_limit_error":
            message = messages["rate_limit_exceeded"]
    return ProviderFailure("hosted_rejected", message, details)


def response_schema(model=LanguageReply) -> dict:
    # Responses strict output requires every property, including nullable ones.
    # Runtime Pydantic validation retains bounds unsupported by some providers.
    def clean(value):
        if isinstance(value, list):
            return [clean(item) for item in value]
        if not isinstance(value, dict):
            return value
        # Property names are user data in the schema, not schema keywords:
        # a record's required "title" field must survive metadata removal.
        result = {
            key: {name: clean(schema) for name, schema in item.items()}
            if key in {"properties", "$defs"} else clean(item)
            for key, item in value.items()
            if key not in {"default", "title", "minLength", "maxLength"}
        }
        if result.get("type") == "object":
            result["additionalProperties"] = False
            result["required"] = list(result.get("properties", {}))
        return result
    return clean(model.model_json_schema())


def request_body(run) -> dict:
    policy = run.settings["intelligence_policy"]
    messages = chat_messages(run)
    schema = response_schema() if run.settings.get("language_learning") else None
    if run.settings.get("experience_stage"):
        from .project_experience import PlannerIntent, ProjectReply, classifier_messages, reply_messages
        classifier = run.settings["experience_stage"] == "classify"
        messages = classifier_messages(run) if classifier else reply_messages(run)
        schema = response_schema(PlannerIntent if classifier else ProjectReply)
    if run.settings.get("production_request"):
        messages = run.settings["production_request"]["input"]
        schema = run.settings["production_request"]["schema"]
    # UTF-8 bytes are a conservative token upper bound. Allow extra tokens for
    # message framing and provider schema overhead. Only trim older history.
    def input_bound():
        return len(json.dumps({"input": messages, "schema": schema}, ensure_ascii=False).encode("utf-8")) + 2048
    exact_count = run.settings.get("project_experience") or run.settings.get("production_request")
    while not exact_count and len(messages) > 2 and input_bound() > policy["max_input_tokens"]:
        messages.pop(1)
    if not exact_count and input_bound() > policy["max_input_tokens"]:
        raise ProviderFailure("input_limit", "This component's context exceeds its configured allowance. No response was submitted.")
    body = {"model": policy["model"], "input": messages, "store": False,
            "service_tier": "default", "reasoning": {"effort": policy["reasoning_effort"]},
            "max_output_tokens": policy["max_output_tokens"]}
    if schema:
        body["text"] = {"format": {"type": "json_schema", "name": "project_reply" if run.settings.get("experience_stage") else "language_reply", "strict": True, "schema": schema}}
    return body


def usage_cost(usage: dict, policy: dict) -> float:
    # Until invoice reconciliation exists, count all input at the cache-write
    # rate (a conservative bound). Reasoning is included in output_tokens.
    from decimal import Decimal, ROUND_CEILING
    inputs, outputs = usage.get("input_tokens"), usage.get("output_tokens")
    if type(inputs) is not int or type(outputs) is not int or inputs < 0 or outputs < 0:
        raise ValueError("Provider usage is missing or invalid.")
    cost = (Decimal(inputs) * Decimal(str(policy["cache_write_per_million"]))
            + Decimal(outputs) * Decimal(str(policy["output_per_million"]))) / Decimal(1_000_000)
    return float(cost.quantize(Decimal("0.000001"), rounding=ROUND_CEILING))


def openai_chat(run, cancelled, mark_submitted) -> dict:
    body = request_body(run)
    if cancelled():
        raise Cancelled()
    key = settings().openai_api_key.get_secret_value()
    if not key:
        raise ProviderFailure("provider_unavailable", "The selected hosted model is not configured.")
    if run.settings.get("project_experience") or run.settings.get("production_request"):
        # The policy's input allowance sizes the initial reservation, not the
        # conversation. Larger payloads get an exact count before generation.
        bound = len(json.dumps(body, ensure_ascii=False).encode("utf-8")) + 2048
        if run.settings.get("production_request") or run.settings.get("experience_stage") in {"classify", "respond"} or bound > run.settings["intelligence_policy"]["max_input_tokens"]:
            count_body = {name: body[name] for name in ("model", "input", "text", "reasoning") if name in body}
            try:
                with httpx.Client(timeout=httpx.Timeout(settings().hosted_chat_timeout_seconds, connect=10)) as client:
                    counted = client.post(OPENAI_RESPONSES_URL + "/input_tokens",
                        headers={"Authorization": "Bearer " + key}, json=count_body)
            except (httpx.TimeoutException, httpx.TransportError) as exc:
                raise ProviderFailure("token_count_unavailable", "The provider could not check this request's processing cost. No response was submitted. Try again shortly.") from exc
            if not counted.is_success:
                raise rejection(counted)
            try:
                tokens = counted.json()["input_tokens"]
                if type(tokens) is not int or tokens < 0:
                    raise ValueError("Invalid count")
            except (ValueError, TypeError, KeyError) as exc:
                raise ProviderFailure("token_count_unavailable", "The provider returned an invalid processing estimate. No response was submitted.") from exc
            if cancelled():
                raise Cancelled()
            # Consumed atomically by the worker before the submission marker.
            run.settings = {**run.settings, "hosted_input_tokens": tokens}
            if settings().spending_limits_enabled and (run.settings.get("production_request") or run.settings.get("experience_stage") in {"classify", "respond"}):
                from decimal import Decimal, ROUND_FLOOR
                policy = dict(run.settings["intelligence_policy"])
                spent = run.actual_cost_usd if run.settings.get("production_request") else run.model_provenance.get("classifier", {}).get("metrics", {}).get("cost_estimate_usd", 0)
                remaining = Decimal(str(run.budget_usd)) - Decimal(str(spent))
                input_cost = Decimal(tokens) * Decimal(str(policy["cache_write_per_million"])) / 1_000_000
                affordable = int(((remaining - input_cost) * 1_000_000 / Decimal(str(policy["output_per_million"]))).to_integral_value(rounding=ROUND_FLOOR))
                minimum = 8192 if policy["reasoning_effort"] == "high" else 4096
                if affordable < minimum:
                    raise ProviderFailure("budget_too_low", "The available processing budget cannot cover this brief with enough room for reasoning and an answer. Your full brief is saved; no response was submitted.")
                policy["max_output_tokens"] = min(policy["max_output_tokens"], affordable)
                body["max_output_tokens"] = policy["max_output_tokens"]
                run.settings = {**run.settings, "intelligence_policy": policy}
    # Persist before sending. A crash in the following window must not cause
    # the worker to silently issue another billable request.
    mark_submitted()
    started = time.monotonic()
    try:
        with httpx.Client(timeout=httpx.Timeout(max(settings().hosted_chat_timeout_seconds, 600) if run.settings.get("project_experience") else settings().hosted_chat_timeout_seconds, connect=10)) as client:
            response = client.post(OPENAI_RESPONSES_URL,
                                   headers={"Authorization": "Bearer " + key, "X-Client-Request-Id": run.settings.get("production_request_id", run.id)}, json=body)
    except (httpx.TimeoutException, httpx.TransportError) as exc:
        raise ProviderFailure("submission_uncertain", "The provider response was interrupted. This request needs review before it can be retried.") from exc
    if not response.is_success:
        if response.status_code not in {400, 401, 403, 404, 413, 422, 429}:
            raise ProviderFailure("submission_uncertain", "The provider returned a server error; review this request before retrying.")
        raise rejection(response)
    try:
        data = response.json()
        cost = usage_cost(data.get("usage") or {}, run.settings["intelligence_policy"])
    except (ValueError, TypeError, AttributeError) as exc:
        raise ProviderFailure("submission_uncertain", "The provider did not return complete request details. This request needs review before it can be retried.") from exc
    chunks, refused = [], False
    for item in data.get("output", []):
        for content in item.get("content", []):
            if content.get("type") == "output_text":
                chunks.append(content.get("text", ""))
            if content.get("type") == "refusal":
                refused = True
    return {"text": "".join(chunks), "model": data.get("model", run.model), "artifacts": [],
            "metrics": {**data["usage"], "cost_estimate_usd": cost, "provider_seconds": time.monotonic() - started},
            "provenance": {"runtime": "openai-responses", "response_id": data.get("id"),
                           "status": data.get("status"), "refused": refused,
                           "truncated": data.get("status") == "incomplete", "incomplete_reason": (data.get("incomplete_details") or {}).get("reason"), "store": False,
                           "policy": dict(run.settings["intelligence_policy"]),
                           "input_token_count": run.settings.get("hosted_input_tokens"),
                           "pricing_version": run.settings["intelligence_policy"]["version"]},
            "error_code": "model_refusal" if refused else "response_incomplete" if data.get("status") != "completed" else None,
            "error": "The hosted model declined this request." if refused else
                     "The model exhausted its reasoning/response allowance before finishing. Your brief was accepted and remains saved; this is not a prompt-length rejection." if data.get("status") != "completed" else None}
