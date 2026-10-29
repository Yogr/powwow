import json
from copy import deepcopy

import pytest

from powwow.db import SessionLocal
from powwow.intelligence import CLASSIFIER_POLICY, project_policy
from powwow.models import Run
from powwow.project_experience import ProjectReply, apply_reply, introduction, memory_markdown, reply_messages
from powwow.worker import claim, execute


def test_strict_provider_schema_preserves_required_editor_titles():
    from powwow.hosted_chat import response_schema
    schema = response_schema(ProjectReply)
    record = schema['$defs']['RecordUpdate']
    assert 'title' in record['properties'] and 'title' in record['required']
    assert record['properties']['title'] == {'type': 'string'}
    assert record['additionalProperties'] is False


def queue(client, workspace, prompt, key="experience-test-001", intelligence="basic"):
    message = client.post(f"/v1/chats/{workspace[1]['id']}/messages", json={"content": prompt}).json()
    response = client.post("/v1/runs", json={"chat_id": workspace[1]["id"], "message_id": message["id"],
        "capability": "chat", "settings": {"intelligence": intelligence}, "budget_usd": 1, "idempotency_key": key})
    assert response.status_code == 201, response.text
    return response.json()


def classifier(action="setup", kind="book", target=None, response=False, complexity="simple", title=None):
    return dict(action=action, kind=kind, target_language=target, needs_response=response, complexity=complexity, clarification=None, project_title=title)


def mock_model(monkeypatch, intent, reply=None, before_reply=None):
    calls = []
    def generate(run):
        calls.append(deepcopy(run.settings))
        if run.settings["experience_stage"] == "classify":
            output = intent
        else:
            if before_reply:
                before_reply()
            output = reply or {"reply": "Here are your project details.", "records": []}
        return {"text": json.dumps(output), "model": "test-fixture", "artifacts": [], "metrics": {}, "provenance": {"simulated": True}}
    monkeypatch.setattr("powwow.worker.fixture_result", generate)
    return calls


def result(client, run):
    execute(*claim())
    return client.get(f"/v1/runs/{run['id']}").json()


def test_language_routes_after_earlier_chat_without_local_response(client, workspace, monkeypatch):
    client.post(f"/v1/chats/{workspace[1]['id']}/messages", json={"content": "Hello"})
    calls = mock_model(monkeypatch, classifier(kind="language", target="es"))
    run = result(client, queue(client, workspace, "I want to learn spanish"))
    assert run["status"] == "succeeded"
    assert len(calls) == 1
    assert calls[0]["intelligence_policy"]["model"] == CLASSIFIER_POLICY["model"]
    assert run["settings"]["experience_destination"] == "language"
    assert "personal Spanish tutor" in run["output_text"]
    doc = client.get(f"/v1/projects/{workspace[0]['id']}/workspace").json()["workspace"]
    assert doc["components"] == ["language"]
    assert doc["tasks"] == [] and doc["design"] == ""
    assert doc["answers"]["target_language"] == "es"
    assert len(client.get(f"/v1/chats/{workspace[1]['id']}/messages").json()) == 3


def test_bare_novel_uses_authored_intro_and_plot(client, workspace, monkeypatch):
    calls = mock_model(monkeypatch, classifier())
    run = result(client, queue(client, workspace, "I want to write my first novel", intelligence="super"))
    assert len(calls) == 1
    assert run["settings"]["experience_destination"] == "details"
    assert run["output_text"] == introduction("book")
    assert run["model_provenance"]["response_source"] == "authored_experience_intro"


