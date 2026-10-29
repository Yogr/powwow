import { useEffect, useRef, useState } from "react";
import { authenticatedBlob, post } from "./api";
import type { Artifact, Project } from "./api";
import { storageReadiness } from "./accountPreferences";
import type { AccountPreferences } from "./accountPreferences";
import {
  listLocalFiles,
  migrateLocalArtifact,
  saveLocalArtifact,
  saveLocalProject,
  getLocalStorageConnection,
} from "./localFiles";

/** A local receipt is sent only after the file has been written and verified. */
export function useLocalPersistence({
  accountId,
  preferences,
  artifacts,
  project,
  metadata,
  enabled,
  mirrorCloud = false,
}: {
  accountId: string;
  preferences: AccountPreferences | null;
  artifacts: Artifact[];
  project?: Project;
  metadata: unknown;
  enabled: boolean;
  mirrorCloud?: boolean;
}) {
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState({
    accountId: "",
    projectId: "",
    ready: false,
    manualDownloads: false,
    reason: "",
    folderReady: false,
    mode: "unselected" as string,
  });
  const [problem, setProblem] = useState("");
  const attempted = useRef(new Set<string>());
  const flights = useRef(new Set<string>());
  const mounted = useRef(true);
  const allowed = useRef(false);
  const currentAccount = useRef(accountId);
  const currentProject = useRef(project?.id);
  currentProject.current = project?.id;
  currentAccount.current = accountId;
  allowed.current =
    enabled &&
    status.folderReady &&
    status.accountId === accountId &&
    status.projectId === (project?.id || "") &&
    !status.manualDownloads;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);
  useEffect(() => {
    attempted.current.clear();
    setProblem("");
  }, [accountId, project?.id, preferences, revision]);
  useEffect(() => {
    let active = true;
    setStatus({
      accountId,
      projectId: project?.id || "",
      ready: false,
      manualDownloads: false,
      reason: "",
      folderReady: false,
      mode: "unselected",
    });
    if (enabled && preferences)
      void Promise.all([
        storageReadiness(accountId, preferences, project?.id),
        getLocalStorageConnection(accountId, project?.id).catch(() => null),
      ])
        .then(([value, folder]) => {
          if (active)
            setStatus({
              accountId,
              projectId: project?.id || "",
              ready: value.ready,
              manualDownloads: Boolean(value.manualDownloads),
              reason: value.reason || "",
              folderReady:
                folder?.kind === "folder" && folder.permission === "granted",
              mode: preferences.storage_mode,
            });
        })
        .catch((error) => {
          if (active) setProblem(error.message);
        });
    return () => {
      active = false;
    };
  }, [accountId, project?.id, enabled, preferences, revision]);

  useEffect(() => {
    if (
      !enabled ||
      !status.folderReady ||
      status.accountId !== accountId ||
      status.projectId !== (project?.id || "") ||
      status.manualDownloads
    )
      return;
    const active = () =>
      mounted.current &&
      currentAccount.current === accountId &&
      currentProject.current === project?.id &&
      allowed.current;
    void (async () => {
      const saved = new Set(
        (await listLocalFiles(accountId)).map((file) => file.artifactId),
      );
      for (const artifact of artifacts.filter(
        (item) =>
          item.project_id === (project?.id || null) &&
          (item.storage_mode === "local" ||
            (mirrorCloud && item.storage_mode === "cloud")),
      )) {
        const key = `${accountId}:${artifact.id}`;
        if (!active()) return;
        if (attempted.current.has(key) || flights.current.has(key)) continue;
        attempted.current.add(key);
        flights.current.add(key);
        try {
          // A receipt on another device is not proof that this device has the file.
          const localReceipt = saved.has(artifact.id)
            ? await migrateLocalArtifact(accountId, artifact).catch((error) => {
                if (!artifact.available) throw error;
                return null;
              })
            : null;
          if (!localReceipt) {
            if (!artifact.available)
              throw new Error(
                `${artifact.name} is no longer staged. Open the folder where it was originally saved.`,
              );
            const blob = await authenticatedBlob(artifact.download_url);
            if (!active()) {
              attempted.current.delete(key);
              return;
            }
            const receipt = await saveLocalArtifact(accountId, artifact, blob);
            if (!active()) {
              attempted.current.delete(key);
              return;
            }
            if (artifact.storage_mode === "local")
              await post(`/v1/artifacts/${artifact.id}/local-save`, {
                sha256: receipt.sha256,
                size_bytes: receipt.size_bytes,
              });
          } else if (
            artifact.storage_mode === "local" &&
            !artifact.local_saved_at &&
            artifact.available
          ) {
            // Recover a receipt lost after a successful file write.
            if (active())
              await post(`/v1/artifacts/${artifact.id}/local-save`, {
                sha256: localReceipt.sha256,
                size_bytes: localReceipt.size_bytes,
              });
          }
        } catch (error) {
          if (active())
            setProblem(
              error instanceof Error
                ? error.message
                : "A file could not be saved to your folder.",
            );
        } finally {
          flights.current.delete(key);
        }
      }
    })().catch((error) => {
      if (active()) setProblem(error.message);
    });
  }, [
    accountId,
    project?.id,
    enabled,
    artifacts,
    preferences,
    status,
    revision,
    mirrorCloud,
  ]);

  const serialized = JSON.stringify(metadata);
  useEffect(() => {
    if (
      !enabled ||
      !project ||
      (preferences?.storage_mode !== "local" && !mirrorCloud) ||
      !status.folderReady ||
      status.accountId !== accountId ||
      status.projectId !== (project?.id || "") ||
      status.manualDownloads
    )
      return;
    const timer = setTimeout(() => {
      if (
        currentAccount.current !== accountId ||
        currentProject.current !== project.id
      )
        return;
      void saveLocalProject(
        accountId,
        project.id,
        JSON.parse(serialized),
      ).catch((error) => {
        if (
          currentAccount.current === accountId &&
          currentProject.current === project.id
        )
          setProblem(error.message);
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [
    accountId,
    enabled,
    project?.id,
    preferences,
    status,
    serialized,
    revision,
    mirrorCloud,
  ]);

  return {
    ready:
      status.accountId === accountId &&
      status.projectId === (project?.id || "") &&
      status.mode === preferences?.storage_mode &&
      status.ready,
    manualDownloads: status.manualDownloads,
    problem,
    retry: () => setRevision((value) => value + 1),
  };
}
