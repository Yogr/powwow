import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const output = path.join(root, "evals/reports/project-builder-refinement");
await fs.mkdir(output, { recursive: true });
const report = {
  note: "Browser-only API fixtures exercising the real refinement UI, component picker, and chat tool attachment. No live backend data or provider calls.",
  checks: [],
  errors: [],
  screenshots: [],
};
const project = {
  id: "refinement-fixture-project",
  name: "Cloudbound",
  instructions: "A small browser game about restoring lanterns.",
  context_mode: "project",
  archived: false,
};
const components = [
  ["tasks", "Task board"],
  ["design", "Project design"],
  ["characters", "Characters"],
  ["storyboard", "Storyboard"],
  ["game-design", "Game design"],
  ["assets", "Project assets"],
].map(([id, name]) => ({
  id,
  name,
  description: `Shared ${name.toLowerCase()} for this project.`,
  icon: id,
}));
const existingTask = {
  id: "existing-task",
  title: "Agree on the first playable goal",
  description: "Restore a single lantern.",
  status: "done",
  phase: "Decide",
  acceptance: ["The goal is written down."],
  depends_on: [],
  component: "tasks",
};
const proposedTask = {
  id: "proposal-task",
  title: "Build one island with one lantern",
  description:
    "Create one walkable island and three collectible light fragments.",
  status: "todo",
  phase: "Prototype",
  acceptance: [
    "A player can collect three fragments.",
    "The lantern lights when the fragments are returned.",
  ],
  depends_on: [existingTask.id],
  component: "game-design",
};
let workspace = {
  kind: "game",
  initialized: true,
  brief: project.instructions,
  answers: { platform: "browser" },
  assumptions: ["Start with one island."],
  components: ["tasks", "design", "game-design"],
  tasks: [existingTask],
  records: {
    storyboard: [
      {
        id: "saved-scene",
        title: "The first light returns",
        fields: {
          script: "The lantern lights and the bridge becomes visible.",
        },
      },
    ],
  },
  design: "# Cloudbound\n\nBuild a small, friendly browser game.",
  plan_prompt: "I want to make a game about restoring lanterns.",
};
let version = 3;
const proposedDesign =
  "# Cloudbound: first playable design\n\n## Player goal\n\nRestore the island lantern by collecting three light fragments.\n\n## Keep it small\n\nUse one island, keyboard controls, and placeholder artwork for the first playtest.\n\n## Test the idea\n\nA new player should understand the goal without an explanation.";
