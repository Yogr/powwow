import json

import pytest

from powwow.auth import owner_id
from powwow.db import SessionLocal
from powwow.main import app
from powwow.models import Run
from powwow.worker import claim, execute


@pytest.fixture
def planned(client, workspace):
    project, chat = workspace
    base = f"/v1/projects/{project['id']}"
    plan = client.post(base + "/plan", json={"prompt": "Build a 2D game about a fox collecting stars", "answers": {"platform": "web", "experience": "beginner", "budget": "free"}}).json()
    return base, plan


def proposal():
    return {"design": "# Fox and the lost stars\n\nOne browser level teaches movement, collecting three stars, and returning to the den. Begin with placeholder shapes and verify touch and keyboard controls.",
            "tasks": [{"id": "ai-star-loop", "title": "Build a three-star collection loop", "description": "Place three stars above safe platforms. Returning to the den completes the level only after all three are collected.", "status": "todo", "phase": "Prototype", "acceptance": ["Collecting each star increments the visible counter once.", "The den finishes the level only when the counter reaches three."], "depends_on": ["game-2"], "component": "game-design"}]}


def complete(client, base, monkeypatch, output=None, key="refinement-request-0001"):
    response = client.post(base + "/plan-refinement", json={"budget_usd": 0, "idempotency_key": key})
    assert response.status_code == 201, response.text
    run = response.json()
    output = output if output is not None else json.dumps(proposal())
    monkeypatch.setattr("powwow.worker.fixture_result", lambda _: {"text": output, "model": "test-fixture", "artifacts": [], "metrics": {}, "provenance": {"simulated": True}})
    execute(*claim())
    assert client.get("/v1/runs/" + run["id"]).json()["status"] == "succeeded"
    return run


def test_refinement_uses_existing_durable_run_and_idempotency(client, planned):
    base, plan = planned
    request = {"budget_usd": 0, "idempotency_key": "refine-idempotency-001"}
    run = client.post(base + "/plan-refinement", json=request)
    assert run.status_code == 201, run.text
    data = run.json()
    assert data["capability"] == "chat" and data["status"] == "queued"
    assert data["settings"]["builder_refinement"] is True
    assert data["settings"]["workspace_version"] == plan["version"]
    assert "fox collecting stars" in data["prompt"]
    assert '"platform": "web"' in data["prompt"]
    assert "game-2" in data["prompt"]
    assert len(data["context_snapshot"]) == 1
    duplicate = client.post(base + "/plan-refinement", json=request)
    assert duplicate.json()["id"] == data["id"]
    assert len(client.get(f"/v1/chats/{data['chat_id']}/messages").json()) == 1
    assert client.get(f"/v1/chats/{data['chat_id']}").json()["title"] == "Project guide"
    assert client.post(base + "/plan-refinement", json={**request, "budget_usd": 1}).status_code == 409
    assert client.get(base + "/plan-refinements/" + data["id"]).status_code == 409
    assert client.post(base + "/apply-refinement", json={"run_id": data["id"], "version": plan["version"]}).status_code == 409


def test_real_proposal_review_and_apply_preserves_existing_work(client, planned, monkeypatch):
    base, plan = planned
    plan["workspace"]["tasks"][0]["status"] = "done"
    plan["workspace"]["tasks"][0]["title"] = "My edited task title"
    plan["workspace"]["records"] = {"characters": [{"id": "fox", "title": "Fenn", "fields": {"appearance": "A red fox with a gold scarf"}}]}
    saved = client.put(base + "/workspace", json={"version": plan["version"], "workspace": plan["workspace"]}).json()
    run = complete(client, base, monkeypatch)
    review = client.get(base + "/plan-refinements/" + run["id"])
    assert review.status_code == 200, review.text
    assert review.json()["design"] == proposal()["design"]
    # Review is read-only, and only explicit application updates the workspace.
    assert client.get(base + "/workspace").json() == saved
    applied = client.post(base + "/apply-refinement", json={"run_id": run["id"], "version": saved["version"]})
    assert applied.status_code == 200, applied.text
    result = applied.json()
    assert result["version"] == saved["version"] + 1
    assert result["workspace"]["design"] == proposal()["design"]
    assert result["workspace"]["tasks"][:-1] == saved["workspace"]["tasks"]
    assert result["workspace"]["tasks"][-1]["id"] == "ai-star-loop"
    assert result["workspace"]["records"] == saved["workspace"]["records"]
    assert client.post(base + "/apply-refinement", json={"run_id": run["id"], "version": saved["version"]}).status_code == 409


