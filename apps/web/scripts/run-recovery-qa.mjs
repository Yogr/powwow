import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const output = path.resolve("evals/reports/run-recovery");
await fs.mkdir(output, { recursive: true });
const report = {
  note: "Browser/API fixtures; no paid requests or real project writes.",
  checks: [],
  errors: [],
};
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
const projects = ["a", "b"].map((id) => ({
  id,
  name: `Recovery ${id.toUpperCase()}`,
  storage_mode: "cloud",
  context_mode: "project",
  archived: false,
}));
const workspace = {
  kind: "game",
  initialized: true,
  brief: "Recovery fixture",
  answers: {},
  assumptions: [],
  components: ["design", "assets"],
  tasks: [],
  records: {},
  detail_categories: [],
  design: "",
  plan_prompt: "",
};
const sessions = new Map();
const prefs = {
  app_language: "en",
  storage_mode: "cloud",
  plan: "free",
  storage_quota_bytes: 524288000,
  storage_used_bytes: 0,
  storage_staged_bytes: 0,
  local_retention_hours: 24,
  component_priorities: {},
};
let failure = "storage_choice_required";
let failedProject = "b";
let postedRuns = [];
let retries = 0;
let retryBody;
let taskFixture = false;
const source = {
  id: "source-image",
  project_id: "b",
  name: "Reference portrait",
  kind: "image",
  mime_type: "image/webp",
  url: "/creative/film.webp",
  download_url: "/creative/film.webp",
  storage_mode: "cloud",
  available: true,
  size_bytes: 1000,
  sha256: "fixture",
  metadata: {},
  lineage_ids: [],
  created_at: "2026-10-09T00:00:00Z",
};
function failedRun() {
  const run = {
    id: "failed-run",
    project_id: failedProject,
    chat_id: `${failedProject}:assets`,
    prompt:
      "Re-create this image for modelling and name it keeper-reference.png",
    capability: "chat",
    status: failure === "cancellation_unconfirmed" ? "cancelled" : "failed",
    stage: "classify",
    provider: "fixture",
    model: "fixture",
    workflow_id: failure === "response_incomplete" ? "asset.production.v1" : "project.chat.v1",
    created_at: "2026-10-09T00:00:00Z",
    artifact_ids: [],
    attachment_ids: [],
    context_snapshot: [],
    model_provenance: failure === "response_incomplete" ? { production: { plan_finishing: { status: "completed", result: { provenance: { policy: { model: "gpt-6.1-sol" } } } } } } : {},
    settings: {
      production_active_stage: "plan_finishing",
      project_experience: true,
      experience_intent: {
        action: "media",
        media: {
          workflow: "asset.production.v1",
          steps: [
            "Optimize the reference image",
            "Generate a TRELLIS master",
            "Inspect and finish in Blender",
            "Create and map final textures",
          ],
        },
      },
    },
    error: {
      code: failure,
      message: `Fixture ${failure.replaceAll("_", " ")}`,
    },
    attempt: 1,
    budget_usd: 3,
    estimated_cost_usd: 0.01,
    actual_cost_usd: 0.01,
    output_text: "",
  };
  if (taskFixture) {
    run.workflow_id = "tasks.execute.v1";
    run.settings.task_plan = { tasks: ["HollowInfantry", "WatcherDrone", "PursuitHound", "Crawlframe", "Dreadframe"].map((name, index) => ({
      id: `image-${index}`, output_name: name + ".png", instructions: `Create only ${name}, with transparent background.`,
    })) };
    run.model_provenance = { tasks: { "image-0": { status: "completed" }, "image-1": { status: "blocked" } } };
  }
  return run;
}
await page.route("**/v1/**", async (route) => {
  const req = route.request();
  const p = new URL(req.url()).pathname;
  let data = [];
  if (p === "/v1/config") data = { auth_mode: "local", spending_limits_enabled: !taskFixture };
  else if (p === "/v1/projects") data = projects;
  else if (p === "/v1/chats") data = [...sessions.values()];
  else if (/\/components\/[^/]+\/chat$/.test(p)) {
    const component = p.split("/").at(-2),
      project_id = p.split("/")[3];
    const key = `${project_id}:${component}`;
    if (!sessions.has(key))
      sessions.set(key, {
        id: key,
        project_id,
        component_id: component,
        title: component,
        context_mode: "project",
        archived: false,
      });
    data = sessions.get(key);
  } else if (p.endsWith("/workspace")) data = { version: 1, workspace };
  else if (/\/chats\/[^/]+\/messages$/.test(p)) {
    data =
      req.method() === "POST"
        ? {
            id: "message-created",
            chat_id: "b:assets",
            role: "user",
            ...req.postDataJSON(),
            created_at: new Date().toISOString(),
          }
        : [];
  } else if (p === "/v1/account/preferences") data = prefs;
  else if (p === "/v1/account/experience-tours") data = ["game"];
  else if (p === "/v1/builder/catalog")
    data = {
      components: [
        { id: "design", name: "Blueprint", description: "" },
        { id: "assets", name: "Asset Library", description: "" },
      ],
      kinds: [],
    };
  else if (p === "/v1/catalog")
    data = {
      models: [],
      skills: [],
      workflows: [],
      providers: [],
      capabilities: [],
    };
  else if (p === "/v1/artifacts")
    data = [
      source,
      {
        ...source,
        id: "model",
        kind: "model3d",
        name: "Mesh.glb",
        mime_type: "model/gltf-binary",
      },
    ];
  else if (p === "/v1/intent")
    data = {
      id: "pending-intent",
      capability: "chat",
      method: "pending",
      task: "conversation",
      available: true,
      needs_image: false,
      summary: "",
      skill_ids: [],
      web_search: false,
    };
  else if (p.endsWith("/retry")) {
    retries++;
    retryBody = req.postDataJSON();
    data = failedRun();
  } else if (p === "/v1/runs" && req.method() === "POST") {
    postedRuns.push(req.postDataJSON());
    data = {
      ...failedRun(),
      ...req.postDataJSON(),
      id: "planned-run",
      status: "queued",
      error: null,
    };
  } else if (p === "/v1/runs") data = [failedRun()];
  await route.fulfill({ json: data });
});
page.on("pageerror", (error) => report.errors.push(error.message));
async function openFailure(code, project = "b") {
  failure = code;
  failedProject = project;
  await page.goto(process.env.POWWOW_QA_URL || "http://127.0.0.1:5173");
  await page
    .getByRole("button", {
      name: `Recovery ${project.toUpperCase()}`,
      exact: true,
    })
    .click();
  await page
    .locator(".project-tools")
    .getByRole("button", { name: "Asset Library", exact: true })
    .click();
  await expect(page.locator(".run-error")).toContainText(
    code.replaceAll("_", " "),
  );
}
try {
  for (const code of ["storage_choice_required", "storage_quota"]) {
    await openFailure(code);
    await expect(page.locator(".run-error p")).toHaveCSS(
      "color",
      "rgb(255, 146, 146)",
    );
    await page
      .locator(".run-error")
      .getByRole("button", { name: "Edit project", exact: true })
      .click();
    await expect(
      page.getByRole("dialog").getByLabel("Project name", { exact: true }),
    ).toHaveValue("Recovery B");
    await expect(
      page
        .getByRole("dialog")
        .getByRole("button", { name: "Choose project folder", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
  }
  report.checks.push(
    "Storage failures are red and open the failed run's correct project folder settings.",
  );
  for (const code of [
    "submission_uncertain",
    "cancellation_unconfirmed",
    "workflow_unavailable",
  ]) {
    await openFailure(code);
    await expect(
      page
        .locator(".run-card")
        .getByRole("button", { name: /Retry request|Try again/ }),
    ).toHaveCount(0);
    await page
      .locator(".run-error")
      .getByRole("button", {
        name: code === "workflow_unavailable" ? "View plan" : "View request",
        exact: true,
      })
      .click();
    await expect(page.getByRole("dialog")).toContainText(
      "Optimize the reference image",
    );
    await expect(page.getByRole("dialog")).toContainText(
      "Create and map final textures",
    );
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
  }
  expect(retries).toBe(0);
  report.checks.push(
    "Uncertain submission/cancellation and unavailable workflows have no retry button; saved plan steps are available for review.",
  );
  for (const code of ["image_required", "source_selection_required"]) {
    await openFailure(code);
    await expect(
      page
        .locator(".run-error")
        .getByRole("button", { name: "Retry request", exact: true }),
    ).toHaveCount(0);
    const composer = page.getByLabel("Describe your request", { exact: true });
    if (code === "source_selection_required")
      await composer.fill("Keep this edited request");
    await page
      .locator(".run-error")
      .getByRole("button", { name: "Choose image", exact: true })
      .click();
    await expect(
      page
        .getByRole("dialog")
        .getByRole("button", { name: "Mesh.glb", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Reference portrait", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Add 1 asset", exact: true })
      .click();
    await expect(composer).toHaveValue(
      code === "image_required"
        ? failedRun().prompt
        : "Keep this edited request",
    );
    await expect(
      page.getByRole("button", {
        name: "Remove Reference portrait",
        exact: true,
      }),
    ).toBeVisible();
  }
  report.checks.push(
    "Source failures open image-only assets and attach the selected reference; blank drafts recover the request, edited drafts stay intact.",
  );
  await page
    .getByLabel("Describe your request", { exact: true })
    .fill("Re-create this reference image");
  await page.getByRole("button", { name: "Send request", exact: true }).click();
  await expect.poll(() => postedRuns.length).toBe(1);
  expect(postedRuns[0].intent_id).toBe("pending-intent");
  expect(postedRuns[0].settings.media_budget_usd).toBe(1);
  expect(postedRuns[0].attachment_ids).toEqual(["source-image"]);
  report.checks.push(
    "Pending preflight submits a durable run with exact source IDs and the existing media budget cap.",
  );
  await openFailure("response_incomplete");
  await expect(page.locator(".run-error").getByRole("button", { name: "Retry request", exact: true })).toHaveCount(0);
  await page.locator(".run-error").getByRole("button", { name: "Review with Super", exact: true }).click();
  await expect.poll(() => retries).toBe(1);
  expect(retryBody.intelligence).toBe("super");
  report.checks.push("A known incomplete production plan offers an explicit Super review and sends the selected upgrade; no same-model retry is offered.");
  taskFixture = true;
  await openFailure("budget_too_low");
  await expect(page.getByText("GPT-6 Astra", { exact: true })).toBeVisible();
  const taskList = page.getByRole("list", { name: "Generation tasks" });
  await expect(taskList.getByRole("listitem")).toHaveCount(5);
  await expect(taskList).toContainText("HollowInfantry.png · Completed");
  await expect(taskList).toContainText("WatcherDrone.png · Blocked");
  await page.getByRole("button", { name: "Resume remaining tasks", exact: true }).click();
  await expect.poll(() => retries).toBe(2);
  await openFailure("response_incomplete");
  await expect(page.getByRole("button", { name: /Resume remaining tasks|Review with Super/ })).toHaveCount(0);
  await page.getByRole("button", { name: "View request", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("HollowInfantry.png: Create only HollowInfantry");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  const collapse = page.getByRole("button", { name: "Collapse sidebar", exact: true });
  if (await collapse.isVisible()) await collapse.click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(async () => {
    const box = await page.locator(".sidebar").boundingBox();
    return box ? box.x + box.width : 0;
  }).toBeLessThanOrEqual(1);
  await taskList.scrollIntoViewIfNeeded();
  await expect(taskList).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: path.join(output, "task-progress-mobile.png") });
  report.checks.push("Five task filenames and individual status are visible on desktop/mobile. Known failures offer resume; incomplete paid reviews cannot be repeated; model-authored task instructions are inspectable.");
  expect(report.errors).toEqual([]);
} catch (error) {
  report.errors.push(error.stack || String(error));
  process.exitCode = 1;
  await page
    .screenshot({ path: path.join(output, "failure.png") })
    .catch(() => {});
} finally {
  await browser.close();
  await fs.writeFile(
    path.join(output, "report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
}