def test_rich_brief_and_followups_persist_real_editor_fields(client, workspace, monkeypatch):
    prompt = "Write a novel called Apollo Lost. Mara is the flight surgeon. Keep the rescue mission historically accurate."
    records = [
        {"component": "characters", "record_id": None, "title": "Mara", "fields": [{"name": "description", "value": "Flight surgeon"}], "source_quote": "Mara is the flight surgeon."},
        {"component": "memory", "record_id": None, "title": "Historical accuracy", "fields": [{"name": "description", "value": "Verify historical details of the rescue mission against sources."}], "source_quote": "Keep the rescue mission historically accurate."},
    ]
    calls = mock_model(monkeypatch, classifier(response=True, complexity="deep"), {"reply": "I've organized the premise and Mara's role.", "records": records})
    run = result(client, queue(client, workspace, prompt))
    assert run["status"] == "succeeded"
    assert calls[1]["intelligence_policy"]["model"] == "gpt-6-astra"
    assert run["model_provenance"]["project_update"]["status"] == "applied"
    url = f"/v1/projects/{workspace[0]['id']}/workspace"
    saved = client.get(url).json()["workspace"]
    mara = saved["records"]["characters"][0]
    assert mara["fields"]["description"] == "Flight surgeon"
    assert "Historical accuracy" in memory_markdown(saved)
    update = {"component": "characters", "record_id": mara["id"], "title": "Mara", "fields": [{"name": "description", "value": "Flight surgeon. Patient under pressure"}], "source_quote": "Mara is patient under pressure"}
    calls = mock_model(monkeypatch, classifier(action="update", response=True), {"reply": "Mara stays calm under pressure.", "records": [update]})
    followup = result(client, queue(client, workspace, "Mara is patient under pressure", key="experience-followup", intelligence="super"))
    assert calls[1]["intelligence_policy"]["model"] == "gpt-6-astra"
    after = client.get(url).json()["workspace"]
    assert len(after["records"]["characters"]) == 1
    assert after["records"]["characters"][0]["fields"] == {"description": "Flight surgeon. Patient under pressure"}
    assert followup["settings"]["experience_intro"] == ""
    exported = client.get(f"/v1/projects/{workspace[0]['id']}/memory.md")
    assert "Mara" in exported.text and "text/markdown" in exported.headers["content-type"]


@pytest.mark.parametrize("tier,complexity,model,effort", [
    ("basic", "simple", "gpt-6-astra", "high"),
    ("basic", "deep", "gpt-6-astra", "high"),
    ("smarter", "simple", "gpt-6-astra", "high"),
    ("super", "simple", "gpt-6-astra", "high"),
])
def test_model_selection_is_a_floor(tier, complexity, model, effort):
    policy = project_policy(tier, complexity)
    assert (policy["model"], policy["reasoning_effort"]) == (model, effort)


def test_bad_classifier_stops_without_model_repair_or_downgrade(client, workspace, monkeypatch):
    calls = mock_model(monkeypatch, {"action": "setup", "kind": "made-up"})
    run = result(client, queue(client, workspace, "Start a project"))
    assert run["status"] == "failed"
    assert len(calls) == 1
    assert client.get(f"/v1/projects/{workspace[0]['id']}/workspace").json()["version"] == 0


def test_explicit_project_retry_is_not_blocked_by_old_two_attempt_cap(client, workspace, monkeypatch):
    mock_model(monkeypatch, {'action':'setup','kind':'invalid'})
    failed = result(client, queue(client, workspace, 'Create a novel'))
    for index in range(2):
        retry = client.post(f"/v1/runs/{failed['id']}/retry", json={'idempotency_key':f'explicit-project-retry-{index}'})
        assert retry.status_code == 201
        failed = result(client, retry.json())
        assert failed['status'] == 'failed'
    assert failed['attempt'] == 3


def test_invalid_source_cannot_write_project_data(client, workspace, monkeypatch):
    reply = {"reply": "A suggestion.", "records": [{"component": "characters", "record_id": None, "title": "Invented", "fields": [{"name": "description", "value": "Captain"}], "source_quote": "not in user's input"}]}
    mock_model(monkeypatch, classifier(action="update", response=True), reply)
    run = result(client, queue(client, workspace, "Remember my premise"))
    assert run["status"] == "succeeded"
    assert run["model_provenance"]["project_update"]["status"] == "needs_review"
    assert client.get(f"/v1/projects/{workspace[0]['id']}/workspace").json()["workspace"]["records"] == {}


