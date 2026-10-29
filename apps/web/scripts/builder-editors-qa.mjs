import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const output = path.join(root, "evals/reports/project-builder-editor");
await fs.mkdir(output, { recursive: true });
const report = {
  note: "Browser-only project/API fixtures. Tests exercise the real application and editor persistence callbacks; they do not call AI providers or modify stored projects.",
  checks: [],
  errors: [],
  screenshots: [],
};
const components = [
  ["tasks", "Task board"],
  ["design", "Project design"],
  ["characters", "Characters"],
  ["plot", "Story & plot"],
  ["storyboard", "Storyboard"],
  ["manuscript", "Book editor"],
  ["timeline", "Timeline"],
  ["game-design", "Game design"],
  ["world", "World & locations"],
  ["audio", "Audio & script"],
  ["moodboard", "Moodboard"],
  ["pages", "Pages & screens"],
  ["lessons", "Lessons"],
  ["research", "Research"],
  ["release", "Release checklist"],
  ["assets", "Project assets"],
].map(([id, name]) => ({ id, name, description: name, icon: id }));
const project = {
  id: "editor-fixture-project",
  name: "The Lantern Keeper",
  instructions:
    "A family adventure about a child who restores light to a floating village.",
  context_mode: "project",
  archived: false,
};
let workspace = {
  kind: "movie",
  initialized: true,
  brief: project.instructions,
  answers: {},
  assumptions: [],
  components: components.map((item) => item.id),
  tasks: [],
  records: {},
  design:
    "# The Lantern Keeper\n\nA family adventure about finding your courage.",
  plan_prompt: "I want to make a family adventure movie.",
};
let version = 1;
let failNextSave = false;
let writes = 0;
const artifact = (id, name, url) => ({
  id,
  project_id: project.id,
  chat_id: null,
  run_id: null,
  name,
  kind: "image",
  mime_type: "image/webp",
  size_bytes: 185000,
  sha256: id,
  url,
  download_url: url,
  metadata: {},
  lineage_ids: [],
  created_at: "2026-10-03T12:00:00Z",
});
const artifacts = [
  artifact(
    "fixture-opening",
    "Opening village reference",
    "/creative/film.webp",
  ),
  artifact("fixture-ending", "Final light reference", "/creative/art.webp"),
];
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
  await page.screenshot({ path: path.join(output, name), fullPage: false });
  report.screenshots.push(name);
}
async function openTool(name) {
  await page.locator(".project-tools").waitFor({ state: "attached" });
  if (await page.locator(".app-shell.sidebar-closed").count())
    await page
      .getByRole("button", { name: "Open sidebar", exact: true })
      .click();
  await page
    .locator(".project-tools")
    .getByRole("button", { name, exact: true })
    .click();
  await expect(
    page.locator(".builder-editor").getByRole("heading", { name, exact: true }),
  ).toBeVisible();
}
async function saved() {
  await expect(
    page.getByText("Saved to this project", { exact: true }),
  ).toBeVisible();
}
async function noOverflow(label) {
  const result = await page.evaluate(() => ({
    viewport: innerWidth,
    page: document.documentElement.scrollWidth,
    editor: document.querySelector(".builder-editor")?.scrollWidth,
    editorWidth: document.querySelector(".builder-editor")?.clientWidth,
  }));
  expect(result.page, `${label}: document overflow`).toBeLessThanOrEqual(
    result.viewport + 1,
  );
  expect(result.editor, `${label}: editor overflow`).toBeLessThanOrEqual(
    result.editorWidth + 1,
  );
}
page.on("pageerror", (error) => report.errors.push(error.message));
await page.route("**/v1/**", async (route) => {
  const request = route.request();
  const url = new URL(request.url());
  let data = [];
  if (url.pathname === "/v1/config") data = { auth_mode: "local" };
  else if (url.pathname === "/v1/projects") data = [project];
  else if (url.pathname === "/v1/artifacts") data = artifacts;
  else if (url.pathname === "/v1/catalog")
    data = {
      models: [],
      skills: [],
      workflows: [],
      providers: [],
      capabilities: [{ id: "chat", enabled: true }],
    };
  else if (url.pathname === "/v1/builder/catalog")
    data = { components, kinds: [] };
  else if (url.pathname === `/v1/projects/${project.id}/workspace`) {
    if (request.method() === "PUT") {
      await new Promise((resolve) => setTimeout(resolve, 240));
      if (failNextSave) {
        failNextSave = false;
        await route.fulfill({
          status: 503,
          json: { detail: "Fixture save failed. Please retry." },
        });
        return;
      }
      const body = request.postDataJSON();
      expect(body.version).toBe(version);
      workspace = body.workspace;
      version += 1;
      writes += 1;
    }
    data = { version, workspace };
  }
  await route.fulfill({ json: data });
});
try {
  await page.goto(process.env.POWWOW_QA_URL || "http://127.0.0.1:5173");
  await expect(
    page.getByRole("button", { name: "Create project", exact: true }),
  ).toBeVisible();
  await openTool("Characters");
  await expect(
    page.getByRole("heading", { name: "Your first character starts here" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Create a character", exact: true })
    .click();
  await page.getByLabel("Character name", { exact: true }).fill("Mara Finch");
  await page.getByLabel("Role", { exact: true }).selectOption("Protagonist");
  await page
    .getByLabel("Personality", { exact: true })
    .fill("Resourceful and curious, but reluctant to ask for help.");
  await page
    .getByLabel("What do they want?", { exact: true })
    .fill(
      "Restore the village lantern before the floating islands drift apart.",
    );
  await page
    .getByLabel("Visual identity", { exact: true })
    .fill("A patched indigo raincoat and a small brass lantern.");
  await page
    .getByLabel("Character reference", { exact: true })
    .selectOption("fixture-opening");
  failNextSave = true;
  await page
    .getByRole("button", { name: "Save character", exact: true })
    .click();
  await expect(
    page.getByText("Fixture save failed. Please retry.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Character name", { exact: true })).toHaveValue(
    "Mara Finch",
  );
  expect(workspace.records.characters).toBeUndefined();
  check(
    "Failed save retains all character edits and does not claim persistence",
  );
  await page
    .getByRole("button", { name: "Save character", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Saving…", exact: true }),
  ).toBeDisabled();
  await saved();
  expect(workspace.records.characters[0].fields.motivation).toContain(
    "Restore the village lantern",
  );
  check(
    "Character create saves through the actual versioned workspace callback",
  );
  await page.locator(".builder-workspace-surface").evaluate((element) => {
    element.scrollTop = 0;
  });
  await shot("characters-desktop.png");
  await page
    .getByRole("button", { name: "Add character", exact: true })
    .first()
    .click();
  await page
    .getByLabel("Character name", { exact: true })
    .fill("Unsaved draft");
  await page
    .locator(".builder-record-list")
    .getByRole("button", { name: /Mara Finch/ })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Keep your draft?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Keep editing", exact: true }).click();
  await expect(page.getByLabel("Character name", { exact: true })).toHaveValue(
    "Unsaved draft",
  );
  await page
    .locator(".builder-record-list")
    .getByRole("button", { name: /Mara Finch/ })
    .click();
  await page
    .getByRole("button", { name: "Discard changes", exact: true })
    .click();
  await expect(page.getByLabel("Character name", { exact: true })).toHaveValue(
    "Mara Finch",
  );
  check(
    "Switching records confirms unsaved draft discard and Keep editing preserves it",
  );
  await page
    .getByRole("button", { name: "Add character", exact: true })
    .first()
    .click();
  await page
    .getByLabel("Character name", { exact: true })
    .fill("Temporary character");
  await page
    .getByRole("button", { name: "Save character", exact: true })
    .click();
  await saved();
  await page
    .getByRole("button", { name: "Delete character", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(workspace.records.characters).toHaveLength(2);
  await page
    .getByRole("button", { name: "Delete character", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete character", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(workspace.records.characters).toHaveLength(1);
  check(
    "Character deletion requires confirmation and Cancel leaves the record intact",
  );

  await openTool("Book editor");
  await page
    .getByRole("button", { name: "Create a chapter", exact: true })
    .click();
  await page
    .getByLabel("Chapter title", { exact: true })
    .fill("The light goes out");
  await page
    .getByLabel("Chapter outline", { exact: true })
    .fill("Mara notices the lantern dimming and discovers a missing map.");
  await page
    .getByLabel("Draft status", { exact: true })
    .selectOption("First draft");
  await page
    .getByLabel("Chapter manuscript", { exact: true })
    .fill(
      "The last lantern blinked twice.\n\nMara held her breath. Above the village, the floating islands had begun to move.\n\n**Someone had to bring the light back.**",
    );
  await page.getByRole("button", { name: "Save chapter", exact: true }).click();
  await saved();
  await page.getByRole("button", { name: "Read", exact: true }).click();
  await expect(page.locator(".builder-manuscript-preview strong")).toHaveText(
    "Someone had to bring the light back.",
  );
  await page.locator(".builder-manuscript-preview").scrollIntoViewIfNeeded();
  await shot("manuscript-read-desktop.png");
  await page
    .getByRole("button", { name: "Add chapter", exact: true })
    .first()
    .click();
  await page
    .getByLabel("Chapter title", { exact: true })
    .fill("A map of the clouds");
  await page
    .getByLabel("Chapter manuscript", { exact: true })
    .fill("The map unfolded into a sky full of impossible roads.");
  await page.getByRole("button", { name: "Save chapter", exact: true }).click();
  await saved();
  await page
    .getByRole("button", { name: "Move chapter earlier", exact: true })
    .click();
  await saved();
  expect(workspace.records.manuscript.map((item) => item.title)).toEqual([
    "A map of the clouds",
    "The light goes out",
  ]);
  check(
    "Manuscript write/read modes render Markdown and persist chapter ordering",
  );

  await openTool("Storyboard");
  await page
    .getByRole("button", { name: "Create a scene", exact: true })
    .click();
  await page
    .getByLabel("Scene title", { exact: true })
    .fill("The village loses its light");
  await page
    .getByLabel("First frame", { exact: true })
    .selectOption("fixture-opening");
  await page
    .getByLabel("Last frame", { exact: true })
    .selectOption("fixture-ending");
  await page
    .getByLabel("Scene heading", { exact: true })
    .fill("EXT. FLOATING VILLAGE — DUSK");
  await page.getByLabel("Duration in seconds", { exact: true }).fill("12");
  await page
    .getByLabel("Action & dialogue", { exact: true })
    .fill(
      "The camera crosses the rooftops as lanterns go dark one by one. MARA: We still have time.",
    );
  await page
    .getByLabel("Shot & camera movement", { exact: true })
    .fill("Wide establishing shot, slow push toward Mara on the bridge.");
  await page.getByRole("button", { name: "Save scene", exact: true }).click();
  await saved();
  expect(workspace.records.storyboard[0].fields.first_image).toBe(
    "fixture-opening",
  );
  expect(workspace.records.storyboard[0].fields.last_image).toBe(
    "fixture-ending",
  );
  await expect(page.locator(".builder-storyboard-frames img")).toHaveCount(2);
  await expect
    .poll(() =>
      page
        .locator(".builder-storyboard-frames img")
        .evaluateAll((images) =>
          images.every((image) => image.complete && image.naturalWidth > 0),
        ),
    )
    .toBeTruthy();
  await page.locator(".builder-workspace-surface").evaluate((element) => {
    element.scrollTop = 0;
  });
  await shot("storyboard-desktop.png");
  await page.reload();
  await openTool("Storyboard");
  await expect(page.getByLabel("Scene title", { exact: true })).toHaveValue(
    "The village loses its light",
  );
  await expect(page.getByLabel("First frame", { exact: true })).toHaveValue(
    "fixture-opening",
  );
  await expect(
    page.getByText("12 seconds planned", { exact: true }),
  ).toBeVisible();
  check(
    "Storyboard image references, script, timing, and scene title survive remount/reload",
  );

  await openTool("Game design");
  await page
    .getByRole("button", { name: "Create a mechanic", exact: true })
    .click();
  await page
    .getByLabel("Mechanic or system", { exact: true })
    .fill("Restore the lanterns");
  await page.getByLabel("System", { exact: true }).selectOption("Core loop");
  await page
    .getByLabel("Rules & interactions", { exact: true })
    .fill(
      "Collect three light fragments, then hold interact near an unlit lantern.",
    );
  await page
    .getByLabel("Smallest playable version", { exact: true })
    .fill("One island, one lantern, and three fragments. No inventory screen.");
  await page
    .getByLabel("Playtest plan", { exact: true })
    .fill(
      "Ask a new player to restore the lantern without instructions. Observe confusion.",
    );
  await page
    .getByRole("button", { name: "Save mechanic", exact: true })
    .click();
  await saved();
  check(
    "Game design stores playable rules, prototype scope, and playtest plan",
  );

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const name of ["Storyboard", "Book editor", "Game design"]) {
      await openTool(name);
      await noOverflow(`${name} at ${width}px`);
      await page.locator(".builder-workspace-surface").evaluate((element) => {
        element.scrollTop = 0;
      });
      await shot(`${name.toLowerCase().replaceAll(" ", "-")}-${width}.png`);
      await page.locator(".builder-editor-savebar").scrollIntoViewIfNeeded();
      await expect(
        page
          .locator(".builder-editor-savebar")
          .getByRole("button", { name: /^Save / }),
      ).toBeVisible();
    }
    check(
      `Storyboard, book, and game editors have no horizontal overflow at ${width}px; save actions remain reachable`,
    );
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const name of [
    "Story & plot",
    "Timeline",
    "World & locations",
    "Audio & script",
    "Moodboard",
    "Pages & screens",
    "Lessons",
    "Research",
    "Release checklist",
    "Project assets",
  ]) {
    await openTool(name);
    await noOverflow(name);
  }
  await expect(page.locator(".builder-asset-card")).toHaveCount(2);
  check(
    "All 14 project editors render and the asset shelf shows only project fixture assets",
  );
  await openTool("Characters");
  await page
    .getByLabel("Personality", { exact: true })
    .fill("Resourceful, curious, and ready to ask for help.");
  await page.getByRole("button", { name: "Save & ask", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Describe your request" }),
  ).toHaveValue(/Resourceful, curious, and ready to ask for help/);
  expect(workspace.records.characters[0].fields.traits).toBe(
    "Resourceful, curious, and ready to ask for help.",
  );
  check(
    "Save & ask persists the edited record before handing its full context to chat",
  );
  expect(report.errors).toEqual([]);
  report.writes = writes;
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