def test_proposal_conflict_preserves_edits_since_request(client, planned, monkeypatch):
    base, plan = planned
    run = complete(client, base, monkeypatch)
    plan["workspace"]["design"] = "A new manually edited design"
    updated = client.put(base + "/workspace", json={"version": plan["version"], "workspace": plan["workspace"]}).json()
    for version in [plan["version"], updated["version"]]:
        assert client.post(base + "/apply-refinement", json={"run_id": run["id"], "version": version}).status_code == 409
    assert client.get(base + "/plan-refinements/" + run["id"]).status_code == 409
    assert client.get(base + "/workspace").json() == updated


@pytest.mark.parametrize("bad", ["not JSON", '{"design":"a","tasks":"wrong"}', "{truncated", '{"design":"a","tasks":[],"unexpected":true}'])
def test_malformed_model_output_never_changes_workspace(client, planned, monkeypatch, bad):
    base, plan = planned
    run = complete(client, base, monkeypatch, output=bad)
    assert client.get(base + "/plan-refinements/" + run["id"]).status_code == 422
    rejected = client.post(base + "/apply-refinement", json={"run_id": run["id"], "version": plan["version"]})
    assert rejected.status_code == 422
    assert client.get(base + "/workspace").json()["workspace"] == plan["workspace"]


@pytest.mark.parametrize("problem", ["missing", "cycle", "component", "status", "duplicate"])
def test_invalid_model_task_graph_is_rejected(client, planned, monkeypatch, problem):
    base, plan = planned
    value = proposal()
    task = value["tasks"][0]
    if problem == "missing":
        task["depends_on"] = ["nonexistent"]
    elif problem == "cycle":
        task["depends_on"] = [task["id"]]
    elif problem == "component":
        task["component"] = "undeclared-plugin"
    elif problem == "status":
        task["status"] = "done"
    else:
        value["tasks"].append(dict(task))
    run = complete(client, base, monkeypatch, output=json.dumps(value))
    assert client.post(base + "/apply-refinement", json={"run_id": run["id"], "version": plan["version"]}).status_code == 422


def test_refinement_ownership_and_run_purpose_are_checked(client, planned, monkeypatch):
    base, plan = planned
    run = complete(client, base, monkeypatch)
    other = client.post("/v1/projects", json={"name": "Unrelated"}).json()
    assert client.get(f"/v1/projects/{other['id']}/plan-refinements/{run['id']}").status_code == 404
    app.dependency_overrides[owner_id] = lambda: "another-owner"
    assert client.post(base + "/plan-refinement", json={"budget_usd": 0, "idempotency_key": "refine-other-owner"}).status_code == 404
    assert client.get(base + "/plan-refinements/" + run["id"]).status_code == 404
    assert client.post(base + "/apply-refinement", json={"run_id": run["id"], "version": plan["version"]}).status_code == 404
    app.dependency_overrides[owner_id] = lambda: "test-owner-a"
    with SessionLocal() as db:
        current = db.get(Run, run["id"])
        current.settings = {}
        db.commit()
    assert client.get(base + "/plan-refinements/" + run["id"]).status_code == 404


def test_refinement_requires_initial_plan_and_respects_budget(client, workspace, planned):
    blank = client.post("/v1/projects", json={"name": "No plan"}).json()
    assert client.post(f"/v1/projects/{blank['id']}/plan-refinement", json={"budget_usd": 0, "idempotency_key": "refine-no-plan"}).status_code == 409
    base, _ = planned
    assert client.post(base + "/plan-refinement", json={"budget_usd": 101, "idempotency_key": "refine-excessive-budget"}).status_code == 422
    assert client.post(base + "/plan-refinement", json={"budget_usd": -1, "idempotency_key": "refine-negative-budget"}).status_code == 422


def test_retry_keeps_internal_refinement_tags(client, planned):
    base, plan = planned
    run = client.post(base + "/plan-refinement", json={"budget_usd": 0, "idempotency_key": "refine-before-cancel"}).json()
    client.post(f"/v1/runs/{run['id']}/cancel")
    retry = client.post(f"/v1/runs/{run['id']}/retry", json={"idempotency_key": "refine-after-cancel"})
    assert retry.status_code == 201, retry.text
    assert retry.json()["settings"]["builder_refinement"] is True
    assert retry.json()["settings"]["workspace_version"] == plan["version"]


@pytest.mark.parametrize("dependencies", [["missing"], ["one"]])
def test_workspace_put_checks_missing_dependencies_and_cycles(client, workspace, dependencies):
    url = f"/v1/projects/{workspace[0]['id']}/workspace"
    doc = client.get(url).json()
    doc["workspace"]["tasks"] = [{"id": "one", "title": "Task one", "depends_on": dependencies}]
    assert client.put(url, json=doc).status_code == 422