def test_concurrent_edit_is_preserved_and_proposal_retained(client, workspace, monkeypatch):
    url = f"/v1/projects/{workspace[0]['id']}/workspace"
    doc = client.get(url).json()
    doc["workspace"]["records"] = {"characters": [{"id": "mara", "title": "Mara", "fields": {"description": "Quiet"}}]}
    assert client.put(url, json=doc).status_code == 200
    def edit():
        newer = client.get(url).json()
        newer["workspace"]["records"]["characters"][0]["fields"]["description"] = "My manual edit"
        assert client.put(url, json=newer).status_code == 200
    reply = {"reply": "Mara is patient.", "records": [{"component": "characters", "record_id": "mara", "title": "Mara", "fields": [{"name": "description", "value": "Patient"}], "source_quote": "Mara is patient"}]}
    mock_model(monkeypatch, classifier(action="update", response=True), reply, edit)
    run = result(client, queue(client, workspace, "Mara is patient"))
    assert run["model_provenance"]["project_update"]["status"] == "needs_review"
    assert run["model_provenance"]["project_reply"] == reply
    assert client.get(url).json()["workspace"]["records"]["characters"][0]["fields"]["description"] == "My manual edit"


@pytest.mark.parametrize('prompt,kind,target,title', [
    ('Help me write my first novel', 'book', None, 'My First Novel'),
    ('I want to learn Spanish', 'language', 'es', 'Learning Spanish'),
    ('Create a game called Apollo Lost', 'game', None, 'Apollo Lost Game'),
    ('Write a novel called Apollo Lost', 'book', None, 'Apollo Lost Novel'),
    ('Create a Spanish learning app', 'app', None, 'Spanish Learning App'),
])
def test_standalone_intake_creates_one_project_and_preserves_chat(client, monkeypatch, prompt, kind, target, title):
    chat = client.post('/v1/chats', json={}).json()
    calls = mock_model(monkeypatch, classifier(kind=kind, target=target, title=title))
    run = result(client, queue(client, ({}, chat), prompt))
    assert run['status'] == 'succeeded'
    projects = client.get('/v1/projects').json()
    assert len(projects) == 1 and projects[0]['id'] == run['project_id']
    assert projects[0]['name'] == title
    assert len(calls) == 1
    assert run['settings']['experience_intent']['project_title'] == title
    assert client.get('/v1/chats').json()[0]['project_id'] == run['project_id']
    assert len(client.get(f"/v1/chats/{chat['id']}/messages").json()) == 2


def test_inferred_title_does_not_rename_existing_project(client, workspace, monkeypatch):
    mock_model(monkeypatch, classifier(kind='language', target='es', title='Learning Spanish'))
    run = result(client, queue(client, workspace, 'I want to learn Spanish'))
    assert run['status'] == 'succeeded'
    assert client.get('/v1/projects').json()[0]['name'] == workspace[0]['name']


def test_full_attached_brief_survives_context_and_supports_editor_updates(client, workspace, monkeypatch):
    from powwow.project_experience import classifier_messages
    brief = 'Story background. ' * 4000 + 'Mara is the flight surgeon.'
    uploaded = client.post('/v1/uploads', files={'file': ('brief.txt', brief.encode(), 'text/plain')}).json()
    message = client.post(f"/v1/chats/{workspace[1]['id']}/messages", json={'content': 'Develop a novel from the attached brief.', 'attachment_ids': [uploaded['id']]}).json()
    request = client.post('/v1/runs', json={'chat_id': workspace[1]['id'], 'message_id': message['id'], 'attachment_ids': [uploaded['id']], 'idempotency_key': 'attached-full-brief-test'}).json()
    with SessionLocal() as db:
        run = db.get(Run, request['id'])
        assert next(s for s in run.context_snapshot if s['source_id'] == uploaded['id'])['content'] == brief
        assert json.loads(classifier_messages(run)[1]['content'])['attached_references'][0]['content'] == brief
    mock_model(monkeypatch, classifier(response=True), {'reply': 'Mara is captured.', 'records': [
        {'component': 'characters', 'record_id': None, 'title': 'Mara', 'fields': [{'name':'description','value':'Flight surgeon'}], 'source_quote':'Mara is the flight surgeon.'}]})
    completed = result(client, request)
    assert completed['status'] == 'succeeded'
    assert completed['model_provenance']['project_update']['status'] == 'applied'


