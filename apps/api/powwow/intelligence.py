"""Experience-specific model policies. Candidate does not mean quality-approved."""
from copy import deepcopy
from decimal import Decimal, ROUND_CEILING

from .config import settings

# Standard API rates checked against official model pages on 2026-10-03.
# Reserve the cache-write rate for ALL input: caching must never be required
# for a request to fit its budget. Output includes billed reasoning tokens.
LANGUAGE_TIERS = {
    "basic": {"name": "Basic", "description": "Our starting candidate for natural daily conversation.",
              "provider": "openai", "model": "gpt-6.1-sol", "reasoning_effort": "low",
              "input_per_million": 2.0, "cache_write_per_million": 2.5, "output_per_million": 10.0,
              "max_input_tokens": 16384, "max_output_tokens": 4096},
    "smarter": {"name": "Smarter", "description": "More reasoning for nuanced questions and explanations.",
                "provider": "openai", "model": "gpt-6.1-sol", "reasoning_effort": "high",
                "input_per_million": 2.0, "cache_write_per_million": 2.5, "output_per_million": 10.0,
                "max_input_tokens": 16384, "max_output_tokens": 8192},
    "advanced": {"name": "Advanced", "description": "Our most capable configured candidate, with a higher usage cost.",
                 "provider": "openai", "model": "gpt-6-astra", "reasoning_effort": "high",
                 "input_per_million": 10.0, "cache_write_per_million": 12.5, "output_per_million": 50.0,
                 "max_input_tokens": 16384, "max_output_tokens": 8192},
}


def maximum_cost(policy: dict) -> float:
    cost = (Decimal(policy["max_input_tokens"]) * Decimal(str(policy["cache_write_per_million"]))
            + Decimal(policy["max_output_tokens"]) * Decimal(str(policy["output_per_million"]))) / Decimal(1_000_000)
    return float(cost.quantize(Decimal("0.000001"), rounding=ROUND_CEILING))


def language_binding(tier: str = "basic") -> dict:
    policy = deepcopy(LANGUAGE_TIERS['advanced'])
    enabled = bool(settings().openai_api_key.get_secret_value())
    if settings().app_env == "test" and settings().enable_test_provider:
        return {"provider": "test", "model": "test-fixture", "enabled": True, "estimated_cost_usd": 0, "reason": None}
    return {"provider": policy["provider"], "model": policy["model"], "enabled": enabled,
            "estimated_cost_usd": maximum_cost(policy), "policy": {**policy, "version": "language-astra-2026-10-10", "tier": tier, "qualification": "candidate"},
            "reason": None if enabled else "Language learning needs a hosted model. Configure OPENAI_API_KEY on the server to start the baseline evaluation."}


def language_intelligence() -> dict:
    configured = bool(settings().openai_api_key.get_secret_value())
    return {"experience": "language", "default_tier": "basic", "qualification": "candidate",
            "qualification_note": "Baseline evaluation: hosted candidates still need live teaching tests and creator review.",
            "local_baseline": {"model": "Qwen3-4B-Instruct-2507", "status": "rejected", "reason": "Repeated failures in the bilingual conversation and word-help acceptance test."},
            "tiers": [{"id": "basic", **LANGUAGE_TIERS['advanced'], "name": "GPT-6 Astra", "enabled": configured,
                       "max_cost_usd": maximum_cost(LANGUAGE_TIERS['advanced'])}],
            "limits": {"daily_budget_usd": settings().language_daily_budget_usd,
                       "daily_turns": settings().language_daily_turn_limit},
            "setup_required": not configured}


def general_binding(tier: str = "basic") -> dict:
    if settings().app_env == "test" and settings().enable_test_provider:
        return {"provider": "test", "model": "test-fixture", "enabled": True, "estimated_cost_usd": 0, "reason": None}
    policy = deepcopy(LANGUAGE_TIERS["advanced"])
    policy.update(name="GPT-6 Astra", qualification="candidate")
    return {"provider": "openai", "model": policy["model"], "enabled": bool(settings().openai_api_key.get_secret_value()),
            "estimated_cost_usd": maximum_cost(policy), "policy": {**policy, "version": "general-chat-astra-2026-10-10", "tier": tier},
            "reason": None if settings().openai_api_key.get_secret_value() else "This intelligence level needs a hosted model configured on the server."}


# Project max_input_tokens values size initial budget reservations, not input
# ceilings. Larger requests use provider token counts and atomic reservation growth.
# Routing and response policies are distinct. Candidate pricing checked against
# official model pages on 2026-10-05; promotion still requires live evaluation.
CLASSIFIER_POLICY = {
    "provider": "openai", "model": "gpt-6-astra", "reasoning_effort": "high",
    "input_per_million": 10.0, "cache_write_per_million": 12.5, "output_per_million": 50.0,
    "max_input_tokens": 65536, "max_output_tokens": 16384,
    "version": "task-planner-2026-10-10", "qualification": "candidate",
}


def project_policy(tier: str, complexity: str = "standard") -> dict:
    # Legacy tier values remain readable, but cannot downgrade the active baseline.
    policy = deepcopy(LANGUAGE_TIERS["advanced"])
    policy.update(max_input_tokens=49152, max_output_tokens=32768,
                  version="project-response-astra-2026-10-10", tier=tier,
                  effective_tier="super", qualification="candidate")
    return policy


def project_binding(tier: str) -> dict:
    if settings().app_env == "test" and settings().enable_test_provider:
        return {"provider": "test", "model": "test-fixture", "enabled": True, "estimated_cost_usd": 0, "reason": None}
    # Reserve the strongest allowed automatic promotion up front. Actual usage
    # is charged, and the unused reservation is released after the turn.
    policy = project_policy(tier, "deep")
    return {"provider": "openai", "model": policy["model"],
            "enabled": bool(settings().openai_api_key.get_secret_value()),
            "estimated_cost_usd": maximum_cost(policy) + maximum_cost(CLASSIFIER_POLICY),
            "policy": policy,
            "reason": "Project conversations need the hosted model configured on the server."}


def general_intelligence() -> dict:
    bound = general_binding("super")
    return {"experience": "chat", "default_tier": "super", "tiers": [
            {"id": "super", "name": "GPT-6 Astra", "description": "Quality-first reasoning baseline.",
             "enabled": bound["enabled"], "provider": bound["provider"], "model": bound["model"],
             "qualification": "candidate", "reason": bound.get("reason")}],
            "qualification_note": "The Astra baseline remains a candidate pending live evaluation and product-owner review."}
