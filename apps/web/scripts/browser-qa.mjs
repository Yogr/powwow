import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const output = path.join(root, "evals/reports/ui-validation");
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
page.setDefaultTimeout(15000);
const report = {
  started_at: new Date().toISOString(),
  checks: [],
  errors: [],
  fixture_note:
    "The GLB and MP4 are procedural viewer fixtures, not model inference results.",
};
page.on("pageerror", (e) => report.errors.push(e.message));
const stamp = Date.now().toString().slice(-6),
  primary = `Interface checks ${stamp}`,
  renamed = `Interface validation ${stamp}`,
  destination = `Fixture previews ${stamp}`,
  conversation = `Source lookup ${stamp}`;
const modelFile = `procedural-viewer-${stamp}.glb`,
  videoFile = `procedural-video-${stamp}.mp4`;
const log = (name, details = {}) => {
  report.checks.push({ name, passed: true, ...details });
  console.log("PASS", name);
};
async function createProject(name) {
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Project name", { exact: true }).fill(name);
  await dialog
    .getByLabel(/Project instructions/)
    .fill(
      "QA workspace. Procedural viewer fixtures are uploads, not generated model outputs.",
    );
  await dialog
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".breadcrumb-project")).toContainText(name);
}
async function context() {
  await page.getByRole("button", { name: /^Context/ }).click();
  return page.getByRole("dialog");
}
async function library() {
  await page.getByRole("button", { name: /Your library/ }).click();
  await expect(page.locator(".library")).toBeVisible();
}