def test_legacy_classifier_without_title_can_still_create_project(client, monkeypatch):
    chat = client.post('/v1/chats', json={}).json()
    intent = classifier(kind='language', target='es')
    del intent['project_title']
    calls = mock_model(monkeypatch, intent)
    run = result(client, queue(client, ({}, chat), 'I want to learn Spanish'))
    assert run['status'] == 'succeeded'
    assert client.get('/v1/projects').json()[0]['name'] == 'Learning Spanish'
    assert len(calls) == 1


@pytest.mark.parametrize('kind', ['book', 'game'])
def test_long_brief_fits_without_repeated_copies_or_losing_saved_content(client, monkeypatch, kind):
    from powwow.hosted_chat import request_body, response_schema
    prompt = 'Create Apollo Lost. ' + ('The crew must rescue Mara and verify the historical details. ' * 210)
    chat = client.post('/v1/chats', json={}).json()
    bodies = []
    def generate(run):
        if run.settings['experience_stage'] == 'classify':
            value = classifier(kind=kind, title='Apollo Lost', response=True, complexity='deep')
        else:
            snapshot = deepcopy(run.settings['experience_snapshot'])
            body = request_body(run)
            bodies.append(body)
            payload = json.loads(body['input'][1]['content'])
            assert payload['request'] == prompt
            assert payload['project']['brief'] == {'$text_ref': 'request'}
            assert payload['project']['plan_prompt'] == {'$text_ref': 'request'}
            assert payload['recent_conversation'] == []
            assert run.settings['experience_snapshot'] == snapshot
            def expand(value):
                if isinstance(value, dict):
                    if value == {'$text_ref': 'request'}:
                        return prompt
                    if '$text_parts' in value:
                        return ''.join(expand(part) for part in value['$text_parts'])
                    return {key: expand(item) for key, item in value.items()}
                if isinstance(value, list):
                    return [expand(item) for item in value]
                return value
            assert expand(payload['project']) == snapshot['workspace']
            # The previous repeated representation would have rejected this brief.
            payload['project'] = snapshot['workspace']
            payload['recent_conversation'] = [{'role': 'user', 'content': prompt}]
            inflated = deepcopy(body['input'])
            inflated[1]['content'] = json.dumps(payload, ensure_ascii=False)
            assert len(json.dumps({'input': inflated, 'schema': response_schema(ProjectReply)}, ensure_ascii=False).encode('utf-8')) + 2048 > run.settings['intelligence_policy']['max_input_tokens']
            value = {'reply': 'Your brief is ready to develop.', 'records': []}
        return {'text': json.dumps(value), 'model': 'test-fixture', 'metrics': {}, 'artifacts': [], 'provenance': {'simulated': True}}
    monkeypatch.setattr('powwow.worker.fixture_result', generate)
    run = result(client, queue(client, ({}, chat), prompt))
    assert run['status'] == 'succeeded', run.get('error')
    assert len(bodies) == 1
    saved = client.get(f"/v1/projects/{run['project_id']}/workspace").json()['workspace']
    assert saved['brief'] == prompt and saved['plan_prompt'] == prompt


