import pytest

from powwow.worker import claim, execute


def setup(client, workspace):
    project, chat = workspace
    url = f"/v1/projects/{project['id']}/workspace"
    doc = client.get(url).json()
    doc['workspace'].update(components=['details'], detail_categories=[{'id': 'characters', 'name': 'Characters'}], records={'characters': [{'id': 'mara', 'title': 'Mara', 'fields': {'description': 'A traveller'}}]})
    assert client.put(url, json=doc).status_code == 200
    message = client.post(f"/v1/chats/{chat['id']}/messages", json={'content': 'A portrait of a traveller'}).json()
    body = {'chat_id': chat['id'], 'message_id': message['id'], 'capability': 'text_to_image', 'idempotency_key': 'entry-image-generation', 'budget_usd': 1, 'settings': {'entry_image': {'category_id': 'characters', 'record_id': 'mara', 'field': 'reference', 'expected_reference': ''}}}
    return url, body


@pytest.mark.parametrize('edit', ['description', 'image', 'delete'])
def test_completed_image_preserves_concurrent_edits_and_replays_once(client, workspace, edit):
    url, body = setup(client, workspace)
    response = client.post('/v1/runs', json=body)
    assert response.status_code == 201, response.text
    run = response.json()
    doc = client.get(url).json()
    record = doc['workspace']['records']['characters'][0]
    record['fields']['description'] = 'An edit made while generating'
    if edit == 'image':
        record['fields']['reference'] = 'manual-choice'
    elif edit == 'delete':
        doc['workspace']['records']['characters'] = []
    assert client.put(url, json=doc).status_code == 200
    execute(*claim())
    result = client.get(f"/v1/runs/{run['id']}").json()
    assert result['status'] == 'succeeded', result
    association = result['model_provenance']['entry_image']
    assert association['status'] == ('attached' if edit == 'description' else 'available_in_assets')
    image = client.get('/v1/artifacts/' + association['artifact_id']).json()
    assert image['project_id'] == workspace[0]['id']
    assert image['name'] == 'mara.png'
    current = client.get(url).json()
    if edit != 'delete':
        record = current['workspace']['records']['characters'][0]
        assert record['fields']['description'] == 'An edit made while generating'
        assert record['fields']['reference'] == (image['id'] if edit == 'description' else 'manual-choice')
    else:
        assert current['workspace']['records']['characters'] == []
    assert client.post('/v1/runs', json=body).json()['id'] == run['id']
    assert claim() is None
    assert client.get(url).json() == current
    assert len(client.get('/v1/usage').json()['entries']) == 1


@pytest.mark.parametrize('change,code', [({'record_id': 'missing'}, 422), ({'category_id': 'other-project'}, 422), ({'field': 'first_image'}, 422), ({'expected_reference': 'stale'}, 409)])
def test_invalid_target_rejected_before_paid_admission(client, workspace, change, code):
    _, body = setup(client, workspace)
    body['settings']['entry_image'].update(change)
    assert client.post('/v1/runs', json=body).status_code == code
    assert client.get('/v1/runs').json() == []
    assert client.get('/v1/usage').json()['entries'] == []


def test_non_image_workflow_cannot_attach_to_entry(client, workspace):
    _, body = setup(client, workspace)
    body['capability'] = 'chat'
    assert client.post('/v1/runs', json=body).status_code == 422


def test_planner_cannot_redirect_an_explicit_entry_image(client, workspace, monkeypatch):
    import json
    from powwow.providers import fixture_result
    url, body = setup(client, workspace)

    def wrong_destination(run):
        result = fixture_result(run)
        if run.settings.get('experience_stage') == 'classify':
            intent = json.loads(result['text'])
            intent['media']['tasks'][0]['destination'] = None
            result['text'] = json.dumps(intent)
        return result

    monkeypatch.setattr('powwow.worker.fixture_result', wrong_destination)
    run = client.post('/v1/runs', json=body).json()
    execute(*claim())
    result = client.get('/v1/runs/' + run['id']).json()
    assert result['error']['code'] == 'invalid_plan'
    assert result['artifact_ids'] == []
    assert not client.get(url).json()['workspace']['records']['characters'][0]['fields'].get('reference')
