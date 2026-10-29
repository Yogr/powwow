import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const output = path.join(root, "evals/reports/asset-deletion");
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
let deletes = 0;
let failDelete = false;
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
let artifacts = [
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
page.setDefaultTimeout(7000);
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
  if (request.method() === "DELETE" && url.pathname.startsWith("/v1/artifacts/")) {
    deletes++;
    if (failDelete) return route.fulfill({ status: 503, json: { detail: "Could not delete file. Try again." } });
    artifacts = artifacts.filter((item) => item.id !== url.pathname.split("/").at(-1));
    return route.fulfill({ status: 204 });
  }
  let data = [];
  if (url.pathname === "/v1/config") data = { auth_mode: "local" };
  else if (url.pathname === "/v1/account/experience-tours") data = ["movie"];
  else if (url.pathname.includes("/components/")) data = { id: "fixture-chat", project_id: project.id, component_id: "assets", title: "Assets" };
  else if (url.pathname === "/v1/account/preferences") data = { component_priorities: {}, storage_mode: "cloud", app_language: "en" };
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
  await page.getByRole("button", { name: project.name, exact: true }).click();
  await openTool("Project assets");
  await expect(page.locator(".builder-asset-card")).toHaveCount(2);
  await page.locator(".builder-asset-card").first().click();
  page.once("dialog", async (dialog) => { expect(dialog.message()).toContain("cannot be undone"); await dialog.dismiss(); });
  await page.getByRole("button", { name: "Delete permanently" }).click();
  expect(deletes).toBe(0);
  await expect(page.getByRole("dialog")).toBeVisible();
  failDelete = true;
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete permanently" }).click();
  await expect(page.getByRole("alert")).toContainText("Could not delete file");
  await expect(page.locator(".builder-asset-card")).toHaveCount(2);
  failDelete = false;
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete permanently" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".builder-asset-card")).toHaveCount(1);
  await page.reload();
  await page.getByRole("button", { name: project.name, exact: true }).click();
  await openTool("Project assets");
  await expect(page.locator(".builder-asset-card")).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".builder-asset-card").click();
  await expect(page.getByRole("button", { name: "Delete permanently" })).toBeVisible();
  await shot("delete-mobile.png");
  expect(report.errors).toEqual([]);
  check("Cancel sends no deletion; failure retains asset; confirmed retry removes asset and survives reload; mobile action is visible");
  report.passed = true;
} catch (error) {
  report.passed = false;
  report.failure = error.stack || String(error);
  console.error(error);
  console.log((await page.locator("body").innerText()).slice(0, 7000));
  process.exitCode = 1;
} finally {
  await fs.writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
  await browser.close();
}
