// Uses the configured hosted model and a private QA account. Makes paid calls.
import fs from "node:fs/promises";
import path from "node:path";
import { chromium, expect } from "@playwright/test";
import { openQaSession } from "./qa-session.mjs";

const output = path.resolve("../../evals/reports/language-learning");
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const checks = [];
const intelligence = process.env.POWWOW_LANGUAGE_TIER || "basic";
let budget;
let projectId;
let api, base;
const report = { date: new Date().toISOString(), mode: "real configured model", checks, turns: [] };
async function json(response) {
  expect(response.ok(), `${response.status()} ${await response.text()}`).toBeTruthy();
  return response.json();
}
try {
  ({ api, base } = await openQaSession(page));
  const catalog = await json(await api.get(base + "/v1/languages/catalog"));
  const policy = catalog.intelligence?.tiers.find(tier => tier.id === intelligence);
  if (!policy?.enabled) throw new Error("Hosted language model is not configured for " + intelligence + ". Run scripts/configure-openai.ps1 and restart before live QA.");
  budget = Math.ceil(policy.max_cost_usd * 100) / 100;
  report.policy = policy;
  report.qualification = "Software smoke test only; fluent review and product acceptance still required.";
  const project = await json(await api.post(base + "/v1/projects", { data: { name: "Language live QA " + Date.now(), context_mode: "project" } }));
  projectId = project.id;
  const preview = await json(await api.post(base + `/v1/projects/${project.id}/plan-preview`, { data: { prompt: "I want to learn Spanish. I speak English." } }));
  expect(preview.eligible).toBeTruthy();
  expect(preview.kind).toBe("language");
  checks.push("Natural learning request opens project setup");
  const profile = await json(await api.post(base + `/v1/projects/${project.id}/language/profiles`, { data: { learner_name: "QA learner", target_language: "es", native_language: "en", level: "beginner", timezone: "America/New_York" } }));
  const [days, sameDays] = await Promise.all([0, 1].map(async () => json(await api.get(base + `/v1/language/profiles/${profile.id}/days`))));
  expect(sameDays.current_day_id).toBe(days.current_day_id);
  const dayId = days.current_day_id;
  expect(days.days).toHaveLength(1);
  expect(days.days[0].day_number).toBe(1);
  const workspace = await json(await api.get(base + `/v1/projects/${project.id}/workspace`));
  expect(workspace.workspace.components).toContain("language");
  checks.push("Profile attaches project tool and creates Day 1");

  async function turn(action, text = "", selectedDay = dayId) {
    const data = { action, text, intelligence, budget_usd: budget, idempotency_key: crypto.randomUUID() };
    const [run, duplicate] = await Promise.all([0, 1].map(async () => json(await api.post(base + `/v1/language/days/${selectedDay}/turns`, { data }))));
    expect(duplicate.id).toBe(run.id);
    let detail;
    const deadline = Date.now() + 240000;
    while (Date.now() < deadline) {
      detail = await json(await api.get(base + `/v1/language/days/${selectedDay}`));
      if (!detail.active_run) break;
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    expect(detail.last_run?.status, JSON.stringify(detail.last_run?.error)).toBe("succeeded");
    const result = detail.turns.find(item => item.run_id === run.id && item.role === "assistant");
    expect(result?.reply).toBeTruthy();
    expect(result.reply.segments.map(item => item.text).join("")).toBe(result.text);
    expect(result.reply.segments.length).toBeGreaterThan(1);
    expect(result.reply.translation.length).toBeGreaterThan(0);
    expect(result.text.startsWith("{")).toBeFalsy();
    report.turns.push({ input: { action, text, day_id: selectedDay }, reply: result.reply, run_id: run.id,
      model: detail.last_run.model, provider: detail.last_run.provider, policy: detail.last_run.settings.intelligence_policy,
      metrics: detail.last_run.model_provenance.metrics, cost_estimate_usd: detail.last_run.actual_cost_usd,
      latency_ms: new Date(detail.last_run.completed_at) - new Date(detail.last_run.started_at) });
    console.log(`PASS real model ${run.settings.language_profile.target_language}: ${action}`);
    return { detail, result, run };
  }

  await turn("start");
  checks.push("Real model greeting, translation and contextual word segments; duplicate request stays one run");
  const native = await turn("reply", "I had a good day today, but I don't know how to say that in Spanish.");
  expect(native.result.reply.show_translation_tip).toBeTruthy();
  expect(native.result.reply.explanation).toBeTruthy();
  checks.push("Native-language reply receives teaching explanation and translation tip");
  const corrected = await turn("reply", "Yo tengo dia bueno");
  expect(corrected.result.reply.correction).toBeTruthy();
  expect(corrected.result.reply.correction.original).toContain("tengo");
  checks.push("Attempted Spanish receives a gentle correction");
  const help = await turn("help");
  expect(help.result.reply.show_translation_tip).toBeTruthy();
  expect(help.result.reply.explanation).toBeTruthy();
  checks.push("Help action explains the conversation and returns tooltip metadata");

  const vocab = native.result.reply.vocabulary[0];
  expect(vocab).toBeTruthy();
  const phrase = await json(await api.post(base + `/v1/language/profiles/${profile.id}/phrases`, { data: { ...vocab, source_turn_id: native.result.id } }));
  const reviewed = await json(await api.patch(base + `/v1/language/phrases/${phrase.id}`, { data: { rating: "good" } }));
  expect(reviewed.review_count).toBe(1);
  expect(reviewed.interval_days).toBe(1);
  checks.push("Real vocabulary saves with provenance and a review date");

  const other = await json(await api.post(base + `/v1/projects/${project.id}/language/profiles`, { data: { learner_name: "Another learner", target_language: "fr", native_language: "en", level: "beginner", timezone: "America/New_York" } }));
  const otherDays = await json(await api.get(base + `/v1/language/profiles/${other.id}/days`));
  const otherDay = await json(await api.get(base + `/v1/language/days/${otherDays.current_day_id}`));
  expect(otherDay.turns).toHaveLength(0);
  expect(await json(await api.get(base + `/v1/language/profiles/${other.id}/phrases`))).toHaveLength(0);
  const chats = await json(await api.get(base + `/v1/chats?project_id=${project.id}`));
  expect(chats.some(item => item.id === days.days[0].chat_id)).toBeFalsy();
  checks.push("Second learner is empty and daily chats stay out of the generic sidebar");
  const french = await turn("start", "", otherDays.current_day_id);
  expect(french.run.context_snapshot).toHaveLength(0);
  checks.push("Real French greeting starts with isolated learner context");
  const japaneseProfile = await json(await api.post(base + `/v1/projects/${project.id}/language/profiles`, { data: { learner_name: "Japanese learner", target_language: "ja", native_language: "en", level: "beginner", timezone: "America/New_York" } }));
  const japaneseDays = await json(await api.get(base + `/v1/language/profiles/${japaneseProfile.id}/days`));
  const japanese = await turn("start", "", japaneseDays.current_day_id);
  expect(/[\u3040-\u30ff\u4e00-\u9fff]/.test(japanese.result.text)).toBeTruthy();
  expect(japanese.run.context_snapshot).toHaveLength(0);
  checks.push("Real Japanese greeting supplies readable word segments without relying on spaces");

  await page.reload();
  await page.getByRole("button", { name: project.name, exact: true }).click();
  await page.getByRole("button", { name: "Learn: Spanish — QA learner", exact: true }).click();
  await expect(page.locator(".language-workspace")).toBeVisible();
  await expect(page.locator(".language-transcript")).toContainText(help.result.text);
  await page.screenshot({ path: path.join(output, "live-desktop.png"), fullPage: true });
  checks.push("Saved real-model dialogue reopens through the project sidebar");
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.error = String(error);
  throw error;
} finally {
  if (projectId && api) {
    const response = await api.patch(base + `/v1/projects/${projectId}`, { data: { archived: true } });
    report.qa_project_archived = response.ok();
  }
  await fs.writeFile(path.join(output, "live-report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ status: report.status, checks: checks.length, report: path.join(output, "live-report.json") }));
  await browser.close();
}
