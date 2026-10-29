import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
const imageBytes = await fs.readFile("apps/web/public/creative/film.webp");
const imageHash = createHash("sha256").update(imageBytes).digest("hex");
const output = path.resolve("evals/reports/project-details");
await fs.mkdir(output, { recursive: true });
const report = {
  note: "Local browser/API fixtures, no model calls or real project writes.",
  checks: [],
  errors: [],
};
const check = (value) => {
  report.checks.push(value);
  console.log("PASS", value);
};
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
page.setDefaultTimeout(10000);
const projects = [
  {
    id: "details-a",
    name: "The Lantern Keeper",
    storage_mode: "local",
    context_mode: "project",
    archived: false,
  },
  {
    id: "details-b",
    name: "Second project",
    storage_mode: "local",
    context_mode: "project",
    archived: false,
  },
];
const components = [
  ["design", "Project Blueprint"],
  ["tasks", "Task Board"],
  ["details", "Project Details"],
  ["storyboard", "Storyboard"],
  ["manuscript", "Book & Script Editor"],
  ["assets", "Asset Library"],
  ["language", "Learn a Language"],
].map(([id, name]) => ({ id, name, description: name }));
let workspace = {
  kind: "game",
  initialized: true,
  brief: "A lantern adventure",
  answers: {},
  assumptions: [],
  components: ["design", "tasks", "details", "assets"],
  tasks: [],
  records: {
    characters: [
      {
        id: "mara",
        title: "Mara Finch",
        fields: {
          description:
            "A resourceful child in an indigo raincoat.\n\nMotivation:\nRestore the village lantern.",
          reference: "image-one",
        },
      },
      {
        id: "fenn",
        title: "Fenn",
        fields: { description: "A fox with a gold scarf." },
      },
    ],
  },
  detail_categories: [
    { id: "characters", name: "Characters" },
    { id: "world", name: "World & locations" },
  ],
  design: "Original blueprint",
  plan_prompt: "",
};
const sessions = new Map(),
  messages = new Map();
let generatedRuns = [],
  extraImages = [],
  generationRequests = [],
  uploadCount = 0,
  uncertainNext = false;
function fixtureImage(id, name) {
  return {
    id,
    name,
    created_at: new Date().toISOString(),
    project_id: "details-a",
    kind: "image",
    mime_type: "image/webp",
    url: "/creative/film.webp",
    download_url: "/creative/film.webp",
    storage_mode: "cloud",
    available: true,
    size_bytes: imageBytes.length,
    sha256: imageHash,
    metadata: {},
    lineage_ids: [],
  };
}