def test_large_unique_context_is_counted_and_sent_intact(client, workspace, monkeypatch):
    import httpx
    from pydantic import SecretStr
    from powwow.config import settings
    from powwow.hosted_chat import openai_chat
    from test_hosted_language import transport, output
    mock_model(monkeypatch, classifier(response=True))
    completed = result(client, queue(client, workspace, 'Create my novel'))
    submitted = []
    payloads = []
    monkeypatch.setattr(settings(), 'openai_api_key', SecretStr('fixture-key'))
    def handler(request):
        payloads.append(json.loads(request.content))
        if request.url.path.endswith('/input_tokens'):
            return httpx.Response(200, json={'input_tokens': 20000})
        return httpx.Response(200, json=output())
    transport(monkeypatch, handler)
    with SessionLocal() as db:
        run = db.get(Run, completed['id'])
        run.settings = {**run.settings, 'experience_stage': 'respond',
                        'intelligence_policy': project_policy('super', 'deep')}
        run.context_snapshot = [{'source_type': 'attachment', 'source_id': 'large-reference', 'content': 'Unique reference text. ' * 4000}]
        openai_chat(run, lambda: False, lambda: submitted.append(True))
        assert run.settings['hosted_input_tokens'] == 20000
    assert submitted == [True]
    assert len(payloads) == 2
    assert payloads[0]['input'] == payloads[1]['input']
    assert json.loads(payloads[1]['input'][1]['content'])['authorized_sources'][0]['content'] == 'Unique reference text. ' * 4000


@pytest.mark.parametrize('mode', ['success', 'budget', 'uncertain', 'count-failure', 'incomplete'])
def test_long_project_counts_reserves_and_never_repeats_uncertain_submission(client, monkeypatch, mode):
    import httpx
    from pydantic import SecretStr
    from powwow.config import settings
    from powwow.models import Account
    from test_hosted_language import transport, output
    monkeypatch.setattr(settings(), 'enable_test_provider', False)
    monkeypatch.setattr(settings(), 'openai_api_key', SecretStr('fixture-key'))
    chat = client.post('/v1/chats', json={}).json()
    prompt = 'Create a novel. ' + 'Detailed story background. ' * 4000
    submitted = queue(client, ({}, chat), prompt, intelligence='super')
    calls = []
    def handler(request):
        count = request.url.path.endswith('/input_tokens')
        calls.append('count' if count else 'generate')
        if count:
            if mode == 'count-failure':
                raise httpx.ReadTimeout('fixture', request=request)
            return httpx.Response(200, json={'input_tokens': (90000 if mode == 'budget' else 20000) if len(calls) > 2 else 10000})
        if len(calls) == 2:
            return httpx.Response(200, json=output(json.dumps(classifier(response=True, complexity='deep'))))
        with SessionLocal() as db:
            current = db.get(Run, submitted['id'])
            assert current.submission_started
            assert current.reservation_usd >= .9548
            assert db.get(Account, current.owner_id).reserved_usd >= .9548
        if mode == 'uncertain':
            raise httpx.ReadTimeout('fixture', request=request)
        assert json.loads(request.content)['max_output_tokens'] > 8192
        if mode == 'incomplete':
            response = output('', status='incomplete')
            response['incomplete_details'] = {'reason': 'max_output_tokens'}
            return httpx.Response(200, json=response)
        return httpx.Response(200, json=output(json.dumps({'reply': 'Ready.', 'records': []})))
    transport(monkeypatch, handler)
    completed = result(client, submitted)
    assert calls == (['count'] if mode == 'count-failure' else ['count', 'generate', 'count'] if mode == 'budget' else ['count', 'generate', 'count', 'generate'])
    assert completed['status'] == ('succeeded' if mode == 'success' else 'failed')
    if mode != 'success':
        assert completed['error']['code'] == {'budget': 'budget_too_low', 'uncertain': 'submission_uncertain', 'count-failure': 'token_count_unavailable', 'incomplete': 'response_incomplete'}[mode]
        if mode == 'incomplete':
            assert 'not a prompt-length rejection' in completed['error']['message']
            assert completed['model_provenance']['incomplete_reason'] == 'max_output_tokens'
    with SessionLocal() as db:
        current = db.get(Run, submitted['id'])
        assert (db.get(Account, current.owner_id).reserved_usd > 0) == (mode == 'uncertain')
    assert claim() is None


