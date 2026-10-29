import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const output = path.join(root, "evals/reports/ui-validation");
const base = process.env.POWWOW_QA_URL || "http://127.0.0.1:5173";
const credentialsPath = process.env.POWWOW_QA_CREDENTIALS;
const liveInference = process.env.POWWOW_QA_INFERENCE === "1";
const report = {
  started_at: new Date().toISOString(),
  checks: [],
  errors: [],
  state_fixture_note:
    "Unavailable and missing-image intent responses are explicit browser fixtures. They verify draft preservation and UI boundaries; they do not claim live video or 3D inference.",
  live_inference: liveInference,
};
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
page.setDefaultTimeout(15000);
page.on("pageerror", (error) => report.errors.push(error.message));
const capture = (options) => page.screenshot({ ...options, mask: [page.locator(".profile-row > span:last-of-type"), page.locator(".account-card"), page.locator("input[type=email], input[type=password]")], maskColor: "#23271f" });
let bearer;
page.on("request", (req) => {
  if (req.url().includes("/v1/"))
    bearer = req.headers().authorization || bearer;
});
const check = (name, details = {}) => {
  report.checks.push({ name, passed: true, ...details });
  console.log("PASS", name);
};
const projectName = `Customer experience ${Date.now().toString().slice(-6)}`;
let createdProjectId;
const credentials = credentialsPath
  ? JSON.parse(await fs.readFile(credentialsPath, "utf8"))
  : null;
const account =
  credentials?.accounts?.[0] || credentials?.primary || credentials;
const api = async (endpoint, options = {}) => {
  const response = await page.request.fetch(base + endpoint, {
    ...options,
    headers: {
      ...(bearer ? { Authorization: bearer } : {}),
      ...options.headers,
    },
  });
  expect(
    response.ok(),
    `${options.method || "GET"} ${endpoint}: ${response.status()}`,
  ).toBeTruthy();
  return response.status() === 204 ? undefined : response.json();
};
const noOverflow = async () => {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
};
async function login(user = account) {
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Create project", exact: true }),
  ).toBeVisible();
}

