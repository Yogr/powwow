from sqlalchemy import create_engine, text

from powwow.auth import owner_id
from powwow.db import SessionLocal
from powwow.main import app
from powwow.migrations import component_chat_sessions
from powwow.models import Run
from powwow.project_experience import reply_messages


def test_component_sessions_persist_and_isolate_history(client, workspace):
    project, old_chat = workspace
    base = f"/v1/projects/{project['id']}/components"
    details = client.put(base + "/details/chat").json()
    tasks = client.put(base + "/tasks/chat").json()
    assert details['component_id'] == 'details'
    assert tasks['id'] != details['id'] != old_chat['id']
    assert client.put(base + "/details/chat").json()['id'] == details['id']
    for chat, content in [(old_chat, 'Private old conversation'), (tasks, 'Private task conversation'), (details, 'Own earlier conversation')]:
        client.post(f"/v1/chats/{chat['id']}/messages", json={'content': content})
    url = f"/v1/projects/{project['id']}/workspace"
    doc = client.get(url).json()
    doc['workspace']['design'] = 'Shared saved blueprint'
    client.put(url, json=doc)
    message = client.post(f"/v1/chats/{details['id']}/messages", json={'content': 'Develop this character'}).json()
    response = client.post('/v1/runs', json={'chat_id': details['id'], 'message_id': message['id'], 'capability': 'chat', 'idempotency_key': 'component-session-check'})
    assert response.status_code == 201, response.text
    run = response.json()
    sources = str(run['context_snapshot'])
    assert 'Own earlier conversation' in sources and 'Shared saved blueprint' in sources
    assert 'Private old conversation' not in sources and 'Private task conversation' not in sources
    assert run['settings']['component_session'] == 'details'
    with SessionLocal() as db:
        saved = db.get(Run, run['id'])
        saved.settings = {**saved.settings, 'experience_intent': {'action': 'update'}}
        payload = reply_messages(saved)[1]['content']
        assert '"active_component": "details"' in payload
        assert 'Private task conversation' not in payload


def test_component_sessions_project_and_owner_boundaries(client, workspace):
    project, _ = workspace
    url = f"/v1/projects/{project['id']}/components/details/chat"
    first = client.put(url).json()
    second_project = client.post('/v1/projects', json={'name': 'Other'}).json()
    other = client.put(f"/v1/projects/{second_project['id']}/components/details/chat").json()
    assert first['id'] != other['id']
    assert client.patch(f"/v1/chats/{first['id']}", json={'project_id': second_project['id']}).status_code == 409
    assert client.patch(f"/v1/chats/{first['id']}", json={'archived': True}).status_code == 409
    for invalid in ('characters', 'unknown', 'language'):
        assert client.put(url.replace('details', invalid)).status_code == 422
    app.dependency_overrides[owner_id] = lambda: 'test-owner-b'
    assert client.put(url).status_code == 404
    app.dependency_overrides[owner_id] = lambda: 'test-owner-a'
    client.patch(f"/v1/projects/{project['id']}", json={'archived': True})
    assert client.put(url).status_code == 409


def test_session_migration_keeps_old_chats_and_is_repeatable():
    engine = create_engine('sqlite://')
    with engine.begin() as connection:
        connection.execute(text('CREATE TABLE chats (id TEXT PRIMARY KEY, project_id TEXT, title TEXT)'))
        connection.execute(text("INSERT INTO chats VALUES ('old', 'project', 'Keep my conversation')"))
        component_chat_sessions(connection)
        component_chat_sessions(connection)
        assert connection.execute(text('SELECT title, component_id FROM chats')).one() == ('Keep my conversation', None)
        connection.execute(text("INSERT INTO chats VALUES ('second', 'project', 'Another ordinary chat', NULL)"))