@pytest.mark.parametrize('failure', ['submission_uncertain', 'hosted_rejected'])
def test_classifier_cost_survives_second_stage_failure(client, workspace, monkeypatch, failure):
    from pydantic import SecretStr
    from powwow.config import settings
    from powwow.models import Account
    from powwow.providers import ProviderFailure
    cfg = settings()
    monkeypatch.setattr(cfg, 'enable_test_provider', False)
    monkeypatch.setattr(cfg, 'openai_api_key', SecretStr('fixture-not-a-real-key'))
    calls = []
    def hosted(run, cancelled, mark):
        mark()
        calls.append(run.settings['experience_stage'])
        if calls[-1] == 'classify':
            return {'text': json.dumps(classifier(action='update',response=True)), 'model':'classifier-fixture', 'metrics':{'cost_estimate_usd':.002}, 'provenance':{}, 'artifacts':[]}
        raise ProviderFailure(failure, 'Simulated failure')
    monkeypatch.setattr('powwow.worker.openai_chat', hosted)
    submitted = queue(client, workspace, 'Add Mara to the characters')
    run = result(client, submitted)
    assert run['status'] == 'failed'
    assert run['error']['code'] == failure
    assert run['actual_cost_usd'] == .002
    with SessionLocal() as db:
        saved = db.get(Run, run['id'])
        account = db.get(Account, saved.owner_id)
        assert account.spent_usd == .002
        assert (account.reserved_usd > 0) == (failure == 'submission_uncertain')
    assert calls == ['classify','respond']
    assert claim() is None
    if failure == 'submission_uncertain':
        retry = client.post(f"/v1/runs/{run['id']}/retry", json={'idempotency_key':'no-repeat-unknown'})
        assert retry.status_code == 409


def test_task_and_blueprint_updates_are_visible_in_native_structures(client, workspace, monkeypatch):
    prompt = 'Add a task to verify the Apollo dates and record historical accuracy in the blueprint.'
    records = [
        {'component':'tasks','record_id':None,'title':'Verify Apollo dates','fields':[{'name':'description','value':'Check primary NASA sources.'}], 'source_quote':'Add a task to verify the Apollo dates'},
        {'component':'design','record_id':None,'title':'Historical accuracy','fields':[{'name':'content','value':'Verify historical details before drafting.'}], 'source_quote':'record historical accuracy in the blueprint'},
    ]
    mock_model(monkeypatch, classifier(action='update', response=True), {'reply':'Here is the research task.', 'records':records})
    run=result(client,queue(client,workspace,prompt))
    assert run['model_provenance']['project_update']['status']=='applied'
    doc=client.get(f"/v1/projects/{workspace[0]['id']}/workspace").json()['workspace']
    assert doc['tasks'][0]['title']=='Verify Apollo dates'
    assert 'Historical accuracy' in doc['design']