let run = {
  id: "fixture-plan-run",
  chat_id: "planning-chat",
  message_id: "planning-message",
  project_id: project.id,
  capability: "chat",
  workflow_id: "builder",
  status: "succeeded",
  stage: "complete",
  progress: 1,
  prompt: workspace.plan_prompt,
  settings: { builder_refinement: true, workspace_version: version },
  attachment_ids: [],
  artifact_ids: [],
  output_text: proposedDesign,
  error: null,
  estimated_cost_usd: 0.02,
  actual_cost_usd: 0.01,
  budget_usd: 0.1,
  provider: "fixture",
  model: "fixture",
  model_provenance: {},
  context_snapshot: [],
  attempt: 1,
  parent_run_id: null,
  created_at: "2026-10-03T12:00:00Z",
  updated_at: "2026-10-03T12:00:10Z",
  started_at: null,
  completed_at: null,
};
let writes = 0;
let workspaceReads = 0;
let applyCalls = 0;
let unexpected = [];
let failNextSave = false;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const check = (name) => {
  report.checks.push(name);
  console.log("PASS", name);
};
async function shot(name) {
  await page.screenshot({ path: path.join(output, name) });
  report.screenshots.push(name);
}
async function board() {
  await page.locator(".project-tools").waitFor();
  await page
    .locator(".project-tools")
    .getByRole("button", { name: "Task board", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "AI project planning" }),
  ).toBeVisible();

}
await page.addInitScript(() => { localStorage.setItem("powwow.tour:local:game", "seen"); localStorage.setItem("powwow.project", "refinement-fixture-project"); });
page.on("pageerror", (error) => report.errors.push(error.message));
await page.route("**/v1/**", async (route) => {
  const request = route.request();
  const url = new URL(request.url());
  let data = [];
  if (url.pathname === "/v1/config") data = { auth_mode: "local" };
  else if (url.pathname === "/v1/projects") data = [project];
  else if (url.pathname === "/v1/account/preferences") data = {app_language:"en",storage_mode:"cloud",plan:"free",component_priorities:{},storage_quota_bytes:524288000,storage_used_bytes:0};
  else if (url.pathname === "/v1/account/experience-tours") data = ["game"];
  else if (url.pathname === "/v1/runs") data = [run];
  else if (url.pathname === "/v1/catalog")
    data = {
      models: [],
      skills: [],
      workflows: [],
      providers: [],
      capabilities: [{ id: "chat", enabled: true }],
    };
  else if (url.pathname === "/v1/builder/catalog")
    data = {
      components,
      kinds: [
        {
          id: "game",
          name: "Game",
          description: "A playable idea",
          icon: "game",
          components: ["tasks", "design", "game-design"],
          questions: [],
        },
      ],
    };
  else if (url.pathname === `/v1/projects/${project.id}/workspace`) {
    if (request.method() === "GET") workspaceReads++;
    if (request.method() === "PUT") {
      const body = request.postDataJSON();
      if (failNextSave) {
        failNextSave = false;
        await route.fulfill({
          status: 503,
          json: { detail: "Fixture tools save failed. Please retry." },
        });
        return;
      }
      expect(body.version).toBe(version);
      workspace = body.workspace;
      version += 1;
      writes += 1;
    }
    data = { version, workspace };
  } else if (
    url.pathname === `/v1/projects/${project.id}/plan-refinements/${run.id}`
  ) {
    if (run.settings.workspace_version !== version) {
      await route.fulfill({
        status: 409,
        json: {
          detail:
            "This planning proposal is out of date. Start a new planning pass.",
        },
      });
      return;
    }
    data = {
      run_id: run.id,
      version,
      design: proposedDesign,
      tasks: [proposedTask],
    };
  } else if (url.pathname === `/v1/projects/${project.id}/apply-refinement`) {
    const body = request.postDataJSON();
    applyCalls += 1;
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (body.version !== version) {
      await route.fulfill({
        status: 409,
        json: {
          detail:
            "The project changed while this proposal was open. Review the current project before applying.",
        },
      });
      return;
    }
    workspace = {
      ...workspace,
      design: proposedDesign,
      tasks: [...workspace.tasks, proposedTask],
    };
    version += 1;
    data = { version, workspace };
  } else if (
    [
      "/v1/intent",
      `/v1/projects/${project.id}/plan-preview`,
      `/v1/projects/${project.id}/plan-refinement`,
    ].includes(url.pathname)
  ) {
    unexpected.push(url.pathname);
    await route.fulfill({
      status: 400,
      json: {
        detail:
          "Unexpected external planning or generation request in fixture QA.",
      },
    });
    return;
  }
  await route.fulfill({ json: data });
});
try {
  await page.goto(process.env.POWWOW_QA_URL || "http://127.0.0.1:5173");
  await page.getByRole("button", {name:"Cloudbound", exact:true}).click();
  await board();
  const initialReads = workspaceReads;
  await expect.poll(() => workspaceReads, {timeout:20000}).toBeGreaterThanOrEqual(initialReads + 3);
  await expect(page.getByRole('region',{name:'AI project planning'})).toHaveCount(1);
  check('Three complete background refreshes leave exactly one planning banner');
  await expect(
    page.getByText("A more detailed plan is ready to review", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Review proposed plan", exact: true })
    .click();
  const proposal = page.getByRole("dialog", {
    name: "Review Powwow’s proposed plan",
  });
  await expect(proposal).toBeVisible();
  await expect(
    proposal.getByRole("heading", {
      name: "Cloudbound: first playable design",
    }),
  ).toBeVisible();
  await expect(
    proposal.getByText(proposedTask.title, { exact: true }),
  ).toBeVisible();
  expect(workspace.design).not.toBe(proposedDesign);
  await shot("review-proposed-plan-desktop.png");
  await page
    .getByRole("button", { name: "Keep current plan", exact: true })
    .click();
  await expect(proposal).toHaveCount(0);
  expect(applyCalls).toBe(0);
  check(
    "Successful AI proposal opens a review with design and acceptance checks; Keep current plan does not apply it",
  );
  await page
    .getByRole("button", { name: "Review proposed plan", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Apply proposed plan", exact: true })
    .click();
  await expect(proposal).toHaveCount(0);
  expect(workspace.design).toBe(proposedDesign);
  expect(workspace.tasks).toHaveLength(2);
  expect(workspace.tasks[0]).toEqual(existingTask);
  expect(workspace.records.storyboard[0].id).toBe("saved-scene");
  await expect(
    page.locator(".builder-task").filter({ hasText: proposedTask.title }),
  ).toBeVisible();
  check(
    "Apply updates design and adds proposed tasks while preserving completed work and editor records",
  );
  await expect(
    page.getByText(
      "Your project has changed since the last planning pass. Start a fresh pass to include your latest work.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Deepen with AI", exact: true }),
  ).toBeVisible();
  check(
    "An older planning version shows the stale state and offers a fresh planning pass",
  );

  run = {
    ...run,
    id: "fixture-next-plan-run",
    settings: { ...run.settings, workspace_version: version },
  };
  await page.reload();
  await board();
  await page
    .getByRole("button", { name: "Review proposed plan", exact: true })
    .click();
  const currentDesign =
    "# Cloudbound\n\nThe owner just updated the design in another window.";
  version += 1;
  workspace = { ...workspace, design: currentDesign };
  await page
    .getByRole("button", { name: "Apply proposed plan", exact: true })
    .click();
  await expect(proposal.getByRole("alert")).toHaveText(
    "The project changed while this proposal was open. Review the current project before applying.",
  );
  await expect(proposal).toBeVisible();
  expect(workspace.design).toBe(currentDesign);
  expect(workspace.tasks).toHaveLength(2);
  await shot("apply-conflict-desktop.png");
  await page
    .getByRole("button", { name: "Keep current plan", exact: true })
    .click();
  check(
    "An apply conflict stays visible in the review, retains the latest design, and adds no duplicate tasks",
  );
  await page.reload();
  await board();

  await page
    .getByRole("button", { name: "Add project tools", exact: true })
    .click();
  const picker = page.getByRole("dialog", { name: "Your project's tools" });
  await expect(
    picker.getByRole("checkbox", { name: /Task board/ }),
  ).toBeEnabled();
  await expect(
    picker.getByRole("checkbox", { name: /Blueprint/ }),
  ).toBeEnabled();
  await picker.getByRole("checkbox", { name: /Storyboard/ }).check();
  failNextSave = true;
  await picker
    .getByRole("button", { name: "Save 4 tools", exact: true })
    .click();
  await expect(picker.getByRole("alert")).toContainText(
    "Fixture tools save failed",
  );
  await expect(
    picker.getByRole("checkbox", { name: /Storyboard/ }),
  ).toBeChecked();
  expect(workspace.components).not.toContain("storyboard");
  await picker
    .getByRole("button", { name: "Save 4 tools", exact: true })
    .click();
  await expect(picker).toHaveCount(0);
  expect(workspace.components).toContain("storyboard");
  await expect(
    page
      .locator(".project-tools")
      .getByRole("button", { name: "Storyboard", exact: true }),
  ).toBeVisible();
  check(
    "Tool picker allows optional tools and retains selections after a save failure; retry attaches Storyboard",
  );
  await page
    .getByRole("button", { name: "Add project tools", exact: true })
    .click();
  await picker.getByRole("checkbox", { name: /Storyboard/ }).uncheck();
  await picker
    .getByRole("button", { name: "Save 3 tools", exact: true })
    .click();
  await expect(picker).toHaveCount(0);
  expect(workspace.components).not.toContain("storyboard");
  expect(workspace.records.storyboard[0].title).toBe("The first light returns");
  await page.reload();
  await board();
  await expect(
    page
      .locator(".project-tools")
      .getByRole("button", { name: "Storyboard", exact: true }),
  ).toHaveCount(0);
  check(
    "Removing a project tool persists across reload and keeps its saved editor content",
  );
  await page.getByRole('button',{name:'Add project tools',exact:true}).click();
  await picker.getByRole('checkbox',{name:/Storyboard/}).check();
  await picker.getByRole('button',{name:'Save 4 tools',exact:true}).click();
  await page.locator('.project-tools').getByRole('button',{name:'Storyboard',exact:true}).click();
  await expect(page.getByLabel('Scene title',{exact:true})).toHaveValue('The first light returns');
  expect(unexpected).toEqual([]);
  check('Reattaching an optional component restores its saved records');
  expect(report.errors).toEqual([]);
  report.writes = writes;
  report.applyCalls = applyCalls;
  report.passed = true;
} catch (error) {
  report.passed = false;
  report.failure = error.stack || String(error);
  await shot("failure.png");
  console.error(error);
  process.exitCode = 1;
} finally {
  await fs.writeFile(
    path.join(output, "report.json"),
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
