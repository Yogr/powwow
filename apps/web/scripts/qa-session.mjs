import fs from "node:fs/promises";
import { expect } from "@playwright/test";

export async function openQaSession(page) {
  const base = process.env.POWWOW_QA_URL || "http://127.0.0.1:5173";
  let authorization;
  page.on("request", request => {
    if (request.url().includes("/v1/"))
      authorization = request.headers().authorization || authorization;
  });
  const config = await (await page.request.get(base + "/v1/config")).json();
  await page.goto(base);
  if (config.auth_mode === "supabase") {
    if (!process.env.POWWOW_QA_CREDENTIALS)
      throw new Error("Set POWWOW_QA_CREDENTIALS to a private QA account JSON file.");
    const credentials = JSON.parse(await fs.readFile(process.env.POWWOW_QA_CREDENTIALS, "utf8"));
    const account = credentials.primary || credentials.accounts?.[0] || credentials;
    await page.getByLabel("Email", { exact: true }).fill(account.email);
    await page.getByLabel("Password", { exact: true }).fill(account.password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
  }
  await expect(page.getByRole("button", { name: "Create project", exact: true })).toBeVisible();
  const api = Object.fromEntries(["get", "post", "patch", "delete"].map(method => [method, (url, options = {}) => page.request[method](url, {
    ...options,
    headers: { ...(authorization ? { Authorization: authorization } : {}), ...options.headers },
  })]));
  const scope = authorization
    ? `user:${JSON.parse(Buffer.from(authorization.split(".")[1], "base64url").toString()).sub}`
    : "local";
  return { api, scope, base, config };
}