try {
  const config = await (await page.request.get(base + "/v1/config")).json();
  await page.goto(base);
  if (config.auth_mode === "supabase") {
    if (!account?.email || !account?.password)
      throw new Error(
        "POWWOW_QA_CREDENTIALS must point to a private JSON file with email and password.",
      );
    await expect(
      page.getByRole("button", { name: "Sign in", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create project", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "New here? Create an account" })
      .click();
    await expect(
      page.getByRole("heading", { name: "A home for your ideas." }),
    ).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
      "minlength",
      "8",
    );
    await page
      .getByRole("button", { name: "Already have an account? Sign in" })
      .click();
    await capture({
      path: path.join(output, "customer-sign-in.png"),
      fullPage: true,
    });
    await login();
    check(
      "Real Supabase sign-in gates workspace access; sign-up form available",
    );
  } else {
    if (credentialsPath)
      throw new Error(
        "Expected Supabase mode; local authentication is not acceptable for this QA run.",
      );
    await expect(
      page.getByRole("button", { name: "Create project", exact: true }),
    ).toBeVisible();
    report.auth_note =
      "Local preview only. Supabase authentication has not been validated by this run.";
  }
  await noOverflow();
  await expect(
    page.getByRole("combobox", { name: "Choose an outcome" }),
  ).toHaveValue("auto");
  await expect(page.getByRole("button", { name: "Image options" })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: "Explore Powwow" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      /Models & skills|Local workspace|Connected|Configure a provider/,
    ),
  ).toHaveCount(0);
  check(
    "Customer home defaults to Let Powwow choose without provider setup inventory",
  );

  await page.getByRole("button", { name: "Explore Powwow" }).click();
  const explore = page.getByRole("dialog");
  await expect(
    explore.getByRole("heading", {
      name: "What would you like to make possible?",
    }),
  ).toBeVisible();
  await expect(explore.locator(".outcome-card")).toHaveCount(6);
  await expect(
    explore.getByText(/Provider|Configured|endpoint|VRAM|Connect your/),
  ).toHaveCount(0);
  await capture({
    path: path.join(output, "customer-explore.png"),
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await expect(explore).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Explore Powwow" }),
  ).toBeFocused();
  check("Outcome discovery and native modal Escape/focus restoration");

  await page.getByRole("button", { name: "Creative options", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Choose an outcome" })
    .selectOption("text_to_image");
  await page.getByRole("button", { name: "Image options" }).click();
  await expect(page.getByRole("combobox", { name: "Image shape", exact: true })).toBeVisible();
  await page
    .getByRole("combobox", { name: "Choose an outcome" })
    .selectOption("auto");
  await expect(page.getByLabel("Image shape", { exact: true })).toHaveCount(0);
  check("Image controls only appear for the image outcome");

  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  const nameInput = dialog.getByLabel("Project name", { exact: true });
  await nameInput.pressSequentially(projectName, { delay: 4 });
  await expect(nameInput).toHaveValue(projectName);
  await expect(nameInput).toBeFocused();
  await dialog
    .getByLabel(/Project instructions/)
    .fill("Customer experience validation. Use a warm, plain voice.");
  await dialog
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await expect(page.locator(".breadcrumb-project")).toContainText(projectName);
  createdProjectId = (await api("/v1/projects")).find(
    (item) => item.name === projectName,
  )?.id;
  expect(createdProjectId).toBeTruthy();
  check(
    "Project creation persists; character-by-character editing keeps keyboard focus",
  );

  const draft = page.getByRole("textbox", { name: "Describe your request" });
  const chatsBefore = (await api("/v1/chats")).length;
  const fixture = {
    id: "browser-state-fixture",
    capability: "image_to_video",
    task: "video",
    available: false,
    needs_image: false,
    summary: "Video request",
    skill_ids: [],
    method: "rules",
    model: null,
    web_search: false,
  };
  await page.route("**/v1/intent", (route) => route.fulfill({ json: fixture }));
  await draft.fill(
    "Create a short video of a ceramic vase turning in soft light.",
  );
  await page.getByRole("button", { name: "Send request", exact: true }).click();
  await expect(page.locator(".intent-feedback")).toContainText(
    "Video creation isn’t available yet",
  );
  await expect(draft).toHaveValue(
    "Create a short video of a ceramic vase turning in soft light.",
  );
  expect((await api("/v1/chats")).length).toBe(chatsBefore);
  check("Unavailable intent preserves draft and creates no conversation", {
    state_fixture: true,
  });
  await page.unroute("**/v1/intent");
  await page.route("**/v1/intent", (route) =>
    route.fulfill({ json: { ...fixture, available: true, needs_image: true } }),
  );
  await draft.fill("Animate my reference image.");
  await page.getByRole("button", { name: "Send request", exact: true }).click();
  await expect(page.locator(".intent-feedback")).toContainText(
    "Add the image you’d like to use",
  );
  expect((await api("/v1/chats")).length).toBe(chatsBefore);
  check("Missing image explains next action and creates no conversation", {
    state_fixture: true,
  });
  await page.unroute("**/v1/intent");

  await draft.fill("");
  await page.locator('input[type="file"]').setInputFiles({
    name: "Customer QA context.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(
      "This file verifies authenticated project storage. It is a QA fixture.",
    ),
  });
  await expect(
    page.getByRole("button", { name: "Remove Customer QA context.txt" }),
  ).toBeVisible();
  const uploaded = (
    await api(`/v1/artifacts?project_id=${createdProjectId}`)
  ).find((item) => item.name === "Customer QA context.txt");
  expect(uploaded).toBeTruthy();
  const stored = await page.request.get(base + uploaded.download_url, {
    headers: bearer ? { Authorization: bearer } : {},
  });
  expect(stored.ok()).toBeTruthy();
  expect(await stored.text()).toContain("authenticated project storage");
  await page
    .getByRole("button", { name: "Remove Customer QA context.txt" })
    .click();
  check("Authenticated upload and original download preserve file contents");

  if (liveInference) {
    const novelPrompt =
      "Help me develop an idea for a novel called Apollo Lost. A lunar archivist discovers messages from a missing expedition. Give me a concise premise, two main characters, and a three-part plot outline. Keep it under 500 words.";
    let decision,
      accepted,
      stageOrder = [];
    page.on("request", (req) => {
      if (
        req.method() === "POST" &&
        /\/v1\/(intent|chats|runs)(\/|$)/.test(new URL(req.url()).pathname)
      )
        stageOrder.push(new URL(req.url()).pathname);
    });
    const intentResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/v1/intent") &&
        response.request().method() === "POST",
      { timeout: 90000 },
    );
    const runResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/v1/runs") &&
        response.request().method() === "POST",
      { timeout: 90000 },
    );
    await draft.fill(novelPrompt);
    await page
      .getByRole("button", { name: "Send request", exact: true })
      .click();
    decision = await (await intentResponse).json();
    accepted = await (await runResponse).json();
    expect(decision.task).toBe("creative_writing");
    expect(decision.capability).toBe("chat");
    expect(decision.skill_ids).toContain("story_development@1");
    expect(stageOrder[0]).toBe("/v1/intent");
    await expect
      .poll(async () => (await api(`/v1/runs/${accepted.id}`)).status, {
        timeout: 240000,
        intervals: [2000],
      })
      .toBe("succeeded");
    await expect(page.locator(".message-assistant")).toBeVisible({
      timeout: 20000,
    });
    const result = await api(`/v1/runs/${accepted.id}`);
    expect(result.output_text.length).toBeGreaterThan(100);
    await page.getByRole("button", { name: "About this response" }).click();
    await expect(page.getByRole("dialog")).toContainText("Story development");
    await capture({
      path: path.join(output, "customer-result-details.png"),
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    check(
      "Real automatic novel request resolves to creative-writing guidance and completes",
      {
        run_id: result.id,
        task: decision.task,
        skills: decision.skill_ids,
        model: result.model,
      },
    );
  }

  await capture({
    path: path.join(output, "customer-desktop.png"),
    fullPage: true,
  });
  for (const [name, width, height] of [
    ["phone", 390, 844],
    ["tablet", 768, 1024],
    ["reflow-200", 720, 500],
  ]) {
    await page.setViewportSize({ width, height });
    await noOverflow();
    await expect(draft).toBeVisible();
    await capture({
      path: path.join(output, `customer-${name}.png`),
      fullPage: true,
    });
    check(`${name} layout has no horizontal overflow`, {
      viewport: `${width}×${height}`,
      ...(name === "reflow-200"
        ? {
            note: "720×500 CSS viewport is equivalent reflow to a 1440×1000 viewport at 200%.",
          }
        : {}),
    });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .getByRole("button", { name: "Open sidebar" })
    .click()
    .catch(() => {});
  if (config.auth_mode === "supabase") {
    await page.getByRole("button", { name: "Account settings" }).click();
    await expect(page.getByRole("dialog")).toContainText(account.email);
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Sign in", exact: true }),
    ).toBeVisible();
    await expect(page.getByText(projectName, { exact: true })).toHaveCount(0);
    if (credentials.secondary) {
      await login(credentials.secondary);
      await expect(page.getByText(projectName, { exact: true })).toHaveCount(0);
      expect(
        (await api("/v1/projects")).some(
          (item) => item.id === createdProjectId,
        ),
      ).toBeFalsy();
      expect(
        (await api("/v1/artifacts")).some((item) => item.id === uploaded.id),
      ).toBeFalsy();
      await page.getByRole("button", { name: "Account settings" }).click();
      await page.getByRole("button", { name: "Sign out", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "Sign in", exact: true }),
      ).toBeVisible();
      check(
        "Switching accounts cannot display another account’s projects or uploaded files",
      );
    }
    await login();
    await expect(
      page.getByRole("button", { name: projectName, exact: true }),
    ).toBeVisible();
    check(
      "Sign-out clears customer data from UI; sign-in restores saved projects",
    );
  }
  expect(report.errors).toEqual([]);
  check("No uncaught browser runtime errors");
} catch (error) {
  report.failure = error.message;
  await page
    .screenshot({
      path: path.join(output, "customer-failure.png"),
      fullPage: true,
    })
    .catch(() => {});
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (createdProjectId)
    await api(`/v1/projects/${createdProjectId}`, {
      method: "PATCH",
      data: { archived: true },
    }).catch(() => {});
  report.finished_at = new Date().toISOString();
  await fs.writeFile(
    path.join(
      output,
      credentialsPath
        ? "customer-results.json"
        : "customer-preview-results.json",
    ),
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
