import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openQaSession } from "./qa-session.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const report = {
  started_at: new Date().toISOString(),
  checks: [],
  transport_note:
    "Tests deliberately discard HTTP responses after forwarding requests to the real API. Actual inference is not simulated.",
};
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
let api;
let scope;
const base = "http://127.0.0.1:8000";
let project;
const record = (name, data = {}) => {
  report.checks.push({ name, passed: true, ...data });
  console.log("PASS", name);
};
try {
  ({api,scope} = await openQaSession(page));
  project = await (
    await api.post(base + "/v1/projects", {
      data: { name: `Recovery validation ${Date.now().toString().slice(-6)}` },
    })
  ).json();
  await page.reload();
  await page.getByRole("button", { name: project.name, exact: true }).click();
  let originalBody,
    acceptedRun,
    runCalls = 0;
  await page.route("**/v1/runs", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    runCalls++;
    originalBody = route.request().postDataJSON();
    const result = await route.fetch();
    acceptedRun = await result.json();
    await route.abort("failed");
  });
  await page
    .getByRole("textbox", { name: "Describe your request" })
    .fill("Say hello in one short sentence.");
  await page.getByRole("button", { name: "Send request", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Recover request", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      (scope) => JSON.parse(sessionStorage.getItem(`powwow.pending.${scope}`)).length, scope,
    ),
  ).toBe(1);
  record(
    "Accepted run with discarded response preserves its recovery operation",
    { run_id: acceptedRun.id },
  );
  await page
    .getByRole("textbox", { name: "Describe your request" })
    .fill("This edited request must not be dispatched yet.");
  await page
    .getByRole("combobox", { name: "Choose an outcome" })
    .selectOption("text_to_image");
  await page
    .getByRole("textbox", { name: "Describe your request" })
    .press("Enter");
  expect(runCalls).toBe(1);
  record(
    "Changed prompt/settings and Enter do not create another request while unresolved",
  );
  await page.unroute("**/v1/runs");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Recover request", exact: true }),
  ).toBeVisible();
  let recoveredBody, recoveredRun;
  await page.route("**/v1/runs", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    recoveredBody = route.request().postDataJSON();
    const response = await route.fetch();
    recoveredRun = await response.json();
    await route.fulfill({ response });
  });
  await page
    .getByRole("button", { name: "Recover request", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Recover request", exact: true }),
  ).toHaveCount(0);
  expect(recoveredBody).toEqual(originalBody);
  expect(recoveredRun.id).toBe(acceptedRun.id);
  expect(
    await page.evaluate(
      (scope) => JSON.parse(sessionStorage.getItem(`powwow.pending.${scope}`)).length, scope,
    ),
  ).toBe(0);
  record(
    "Reload recovery reuses exact request payload/key and returns the same logical run",
  );
  await page.unroute("**/v1/runs");
  const runs = await (
    await api.get(base + `/v1/runs?chat_id=${acceptedRun.chat_id}`)
  ).json();
  expect(
    runs.filter((run) => run.message_id === acceptedRun.message_id),
  ).toHaveLength(1);
  record("Server has one logical generation after response-loss recovery");

  // Submit and cancel a real queued chat request to exercise retry recovery.
  const chat = await (
    await api.post(base + "/v1/chats", {
      data: { project_id: project.id, title: "Retry recovery check" },
    })
  ).json();
  const message = await (
    await api.post(base + `/v1/chats/${chat.id}/messages`, {
      data: { content: "Write a concise greeting." },
    })
  ).json();
  const cancelled = await (
    await api.post(base + "/v1/runs", {
      data: {
        chat_id: chat.id,
        message_id: message.id,
        capability: "chat",
        idempotency_key: crypto.randomUUID(),
      },
    })
  ).json();
  await api.post(base + `/v1/runs/${cancelled.id}/cancel`, { data: {} });
  await expect
    .poll(
      async () => {
        const result = await (
          await api.get(base + `/v1/runs/${cancelled.id}`)
        ).json();
        return result.status;
      },
      { timeout: 45000 },
    )
    .toBe("cancelled");
  await page.reload();
  await page.getByRole("button", {name: project.name, exact: true}).click();
  await page
    .getByRole("button", { name: "Retry recovery check", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Try again", exact: true }),
  ).toBeVisible();
  let retryBody,
    retryRun,
    retryCalls = 0;
  const retryRoute = `**/v1/runs/${cancelled.id}/retry`;
  await page.route(retryRoute, async (route) => {
    retryCalls++;
    retryBody = route.request().postDataJSON();
    const response = await route.fetch();
    retryRun = await response.json();
    await new Promise((resolve) => setTimeout(resolve, 600));
    await route.abort("failed");
  });
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Try again", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Recover request", exact: true }),
  ).toBeEnabled();
  expect(retryCalls).toBe(1);
  record(
    "Retry disables concurrent taps and persists its exact recovery operation",
  );
  await page.unroute(retryRoute);
  await page.reload();
  let recoveredRetryBody, recoveredRetry;
  await page.route(retryRoute, async (route) => {
    recoveredRetryBody = route.request().postDataJSON();
    const response = await route.fetch();
    recoveredRetry = await response.json();
    await route.fulfill({ response });
  });
  await page
    .getByRole("button", { name: "Recover request", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Recover request", exact: true }),
  ).toHaveCount(0);
  expect(recoveredRetryBody).toEqual(retryBody);
  expect(recoveredRetry.id).toBe(retryRun.id);
  record(
    "Retry survives reload and reuses original retry path/body/idempotency key",
    { run_id: retryRun.id },
  );
  const retryRuns = await (
    await api.get(base + `/v1/runs?chat_id=${chat.id}`)
  ).json();
  expect(
    retryRuns.filter((run) => run.parent_run_id === cancelled.id),
  ).toHaveLength(1);
  record("Server has one retry after discarded response and recovery");
  await page.unroute(retryRoute);

  await page.getByRole("button", { name: /New conversation/ }).click();
  await page.route("**/v1/runs", async (route) => {
    if (route.request().method() === "POST")
      await route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({
          detail: {
            code: "test_rejection",
            message: "Deliberate definitive rejection for recovery validation.",
          },
        }),
      });
    else await route.continue();
  });
  await page
    .getByRole("textbox", { name: "Describe your request" })
    .fill("Keep this draft after a validation rejection.");
  await page.getByRole("button", { name: "Send request", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Deliberate definitive rejection",
  );
  expect(
    await page.evaluate(
      (scope) => JSON.parse(sessionStorage.getItem(`powwow.pending.${scope}`)).length, scope,
    ),
  ).toBe(0);
  await expect(
    page.getByRole("textbox", { name: "Describe your request" }),
  ).toHaveValue("Keep this draft after a validation rejection.");
  record("Definitive 4xx clears the pending operation and preserves the draft");
  report.passed = true;
  report.completed_at = new Date().toISOString();
} catch (error) {
  report.passed = false;
  report.failure = error.stack;
  console.error(error);
} finally {
  if (project)
    await api.patch(base + `/v1/projects/${project.id}`, {
      data: { archived: true },
    });
  await fs.mkdir(path.join(root, "evals/reports/ui-validation"), {
    recursive: true,
  });
  await fs.writeFile(
    path.join(root, "evals/reports/ui-validation/idempotency-results.json"),
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
if (!report.passed) process.exitCode = 1;
