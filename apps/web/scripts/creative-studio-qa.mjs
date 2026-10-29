import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const output = path.join(root, "evals/reports/creative-studio");
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = {
  note: "Browser-only API fixtures for design and interaction checks; no generation or persistence is simulated in the application.",
  checks: [],
  errors: [],
};
const project = {
  id: "design-review",
  name: "My workspace",
  context_mode: "project",
  archived: false,
};
const catalog = {
  models: [],
  skills: [],
  workflows: [],
  providers: [],
  capabilities: ["chat", "text_to_image", "image_to_video", "image_to_3d"].map(
    (id) => ({ id, enabled: !id.includes("image_to_") }),
  ),
};
const check = (name) => {
  report.checks.push(name);
  console.log("PASS", name);
};
let page;
async function fixture(page) {
  page.on("pageerror", (error) => report.errors.push(error.message));
  await page.route("**/v1/**", async (route) => {
    const url = new URL(route.request().url());
    let data = [];
    if (url.pathname === "/v1/config") data = { auth_mode: "local" };
    if (url.pathname === "/v1/projects") data = [project];
    if (url.pathname === "/v1/catalog") data = catalog;
    if (url.pathname === "/v1/intent")
      data = {
        id: "fixture-unavailable",
        capability: "chat",
        available: false,
        needs_image: false,
      };
    await route.fulfill({ json: data });
  });
}
try {
  page = await browser.newPage({
    viewport: { width: 1672, height: 941 },
    reducedMotion: "reduce",
  });
  await fixture(page);
  await page.goto("http://127.0.0.1:5173");
  await expect(
    page.getByRole("heading", { name: "What should we build together?" }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".orbit-card img")).toHaveCount(4);
  expect(
    await page
      .locator(".orbit-card img")
      .evaluateAll((images) =>
        images.every((image) => image.complete && image.naturalWidth > 0),
      ),
  ).toBeTruthy();
  await page.screenshot({ path: path.join(output, "desktop.png") });
  check("Desktop artwork loads and the headline is visible");

  const input = page.getByRole("textbox", { name: "Describe your request" });
  for (const [label, text] of [
    ["Write a novel", "novel"],
    ["Build a game", "browser game"],
    ["Start your screenplay", "screenplay"],
    ["Write a song", "lyrics"],
    ["Create some art", "concept art"],
  ]) {
    await page
      .locator(".creative-prompts")
      .getByRole("button", { name: label, exact: true })
      .click();
    await expect(input).toHaveValue(new RegExp(text));
    await expect(input).toBeFocused();
  }
  check("Every suggestion fills an appropriate draft and focuses the composer");
  await page
    .getByRole("button", { name: "Creative options", exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Choose an outcome" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Image options" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Image options" }).click();
  await expect(
    page.getByRole("combobox", { name: "Image shape", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Choose an outcome" })
    .selectOption("chat");
  await page
    .getByRole("button", { name: "Creative options", exact: true })
    .click();
  check("Creative settings preserve outcome selection and image controls");
  await page.getByRole("button", { name: "Send request", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Your draft is saved" }),
  ).toBeVisible();
  await expect(input).toHaveValue(/concept art/);
  check(
    "Submission reaches intent handling and preserves the draft on unavailable outcomes",
  );
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.locator(".orbit-card-model").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".orbit-card-model")).toBeFocused();
  check(
    "Unavailable 3D preview opens capability discovery and restores keyboard focus",
  );
  await page.getByRole("button", { name: "Your library", exact: true }).click();
  await expect(page.locator(".library")).toBeVisible();
  await page.getByRole("button", { name: "Home", exact: true }).click();
  check("Library and Home navigation continue to work");

  for (const [width, height, name] of [
    [1440, 900, "laptop"],
    [1024, 768, "small-desktop"],
    [768, 1024, "tablet"],
    [390, 844, "phone"],
    [320, 740, "small-phone"],
    [720, 470, "zoom-reflow"],
  ]) {
    await page.setViewportSize({ width, height });
    await expect(input).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await expect
      .poll(() =>
        page
          .locator(".conversation-panel")
          .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      )
      .toBeTruthy();
    for (const selector of [
      ".composer-home",
      ".creative-prompts",
      ".welcome-heading",
    ]) {
      const box = await page.locator(selector).boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
    }
    await page.screenshot({ path: path.join(output, `${name}.png`) });
    check(`${width}px layout has no horizontal overflow`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open sidebar" }).click();
  await expect(
    page.getByRole("button", { name: "Home", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Writing Find your story." }).click();
  await expect(page.locator(".app-shell")).toHaveClass(/sidebar-closed/);
  await expect(input).toBeFocused();
  await expect(input).toHaveValue(/novel/);
  check("Mobile tool navigation closes the drawer and focuses the draft");

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await input.blur();
  await page.mouse.move(2, 899);
  const card = page.locator(".orbit-card-novel");
  const transform = () => card.evaluate((el) => el.style.transform);
  const before = await transform();
  await expect.poll(transform).not.toBe(before);
  await page.getByRole("button", { name: "Pause showcase animation" }).click();
  const paused = await transform();
  await page.waitForTimeout(250);
  expect(await transform()).toBe(paused);
  await page.getByRole("button", { name: "Play showcase animation" }).click();
  await expect.poll(transform).not.toBe(paused);
  check("The orbit moves continuously and its pause/play control works");
  await card.focus();
  const focused = await transform();
  await page.waitForTimeout(250);
  expect(await transform()).toBe(focused);
  await input.focus();
  await expect.poll(transform).not.toBe(focused);
  check("Keyboard focus pauses the orbit, and leaving it resumes motion");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(
    page.getByRole("button", { name: /showcase animation/ }),
  ).toHaveCount(0);
  const reduced = await transform();
  await page.waitForTimeout(250);
  expect(await transform()).toBe(reduced);
  check(
    "Reduced-motion preference stops the orbit without hiding the previews",
  );
  expect(report.errors).toEqual([]);
  check("No uncaught browser errors");
  if (process.env.POWWOW_RECORD_SHOWCASE === "1") {
    const preview = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      recordVideo: { dir: output, size: { width: 1440, height: 900 } },
    });
    await fixture(preview);
    await preview.goto("http://127.0.0.1:5173");
    await expect(preview.locator(".creative-showcase")).toBeVisible();
    await preview.waitForTimeout(10000);
    const video = preview.video();
    await preview.close();
    await video.saveAs(path.join(output, "showcase.webm"));
    await video.delete();
  }
} catch (error) {
  if (page) {
    await page.screenshot({ path: path.join(output, "failure.png") });
    console.log(
      await page.evaluate(() => ({
        width: innerWidth,
        panel: [
          document.querySelector(".conversation-panel").clientWidth,
          document.querySelector(".conversation-panel").scrollWidth,
        ],
        overflow: [...document.querySelectorAll(".main-shell *")]
          .filter((el) => el.getBoundingClientRect().right > innerWidth + 1)
          .map((el) => ({
            tag: el.tagName,
            class: el.className,
            width: el.clientWidth,
            right: el.getBoundingClientRect().right,
          }))
          .slice(0, 20),
      })),
    );
  }
  report.failure = error.stack;
  throw error;
} finally {
  await fs.writeFile(
    path.join(output, "report.json"),
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
