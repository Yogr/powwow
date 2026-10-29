import { useEffect, useRef, useState } from "react";
import { FolderOpen, LoaderCircle } from "lucide-react";
import { Modal } from "./components";
import {
  chooseLocalFolder,
  directoryPickerSupported,
  getLocalStorageConnection,
  reconnectLocalFolder,
} from "./localFiles";
import type { LocalStorageConnection } from "./localFiles";

type FolderProps = {
  accountId: string;
  projectId: string;
  onChanged: () => void | Promise<void>;
};

export default function ProjectFolder({
  projectName,
  onClose,
  ...props
}: FolderProps & { projectName: string; onClose: () => void }) {
  return (
    <Modal title="Project folder" onClose={onClose}>
      <div className="project-folder-content">
        <h3>{projectName}</h3>
        <ProjectFolderControl {...props} />
      </div>
    </Modal>
  );
}

export function ProjectFolderControl({
  accountId,
  projectId,
  onChanged,
}: FolderProps) {
  const [connection, setConnection] = useState<LocalStorageConnection>();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const flight = useRef(false);
  useEffect(() => {
    let active = true;
    void getLocalStorageConnection(accountId, projectId)
      .then((value) => {
        if (active) setConnection(value);
      })
      .catch((value) => {
        if (active) setError(value.message);
      });
    return () => {
      active = false;
    };
  }, [accountId, projectId]);
  async function connect(reconnect = false) {
    if (flight.current) return;
    flight.current = true;
    setBusy(true);
    setError("");
    try {
      const value = await (reconnect
        ? reconnectLocalFolder(accountId, projectId)
        : chooseLocalFolder(accountId, projectId));
      setConnection(value);
      if (value.permission !== "granted")
        setError("Allow folder access to save this project's files.");
      else await onChanged();
    } catch (value) {
      if ((value as Error).name !== "AbortError")
        setError((value as Error).message);
    } finally {
      flight.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="project-folder-control" aria-label="Project folder">
      <span className="project-folder-label">Project folder</span>
      <div className="account-folder-status">
        <FolderOpen size={20} />
        <span>{connection?.folderName || "No folder selected"}</span>
      </div>
      <div className="project-folder-actions">
        {connection?.kind === "folder" &&
          connection.permission !== "granted" && (
            <button
              type="button"
              className="button"
              disabled={busy}
              onClick={() => void connect(true)}
            >
              Reconnect folder
            </button>
          )}
        <button
          type="button"
          className="button"
          disabled={busy}
          onClick={() => {
            if (!directoryPickerSupported())
              setError("Folder access requires Chrome or Edge.");
            else void connect();
          }}
        >
          {busy ? (
            <LoaderCircle size={16} className="spin" />
          ) : (
            <FolderOpen size={16} />
          )}
          {connection?.kind === "folder"
            ? "Choose another folder"
            : "Choose project folder"}
        </button>
      </div>
      {error && (
        <p className="project-storage-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
