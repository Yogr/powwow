from sqlalchemy import select

from powwow.auth import owner_id
from powwow.db import SessionLocal
from powwow.main import app
from powwow.models import Artifact
from powwow.storage import Storage


def upload(client, workspace):
    project, chat = workspace
    response = client.post('/v1/uploads', data={'project_id': project['id'], 'chat_id': chat['id']}, files={'file': ('notes.txt', b'asset contents', 'text/plain')})
    assert response.status_code == 201, response.text
    asset = response.json()
    with SessionLocal() as db:
        key = db.scalar(select(Artifact).where(Artifact.id == asset['id'])).storage_key
    return asset, key


def test_delete_removes_bytes_and_record(client, workspace):
    asset, key = upload(client, workspace)
    assert Storage().local_path(key).exists()
    url = '/v1/artifacts/' + asset['id']
    assert client.delete(url).status_code == 204
    assert not Storage().local_path(key).exists()
    assert client.get(url).status_code == 404
    assert client.get(url + '/download').status_code == 404
    assert client.get('/v1/artifacts').json() == []
    assert client.delete(url).status_code == 404


def test_delete_rejects_other_owner(client, workspace):
    asset, key = upload(client, workspace)
    app.dependency_overrides[owner_id] = lambda: 'other-owner'
    assert client.delete('/v1/artifacts/' + asset['id']).status_code == 404
    assert Storage().local_path(key).exists()


def test_storage_failure_keeps_record_and_allows_retry(client, workspace, monkeypatch):
    asset, key = upload(client, workspace)
    original = Storage.delete
    def fail_delete(*args):
        raise OSError('private storage error')
    monkeypatch.setattr(Storage, 'delete', fail_delete)
    url = '/v1/artifacts/' + asset['id']
    response = client.delete(url)
    assert response.status_code == 503
    assert 'private storage error' not in response.text
    assert client.get(url).status_code == 200
    assert Storage().local_path(key).exists()
    monkeypatch.setattr(Storage, 'delete', original)
    assert client.delete(url).status_code == 204


def test_cannot_delete_attachment_of_active_request(client, workspace):
    asset, key = upload(client, workspace)
    _, chat = workspace
    message = client.post(f"/v1/chats/{chat['id']}/messages", json={'content': 'Summarize these notes', 'attachment_ids': [asset['id']]}).json()
    response = client.post('/v1/runs', json={'chat_id': chat['id'], 'message_id': message['id'], 'capability': 'chat', 'idempotency_key': 'delete-active-test', 'budget_usd': 1})
    assert response.status_code == 201, response.text
    assert client.delete('/v1/artifacts/' + asset['id']).status_code == 409
    assert Storage().local_path(key).exists()
