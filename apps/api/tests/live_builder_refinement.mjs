// Opt-in live acceptance. Uses the private QA credential file without logging it.
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import { openQaSession } from '../../web/scripts/qa-session.mjs';

const output = new URL('../../../evals/reports/project-builder/live-ai.json', import.meta.url);
const browser = await chromium.launch({ headless: true });
let api, base, project, run;
const report = { started_at: new Date().toISOString(), passed: false, checks: [] };
try {
  const page = await browser.newPage();
  ({ api, base } = await openQaSession(page));
  const schema = await (await page.request.get('http://127.0.0.1:8000/openapi.json')).json();
  if (!schema.paths['/v1/projects/{project_id}/plan-refinement']) throw new Error('Restarted API does not expose refinement endpoint');
  const catalog = await (await api.get(base + '/v1/catalog')).json();
  const chat = catalog.capabilities.find(item => item.id === 'chat');
  if (chat?.provider !== 'ollama' || !chat.enabled) throw new Error('Live acceptance requires a configured local Ollama chat provider');
  const created = await api.post(base + '/v1/projects', { data: { name: 'QA · AI project roadmap acceptance' } });
  if (created.status() !== 201) throw new Error('QA project creation failed: ' + created.status());
  project = await created.json();
  const url = base + '/v1/projects/' + project.id;
  const initialResponse = await api.post(url + '/plan', { data: {
    prompt: 'I want to build a small 2D browser game where a young fox collects three lost stars, avoids puddles, and brings the stars back to its den. A child should be able to understand the controls without help. Start with one short level, keyboard controls, original simple artwork, no accounts, no online play, and no paid tools.',
    answers: { dimension: '2d', perspective: 'side', engine: 'browser', platform: 'web', play_mode: 'solo', experience: 'beginner', budget: 'free' },
  } });
  if (!initialResponse.ok()) throw new Error('Starter plan failed: ' + initialResponse.status());
  const initial = await initialResponse.json();
  report.initial_task_count = initial.workspace.tasks.length;
  const queuedResponse = await api.post(url + '/plan-refinement', { data: { budget_usd: 0, idempotency_key: 'qa-live-planning-' + crypto.randomUUID() } });
  if (queuedResponse.status() !== 201) throw new Error('Refinement admission failed: ' + queuedResponse.status());
  run = await queuedResponse.json();
  report.provider = run.provider;
  report.model = run.model;
  report.run_id = run.id;
  console.log(JSON.stringify({ stage: 'queued', provider: run.provider, model: run.model }));
  const deadline = Date.now() + 540000;
  let previous, lastPrint = 0;
  while (Date.now() < deadline) {
    run = await (await api.get(base + '/v1/runs/' + run.id)).json();
    if (run.status !== previous || Date.now() - lastPrint > 30000) {
      console.log(JSON.stringify({ stage: run.status, output_characters: run.output_text.length }));
      previous = run.status;
      lastPrint = Date.now();
    }
    if (['succeeded', 'failed', 'cancelled'].includes(run.status)) break;
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  report.run_status = run.status;
  report.output_characters = run.output_text?.length || 0;
  report.actual_cost_usd = run.actual_cost_usd;
  report.model_provenance = { finish_reason: run.model_provenance?.finish_reason, truncated: run.model_provenance?.truncated, output_limit: run.model_provenance?.output_limit };
  if (run.status !== 'succeeded') throw new Error('Live planning did not succeed: ' + (run.error?.code || run.status));
  const reviewResponse = await api.get(url + '/plan-refinements/' + run.id);
  report.review_status = reviewResponse.status();
  if (!reviewResponse.ok()) {
    report.output_excerpt = run.output_text.slice(-2500);
    throw new Error('Model proposal validation failed: ' + reviewResponse.status());
  }
  const review = await reviewResponse.json();
  report.proposed_task_count = review.tasks.length;
  report.proposed_task_titles = review.tasks.map(task => task.title);
  report.blueprint_excerpt = review.design.slice(0, 1800);
  if (!review.tasks.length || !/fox|star|puddle|den/i.test(review.design)) throw new Error('Proposal lacks concrete project-specific work');
  report.checks.push('Actual local model returned a valid project-specific blueprint and task graph');
  const before = await (await api.get(url + '/workspace')).json();
  if (JSON.stringify(before.workspace) !== JSON.stringify(initial.workspace)) throw new Error('Review unexpectedly mutated the workspace');
  report.checks.push('Review leaves existing workspace unchanged');
  const applyResponse = await api.post(url + '/apply-refinement', { data: { run_id: run.id, version: review.version } });
  if (!applyResponse.ok()) throw new Error('Apply failed: ' + applyResponse.status());
  const applied = await applyResponse.json();
  if (applied.workspace.design !== review.design) throw new Error('Applied blueprint mismatch');
  if (JSON.stringify(applied.workspace.tasks.slice(0, initial.workspace.tasks.length)) !== JSON.stringify(initial.workspace.tasks)) throw new Error('Apply overwrote starter tasks');
  if (JSON.stringify(applied.workspace.records) !== JSON.stringify(initial.workspace.records)) throw new Error('Apply changed editor records');
  report.checks.push('Explicit apply replaces reviewed blueprint and adds tasks while preserving existing work');
  const reloaded = await (await api.get(url + '/workspace')).json();
  if (JSON.stringify(reloaded) !== JSON.stringify(applied)) throw new Error('Applied plan did not persist');
  const duplicate = await api.post(url + '/apply-refinement', { data: { run_id: run.id, version: review.version } });
  if (duplicate.status() !== 409) throw new Error('Repeated apply did not reject stale version');
  report.checks.push('Saved blueprint/tasks survive reload and repeated apply cannot duplicate them');
  report.final_task_count = applied.workspace.tasks.length;
  report.passed = true;
} catch (error) {
  report.error = String(error.message || error);
  process.exitCode = 1;
} finally {
  if (run && !['succeeded', 'failed', 'cancelled'].includes(run.status)) await api.post(base + '/v1/runs/' + run.id + '/cancel');
  if (project) {
    const archived = await api.patch(base + '/v1/projects/' + project.id, { data: { archived: true } });
    report.qa_project_archived = archived.ok();
  }
  report.finished_at = new Date().toISOString();
  await fs.mkdir(new URL('.', output), { recursive: true });
  await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n');
  await browser.close();
  console.log(JSON.stringify({ passed: report.passed, error: report.error, proposed_tasks: report.proposed_task_count, report: output.pathname }));
}
