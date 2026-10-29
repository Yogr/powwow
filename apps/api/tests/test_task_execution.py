import json

import pytest
from pydantic import ValidationError

from powwow.db import SessionLocal
from powwow.media_planning import MediaTask, TaskPlan
from powwow.models import Account, Run, UsageEntry
from powwow.providers import ProviderFailure
from powwow.task_execution import Tasks
from powwow.worker import claim, execute


def task(index, **extra):
    return MediaTask(id=f'image-{index}', workflow='image.create.v1', instructions=f'Create only enemy {index} in T-pose.',
        output_name=f'Enemy{index}.png', transparent_background=True, acceptance=['One subject in T-pose, no background'], **extra)


def queue(client, workspace, monkeypatch, tasks):
    from powwow.config import settings
    monkeypatch.setattr(settings(), 'max_run_budget_usd', 5)
    plan = TaskPlan(summary='Create separate enemy references', tasks=tasks)
    from powwow.providers import fixture_result
    def fixture(run):
        if run.settings.get('experience_stage') == 'classify':
            return {'text': json.dumps({'action': 'media', 'kind': None, 'target_language': None, 'complexity': 'deep',
                'needs_response': False, 'clarification': None, 'project_title': None, 'media': plan.model_dump()}),
                'model': 'test-fixture', 'metrics': {'cost_estimate_usd': 0}, 'artifacts': []}
        return fixture_result(run)
    monkeypatch.setattr('powwow.worker.fixture_result', fixture)
    chat = workspace[1]
    msg = client.post(f"/v1/chats/{chat['id']}/messages", json={'content': 'Create separate enemy reference images.'}).json()
    response = client.post('/v1/runs', json={'chat_id': chat['id'], 'message_id': msg['id'], 'idempotency_key': 'task-test-001', 'budget_usd': 5})
    assert response.status_code == 201, response.text
    return response.json()


def test_five_tasks_produce_five_named_transparent_files(client, workspace, monkeypatch):
    run = queue(client, workspace, monkeypatch, [task(i) for i in range(5)])
    execute(*claim())
    result = client.get('/v1/runs/' + run['id']).json()
    assert result['status'] == 'succeeded', result.get('error')
    assert len(result['artifact_ids']) == 5
    assert list(result['model_provenance']['tasks']) == [f'image-{i}' for i in range(5)]
    assets = client.get('/v1/artifacts').json()
    assert {a['name'] for a in assets} == {f'Enemy{i}.png' for i in range(5)}
    assert all(a['metadata']['quality_review']['passed'] for a in assets)
    assert all(a['metadata']['creation_brief'].startswith('Create only enemy') for a in assets)


def test_task_graph_rejects_cycles_and_duplicate_names():
    with pytest.raises(ValidationError):
        TaskPlan(summary='invalid', tasks=[task(1, depends_on=['image-2']), task(2, depends_on=['image-1'])])
    with pytest.raises(ValidationError):
        TaskPlan(summary='invalid', tasks=[task(1), task(1)])


def test_resume_preserves_completed_generation(client, workspace, monkeypatch):
    run = queue(client, workspace, monkeypatch, [task(1), task(2)])
    original = Tasks.image
    def interrupted(self, task, refs):
        if task.id == 'image-2':
            raise ProviderFailure('provider_offline', 'Fixture interruption before submission')
        return original(self, task, refs)
    monkeypatch.setattr(Tasks, 'image', interrupted)
    execute(*claim())
    first = client.get('/v1/runs/' + run['id']).json()
    assert first['status'] == 'failed' and len(first['artifact_ids']) == 1
    monkeypatch.setattr(Tasks, 'image', original)
    retry = client.post('/v1/runs/' + run['id'] + '/retry', json={'idempotency_key': 'resume-task-test', 'budget_usd': 5})
    assert retry.status_code == 201, retry.text
    assert retry.json()['id'] == run['id']
    execute(*claim())
    done = client.get('/v1/runs/' + run['id']).json()
    assert done['status'] == 'succeeded' and len(done['artifact_ids']) == 2
    assert first['artifact_ids'][0] in done['artifact_ids']
    with SessionLocal() as db:
        assert db.query(UsageEntry).filter_by(run_id=run['id']).count() == 1


def test_uncertain_task_retains_reservation_and_blocks_retry(client, workspace, monkeypatch):
    run = queue(client, workspace, monkeypatch, [task(1)])
    def uncertain(self, task, refs):
        self.reserve_and_submit(task.id + '-generate', 1)
        raise ProviderFailure('submission_uncertain', 'Fixture lost response')
    monkeypatch.setattr(Tasks, 'image', uncertain)
    execute(*claim())
    result = client.get('/v1/runs/' + run['id']).json()
    assert result['error']['code'] == 'submission_uncertain'
    with SessionLocal() as db:
        assert db.get(Run, run['id']).reservation_usd > 0
    assert client.post('/v1/runs/' + run['id'] + '/retry', json={'idempotency_key': 'uncertain-retry'}).status_code == 409


def test_foreign_task_source_is_rejected_before_generation(client, workspace, monkeypatch):
    t = task(1).model_copy(update={'workflow': 'image.edit.v1', 'source_image_ids': ['not-authorized']})
    run = queue(client, workspace, monkeypatch, [t])
    execute(*claim())
    result = client.get('/v1/runs/' + run['id']).json()
    assert result['error']['code'] == 'invalid_plan'
    assert not result['artifact_ids']


def test_quality_failure_is_not_automatically_regenerated(client, workspace, monkeypatch):
    run = queue(client, workspace, monkeypatch, [task(1), task(2)])
    original = Tasks.review
    def reject(self, task, asset, refs):
        if task.id == 'image-1':
            raise ProviderFailure('quality_review_failed', 'Wrong pose')
        return original(self, task, asset, refs)
    monkeypatch.setattr(Tasks, 'review', reject)
    execute(*claim())
    result = client.get('/v1/runs/' + run['id']).json()
    assert result['status'] == 'failed' and len(result['artifact_ids']) == 2
    assert result['model_provenance']['tasks']['image-1']['status'] == 'needs_review'
    assert result['model_provenance']['tasks']['image-2']['status'] == 'completed'
    assert client.post('/v1/runs/' + run['id'] + '/retry', json={'idempotency_key': 'quality-retry'}).status_code == 409


def test_failed_review_blocks_dependent_tasks_only(client, workspace, monkeypatch):
    run = queue(client, workspace, monkeypatch, [task(1), task(2, depends_on=['image-1']), task(3)])
    original = Tasks.review
    def reject(self, task, asset, refs):
        if task.id == 'image-1':
            raise ProviderFailure('quality_review_failed', 'Wrong anatomy')
        return original(self, task, asset, refs)
    monkeypatch.setattr(Tasks, 'review', reject)
    execute(*claim())
    result = client.get('/v1/runs/' + run['id']).json()
    assert len(result['artifact_ids']) == 2
    assert result['model_provenance']['tasks']['image-2']['error']['code'] == 'dependency_failed'
    assert result['model_provenance']['tasks']['image-3']['status'] == 'completed'