def test_later_chat_uses_saved_character_and_memory_without_restarting(client, workspace, monkeypatch):
    url = f"/v1/projects/{workspace[0]['id']}/workspace"
    doc = client.get(url).json()
    doc['workspace'].update(kind='book', initialized=True, components=['characters', 'memory'], records={
        'characters': [{'id': 'mara', 'title': 'Mara', 'fields': {'role': 'Flight surgeon'}}],
        'memory': [{'id': 'constraint', 'title': 'Historical accuracy', 'fields': {'content': 'Verify dates with NASA.'}}],
    })
    assert client.put(url, json=doc).status_code == 200
    second = client.post('/v1/chats', json={'project_id': workspace[0]['id']}).json()
    for turn in range(14):
        client.post(f"/v1/chats/{second['id']}/messages", json={'content': f'Discussion turn {turn}.'})
    calls = mock_model(monkeypatch, classifier(action='update', response=True), {'reply': 'Mara has a new constraint.', 'records': [
        {'component': 'characters', 'record_id': 'mara', 'title': 'Mara', 'fields': [{'name': 'description', 'value': 'Flight surgeon. Bring the crew home'}], 'source_quote': 'Mara wants to bring the crew home'}
    ]})
    run = result(client, queue(client, (workspace[0], second), 'Mara wants to bring the crew home'))
    assert run['status'] == 'succeeded' and not run['settings']['experience_destination']
    assert calls[1]['experience_snapshot']['workspace']['records']['memory'][0]['fields']['description'] == 'Content:\nVerify dates with NASA.'
    saved = client.get(url).json()['workspace']
    assert saved['records']['characters'] == [{'id': 'mara', 'title': 'Mara', 'fields': {'description': 'Flight surgeon. Bring the crew home'}}]


def test_chat_only_scope_neither_reads_nor_mutates_project(client, workspace, monkeypatch):
    url = f"/v1/projects/{workspace[0]['id']}/workspace"
    doc = client.get(url).json()
    doc['workspace']['brief'] = 'Private project secret'
    assert client.put(url, json=doc).status_code == 200
    private = client.post('/v1/chats', json={'project_id': workspace[0]['id'], 'context_mode': 'chat'}).json()
    calls = mock_model(monkeypatch, classifier(action='chat', kind=None, response=True))
    run = result(client, queue(client, (workspace[0], private), 'Explain gravity'))
    assert run['status'] == 'succeeded'
    assert calls[1]['experience_snapshot']['workspace']['brief'] == ''
    assert run['settings']['experience_project_access'] is False
    with SessionLocal() as db:
        saved = db.get(Run, run['id'])
        assert 'Private project secret' not in json.dumps(reply_messages(saved))
        with pytest.raises(ValueError, match='authorized project context'):
            apply_reply(db, saved, ProjectReply.model_validate({'reply': 'Invalid', 'records': [
                {'component': 'memory', 'record_id': None, 'title': 'Gravity', 'fields': [{'name': 'content', 'value': 'A fact'}], 'source_quote': 'Explain gravity'}
            ]}))
    assert client.get(url).json()['workspace']['records'] == {}


def test_project_reply_retains_authorized_sources_and_web_citations(client, workspace, monkeypatch):
    mock_model(monkeypatch, classifier(action='chat', response=True))
    run = queue(client, workspace, 'Explain the source')
    with SessionLocal() as db:
        saved = db.get(Run, run['id'])
        saved.context_snapshot += [
            {'source_type': 'artifact', 'source_id': 'notes', 'content': 'User-supplied background'},
            {'source_type': 'web', 'source_id': 'source', 'url': 'https://example.org/source', 'search_provider': 'Brave', 'content': 'Retrieved evidence'},
        ]
        saved.settings = {**saved.settings, 'experience_intent': classifier(action='chat', response=True), 'web_search': True}
        messages = reply_messages(saved)
        payload = json.loads(messages[1]['content'])
        assert any(s.get('content') == 'User-supplied background' for s in payload['authorized_sources'])
        assert any(s.get('url') == 'https://example.org/source' for s in payload['authorized_sources'])
        assert 'Cite factual claims' in messages[0]['content']