try {
  await page.goto("http://127.0.0.1:5173/");
  await expect(
    page.getByRole("button", { name: "Create project", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: path.join(output, "01-desktop-home.png"),
    fullPage: true,
  });
  log("Desktop application loads without horizontal overflow", {
    overflow: await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  });
  await createProject(primary);
  log("Create project with instructions");
  await page
    .getByRole("button", { name: `Options for ${primary}`, exact: true })
    .click();
  await page.getByRole("button", { name: "Edit project", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Project name", { exact: true }).fill(renamed);
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator(".breadcrumb-project")).toContainText(renamed);
  log("Rename project");
  dialog = await context();
  await dialog.getByRole("button", { name: /This chat only/ }).click();
  await expect(
    dialog.getByRole("button", { name: /This chat only/ }),
  ).toHaveClass(/selected/);
  await dialog.getByRole("button", { name: /Selected sources/ }).click();
  await dialog
    .getByLabel("Source", { exact: true })
    .selectOption({ label: "Ceramic studies" });
  await dialog.getByRole("button", { name: "Share source" }).click();
  await expect(dialog.locator(".grant-row")).toHaveCount(1);
  await expect(dialog.locator(".grant-row")).toContainText("Live project link");
  log("Context scope and directional project grant");
  await dialog.getByRole("button", { name: "Revoke shared source" }).click();
  await expect(dialog.locator(".grant-row")).toHaveCount(0);
  await dialog.getByRole("button", { name: /This project/ }).click();
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  log("Context grant revocation");
  await page
    .getByRole("button", { name: "Look up online sources", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Look up online sources", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const prompt =
    "What is ceramic material? Use the available sources, keep the answer brief, and cite a source link.";
  await page
    .getByRole("textbox", { name: "Describe your request" })
    .fill(prompt);
  const submission = page.waitForResponse(
    (r) => r.url().endsWith("/v1/runs") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Send request", exact: true }).click();
  const run = await (await submission).json();
  report.source_run_id = run.id;
  await expect(page.locator(".message-assistant .markdown")).toHaveCount(1, {
    timeout: 90000,
  });
  await expect(
    page.locator(".message-assistant a[href^=https]").first(),
  ).toBeVisible({ timeout: 15000 });
  log("Live chat with online lookup and a linked citation", { run_id: run.id });
  await page.screenshot({
    path: path.join(output, "02-sources-chat.png"),
    fullPage: true,
  });
  await page.locator(".chat-row .row-menu").first().click();
  await page.getByRole("button", { name: "Rename conversation" }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Conversation title").fill(conversation);
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator(".breadcrumb-current")).toHaveText(conversation);
  log("Rename conversation");
  await page.keyboard.press("Control+k");
  await page
    .getByRole("textbox", { name: "Search projects and chats" })
    .fill(conversation);
  await expect(page.locator(".chat-row")).toHaveCount(1);
  await page.getByRole("button", { name: "Clear search" }).click();
  await page.getByRole("button", { name: /^Search/ }).click();
  log("Keyboard search");
  await page
    .getByRole("button", { name: `Options for ${conversation}` })
    .click();
  await page
    .getByRole("button", { name: "Archive conversation", exact: true })
    .click();
  await page.getByRole("button", { name: "Archive", exact: true }).click();
  await page
    .getByRole("button", { name: `Options for ${conversation}` })
    .click();
  await page.getByRole("button", { name: "Restore conversation" }).click();
  await page.getByRole("button", { name: "Back to workspace" }).click();
  await page.getByRole("button", { name: conversation, exact: true }).click();
  log("Archive and restore conversation");
  await createProject(destination);
  await page.getByRole("button", { name: renamed, exact: true }).click();
  await page.getByRole("button", { name: conversation, exact: true }).click();
  await page
    .getByRole("button", { name: `Options for ${conversation}` })
    .click();
  await page.getByRole("button", { name: "Move to project" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: destination, exact: true })
    .click();
  await expect(page.locator(".breadcrumb-project")).toContainText(destination);
  log("Move conversation to another project");
  await page.locator("input[type=file]").setInputFiles([
    {
      name: modelFile,
      mimeType: "model/gltf-binary",
      buffer: await fs.readFile(
        path.join(root, "evals/fixtures/procedural-viewer-fixture.glb"),
      ),
    },
    {
      name: videoFile,
      mimeType: "video/mp4",
      buffer: await fs.readFile(
        path.join(root, "evals/fixtures/procedural-video-fixture.mp4"),
      ),
    },
    {
      name: "local-live-image.png",
      mimeType: "image/png",
      buffer: await fs.readFile(
        path.join(root, "evals/reports/local-live-image.png"),
      ),
    },
  ]);
  await expect(page.locator(".attachment-chip")).toHaveCount(3, {
    timeout: 20000,
  });
  log("Upload GLB, MP4, and actual generated PNG");
  await library();
  await page
    .getByRole("button", { name: `Open ${modelFile}`, exact: true })
    .click();
  await expect(page.locator(".model-canvas canvas")).toBeVisible();
  await expect(page.locator(".model-preview .preview-message")).toHaveCount(0, {
    timeout: 20000,
  });
  await page.getByRole("button", { name: "Wireframe", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Wireframe", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Reset view", exact: true }).click();
  log("Actual GLB loaded in WebGL; wireframe and camera reset");
  await page.screenshot({
    path: path.join(output, "03-glb-viewer.png"),
    fullPage: true,
  });
  let download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download", exact: true }).click();
  const file = await download;
  await file.saveAs(path.join(output, file.suggestedFilename()));
  log("Download original GLB", { filename: file.suggestedFilename() });
  await page
    .getByRole("button", { name: "Favorite artifact", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Remove favorite", exact: true }),
  ).toBeVisible();
  await library();
  await page.getByRole("button", { name: "Favorites", exact: true }).click();
  await expect(
    page.getByRole("button", { name: `Open ${modelFile}`, exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Everything", exact: true }).click();
  log("Persisted favorites and library filter");
  await page
    .getByRole("button", { name: `Open ${videoFile}`, exact: true })
    .click();
  await expect(page.locator("video")).toBeVisible();
  await expect
    .poll(() => page.locator("video").evaluate((v) => v.readyState))
    .toBeGreaterThanOrEqual(2);
  const media = await page.locator("video").evaluate(async (v) => {
    await v.play();
    return {
      duration: v.duration,
      width: v.videoWidth,
      height: v.videoHeight,
      paused: v.paused,
    };
  });
  expect(media.paused).toBe(false);
  log("MP4 decodes and plays in browser", media);
  await page.screenshot({
    path: path.join(output, "04-video-player.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("tab", { name: "Output" }).click();
  await expect(page.locator("video")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page.screenshot({
    path: path.join(output, "05-mobile-video.png"),
    fullPage: true,
  });
  await page.getByRole("tab", { name: "Details", exact: true }).click();
  await expect(page.locator("aside.mobile-details")).toBeVisible();
  await page.getByRole("tab", { name: "Chat", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Describe your request" }),
  ).toBeVisible();
  log("Mobile 390px Chat / Output / Details and no overflow");
  await page.setViewportSize({ width: 768, height: 1024 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page.screenshot({
    path: path.join(output, "06-tablet-chat.png"),
    fullPage: true,
  });
  log("Tablet 768px reflow");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Open sidebar" }).click();
  await page.getByRole("button", { name: /Models & skills/ }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByRole("tab", { name: "Skills", exact: true }).click();
  await expect(dialog).toContainText("Motion planning");
  await dialog.getByRole("tab", { name: "Workflows", exact: true }).click();
  await expect(dialog).toContainText("Polished image");
  await dialog.getByRole("tab", { name: "Account", exact: true }).click();
  await expect(dialog).toContainText("Local development");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  log("Catalog settings and keyboard modal dismissal");
  await page
    .getByRole("button", { name: `Options for ${renamed}`, exact: true })
    .click();
  await page
    .getByRole("button", { name: "Archive project", exact: true })
    .click();
  await page.getByRole("button", { name: "Archive", exact: true }).click();
  await page
    .getByRole("button", { name: `Options for ${renamed}`, exact: true })
    .click();
  await page
    .getByRole("button", { name: "Restore project", exact: true })
    .click();
  await page.getByRole("button", { name: "Back to workspace" }).click();
  log("Archive and restore project");
  for (const name of [renamed, destination]) {
    await page
      .getByRole("button", { name: `Options for ${name}`, exact: true })
      .click();
    await page
      .getByRole("button", { name: "Archive project", exact: true })
      .click();
  }
  await page
    .getByRole("button", { name: "Ceramic studies", exact: true })
    .click();
  await page
    .getByRole("button", { name: "A quieter kind of coffee", exact: true })
    .click();
  await expect(page.locator(".image-viewport img")).toBeVisible();
  expect(
    await page
      .locator(".image-viewport img")
      .evaluate((img) => img.complete && img.naturalWidth === 768),
  ).toBe(true);
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(page.locator(".zoom-level")).toHaveText("125%");
  await page.getByRole("button", { name: "125%", exact: true }).click();
  await page.screenshot({
    path: path.join(output, "07-live-image-workspace.png"),
    fullPage: true,
  });
  log("Actual FLUX PNG preview and zoom, QA projects archived");
  expect(report.errors).toEqual([]);
  log("No browser runtime errors");
  report.completed_at = new Date().toISOString();
  report.passed = true;
} catch (error) {
  report.passed = false;
  report.failure = error.stack;
  await page
    .screenshot({ path: path.join(output, "failure.png"), fullPage: true })
    .catch(() => {});
  console.error(error);
} finally {
  await fs.writeFile(
    path.join(output, "results.json"),
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
if (!report.passed) process.exitCode = 1;