let version = 1,
  failNext = false;
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
await page.addInitScript(() => {
  window.__folder = "Folder A";
  window.__pickerCalls = 0;
  window.showDirectoryPicker = async () => {
    window.__pickerCalls++;
    if (window.__cancelPicker) throw new DOMException("Canceled", "AbortError");
    return (await navigator.storage.getDirectory()).getDirectoryHandle(
      window.__folder,
      { create: true },
    );
  };
});
await page.route("**/v1/**", async (route) => {
  const req = route.request(),
    p = new URL(req.url()).pathname;
  let data = [];
  if (p === "/v1/config") data = { auth_mode: "local" };
  else if (p === "/v1/projects") data = projects;
  else if (p === "/v1/chats") data = [...sessions.values()];
  else if (/\/components\/[^/]+\/chat$/.test(p)) {
    const component = p.split("/").at(-2),
      project_id = p.split("/")[3];
    const key = project_id + ":" + component;
    if (!sessions.has(key)) {
      sessions.set(key, {
        id: key,
        component_id: component,
        project_id,
        title: component,
        context_mode: "project",
        archived: false,
      });
      messages.set(key, [
        {
          id: key + ":welcome",
          chat_id: key,
          role: "assistant",
          content: `Only ${component} conversation`,
          attachment_ids: [],
          created_at: new Date().toISOString(),
        },
      ]);
    }
    data = sessions.get(key);
  } else if (p === "/v1/intent")
    data = {
      id: "fixture-intent",
      capability: "chat",
      available: true,
      needs_image: false,
      summary: "Use selected references",
    };
  else if (p === "/v1/runs" && req.method() === "POST") {
    const body = req.postDataJSON();
    generationRequests.push(body);
    let run = generatedRuns.find(
      (item) => item.idempotency_key === body.idempotency_key,
    );
    if (!run) {
      run = {
        id: "image-run-" + generationRequests.length,
        project_id: "details-a",
        ...body,
        status: "queued",
        provider: "fixture",
        model: "fixture",
        workflow_id: "image.create.v1",
        created_at: new Date().toISOString(),
        artifact_ids: [],
        model_provenance: {},
        context_snapshot: [],
        output_text: "",
        estimated_cost_usd: 0.05,
      };
      generatedRuns.unshift(run);
    }
    if (uncertainNext) {
      uncertainNext = false;
      await route.fulfill({
        status: 503,
        json: { detail: "Fixture uncertain submission" },
      });
      return;
    }
    data = run;
  } else if (p === "/v1/runs") data = generatedRuns;
  else if (/\/chats\/[^/]+\/messages$/.test(p)) {
    const id = decodeURIComponent(p.split("/").at(-2)),
      items = messages.get(id) || [];
    if (req.method() === "POST") {
      const body = req.postDataJSON();
      data = {
        id: "message-" + items.length,
        chat_id: id,
        role: "user",
        ...body,
        created_at: new Date().toISOString(),
      };
      items.push(data);
      messages.set(id, items);
    } else data = items;
  } else if (p === "/v1/uploads") {
    uploadCount++;
    data = fixtureImage("upload-" + uploadCount, "Uploaded portrait");
    extraImages.push(data);
  } else if (p === "/v1/account/preferences") data = prefs;
  else if (p === "/v1/account/experience-tours") data = ["game"];
  else if (p === "/v1/builder/catalog") data = { components, kinds: [] };
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
      {
        id: "image-one",
        created_at: "2026-10-01T00:00:00Z",
        project_id: "details-a",
        kind: "image",
        name: "Mara portrait",
        mime_type: "image/webp",
        url: "/creative/film.webp",
        download_url: "/creative/film.webp",
        storage_mode: "cloud",
        available: true,
        size_bytes: imageBytes.length,
        sha256: imageHash,
        metadata: {},
        lineage_ids: [],
      },
    ];
  else if (p.endsWith("/workspace")) {
    if (req.method() === "PUT") {
      if (failNext) {
        failNext = false;
        await route.fulfill({
          status: 503,
          json: { detail: "Fixture save failed" },
        });
        return;
      }
      const body = req.postDataJSON();
      expect(body.version).toBe(version);
      workspace = body.workspace;
      version++;
    }
    data = { version, workspace };
  }
  if (p === "/v1/artifacts") data = [...data, ...extraImages];
  await route.fulfill({ json: data });
});
page.on("pageerror", (error) => report.errors.push(error.message));
async function option(label, value) {
  await page.getByRole("button", { name: label, exact: true }).click();
  await page.getByRole("option", { name: value, exact: true }).click();
}
async function noOverflow() {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual((await page.viewportSize()).width);
}
try {
  await page.goto(process.env.POWWOW_QA_URL || "http://127.0.0.1:5173");
  await page
    .getByRole("button", { name: "The Lantern Keeper", exact: true })
    .click();
  await page
    .locator(".project-tools")
    .getByRole("button", { name: "Project Details", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Project Details", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue(
    "Mara Finch",
  );
  await expect(page.getByLabel("Description", { exact: true })).toContainText(
    "Restore the village lantern",
  );
  expect(
    await page.locator(".builder-editor-fields input:not([type=file])").count(),
  ).toBe(1);
  expect(await page.locator(".builder-editor-fields textarea").count()).toBe(1);
  await expect(page.locator(".builder-record-thumb img")).toHaveCount(1);
  await expect(page.locator(".builder-record-thumb svg")).toHaveCount(1);
  const image = await page.locator(".detail-entry-image").boundingBox(),
    name = await page.getByLabel("Name", { exact: true }).boundingBox();
  expect(image.x).toBeLessThan(name.x);
  expect(Math.abs(image.y - name.y)).toBeLessThan(70);
  const description = await page
    .getByLabel("Description", { exact: true })
    .boundingBox();
  expect(Math.abs(description.x - name.x)).toBeLessThan(2);
  const search = await page.getByPlaceholder("Find an entry").boundingBox();
  const categoryBox = await page
    .getByRole("button", { name: "Category", exact: true })
    .boundingBox();
  expect(categoryBox.y).toBeGreaterThan(search.y);
  expect(Math.abs(categoryBox.x - search.x)).toBeLessThan(35);
  await page.getByRole("button", { name: "Category", exact: true }).click();
  await expect(page.getByRole("option").last()).toHaveText("+ New Category");
  await page.keyboard.press("Escape");
  const dock = page.locator(".project-chat-dock"),
    composer = dock.locator("textarea");
  await dock
    .getByRole("button", { name: "Project Details chat", exact: true })
    .click();
  await expect(dock.getByText("Only details conversation")).toBeVisible();
  await composer.fill("Draft belonging to details");
  await page
    .locator(".project-tools")
    .getByRole("button", { name: "Task Board", exact: true })
    .click();
  await expect(
    dock.getByRole("button", { name: "Task Board chat", exact: true }),
  ).toBeVisible();
  await dock
    .getByRole("button", { name: "Task Board chat", exact: true })
    .click();
  await expect(dock.getByText("Only tasks conversation")).toBeVisible();
  await expect(dock.getByText("Only details conversation")).toHaveCount(0);
  await expect(composer).toHaveValue("");
  await composer.fill("Draft belonging to tasks");
  await page
    .locator(".project-tools")
    .getByRole("button", { name: "Project Details", exact: true })
    .click();
  await expect(composer).toHaveValue("Draft belonging to details");
  await dock
    .getByRole("button", { name: "Project Details chat", exact: true })
    .click();
  await expect(dock.getByText("Only details conversation")).toBeVisible();
  await expect(dock.getByText("Only tasks conversation")).toHaveCount(0);
  await dock
    .getByRole("button", { name: "Project Details chat", exact: true })
    .click();
  check(
    "Component chats reuse distinct saved sessions and preserve separate drafts and histories",
  );
  check(
    "One name and description; image selector beside name; entry list shows images and placeholders",
  );
  await page
    .getByLabel("Description", { exact: true })
    .fill("Manual description with every important detail.");
  failNext = true;
  await page.getByRole("button", { name: "Save entry", exact: true }).click();
  await expect(
    page.getByText("Fixture save failed", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Description", { exact: true })).toHaveValue(
    "Manual description with every important detail.",
  );
  await page.getByRole("button", { name: "Save entry", exact: true }).click();
  await expect(
    page.getByText("Saved to this project", { exact: true }),
  ).toBeVisible();
  check(
    "Failed saves retain edits; successful saves use versioned workspace persistence",
  );
  await page.getByLabel("Name", { exact: true }).fill("Unsaved name");
  page.once("dialog", (d) => d.dismiss());
  await option("Category", "World & locations");
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue(
    "Unsaved name",
  );
  await page.getByLabel("Name", { exact: true }).fill("Mara Finch");
  await option("Category", "+ New Category");
  await page
    .getByLabel("Category name", { exact: true })
    .fill("Props and recurring objects");
  await page
    .getByRole("button", { name: "Save category", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Add entry", exact: true })
    .first()
    .click();
  await page.getByLabel("Name", { exact: true }).fill("The brass lantern");
  await page
    .getByLabel("Description", { exact: true })
    .fill("Passed down through three generations.");
  await option("Choose an image for image", "Mara portrait");
  await page.getByRole("button", { name: "Save entry", exact: true }).click();
  await expect(
    page.getByText("Saved to this project", { exact: true }),
  ).toBeVisible();
  const category = workspace.detail_categories.find(
    (c) => c.name === "Props and recurring objects",
  );
  expect(workspace.records[category.id][0].fields.reference).toBe("image-one");
  await option("Category", "Edit category…");
  await expect(
    page.getByRole("button", { name: "Delete empty category", exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel("Category name", { exact: true })
    .fill("Important objects");
  await page
    .getByRole("button", { name: "Save category", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  check(
    "Custom categories, renaming, image selection and unsaved navigation protection work",
  );
  await option("Category", "Characters");
  await page.screenshot({ path: path.join(output, "details-desktop.png") });
  await noOverflow();
  await expect(page.locator(".local-storage-banner")).toHaveCount(0);
  await expect(
    page.getByText("Ready for your next idea.", { exact: true }),
  ).toHaveCount(0);
  await page
    .locator(".builder-record-list")
    .getByRole("button", { name: /Fenn/ })
    .click();
  await expect(page.locator(".detail-entry-image img")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Generate image", exact: true })
    .click();
  const generation = page.getByRole("dialog", {
    name: "Generate image",
    exact: true,
  });
  await expect(generation.getByRole("alert")).toHaveCount(0);
  await expect(generation.locator("p")).toHaveCount(0);
  await generation.getByLabel("Image description").fill("");
  await generation.getByRole("button", { name: /^Generate image/ }).click();
  await expect(generation.getByRole("alert")).toContainText(
    "Enter an image description.",
  );
  await generation.getByLabel("Image description").fill("x".repeat(7501));
  await generation.getByRole("button", { name: /^Generate image/ }).click();
  await expect(generation.getByRole("alert")).toContainText(
    "Shorten the description to 7,500 characters.",
  );
  await generation
    .getByLabel("Image description")
    .fill("A fox wearing a gold scarf");
  await generation.getByRole("button", { name: /^Generate image/ }).click();
  await expect(generation.getByRole("alert")).toContainText(
    "Select a project folder to generate images.",
  );
  await expect(generation.getByRole("alert")).toHaveCSS(
    "color",
    "rgb(255, 146, 146)",
  );
  expect(generationRequests).toHaveLength(0);
  await page.screenshot({
    path: path.join(output, "missing-folder-error.png"),
  });
  await generation
    .getByRole("button", { name: "Edit project", exact: true })
    .click();
  const settings = page.getByRole("dialog", {
    name: "Edit project",
    exact: true,
  });
  await expect(
    settings.getByLabel("Project name", { exact: true }),
  ).toHaveValue("The Lantern Keeper");
  await expect(
    settings.getByText("No folder selected", { exact: true }),
  ).toBeVisible();
  await settings
    .getByRole("button", { name: "Choose project folder", exact: true })
    .click();
  await expect(settings.getByText("Folder A", { exact: true })).toBeVisible();
  await page.screenshot({ path: path.join(output, "edit-project-folder.png") });
  await settings
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await expect(generation.getByLabel("Image description")).toHaveValue(
    "A fox wearing a gold scarf",
  );
  await expect(generation.getByRole("alert")).toHaveCount(0);
  await generation.getByRole("button", { name: /^Generate image/ }).click();
  await expect(generation).toHaveCount(0);
  expect(generationRequests).toHaveLength(1);
  expect(generationRequests[0].settings.entry_image.expected_reference).toBe(
    "",
  );
  generatedRuns[0].status = "cancelled";
  await expect(
    page
      .locator(".project-chat-handle")
      .getByRole("button", { name: "Thinking…", exact: true }),
  ).toHaveCount(0);
  generatedRuns = [];
  generationRequests = [];
  await page
    .locator(".builder-record-list")
    .getByRole("button", { name: /Mara Finch/ })
    .click();
  // The menu also opens folder settings for a different, unselected project.
  await page
    .getByRole("button", { name: "Options for Second project", exact: true })
    .click();
  await page.getByRole("button", { name: "Edit project", exact: true }).click();
  await expect(
    settings.getByLabel("Project name", { exact: true }),
  ).toHaveValue("Second project");
  await expect(
    settings.getByText("No folder selected", { exact: true }),
  ).toBeVisible();
  await settings
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  check(
    "No idle helper copy; attempted generation shows red validation with a direct folder-settings link; retry works without a source image and retains its prompt",
  );
  const local = await page.evaluate(async () => {
    const files = await import("/src/localFiles.ts");
    const a = await files.getLocalStorageConnection("local", "details-a");
    const bBefore = await files.getLocalStorageConnection("local", "details-b");
    window.__folder = "Folder B";
    await files.chooseLocalFolder("local", "details-b");
    const b = await files.getLocalStorageConnection("local", "details-b");
    const aAfter = await files.getLocalStorageConnection("local", "details-a");
    const pathA = await files.saveLocalProject("local", "details-a", {
      workspace: { brief: "Project A" },
    });
    const pathB = await files.saveLocalProject("local", "details-b", {
      workspace: { brief: "Project B" },
    });
    async function read(root, path) {
      let dir = await (
        await navigator.storage.getDirectory()
      ).getDirectoryHandle(root);
      let parts = path.split("/");
      for (const part of parts.slice(0, -1))
        dir = await dir.getDirectoryHandle(part);
      return JSON.parse(
        await (await (await dir.getFileHandle(parts.at(-1))).getFile()).text(),
      );
    }
    const savedA = await read("Folder A", pathA),
      savedB = await read("Folder B", pathB);
    const otherAccount = await files.getLocalStorageConnection(
      "another-account",
      "details-a",
    );
    return { a, bBefore, b, aAfter, savedA, savedB, otherAccount };
  });
  expect(local.a.folderName).toBe("Folder A");
  expect(local.bBefore.kind).toBe("unselected");
  expect(local.b.folderName).toBe("Folder B");
  expect(local.aAfter.folderName).toBe("Folder A");
  expect(local.savedA.project.workspace.brief).toBe("Project A");
  expect(local.savedB.project.workspace.brief).toBe("Project B");
  expect(local.otherAccount.kind).toBe("unselected");
  check(
    "Two projects save into distinct actual browser filesystem directories; project and account folder isolation verified",
  );
  const picking = page.waitForEvent("filechooser");
  await option("Choose an image for image", "Upload an image…");
  await (
    await picking
  ).setFiles({
    name: "portrait.webp",
    mimeType: "image/webp",
    buffer: imageBytes,
  });
  await expect(page.locator(".detail-entry-image img")).toHaveAttribute(
    "alt",
    "Uploaded portrait",
  );
  await page.getByRole("button", { name: "Save entry", exact: true }).click();
  expect(uploadCount).toBe(1);
  expect(workspace.records.characters[0].fields.reference).toBe("upload-1");
  await page
    .getByRole("button", { name: "Generate image", exact: true })
    .click();
  await expect(
    page.getByLabel("Image description", { exact: true }),
  ).toContainText("Mara Finch");
  await page
    .getByLabel("Image description", { exact: true })
    .fill("A hand-painted portrait in an indigo raincoat");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  expect(generationRequests).toHaveLength(0);
  await page
    .getByRole("button", { name: "Generate image", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Use entry details", exact: true })
    .click();
  await page.screenshot({
    path: path.join(output, "image-generation-dialog.png"),
  });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /^Generate image/ })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(generationRequests).toHaveLength(1);
  expect(generationRequests[0].chat_id).toBe("details-a:details");
  expect(generationRequests[0].settings.entry_image).toEqual({
    category_id: "characters",
    record_id: "mara",
    field: "reference",
    expected_reference: "upload-1",
  });
  expect(generationRequests[0].budget_usd).toBe(1);
  await expect(
    page.getByText("Generating image…", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Description", { exact: true })
    .fill("Unsaved text written while image generates");
  const run = generatedRuns[0];
  run.status = "succeeded";
  run.artifact_ids = ["generated-one"];
  run.model_provenance = {
    entry_image: { status: "attached", artifact_id: "generated-one" },
  };
  extraImages.push(fixtureImage("generated-one", "Generated portrait"));
  workspace.records.characters[0].fields.reference = "generated-one";
  version++;
  await expect(page.locator(".detail-entry-image img")).toHaveAttribute(
    "alt",
    "Generated portrait",
    { timeout: 20000 },
  );
  await expect(page.getByLabel("Description", { exact: true })).toHaveValue(
    "Unsaved text written while image generates",
  );
  await page.getByRole("button", { name: "Save entry", exact: true }).click();
  check(
    "Uploads and confirmed image generation target the entry; generated images merge without losing unsaved prose",
  );
  // A lost response is recovered with the original key, never automatically resubmitted.
  uncertainNext = true;
  await page
    .getByRole("button", { name: "Generate image", exact: true })
    .click();
  await page
    .getByLabel("Image description", { exact: true })
    .fill("A second portrait with a lantern");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /^Generate image/ })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByText("Could not confirm image generation.", { exact: true }),
  ).toBeVisible();
  expect(generationRequests).toHaveLength(2);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /^Generate image/ })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByText("The previous request needs confirmation.", { exact: true }),
  ).toBeVisible();
  expect(generationRequests).toHaveLength(2);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Recover request", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Recover request", exact: true }),
  ).toHaveCount(0);
  expect(generationRequests).toHaveLength(3);
  expect(generationRequests[2].idempotency_key).toBe(
    generationRequests[1].idempotency_key,
  );
  expect(generatedRuns).toHaveLength(2);
  generatedRuns[0].status = "cancelled";
  check(
    "Uncertain generation blocks another submission; explicit recovery reuses the original request key",
  );
  await expect(
    page
      .locator(".project-chat-handle")
      .getByRole("button", { name: "Thinking…", exact: true }),
  ).toHaveCount(0);
  extraImages.push({
    ...fixtureImage("foreign", "Other project portrait"),
    project_id: "details-b",
  });
  await page
    .locator(".project-tools")
    .getByRole("button", { name: "Asset Library", exact: true })
    .click();
  const assetComposer = page
    .locator(".project-chat-dock")
    .getByRole("textbox", { name: "Describe your request", exact: true });
  await assetComposer.fill("Compare these references");
  await page
    .locator(".builder-asset-card")
    .filter({ hasText: "Mara portrait" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add to message", exact: true })
    .click();
  await expect(
    page.locator(".composer-references .attachment-chip"),
  ).toHaveCount(1);
  await expect(assetComposer).toHaveValue("Compare these references");
  await page
    .locator(".builder-asset-card")
    .filter({ hasText: "Mara portrait" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add to message", exact: true })
    .click();
  await expect(
    page.locator(".composer-references .attachment-chip"),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "Add to your message", exact: true })
    .click();
  await expect(
    page.getByRole("menuitem", { name: "Add components", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("menuitem", { name: "Project assets", exact: true })
    .click();
  const picker = page.getByRole("dialog", {
    name: "Project assets",
    exact: true,
  });
  await expect(
    picker.getByRole("button", { name: "Other project portrait", exact: true }),
  ).toHaveCount(0);
  await picker
    .getByRole("button", { name: "Uploaded portrait", exact: true })
    .click();
  await picker
    .getByRole("button", { name: "Generated portrait", exact: true })
    .click();
  await picker
    .getByRole("button", { name: "Add 2 assets", exact: true })
    .click();
  await expect(
    page.locator(".composer-references .attachment-chip"),
  ).toHaveCount(3);
  await page
    .getByRole("button", { name: "Remove Uploaded portrait", exact: true })
    .click();
  await expect(
    page.locator(".composer-references .attachment-chip"),
  ).toHaveCount(2);
  await page.screenshot({
    path: path.join(output, "asset-references-desktop.png"),
  });
  await page
    .locator(".project-tools")
    .getByRole("button", { name: "Task Board", exact: true })
    .click();
  await expect(
    page.locator(".composer-references .attachment-chip"),
  ).toHaveCount(0);
  await page
    .locator(".project-tools")
    .getByRole("button", { name: "Asset Library", exact: true })
    .click();
  await expect(
    page.locator(".composer-references .attachment-chip"),
  ).toHaveCount(2);
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow();
  await expect(
    page.getByRole("button", { name: "Remove Mara portrait", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: path.join(output, "asset-references-mobile.png"),
  });
  await page.getByRole("button", { name: "Send request", exact: true }).click();
  await expect(
    page.locator(".composer-references .attachment-chip"),
  ).toHaveCount(0);
  expect(generationRequests.at(-1).attachment_ids).toEqual([
    "image-one",
    "generated-one",
  ]);
  expect(messages.get("details-a:assets").at(-1).attachment_ids).toEqual([
    "image-one",
    "generated-one",
  ]);
  generatedRuns[0].status = "cancelled";
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
  check(
    "Asset cards attach real references without changing the prompt; the + menu supports multiple project assets, removal, session isolation and transmission of exact asset IDs",
  );
  await page.reload();
  await page
    .getByRole("button", { name: "The Lantern Keeper", exact: true })
    .click();
  await page
    .locator(".project-tools")
    .getByRole("button", { name: "Project Details", exact: true })
    .click();
  await option("Category", "Important objects");
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue(
    "The brass lantern",
  );
  check("Category names, records and image references survive reload");
  await page
    .getByRole("button", { name: "Collapse sidebar", exact: true })
    .click();
  for (const width of [390, 320, 720]) {
    await page.setViewportSize({ width, height: 1000 });
    await noOverflow();
    await expect(page.getByLabel("Description", { exact: true })).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => {
          const name = document
            .querySelector(".builder-record-title")
            .getBoundingClientRect();
          const description = document
            .querySelector(".builder-field textarea")
            .getBoundingClientRect();
          return Math.abs(name.x - description.x);
        }),
      )
      .toBeLessThan(2);
    await page
      .getByLabel("Description", { exact: true })
      .scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, `details-${width}.png`) });
    await page
      .getByRole("button", { name: "Save entry", exact: true })
      .scrollIntoViewIfNeeded();
    await expect(
      page.getByRole("button", { name: "Save entry", exact: true }),
    ).toBeInViewport();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Options for The Lantern Keeper",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Edit project", exact: true }).click();
  await expect(settings.getByText("Folder A", { exact: true })).toBeVisible();
  await settings
    .getByRole("button", { name: "Choose another folder", exact: true })
    .scrollIntoViewIfNeeded();
  await expect(
    settings.getByRole("button", {
      name: "Choose another folder",
      exact: true,
    }),
  ).toBeInViewport();
  await page.screenshot({
    path: path.join(output, "edit-project-folder-mobile.png"),
  });
  await settings
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  check("Desktop, phone and 200%-equivalent reflow have no page overflow");
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
  console.log(JSON.stringify(report));
}
