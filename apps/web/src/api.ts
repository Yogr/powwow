import { createClient } from "@supabase/supabase-js";
import type { components } from "./generated-api";
import { readLocalArtifact } from "./localFiles";

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/$/,
  "",
);
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export let supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
let configuredAuthUrl = supabaseUrl;
let configuredAuthKey = supabaseKey;
export function configureAuth(url?: string, key?: string) {
  if (
    url &&
    key &&
    (!supabase || configuredAuthUrl !== url || configuredAuthKey !== key)
  ) {
    supabase = createClient(url, key);
    configuredAuthUrl = url;
    configuredAuthKey = key;
  }
  return supabase;
}
let token: string | null = null;
let accountGeneration = 0;
let accountIdentity: string | null = null;
function tokenIdentity(value: string | null): string | null {
  if (!value) return null;
  try {
    const encoded = value.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(encoded)).sub || value;
  } catch {
    return value;
  }
}
export const setToken = (value: string | null) => {
  const identity = tokenIdentity(value);
  if (identity !== accountIdentity) accountGeneration += 1;
  accountIdentity = identity;
  token = value;
};

function requireCurrentAccount(generation: number) {
  if (generation !== accountGeneration)
    throw new Error(
      "Your account changed. Open your current workspace to continue.",
    );
}

export function mediaCacheScope() {
  const generation = accountGeneration;
  return { key: accountIdentity ? `user:${accountIdentity}` : "local", check: () => requireCurrentAccount(generation) };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
  get definitive() {
    return this.status >= 400 && this.status < 500;
  }
}

export async function request<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const generation = accountGeneration;
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  requireCurrentAccount(generation);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    requireCurrentAccount(generation);
    const detail =
      data.detail ?? data.error ?? `Request failed (${response.status})`;
    if (detail?.action === "upgrade_storage")
      window.dispatchEvent(new Event("powwow-storage-upgrade"));
    throw new ApiError(
      typeof detail === "string"
        ? detail
        : detail.message ||
            (Array.isArray(detail)
              ? detail
                  .map((item: { msg?: string }) => item.msg || "Invalid input")
                  .join(". ")
              : JSON.stringify(detail)),
      response.status,
    );
  }
  const data = response.status === 204 ? undefined : await response.json();
  requireCurrentAccount(generation);
  return data as T;
}
export const post = <T = unknown>(path: string, data: unknown = {}) =>
  request<T>(path, { method: "POST", body: JSON.stringify(data) });
export const patch = <T = unknown>(path: string, data: unknown) =>
  request<T>(path, { method: "PATCH", body: JSON.stringify(data) });
export const assetUrl = (path?: string | null) =>
  path
    ? /^https?:|^blob:|^data:/.test(path)
      ? path
      : `${API_BASE}${path}`
    : "";
export async function authenticatedBlob(path: string): Promise<Blob> {
  const generation = accountGeneration;
  const account = accountIdentity ? `user:${accountIdentity}` : "local";
  const url = new URL(assetUrl(path), window.location.href);
  const base = new URL(
    API_BASE || window.location.origin,
    window.location.href,
  );
  const artifactId =
    url.origin === base.origin
      ? url.pathname.match(
          /^\/v1\/artifacts\/([^/]+)\/(?:download|content)$/,
        )?.[1]
      : undefined;
  if (artifactId) {
    const local = await readLocalArtifact(account, artifactId).catch(
      () => undefined,
    );
    requireCurrentAccount(generation);
    if (local) return local;
  }
  const response = await fetch(assetUrl(path), {
    headers:
      token && url.origin === base.origin
        ? { Authorization: `Bearer ${token}` }
        : {},
  });
  requireCurrentAccount(generation);
  if (!response.ok) throw new Error(`Download failed (${response.status})`);
  const blob = await response.blob();
  requireCurrentAccount(generation);
  return blob;
}

type Schema = components["schemas"];
export type Project = Schema["ProjectOut"] & { organization_id?: string | null };
export type Chat = Schema["ChatOut"];
export type Message = Schema["MessageOut"] & { text?: string };
export type Run = Omit<Schema["RunOut"], "error"> & {
  error?: string | { code: string; message: string } | null;
  model_id?: string;
};
export type RunEvent = Schema["EventOut"];
export type IntentDecision = Schema["IntentOut"];
export type Artifact = Schema["ArtifactOut"] & {
  preview_url?: string;
  is_demo?: boolean;
};
export type Grant = Schema["GrantOut"];
export type Model = {
  id: string;
  name: string;
  provider?: string;
  capability?: string;
  capabilities?: string[];
  enabled?: boolean;
  available?: boolean;
  status?: string;
  description?: string;
  license?: string;
  revision?: string;
  mode?: string;
};
export type Skill = {
  id: string;
  name: string;
  description?: string;
  version?: string | number;
  capability?: string;
  instructions?: string;
};
export type Capability = {
  id: string;
  name?: string;
  enabled?: boolean;
  available?: boolean;
  requires_image?: boolean;
  description?: string;
  provider?: string;
  mode?: string;
};
export const list = <T>(
  data: T[] | { items: T[] } | Record<string, T[]>,
  key?: string,
): T[] =>
  Array.isArray(data)
    ? data
    : ((key && key in data ? (data as Record<string, T[]>)[key] : data.items) ??
      []);
