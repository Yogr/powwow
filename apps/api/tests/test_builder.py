import pytest

from powwow.auth import owner_id
from powwow.builder import detect_kind, infer_answers
from powwow.db import SessionLocal
from powwow.main import app
from powwow.models import ProjectWorkspace


def project_url(workspace, suffix):
    return f"/v1/projects/{workspace[0]['id']}/{suffix}"


def test_catalog_components_and_guided_choices(client):
    result = client.get("/v1/builder/catalog")
    assert result.status_code == 200
    catalog = result.json()
    assert len(catalog["kinds"]) == 13
    assert len(catalog["components"]) == 7
    component_ids = {component["id"] for component in catalog["components"]}
    for kind in catalog["kinds"]:
        assert set(kind["components"]) <= component_ids
        assert 1 <= len(kind["components"]) <= 4
        if kind["id"] == "language":
            assert {"target_language", "native_language", "level"} == {question["id"] for question in kind["questions"]}
        else:
            assert "experience" in {question["id"] for question in kind["questions"]}
            assert "budget" not in {question["id"] for question in kind["questions"]}
            assert 4 <= len(kind["questions"]) <= 6
        for question in kind["questions"]:
            assert question["recommended"] in {option["id"] for option in question["options"]}


def test_default_workspace_is_universal_and_read_only(client, workspace):
    result = client.get(project_url(workspace, "workspace"))
    assert result.status_code == 200
    data = result.json()
    assert data["version"] == 0
    assert data["workspace"]["components"] == []
    assert data["workspace"]["initialized"] is False
    with SessionLocal() as db:
        assert db.get(ProjectWorkspace, workspace[0]["id"]) is None


def test_workspace_persists_and_uses_optimistic_conflicts(client, workspace):
    url = project_url(workspace, "workspace")
    initial = client.get(url).json()
    initial["workspace"]["design"] = "My edited blueprint"
    initial["workspace"]["components"] += ["manuscript"]
    initial["workspace"]["records"] = {"manuscript": [{"id": "ch1", "title": "Chapter One", "fields": {"body": "An opening line."}}]}
    saved = client.put(url, json=initial)
    assert saved.status_code == 200, saved.text
    assert saved.json()["version"] == 1
    assert client.get(url).json() == saved.json()
    assert client.put(url, json=initial).status_code == 409
    next_doc = saved.json()
    next_doc["workspace"]["design"] = "Second edit"
    assert client.put(url, json=next_doc).json()["version"] == 2
    assert client.put(url, json=next_doc).status_code == 409
    with SessionLocal() as db:
        assert db.get(ProjectWorkspace, workspace[0]["id"]).workspace["records"]["manuscript"][0]["fields"]["body"] == "An opening line."


def test_workspace_ownership_for_all_endpoints(client, workspace):
    blank = client.get(project_url(workspace, "workspace")).json()
    app.dependency_overrides[owner_id] = lambda: "different-owner"
    assert client.get(project_url(workspace, "workspace")).status_code == 404
    assert client.put(project_url(workspace, "workspace"), json=blank).status_code == 404
    for endpoint in ["plan", "plan-preview"]:
        assert client.post(project_url(workspace, endpoint), json={"prompt": "Build a game", "explicit": True}).status_code == 404


def test_preview_infers_choices_without_writing(client, workspace):
    prompt = "I'd like to make a 2D isometric game using Godot for desktop, single-player, and free. I am a beginner."
    response = client.post(project_url(workspace, "plan-preview"), json={"prompt": prompt})
    assert response.status_code == 200, response.text
    preview = response.json()
    assert preview["eligible"] and preview["kind"] == "game"
    assert preview["answers"] == {"experience": "beginner", "dimension": "2d", "perspective": "isometric", "engine": "godot", "platform": "desktop", "play_mode": "solo"}
    with SessionLocal() as db:
        assert db.get(ProjectWorkspace, workspace[0]["id"]) is None


def test_initial_plan_is_durable_and_automatic_replay_does_not_regenerate(client, workspace):
    url = project_url(workspace, "plan")
    request = {"prompt": "I want to build a game where a fox collects lost stars", "answers": {"dimension": "2d", "engine": "browser"}}
    first = client.post(url, json=request)
    assert first.status_code == 200, first.text
    data = first.json()
    assert data["eligible"] and data["version"] == 1
    plan = data["workspace"]
    assert plan["initialized"] and plan["kind"] == "game"
    assert len(plan["tasks"]) >= 12
    assert "fox collects lost stars" in plan["design"]
    assert "rules-based starter roadmap" in " ".join(plan["assumptions"])
    assert "Godot" not in plan["design"]
    task_ids = {task["id"] for task in plan["tasks"]}
    for task in plan["tasks"]:
        assert task["acceptance"]
        assert set(task["depends_on"]) <= task_ids
        assert task["id"] not in task["depends_on"]
    duplicate = client.post(url, json=request).json()
    assert duplicate["eligible"] is True and duplicate["reason"] == "plan_replayed"
    assert duplicate["workspace"] == plan
    assert duplicate["version"] == 1
    preview = client.post(project_url(workspace, "plan-preview"), json=request).json()
    assert preview["eligible"] is False and preview["reason"] == "already_planned"
    different = client.post(url, json={**request, "prompt": "Build a completely different game"}).json()
    assert different["eligible"] is False and different["reason"] == "already_planned"
    changed_choice = client.post(url, json={**request, "answers": {"dimension": "3d"}}).json()
    assert changed_choice["eligible"] is False
    changed_kind = client.post(url, json={**request, "kind": "movie"}).json()
    assert changed_kind["eligible"] is False
    client.patch(f"/v1/projects/{workspace[0]['id']}", json={"archived": True})
    assert client.post(url, json=request).json()["reason"] == "archived"


