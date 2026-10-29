export type PowwowInstallEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
declare global {
  interface Window {
    __powwowInstallPrompt?: PowwowInstallEvent;
  }
}

export const isInstalledApp = () =>
  window.matchMedia("(display-mode: standalone)").matches;

export function registerPowwowApp(): void {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    window.__powwowInstallPrompt = event as PowwowInstallEvent;
    window.dispatchEvent(new Event("powwow-install-available"));
  });
  window.addEventListener("appinstalled", () => {
    window.__powwowInstallPrompt = undefined;
    window.dispatchEvent(new Event("powwow-install-available"));
  });
  // Development keeps Vite's live updates and source modules outside a cache.
  if (
    import.meta.env.PROD &&
    "serviceWorker" in navigator &&
    window.isSecureContext
  ) {
    void navigator.serviceWorker
      .register("/service-worker.js", { scope: "/" })
      .catch(() => {
        // The online web app remains usable when site policy blocks registration.
      });
  }
}
