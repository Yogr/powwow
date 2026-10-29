import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Cloud,
  Download,
  FolderOpen,
  Globe2,
  HardDrive,
  Laptop,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { Modal } from "./components";
import SelectMenu from "./SelectMenu";
import {
  APP_LANGUAGES,
  loadAccountPreferences,
  saveAccountPreferences,
} from "./accountPreferences";
import type {
  AccountPreferences,
  AccountPreferencesPatch,
  SettingsSection,
} from "./accountPreferences";
import {
  chooseLocalFolder,
  directoryPickerSupported,
  getLocalStorageConnection,
  reconnectLocalFolder,
} from "./localFiles";
import type { LocalStorageConnection } from "./localFiles";
import "./account-settings.css";

type Props = {
  accountId: string;
  initialSection?: SettingsSection;
  requiredStorage?: boolean;
  onClose: () => void;
  onPreferencesChanged?: (preferences: AccountPreferences) => void;
};
const errorText = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Settings could not be saved. Please try again.";
const fileSize = (size = 0) =>
  size >= 1_000_000_000
    ? `${(size / 1_000_000_000).toFixed(1).replace(/\.0$/, "")} GB`
    : size >= 1_000_000
      ? `${Math.round(size / 1_000_000)} MB`
      : `${Math.round(size / 1000)} KB`;