def test_existing_conversation_blocks_automatic_plan_but_allows_explicit(client, workspace):
    project, chat = workspace
    client.post(f"/v1/chats/{chat['id']}/messages", json={"content": "Hello"})
    body = {"prompt": "I want to make a movie"}
    for endpoint in ["plan-preview", "plan"]:
        denied = client.post(project_url(workspace, endpoint), json=body).json()
        assert denied["eligible"] is False and denied["reason"] == "existing_conversation"
    allowed = client.post(project_url(workspace, "plan"), json={**body, "explicit": True}).json()
    assert allowed["eligible"] and allowed["workspace"]["kind"] == "movie"


def test_explicit_replan_preserves_completed_tasks_and_editor_work(client, workspace):
    request = {"prompt": "Build a fantasy game", "explicit": True}
    first = client.post(project_url(workspace, "plan"), json=request).json()
    doc = first["workspace"]
    doc["design"] = "My carefully edited design"
    doc["tasks"][0]["status"] = "done"
    doc["tasks"][0]["title"] = "My reviewed scope"
    doc["records"] = {"characters": [{"id": "hero", "title": "Aster", "fields": {"voice": "Quiet and curious"}}]}
    saved = client.put(project_url(workspace, "workspace"), json={"version": first["version"], "workspace": doc}).json()
    replay = client.post(project_url(workspace, "plan"), json=request).json()
    assert replay["version"] == saved["version"]
    assert replay["workspace"] == saved["workspace"]
    additional = client.post(project_url(workspace, "plan"), json={"prompt": "Adapt this to a movie", "kind": "movie", "explicit": True}).json()
    assert additional["workspace"]["design"] == "My carefully edited design"
    assert additional["workspace"]["records"] == saved["workspace"]["records"]
    assert additional["workspace"]["tasks"][0]["status"] == "done"
    assert additional["workspace"]["tasks"][0]["title"] == "My reviewed scope"
    assert "storyboard" in additional["workspace"]["components"]
    ids = [task["id"] for task in additional["workspace"]["tasks"]]
    assert len(ids) == len(set(ids))


def test_preview_reuses_compatible_choices_across_modes(client, workspace):
    client.post(project_url(workspace, "plan"), json={"prompt": "Write a fantasy novel", "answers": {"format": "novel", "budget": "free"}})
    same = client.post(project_url(workspace, "plan-preview"), json={"prompt": "Refine my roadmap", "explicit": True}).json()
    assert same["answers"]["format"] == "novel" and same["answers"]["budget"] == "free"
    changed = client.post(project_url(workspace, "plan-preview"), json={"prompt": "Adapt my story", "kind": "movie", "explicit": True}).json()
    assert "format" not in changed["answers"]
    assert changed["answers"]["budget"] == "free"


@pytest.mark.parametrize("prompt, expected", [
    ("I'd like to make a 2D game", "game"),
    ("Can you build a website about books?", "website"),
    ("Help me write a graphic novel", "comic"),
    ("Create a movie with animated animals", "movie"),
    ("Let's develop an app for book reviews", "app"),
    ("I want to create an image of a game character", None),
    ("Create a movie poster", None),
    ("Write a book chapter", None),
    ("Make a 3D model of a fox", None),
    ("How does a game engine work?", None),
    ("Explain how to build a game", None),
    ("How do I make a movie?", None),
    ("Create an illustration for my book", None),
    ("Make a movie recommendation", None),
    ("Create game ideas", None),
    ("Don't create a game", None),
    ("I don't want to make a movie", None),
])
def test_creation_intent_is_narrow(prompt, expected):
    assert detect_kind(prompt) == expected


def test_inference_does_not_hide_ambiguous_or_negated_choices():
    assert "engine" not in infer_answers("game", "Make a game in Unity or Godot")
    assert infer_answers("game", "Make a 2D game, not 3D")["dimension"] == "2d"
    assert "engine" not in infer_answers("game", "Build a game without Unity")
    assert infer_answers("book", "Write a science fiction ebook")["genre"] == "scifi"
    assert infer_answers("movie", "Create a one-minute animated short film in 9:16")["release_target"] == "vertical"


