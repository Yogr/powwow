import { useEffect, useRef, useState } from "react";
import { Cloud, Download, FolderOpen, LoaderCircle } from "lucide-react";
import { Modal } from "./components";
import { loadAccountPreferences } from "./accountPreferences";
import type { AccountPreferences } from "./accountPreferences";
import { chooseLocalFolder, directoryPickerSupported } from "./localFiles";
import { storageSize } from "./NewProjectDialog";

export default function StorageUpgrade({
  accountId,
  projectId,
  onClose,
  onUseLocal,
}: {
  accountId: string;
  projectId?: string;
  onClose: () => void;
  onUseLocal?: () => Promise<void>;
}) {
  const [preferences, setPreferences] = useState<AccountPreferences>();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [installReady, setInstallReady] = useState(
    Boolean(window.__powwowInstallPrompt),
  );
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const abort = new AbortController();
    void loadAccountPreferences(accountId, abort.signal)
      .then((value) => {
        if (!abort.signal.aborted) setPreferences(value);
      })
      .catch((error) => {
        if (!abort.signal.aborted) setError(error.message);
      });
    const update = () => setInstallReady(Boolean(window.__powwowInstallPrompt));
    window.addEventListener("powwow-install-available", update);
    return () => {
      mounted.current = false;
      abort.abort();
      window.removeEventListener("powwow-install-available", update);
    };
  }, [accountId]);
  async function useLocal() {
    setBusy(true);
    setError("");
    try {
      await chooseLocalFolder(accountId, projectId);
      if (!mounted.current) return;
      await onUseLocal?.();
      if (mounted.current) onClose();
    } catch (error) {
      if (
        mounted.current &&
        !(error instanceof DOMException && error.name === "AbortError")
      )
        setError(
          error instanceof Error
            ? error.message
            : "Folder access could not be saved.",
        );
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  async function install() {
    const prompt = window.__powwowInstallPrompt;
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    window.__powwowInstallPrompt = undefined;
    setInstallReady(false);
  }
  return (
    <Modal
      title="Upgrade your storage"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <div className="storage-upgrade">
        <p>
          {preferences
            ? `${storageSize(preferences.storage_used_bytes)} of ${storageSize(preferences.storage_quota_bytes)} cloud storage used.`
            : "Checking your storage…"}{" "}
          Your existing files and chats stay available.
        </p>
        <section className="storage-upgrade-card">
          <h3>
            <Cloud size={20} />
            Powwow Cloud
          </h3>
          <strong>100 GB · $10/month</strong>
          <p>Proposed storage add-on. Paid upgrades are not available yet.</p>
          <button className="button primary" disabled>
            Checkout coming soon
          </button>
        </section>
        <section className="storage-upgrade-card">
          <h3>
            <FolderOpen size={20} />
            Use storage on your device
          </h3>
          <p>
            Install Powwow with Chrome or Edge on your PC or Mac and choose a
            folder for each project. Cloud projects can also keep a local copy
            in their own connected folder while the app is open.
          </p>
          {installReady ? (
            <button className="button" onClick={() => void install()}>
              <Download size={15} />
              Install Powwow
            </button>
          ) : (
            <p>
              In Chrome or Edge, use the browser menu’s install option. The
              installed app still needs a connection for AI and project
              conversations.
            </p>
          )}
          {directoryPickerSupported() && (
            <>
              <p>
                This browser can also save to a local folder without installing.
              </p>
              {onUseLocal && (
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => void useLocal()}
                >
                  {busy ? (
                    <LoaderCircle size={15} className="spin" />
                  ) : (
                    <FolderOpen size={15} />
                  )}
                  Use a local folder
                </button>
              )}
            </>
          )}
        </section>
        {error && (
          <p className="project-storage-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