def test_saved_reply_recovers_local_writes_without_another_paid_request(client, workspace, monkeypatch):
    from sqlalchemy.exc import SQLAlchemyError
    calls = mock_model(monkeypatch, classifier(action='update', response=True), {'reply': 'Mara is ready.', 'records': [
        {'component': 'characters', 'record_id': None, 'title': 'Mara', 'fields': [{'name': 'description', 'value': 'Flight surgeon'}], 'source_quote': 'Mara is the flight surgeon'}
    ]})
    with monkeypatch.context() as interrupted:
        def fail_write(*args, **kwargs):
            raise SQLAlchemyError('Simulated storage outage after saving the paid reply')
        interrupted.setattr('powwow.project_experience.apply_reply', fail_write)
        run = result(client, queue(client, workspace, 'Mara is the flight surgeon'))
        assert run['status'] == 'succeeded'
        assert run['model_provenance']['project_update']['status'] == 'pending'
    assert claim() is None
    recovered = client.get(f"/v1/runs/{run['id']}").json()
    assert recovered['model_provenance']['project_update']['status'] == 'applied'
    assert len(calls) == 2  # Only the original classifier and response.
    assert len(client.get(f"/v1/projects/{workspace[0]['id']}/workspace").json()['workspace']['records']['characters']) == 1


def test_character_name_correction_preserves_identity_and_other_fields(client, workspace, monkeypatch):
    url = f"/v1/projects/{workspace[0]['id']}/workspace"
    doc = client.get(url).json()
    doc['workspace']['records'] = {'characters': [{'id': 'mara', 'title': 'Mara', 'fields': {'role': 'Flight surgeon'}}]}
    client.put(url, json=doc)
    mock_model(monkeypatch, classifier(action='update', response=True), {'reply': 'Her name is Maria.', 'records': [
        {'component': 'characters', 'record_id': 'mara', 'title': 'Maria', 'fields': [], 'source_quote': 'Rename Mara to Maria'}
    ]})
    run = result(client, queue(client, workspace, 'Rename Mara to Maria'))
    assert run['model_provenance']['project_update']['status'] == 'applied'
    assert client.get(url).json()['workspace']['records']['characters'] == [{'id': 'mara', 'title': 'Maria', 'fields': {'description': 'Role:\nFlight surgeon'}}]

def test_custom_category_updates_description_without_losing_image(client, workspace, monkeypatch):
    url = f"/v1/projects/{workspace[0]['id']}/workspace"
    doc = client.get(url).json()
    doc['workspace'].update(components=['details'], detail_categories=[{'id':'detail-props','name':'Props'}], records={
        'detail-props': [{'id':'lantern','title':'Lantern','fields':{'description':'Brass.','reference':'image-id'}}]})
    assert client.put(url,json=doc).status_code == 200
    calls = mock_model(monkeypatch, classifier(action='update', response=True), {'reply':'The lantern is brass and glows blue.','records':[
        {'component':'detail-props','record_id':'lantern','title':'Lantern','fields':[{'name':'description','value':'Brass. Glows blue.'}],'source_quote':'The lantern glows blue'}]})
    run = result(client, queue(client, workspace, 'The lantern glows blue'))
    assert run['workflow_id'] == 'project.experience.v2'
    assert run['model_provenance']['project_update']['status'] == 'applied'
    saved = client.get(url).json()['workspace']
    assert saved['components'] == ['details']
    assert saved['records']['detail-props'][0]['fields'] == {'description':'Brass. Glows blue.','reference':'image-id'}
    assert len(calls) == 2


def test_legacy_paid_reply_remains_recoverable_after_consolidation(client, workspace, monkeypatch):
    calls = mock_model(monkeypatch, classifier(action='update', response=True), {'reply':'Mara is a surgeon.','records':[
        {'component':'characters','record_id':None,'title':'Mara','fields':[{'name':'role','value':'Surgeon'}],'source_quote':'Mara is a surgeon'}]})
    run = result(client, queue(client, workspace, 'Mara is a surgeon'))
    assert run['model_provenance']['project_update']['status'] == 'applied'
    saved = client.get(f"/v1/projects/{workspace[0]['id']}/workspace").json()['workspace']
    assert saved['records']['characters'][0]['fields']['description'] == 'Role:\nSurgeon'
    assert len(calls) == 2
