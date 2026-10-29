import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Cloud,
  FolderOpen,
  HardDrive,
  LoaderCircle,
} from "lucide-react";
import { Modal } from "./components";
import { post } from "./api";
import type { Project } from "./api";
import { loadAccountPreferences } from "./accountPreferences";
import type { AccountPreferences } from "./accountPreferences";
import {
  pickLocalFolder,
  connectLocalFolder,
  directoryPickerSupported,
} from "./localFiles";
import type { LocalDirectoryHandle } from "./localFiles";
import "./project-storage.css";
import { isInstalledApp } from "./pwa";

export const storageSize = (value: number) =>
  value >= 1024 ** 3
    ? `${(value / 1024 ** 3).toFixed(1).replace(/\.0$/, "")} GB`
    : `${Math.round(value / 1024 ** 2)} MB`;

export default function NewProjectDialog({
  accountId,
  onClose,
  onCreated,
  onUpgrade,
  anchor,
  organizationId,
}: {
  accountId: string;
  onClose: () => void;
  onCreated: (project: Project) => void;
  onUpgrade: () => void;
  anchor: HTMLElement | null;
  organizationId?: string;
}) {
  const localSupported = !organizationId && directoryPickerSupported();
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"local" | "cloud">(
    localSupported ? "local" : "cloud",
  );
  const [folder, setFolder] = useState<LocalDirectoryHandle>();
  const created = useRef<Project | null>(null);
  const [preferences, setPreferences] = useState<AccountPreferences>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const active = useRef(true),
    flight = useRef(false);
  useEffect(() => {
    active.current = true;
    const abort = new AbortController();
    void loadAccountPreferences(accountId, abort.signal)
      .then((value) => {
        if (!abort.signal.aborted) setPreferences(value);
      })
      .catch((error) => {
        if (!abort.signal.aborted) setError(error.message);
      });
    return () => {
      active.current = false;
      abort.abort();
    };
  }, [accountId, localSupported]);
  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || flight.current) return;
    flight.current = true;
    setBusy(true);
    setError("");
    try {
      // Keep the picker in the click's activation window, before any network work.
      let selectedFolder = folder;
      if (
        localSupported &&
        (mode === "local" || isInstalledApp()) &&
        !selectedFolder
      ) {
        selectedFolder = await pickLocalFolder();
        if (!active.current) return;
        setFolder(selectedFolder);
      }
      const project =
        created.current ||
        (await post<Project>("/v1/projects", {
          name: name.trim(),
          context_mode: "project",
          storage_mode: mode,
          organization_id: organizationId,
        }));
      created.current = project;
      if (selectedFolder)
        await connectLocalFolder(accountId, project.id, selectedFolder);
      if (active.current) onCreated(project);
    } catch (error) {
      if (
        active.current &&
        !(error instanceof DOMException && error.name === "AbortError")
      )
        setError(
          error instanceof Error
            ? error.message
            : "Project could not be created.",
        );
    } finally {
      flight.current = false;
      if (active.current) setBusy(false);
    }
  }
  const nearLimit =
    !organizationId && preferences &&
    preferences.storage_used_bytes +
      (preferences.storage_reserved_bytes || 0) >=
      preferences.storage_quota_bytes * 0.9;
  return (
    <Modal
      title="Project Name"
      compact
      anchor={anchor}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form
        className="new-project-form"
        onSubmit={(event) => void create(event)}
      >
        <input
          autoFocus
          aria-label="Project Name"
          placeholder="Name your project"
          required
          maxLength={160}
          value={name}
          disabled={busy}
          onChange={(event) => setName(event.target.value)}
        />
        <fieldset disabled={busy}>
          <legend>Storage options</legend>
          <div className="project-storage-options">
            {localSupported && (
              <label className={mode === "local" ? "selected" : ""}>
                <input
                  type="radio"
                  name="project-storage"
                  value="local"
                  checked={mode === "local"}
                  onChange={() => setMode("local")}
                />
                <HardDrive size={19} />
                <span>Local</span>
                {mode === "local" && <Check size={14} />}
              </label>
            )}
            <label className={mode === "cloud" ? "selected" : ""}>
              <input
                type="radio"
                name="project-storage"
                value="cloud"
                checked={mode === "cloud"}
                onChange={() => setMode("cloud")}
              />
              <Cloud size={19} />
              <span>Cloud</span>
              {mode === "cloud" && <Check size={14} />}
            </label>
          </div>
        </fieldset>
        {localSupported && (mode === "local" || isInstalledApp()) && (
          <button
            type="button"
            className="button"
            disabled={busy}
            onClick={() => {
              if (flight.current) return;
              flight.current = true;
              setBusy(true);
              setError("");
              void pickLocalFolder()
                .then(setFolder)
                .catch((value) => {
                  if (value.name !== "AbortError") setError(value.message);
                })
                .finally(() => {
                  flight.current = false;
                  setBusy(false);
                });
            }}
          >
            <FolderOpen size={14} />
            {folder ? `Folder: ${folder.name}` : "Choose project folder"}
          </button>
        )}
        {mode === "cloud" && !organizationId && (
          <div className="project-cloud-limit">
            <p>
              <AlertTriangle size={15} />
              {preferences
                ? `${storageSize(preferences.storage_used_bytes)} of ${storageSize(preferences.storage_quota_bytes)} cloud storage used`
                : "Checking your cloud allowance…"}
            </p>
            {preferences && (preferences.plan === "free" || nearLimit) && (
              <button type="button" onClick={onUpgrade}>
                Upgrade your storage
                <ArrowUpRight size={14} />
              </button>
            )}
          </div>
        )}
        {error && (
          <p className="project-storage-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button
            type="button"
            className="button subtle"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="button primary" disabled={busy || !name.trim()}>
            {busy && <LoaderCircle size={15} className="spin" />}Create project
          </button>
        </div>
      </form>
    </Modal>
  );
}