export default function AccountSettings({
  accountId,
  initialSection = "general",
  requiredStorage = false,
  onClose,
  onPreferencesChanged,
}: Props) {
  const [section, setSection] = useState<SettingsSection>(
    requiredStorage ? "storage" : initialSection,
  );
  const [preferences, setPreferences] = useState<AccountPreferences>();
  const [connection, setConnection] = useState<LocalStorageConnection>();
  const [language, setLanguage] = useState("en");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [installAvailable, setInstallAvailable] = useState(
    Boolean(window.__powwowInstallPrompt),
  );
  const [installed, setInstalled] = useState(
    window.matchMedia("(display-mode: standalone)").matches,
  );
  const abort = useRef(new AbortController());
  const mounted = useRef(true);
  const saving = useRef(false);
  const activeAccount = useRef(accountId);
  activeAccount.current = accountId;
  const folderSupported = directoryPickerSupported();

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    abort.current = controller;
    setLoading(true);
    setError("");
    void loadAccountPreferences(accountId, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) {
          setPreferences(value);
          setLanguage(value.app_language);
        }
      })
      .catch((value) => {
        if (!controller.signal.aborted) setError(errorText(value));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    void getLocalStorageConnection(accountId)
      .then((value) => {
        if (mounted.current && !controller.signal.aborted) setConnection(value);
      })
      .catch(() => {});
    return () => {
      mounted.current = false;
      controller.abort();
    };
  }, [accountId, reload]);
  useEffect(() => {
    const available = () =>
      setInstallAvailable(Boolean(window.__powwowInstallPrompt));
    const finished = () => {
      setInstalled(true);
      setInstallAvailable(false);
    };
    window.addEventListener("powwow-install-available", available);
    window.addEventListener("appinstalled", finished);
    return () => {
      window.removeEventListener("powwow-install-available", available);
      window.removeEventListener("appinstalled", finished);
    };
  }, []);

  async function save(patch: AccountPreferencesPatch, message: string) {
    const next = await saveAccountPreferences(
      accountId,
      patch,
      abort.current.signal,
    );
    if (mounted.current && activeAccount.current === accountId) {
      setPreferences(next);
      setNotice(message);
      onPreferencesChanged?.(next);
    }
  }
  async function act(action: () => Promise<void>) {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (value) {
      if (
        mounted.current &&
        !(value instanceof DOMException && value.name === "AbortError")
      )
        setError(errorText(value));
    } finally {
      saving.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function connectFolder(reconnect = false) {
    const value = await (reconnect
      ? reconnectLocalFolder(accountId)
      : chooseLocalFolder(accountId));
    if (!mounted.current || activeAccount.current !== accountId) return;
    setConnection(value);
    if (value.permission !== "granted")
      throw new Error(
        "Folder access was not granted. You can reconnect when you are ready.",
      );
    await save(
      { storage_mode: "local" },
      `Files will save to ${value.folderName}.`,
    );
  }
  async function install() {
    const event = window.__powwowInstallPrompt;
    if (!event) return;
    await event.prompt();
    const choice = await event.userChoice;
    window.__powwowInstallPrompt = undefined;
    setInstallAvailable(false);
    if (choice.outcome === "accepted")
      setNotice("Your browser is installing Powwow. Look for it in your apps.");
  }
  function changeSection(next: SettingsSection) {
    setSection(next);
    setNotice("");
    setError("");
  }

  return (
    <Modal title="Settings" onClose={onClose} wide>
      <div className="account-settings">
        <nav className="account-settings-nav" aria-label="Account settings">
          {(
            [
              { id: "general", label: "General", Icon: Globe2 },
              { id: "storage", label: "Storage", Icon: HardDrive },
              { id: "subscription", label: "Subscription", Icon: Sparkles },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              type="button"
              key={id}
              className={section === id ? "selected" : ""}
              aria-current={section === id ? "page" : undefined}
              disabled={busy}
              onClick={() => changeSection(id)}
            >
              <Icon size={17} />
              <span>{label}</span>
              <ArrowRight className="account-nav-arrow" size={13} />
            </button>
          ))}
        </nav>
        <section
          className="account-settings-content"
          aria-label={`${section[0].toUpperCase()}${section.slice(1)} settings`}
          aria-busy={busy || loading}
        >
          {loading ? (
            <div className="account-settings-loading">
              <LoaderCircle className="spin" size={22} />
              <p>Opening your settings…</p>
            </div>
          ) : !preferences ? (
            <div className="account-settings-loading">
              <p role="alert">{error || "Settings could not be loaded."}</p>
              <button
                className="button"
                onClick={() => setReload((n) => n + 1)}
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              {section === "general" && (
                <>
                  <h3>General</h3>
                  <p className="account-section-intro">
                    Language and app installation.
                  </p>
                  <div className="account-setting-row">
                    <div>
                      <label htmlFor="account-app-language">App language</label>
                      <p>
                        Used for language preferences and learning defaults.
                        Some interface text is currently English.
                      </p>
                    </div>
                    <SelectMenu
                      id="account-app-language"
                      ariaLabel="App language"
                      className="account-language-select"
                      value={language}
                      disabled={busy}
                      onChange={setLanguage}
                      options={APP_LANGUAGES.map(([value, label]) => ({
                        value,
                        label,
                      }))}
                    />
                  </div>
                  <div className="account-setting-actions">
                    <button
                      className="button primary"
                      disabled={busy || language === preferences.app_language}
                      onClick={() =>
                        void act(() =>
                          save(
                            { app_language: language },
                            "Language preference saved.",
                          ),
                        )
                      }
                    >
                      {busy ? (
                        <LoaderCircle className="spin" size={15} />
                      ) : (
                        <Check size={15} />
                      )}
                      Save language
                    </button>
                  </div>
                  <div className="account-install-card">
                    <span className="account-storage-icon">
                      <Laptop size={22} />
                    </span>
                    <div>
                      <h4>Powwow on your desktop</h4>
                      <p>
                        Open it in its own window on your PC or Mac. AI and
                        synced projects still need a connection.
                      </p>
                      {installed ? (
                        <span className="account-connected">
                          <Check size={14} />
                          Running as an app
                        </span>
                      ) : installAvailable ? (
                        <button
                          className="button"
                          disabled={busy}
                          onClick={() => void act(install)}
                        >
                          <Download size={15} />
                          Install Powwow
                        </button>
                      ) : (
                        <p className="account-install-help">
                          Chrome or Edge: use <b>Install Powwow</b> in the
                          browser menu when offered. On a Mac with Safari,
                          choose <b>File → Add to Dock</b>.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
              {section === "storage" && (
                <>
                  <h3>Storage</h3>
                  <p className="account-section-intro">
                    {requiredStorage &&
                    preferences.storage_mode === "unselected"
                      ? "Choose a storage option before uploading or generating files."
                      : "Storage for regular chats. Choose each project’s folder from Project folder in its header."}
                  </p>
                  {folderSupported && (
                    <div
                      className={`account-storage-card ${preferences.storage_mode === "local" ? "is-selected" : ""}`}
                    >
                      <div className="account-storage-card-heading">
                        <span className="account-storage-icon">
                          <FolderOpen size={22} />
                        </span>
                        <div>
                          <h4>On this device</h4>
                          <p>Files from regular chats, in a folder you choose.</p>
                        </div>
                        {preferences.storage_mode === "local" && (
                          <span className="account-selection">
                            <Check size={13} />
                            Selected
                          </span>
                        )}
                      </div>
                      <p>
                        Save uploaded and generated files to your own storage.
                        Your project details and conversations stay synced in
                        your Powwow account.
                      </p>
                      {connection?.kind === "folder" && (
                        <div className="account-folder-status">
                          <FolderOpen size={16} />
                          <span>{connection.folderName}</span>
                          <small>
                            {connection.permission === "granted"
                              ? "Connected on this device"
                              : "Reconnect to save files"}
                          </small>
                        </div>
                      )}
                      {connection?.kind === "downloads" && (
                        <div className="account-folder-status">
                          <Download size={16} />
                          <span>Explicit downloads</span>
                          <small>Save each file yourself</small>
                        </div>
                      )}
                      {folderSupported ? (
                        <div className="account-storage-actions">
                          <button
                            className="button primary"
                            disabled={busy}
                            onClick={() =>
                              void act(() =>
                                connectFolder(
                                  connection?.kind === "folder" &&
                                    connection.permission !== "granted",
                                ),
                              )
                            }
                          >
                            {busy ? (
                              <LoaderCircle className="spin" size={15} />
                            ) : (
                              <FolderOpen size={16} />
                            )}
                            {connection?.kind === "folder" &&
                            connection.permission !== "granted"
                              ? "Reconnect folder"
                              : connection?.kind === "folder"
                                ? "Choose another folder"
                                : "Choose chat folder"}
                          </button>
                          {connection?.kind === "folder" &&
                            connection.permission === "granted" &&
                            preferences.storage_mode !== "local" && (
                              <button
                                className="button"
                                disabled={busy}
                                onClick={() =>
                                  void act(() =>
                                    save(
                                      { storage_mode: "local" },
                                      "Your connected folder is now the default for files.",
                                    ),
                                  )
                                }
                              >
                                Use this folder
                              </button>
                            )}
                        </div>
                      ) : null}
                      <small className="account-storage-scope">
                        AI needs temporary access to files it works on.
                        Local-mode files are staged for{" "}
                        {preferences.local_retention_hours || 24} hours; save
                        them before that window ends. Switching locations does
                        not move existing files.
                      </small>
                    </div>
                  )}
                  <div
                    className={`account-storage-card ${preferences.storage_mode === "cloud" ? "is-selected" : ""}`}
                  >
                    <div className="account-storage-card-heading">
                      <span className="account-storage-icon">
                        <Cloud size={23} />
                      </span>
                      <div>
                        <h4>Powwow Cloud</h4>
                        <p>Your files available across devices.</p>
                      </div>
                      {preferences.storage_mode === "cloud" && (
                        <span className="account-selection">
                          <Check size={13} />
                          Selected
                        </span>
                      )}
                    </div>
                    <p>
                      Keep files in your account’s private cloud storage. Your
                      current allowance is{" "}
                      {fileSize(preferences.storage_quota_bytes)}.
                    </p>
                    <div className="account-storage-meter">
                      <div>
                        <span>
                          {fileSize(preferences.storage_used_bytes)} used
                        </span>
                        <span>
                          {fileSize(preferences.storage_quota_bytes)} available
                          in your plan
                        </span>
                      </div>
                      <progress
                        value={Math.min(
                          preferences.storage_used_bytes,
                          preferences.storage_quota_bytes,
                        )}
                        max={Math.max(1, preferences.storage_quota_bytes)}
                        aria-label="Cloud storage usage"
                      />
                    </div>
                    <div className="account-storage-actions">
                      <button
                        className="button"
                        disabled={busy || preferences.storage_mode === "cloud"}
                        onClick={() =>
                          void act(() =>
                            save(
                              { storage_mode: "cloud" },
                              "New files will use Powwow Cloud.",
                            ),
                          )
                        }
                      >
                        <Cloud size={15} />
                        Use Powwow Cloud
                      </button>
                      <button
                        className="account-text-button"
                        onClick={() => changeSection("subscription")}
                      >
                        Explore storage plans
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                  {preferences.storage_staged_bytes > 0 && (
                    <p className="account-storage-scope">
                      Temporary processing files:{" "}
                      {fileSize(preferences.storage_staged_bytes)}. This is
                      separate from permanent cloud usage.
                    </p>
                  )}
                </>
              )}
              {section === "subscription" && (
                <>
                  <h3>Subscription</h3>
                  <p className="account-section-intro">
                    Your current plan is{" "}
                    <b>{preferences.plan === "powwow" ? "Powwow" : "Free"}</b>.
                    Paid subscriptions are being prepared; checkout is not
                    connected yet.
                  </p>
                  <div className="account-plan-grid">
                    <article className="account-plan">
                      <div className="account-plan-label">
                        Free
                        {preferences.plan === "free" && (
                          <span>Current plan</span>
                        )}
                      </div>
                      <p className="account-plan-price">
                        $0<span>/ month</span>
                      </p>
                      <p>Start exploring your ideas.</p>
                      <ul>
                        <li>
                          <Check size={14} />
                          Project tools and guided setup
                        </li>
                        <li>
                          <Check size={14} />
                          Save files to your device
                        </li>
                        <li>
                          <Check size={14} />
                          Available workspace AI tools
                        </li>
                      </ul>
                      <button className="button" disabled>
                        {preferences.plan === "free"
                          ? "Your current plan"
                          : "Free plan"}
                      </button>
                    </article>
                    <article className="account-plan account-plan-featured">
                      <div className="account-plan-label">
                        Powwow<span>Coming soon</span>
                      </div>
                      <p className="account-plan-price">
                        $20<span>/ month</span>
                      </p>
                      <p>A subscription for ongoing creation.</p>
                      <ul>
                        <li>
                          <Check size={14} />
                          Everything in Free
                        </li>
                        <li>
                          <Check size={14} />
                          Monthly creator subscription
                        </li>
                        <li>
                          <Check size={14} />
                          Usage details before launch
                        </li>
                      </ul>
                      <button className="button primary" disabled>
                        Checkout not available
                      </button>
                    </article>
                  </div>
                  <article className="account-cloud-plan">
                    <span className="account-storage-icon">
                      <Cloud size={23} />
                    </span>
                    <div>
                      <div className="account-plan-label">
                        Powwow Cloud<span>Proposed add-on</span>
                      </div>
                      <p>
                        <b>100 GB</b> of space for your creative files.
                      </p>
                      <small>
                        Planned capacity, separate from your current storage
                        allowance. Availability and final terms will be
                        confirmed before purchase.
                      </small>
                    </div>
                    <div className="account-cloud-price">
                      <b>+$10</b>
                      <span>/ month</span>
                    </div>
                  </article>
                  <p className="account-billing-note">
                    Nothing on this screen starts a payment or changes your
                    subscription. Current storage limits remain in effect.
                  </p>
                </>
              )}
              {error && (
                <div className="account-settings-feedback error" role="alert">
                  <p>{error}</p>
                  <button
                    aria-label="Dismiss settings error"
                    onClick={() => setError("")}
                  >
                    <X size={15} />
                  </button>
                </div>
              )}
              {notice && (
                <div className="account-settings-feedback" role="status">
                  <Check size={16} />
                  <p>{notice}</p>
                </div>
              )}
              <footer className="account-settings-footer">
                <span>
                  <RefreshCw size={12} />
                  Preferences sync with your account
                </span>
                <button className="button" disabled={busy} onClick={onClose}>
                  Done
                </button>
              </footer>
            </>
          )}
        </section>
      </div>
    </Modal>
  );
}