@pytest.mark.parametrize("kind", ["game", "movie", "book", "comic", "website", "app", "podcast", "music", "course", "brand", "research", "other"])
def test_every_mode_produces_connected_actionable_plan(client, workspace, kind):
    response = client.post(project_url(workspace, "plan"), json={"prompt": "A project about exploring the ocean", "kind": kind, "explicit": True})
    assert response.status_code == 200, response.text
    plan = response.json()["workspace"]
    assert plan["kind"] == kind
    assert 2 <= len(plan["components"]) <= 4
    if kind == "book":
        assert plan["tasks"] == [] and plan["design"] == ""
        assert plan["components"] == ["details", "manuscript"]
    else:
        assert len(plan["tasks"]) >= 11
    seen = set()
    for task in plan["tasks"]:
        assert set(task["depends_on"]) <= seen
        seen.add(task["id"])


def test_online_and_mobile_choices_add_real_prerequisites(client, workspace):
    response = client.post(project_url(workspace, "plan"), json={"prompt": "Build an online multiplayer game for Android"}).json()
    ids = {task["id"] for task in response["workspace"]["tasks"]}
    assert {"game-network", "game-platform"} <= ids


def test_builder_context_tracks_changes_and_respects_project_boundaries(client, workspace):
    project, chat = workspace
    first = client.post(project_url(workspace, "plan"), json={"prompt": "Write a fantasy book about Aster"}).json()
    first["workspace"]["records"] = {"characters": [{"id": "hero", "title": "Aster", "fields": {"voice": "Quiet and curious"}}]}
    saved = client.put(project_url(workspace, "workspace"), json={"version": first["version"], "workspace": first["workspace"]}).json()
    message = client.post(f"/v1/chats/{chat['id']}/messages", json={"content": "Draft the opening scene"}).json()
    body = {"chat_id": chat["id"], "message_id": message["id"], "capability": "chat", "idempotency_key": "builder-context-001"}
    run = client.post("/v1/runs", json=body).json()
    sources = [source for source in run["context_snapshot"] if source["source_type"] == "workspace"]
    assert len(sources) == 1
    assert sources[0]["version"] == str(saved["version"])
    assert "Quiet and curious" in sources[0]["content"]
    assert "Write a fantasy book about Aster" in sources[0]["content"]
    assert len(sources[0]["content"]) <= 16500
    client.patch(f"/v1/chats/{chat['id']}", json={"context_mode": "chat"})
    isolated = client.post("/v1/runs", json={**body, "idempotency_key": "builder-context-isolated"}).json()
    assert all(source["source_type"] != "workspace" for source in isolated["context_snapshot"])
    other = client.post("/v1/projects", json={"name": "Other"}).json()
    client.patch(f"/v1/chats/{chat['id']}", json={"project_id": other["id"], "context_mode": "project"})
    moved = client.post("/v1/runs", json={**body, "idempotency_key": "builder-context-moved"}).json()
    assert all(source["source_type"] != "workspace" for source in moved["context_snapshot"])


def test_unknown_components_invalid_status_and_archived_writes_are_rejected(client, workspace):
    url = project_url(workspace, "workspace")
    initial = client.get(url).json()
    initial["workspace"]["components"].append("unknown-tool")
    assert client.put(url, json=initial).status_code == 422
    initial["workspace"]["components"] = []
    initial["workspace"]["tasks"] = [{"id": "task-1", "title": "Bad state", "status": "complete"}]
    assert client.put(url, json=initial).status_code == 422
    initial["workspace"]["tasks"] = []
    client.patch(f"/v1/projects/{workspace[0]['id']}", json={"archived": True})
    assert client.put(url, json=initial).status_code == 409
    assert client.post(project_url(workspace, "plan"), json={"prompt": "Build a game", "explicit": True}).json()["reason"] == "archived"
def test_legacy_novel_notes_survive_without_universal_planning_tools(client, workspace):
    from powwow.db import SessionLocal
    from powwow.models import ProjectWorkspace
    from powwow.builder_schemas import BuilderWorkspace
    legacy = BuilderWorkspace(kind="book", initialized=True, components=["design", "tasks", "characters"],
                              design="My carefully written story background",
                              tasks=[{"id": "legacy-task", "title": "My old note"}]).model_dump()
    with SessionLocal() as db:
        db.add(ProjectWorkspace(project_id=workspace[0]["id"], workspace=legacy, version=1))
        db.commit()
    for _ in range(3):
        doc = client.get(project_url(workspace, "workspace")).json()
        assert doc["workspace"]["components"] == ["details"]
        assert doc["workspace"]["design"] == legacy["design"]
        assert doc["workspace"]["tasks"] == legacy["tasks"]
        assert doc["workspace"]["records"]["plot"] == [{"id": "legacy-story-notes", "title": "Story notes", "fields": {"description": "Summary:\n" + legacy["design"]}}]
        assert client.put(project_url(workspace, "workspace"), json=doc).status_code == 200
