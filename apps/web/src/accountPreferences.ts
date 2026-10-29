import { request } from "./api";
import { getLocalStorageConnection } from "./localFiles";

export type SettingsSection = "general" | "storage" | "subscription";
export type AccountPreferences = {
  app_language: string;
  storage_mode: "unselected" | "local" | "cloud";
  plan: "free" | "powwow";
  storage_quota_bytes: number;
  storage_used_bytes: number;
  storage_staged_bytes: number;
  storage_reserved_bytes?: number;
  storage_grace_bytes?: number;
  storage_full?: boolean;
  local_retention_hours: number;
  checkout_available: boolean;
  component_priorities: Record<string, number>;
};
export type AccountPreferencesPatch = Partial<
  Pick<
    AccountPreferences,
    "app_language" | "storage_mode" | "component_priorities"
  >
>;
export const APP_LANGUAGES = [
  ["en", "English"],
  ["es", "Español"],
  ["fr", "Français"],
  ["de", "Deutsch"],
  ["it", "Italiano"],
  ["pt", "Português"],
  ["ja", "日本語"],
  ["ko", "한국어"],
  ["zh", "中文"],
  ["ar", "العربية"],
  ["hi", "हिन्दी"],
  ["ru", "Русский"],
  ["uk", "Українська"],
  ["nl", "Nederlands"],
  ["sv", "Svenska"],
  ["pl", "Polski"],
  ["tr", "Türkçe"],
  ["vi", "Tiếng Việt"],
  ["el", "Ελληνικά"],
  ["he", "עברית"],
] as const;

const cache = new Map<string, AccountPreferences>();
export function getCachedAccountPreferences(
  accountId: string,
): AccountPreferences | undefined {
  return cache.get(accountId);
}
export function clearAccountPreferences(accountId?: string): void {
  if (accountId) cache.delete(accountId);
  else cache.clear();
}
function saveCache(
  accountId: string,
  value: AccountPreferences,
): AccountPreferences {
  cache.set(accountId, value);
  if (typeof document !== "undefined")
    document.documentElement.lang = value.app_language || "en";
  return value;
}
export async function loadAccountPreferences(
  accountId: string,
  signal?: AbortSignal,
): Promise<AccountPreferences> {
  if (!accountId) throw new Error("Sign in to load your settings.");
  return saveCache(
    accountId,
    await request<AccountPreferences>("/v1/account/preferences", { signal }),
  );
}
export async function saveAccountPreferences(
  accountId: string,
  patch: AccountPreferencesPatch,
  signal?: AbortSignal,
): Promise<AccountPreferences> {
  if (!accountId) throw new Error("Sign in to save your settings.");
  return saveCache(
    accountId,
    await request<AccountPreferences>("/v1/account/preferences", {
      method: "PATCH",
      body: JSON.stringify(patch),
      signal,
    }),
  );
}
export async function storageReadiness(
  accountId: string,
  preferences: AccountPreferences,
  projectId?: string,
): Promise<{
  ready: boolean;
  mode: AccountPreferences["storage_mode"];
  reason?: string;
  manualDownloads?: boolean;
}> {
  if (preferences.storage_mode === "unselected")
    return {
      ready: false,
      mode: "unselected",
      reason: "Choose where your files should live in Settings → Storage.",
    };
  if (preferences.storage_mode === "cloud")
    return { ready: true, mode: "cloud" };
  const connection = await getLocalStorageConnection(accountId, projectId);
  if (connection.kind === "downloads")
    return {
      ready: false,
      mode: "local",
      manualDownloads: true,
      reason:
        "Choose Cloud in Settings, or connect a local folder in a supported browser.",
    };
  if (connection.kind === "folder" && connection.permission === "granted")
    return { ready: true, mode: "local", manualDownloads: false };
  return {
    ready: false,
    mode: "local",
    reason: projectId
      ? "Choose a folder for this project using Project folder in the header."
      : "Connect your chat folder in Settings → Storage to save files on this device.",
  };
}
