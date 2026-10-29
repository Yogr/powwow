import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

const modelPath = process.env.POWWOW_PREVIEW_MODEL || "evals/fixtures/validated-fixture.glb";
const model = await fs.readFile(modelPath);
const thumbnail = await fs.readFile(process.env.POWWOW_PREVIEW_PNG || "evals/fixtures/validated-fixture-preview.png");
const output = path.resolve(process.env.POWWOW_PREVIEW_OUTPUT || "evals/reports/model-preview");
await fs.mkdir(output, { recursive: true });
const report = {
  note: "Browser fixtures; no model generation or real project writes.",
  source: { path: modelPath, bytes: model.length, sha256: createHash("sha256").update(model).digest("hex") },
  checks: [],
  errors: [],
};
const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
  args: ["--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1250, height: 950 } });
page.setDefaultTimeout(15000);
page.on("pageerror", (error) => report.errors.push(error.message));
let modelRequests = 0;
let localRequests = 0;
await page.route("**/__qa/model-preview", (route) =>
  route.fulfill({
    contentType: "text/html",
    body: '<html><head><link rel="stylesheet" href="/src/styles.css"></head><body><div id="root" style="max-width:1100px;margin:auto"></div></body></html>',
  }),
);
await page.route("**/__qa/fixture.glb", (route) =>
  route.fulfill({ contentType: "model/gltf-binary", body: model }),
);
await page.route("**/v1/artifacts/**", async (route) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  };
  if (route.request().method() === "OPTIONS") {
    await route.fulfill({ status: 204, headers });
    return;
  }
  const pathname = new URL(route.request().url()).pathname;
  if (pathname.includes("server-preview")) {
    await route.fulfill({ contentType: "image/png", body: thumbnail, headers });
  } else if (pathname.includes("cached-model")) {
    report.errors.push("A model with a saved PNG downloaded its GLB.");
    await route.fulfill({ status: 500, headers });
  } else if (pathname.includes("local-model")) {
    localRequests++;
    await route.fulfill({ status: 410, headers });
  } else if (pathname.includes("broken-model")) {
    await route.fulfill({
      contentType: "model/gltf-binary",
      body: "broken model",
      headers,
    });
  } else if (pathname.includes("unavailable-model")) {
    await route.fulfill({ status: 404, headers });
  } else {
    if (!/^Bearer /.test(route.request().headers().authorization || ""))
      report.errors.push("Model request did not include authorization.");
    modelRequests++;
    await route.fulfill({
      contentType: "model/gltf-binary",
      body: model,
      headers,
    });
  }
});
const artifacts = [
  "remote-model",
  "local-model",
  "broken-model",
  "unavailable-model",
  "cached-model",
].map((id) => ({
  id,
  project_id: "model-project",
  name: `${id}.glb`,
  mime_type: "model/gltf-binary",
  kind: "model3d",
  created_at: "2026-10-09T00:00:00Z",
  size_bytes: model.length,
  sha256: createHash("sha256").update(model).digest("hex"),
  url: `/v1/artifacts/${id}/content`,
  download_url: `/v1/artifacts/${id}/download`,
  preview_url: id === "cached-model" ? "/v1/artifacts/server-preview/content" : undefined,
  metadata: {},
  lineage_ids: [],
  available: true,
  storage_mode: id.startsWith("local") ? "local" : "cloud",
}));
try {
  await page.goto(
    `${process.env.POWWOW_QA_URL || "http://127.0.0.1:5173"}/__qa/model-preview`,
  );
  await page.evaluate(async (artifacts) => {
    const { default: RefreshRuntime } = await import("/@react-refresh");
    RefreshRuntime.injectIntoGlobalHook(window);
    window.$RefreshReg$ = () => {};
    window.$RefreshSig$ = () => (type) => type;
    window.__vite_plugin_react_preamble_installed__ = true;
    const { default: React } =
      await import("/node_modules/.vite/deps/react.js");
    const { default: ReactDOM } =
      await import("/node_modules/.vite/deps/react-dom_client.js");
    const { BuilderEditors } = await import("/src/BuilderEditors.tsx");
    const componentSource = await (await fetch("/src/components.tsx")).text();
    const apiModule = componentSource.match(/from "([^"]*\/api\.ts[^"]*)"/)[1];
    const { setToken } = await import(apiModule);
    const { connectLocalFolder, saveLocalArtifact } =
      await import("/src/localFiles.ts");
    setToken(`fixture.${btoa(JSON.stringify({ sub: "preview-qa" }))}.fixture`);
    window.__renders = 0;
    // Constructor methods are instance properties; count native WebGL draw calls instead.
    for (const kind of [WebGLRenderingContext, WebGL2RenderingContext]) {
      for (const method of ['drawElements', 'drawArrays']) {
        const original = kind.prototype[method];
        kind.prototype[method] = function(...args) { window.__renders++; return original.apply(this, args); };
      }
    }
    const root = await navigator.storage.getDirectory();
    const directory = await root.getDirectoryHandle("model-preview-qa", {
      create: true,
    });
    await connectLocalFolder("user:preview-qa", "model-project", directory);
    const model = await (await fetch("/__qa/fixture.glb")).blob();
    await saveLocalArtifact("user:preview-qa", artifacts[1], model);
    window.__attached = [];
    ReactDOM.createRoot(document.getElementById("root")).render(
      React.createElement(BuilderEditors, {
        componentId: "assets",
        artifacts,
        projectName: "Model preview QA",
        workspace: {},
        onSave: async () => {},
        onAsk: () => {},
        onAttachAssets: async (items) => {
          window.__attached.push(...items.map((item) => item.id));
        },
      }),
    );
  }, artifacts);
  await page.getByRole("button", { name: "Models", exact: true }).click();
  await expect(page.locator(".builder-asset-card")).toHaveCount(5);
  await page.getByRole("button", { name: /remote-model\.glb model/ }).click();
  let dialog = page.getByRole("dialog");
  await expect(dialog.locator(".model-still")).toBeVisible();
  await expect(dialog.locator("canvas")).toHaveCount(0);
  expect(modelRequests).toBe(1);
  const draws = await page.evaluate(() => window.__renders);
  await page.waitForTimeout(1200);
  expect(await page.evaluate(() => window.__renders)).toBe(draws);
  await page.screenshot({ path: path.join(output, "model-desktop.png") });
  await dialog
    .getByRole("button", { name: "Add to message", exact: true })
    .click();
  expect(await page.evaluate(() => window.__attached)).toEqual([
    "remote-model",
  ]);
  report.checks.push(
    "Authenticated GLB becomes a cached image with no canvas or ongoing draw calls; Add to message preserves the reference.",
  );

  await page.getByRole("button", { name: /local-model\.glb model/ }).click();
  dialog = page.getByRole("dialog");
  await expect(dialog.locator('.model-still')).toBeVisible();
  expect(localRequests).toBe(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(dialog.locator(".model-still")).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({ path: path.join(output, "model-mobile.png") });
  await dialog
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  report.checks.push(
    "Verified local GLB previews without a server copy; the static image fits mobile.",
  );
  await page.getByRole("button", { name: /cached-model\.glb model/ }).click();
  dialog = page.getByRole("dialog");
  await expect(dialog.locator('.model-still')).toBeVisible();
  await expect(dialog.locator('canvas')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await page.getByRole("button", { name: /remote-model\.glb model/ }).click();
  dialog = page.getByRole("dialog");
  await expect(dialog.locator('.model-still')).toBeVisible();
  expect(modelRequests).toBe(1);
  await dialog.getByRole('button', { name: 'Close dialog', exact: true }).click();
  report.checks.push('Saved PNG previews never load the GLB; reopening an older model reuses its cached thumbnail.');

  await page.getByRole("button", { name: /broken-model\.glb model/ }).click();
  dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("alert")).toContainText(
    "Preview unavailable",
  );
  await expect(
    dialog.getByRole("button", { name: "Save to device", exact: true }),
  ).toBeEnabled();
  await dialog
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await page
    .getByRole("button", { name: /unavailable-model\.glb model/ })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Preview unavailable",
  );
  report.checks.push(
    "Malformed and unavailable models show errors instead of an indefinite loading state; original downloads remain available.",
  );
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
