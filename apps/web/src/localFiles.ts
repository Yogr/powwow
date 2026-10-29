type PermissionMode = { mode: "read" | "readwrite" };
interface LocalFileHandle {
  kind: "file";
  name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<{
    write(data: Blob | string): Promise<void>;
    close(): Promise<void>;
    abort?(): Promise<void>;
  }>;
}
export interface LocalDirectoryHandle {
  kind: "directory";
  name: string;
  isSameEntry?(other: LocalDirectoryHandle): Promise<boolean>;
  queryPermission(options: PermissionMode): Promise<PermissionState>;
  requestPermission(options: PermissionMode): Promise<PermissionState>;
  getDirectoryHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<LocalDirectoryHandle>;
  getFileHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<LocalFileHandle>;
}
type FolderRecord = {
  accountId: string;
  projectId?: string;
  kind: "folder" | "downloads";
  handle?: LocalDirectoryHandle;
  updatedAt: string;
};
type SavedFile = {
  accountId: string;
  artifactId: string;
  projectId: string;
  name: string;
  relativePath: string;
  sha256: string;
  size_bytes: number;
  savedAt: string;
  root: LocalDirectoryHandle;
};
export type LocalArtifact = {
  id: string;
  project_id?: string | null;
  name: string;
  mime_type?: string;
  kind?: string;
  sha256: string;
  size_bytes: number;
};
export type LocalSaveReceipt = {
  relativePath: string;
  sha256: string;
  size_bytes: number;
};
export type LocalStorageConnection = {
  kind: "unselected" | "folder" | "downloads";
  folderName: string | null;
  permission: PermissionState | "unsupported";
  supported: boolean;
};

const DB_NAME = "powwow-local-files-v1";
const FOLDERS = "folders";
const FILES = "files";

function accountKey(accountId: string): string {
  if (!accountId.trim())
    throw new Error("Sign in before choosing a storage location.");
  return accountId;
}

function folderKey(accountId: string, projectId?: string): string {
  return projectId
    ? JSON.stringify([accountKey(accountId), projectId])
    : accountKey(accountId);
}

async function database(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined")
    throw new Error(
      "This browser cannot remember a local folder. Use explicit file downloads instead.",
    );
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, 1);
    open.onupgradeneeded = () => {
      if (!open.result.objectStoreNames.contains(FOLDERS))
        open.result.createObjectStore(FOLDERS);
      if (!open.result.objectStoreNames.contains(FILES))
        open.result.createObjectStore(FILES);
    };
    open.onsuccess = () => resolve(open.result);
    open.onerror = () =>
      reject(
        new Error(
          "Your browser could not open local storage. Check its site-storage settings.",
        ),
      );
    open.onblocked = () =>
      reject(
        new Error(
          "Close other Powwow tabs and try connecting your folder again.",
        ),
      );
  });
}

async function stored<T>(
  name: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest,
): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(name, mode);
    let result: T;
    let request: IDBRequest;
    try {
      request = operation(transaction.objectStore(name));
    } catch (error) {
      db.close();
      reject(error);
      return;
    }
    request.onsuccess = () => {
      result = request.result as T;
    };
    transaction.oncomplete = () => {
      db.close();
      resolve(result);
    };
    transaction.onerror = () => {
      db.close();
      reject(
        transaction.error ||
          new Error("Your browser could not save the local folder connection."),
      );
    };
    transaction.onabort = () => {
      db.close();
      reject(
        transaction.error ||
          new Error("The local storage operation was interrupted."),
      );
    };
  });
}

export function directoryPickerSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    window.top === window.self &&
    typeof (window as unknown as { showDirectoryPicker?: unknown })
      .showDirectoryPicker === "function"
  );
}

export async function getLocalStorageConnection(
  accountId: string,
  projectId?: string,
): Promise<LocalStorageConnection> {
  const record = await stored<FolderRecord | undefined>(
    FOLDERS,
    "readonly",
    (store) => store.get(folderKey(accountId, projectId)),
  );
  const supported = directoryPickerSupported();
  if (!record)
    return {
      kind: "unselected",
      folderName: null,
      permission: supported ? "prompt" : "unsupported",
      supported,
    };
  if (record.kind === "downloads")
    return {
      kind: "downloads",
      folderName: null,
      permission: "unsupported",
      supported,
    };
  const permission = record.handle
    ? await record.handle
        .queryPermission({ mode: "readwrite" })
        .catch(() => "prompt" as const)
    : "prompt";
  return {
    kind: "folder",
    folderName: record.handle?.name || null,
    permission,
    supported,
  };
}

/** Must be called directly from a user click: browsers require user activation. */
export async function chooseLocalFolder(
  accountId: string,
  projectId?: string,
): Promise<LocalStorageConnection> {
  accountKey(accountId);
  const handle = await pickLocalFolder();
  return connectLocalFolder(accountId, projectId, handle);
}

export async function pickLocalFolder(): Promise<LocalDirectoryHandle> {
  if (!directoryPickerSupported())
    throw new Error(
      "Automatic folder saving needs a browser with local-folder access, such as Chrome or Edge. You can use explicit downloads in this browser.",
    );
  const picker = (
    window as unknown as {
      showDirectoryPicker(options: {
        id: string;
        mode: "readwrite";
      }): Promise<LocalDirectoryHandle>;
    }
  ).showDirectoryPicker;
  const handle = await picker.call(window, {
    id: "powwow-projects",
    mode: "readwrite",
  });
  if ((await handle.queryPermission({ mode: "readwrite" })) !== "granted")
    throw new Error(
      "Allow access to the selected folder before saving files there.",
    );
  return handle;
}

export async function connectLocalFolder(
  accountId: string,
  projectId: string | undefined,
  handle: LocalDirectoryHandle,
): Promise<LocalStorageConnection> {
  if (projectId)
    await serializeWrite(() =>
      claimProjectFolder(handle, accountId, projectId),
    );
  await stored(FOLDERS, "readwrite", (store) =>
    store.put(
      {
        accountId,
        projectId,
        kind: "folder",
        handle,
        updatedAt: new Date().toISOString(),
      } satisfies FolderRecord,
      folderKey(accountId, projectId),
    ),
  );
  return {
    kind: "folder",
    folderName: handle.name,
    permission: "granted",
    supported: true,
  };
}

/** Permission prompts are intentional user actions, never background side effects. */
export async function reconnectLocalFolder(
  accountId: string,
  projectId?: string,
): Promise<LocalStorageConnection> {
  const record = await stored<FolderRecord | undefined>(
    FOLDERS,
    "readonly",
    (store) => store.get(folderKey(accountId, projectId)),
  );
  if (!record?.handle) return chooseLocalFolder(accountId, projectId);
  const permission = await record.handle.requestPermission({
    mode: "readwrite",
  });
  return {
    kind: "folder",
    folderName: record.handle.name,
    permission,
    supported: directoryPickerSupported(),
  };
}

export async function chooseDownloadStorage(
  accountId: string,
): Promise<LocalStorageConnection> {
  await stored(FOLDERS, "readwrite", (store) =>
    store.put(
      {
        accountId,
        kind: "downloads",
        updatedAt: new Date().toISOString(),
      } satisfies FolderRecord,
      accountKey(accountId),
    ),
  );
  return {
    kind: "downloads",
    folderName: null,
    permission: "unsupported",
    supported: directoryPickerSupported(),
  };
}

export async function forgetLocalFolder(accountId: string): Promise<void> {
  await stored(FOLDERS, "readwrite", (store) =>
    store.delete(accountKey(accountId)),
  );
}

function safePart(value: string, fallback = "file"): string {
  const clean = value
    .normalize("NFKC")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[. ]+$/g, "")
    .slice(0, 120)
    .trim();
  if (!clean || clean === "." || clean === "..") return fallback;
  return /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(clean)
    ? `_${clean}`
    : clean;
}

async function digest(blob: Blob): Promise<string> {
  const value = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(value), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function rootFolder(
  accountId: string,
  projectId?: string,
): Promise<LocalDirectoryHandle> {
  const record = await stored<FolderRecord | undefined>(
    FOLDERS,
    "readonly",
    (store) => store.get(folderKey(accountId, projectId)),
  );
  if (record?.kind === "downloads")
    throw new Error(
      "This account uses explicit downloads. Download this file to keep it on your device.",
    );
  if (!record?.handle)
    throw new Error(
      "Choose a folder using Project folder in this project's header.",
    );
  if (
    (await record.handle.queryPermission({ mode: "readwrite" })) !== "granted"
  )
    throw new Error(
      "Reconnect this project's folder using Project folder before saving files.",
    );
  return record.handle;
}

const PROJECT_PARTS = [".powwow"];

// Serialize across tabs as well as within this module. File System Access has
// no create-exclusive primitive, so every Powwow writer uses the same lock.
let localWriteQueue: Promise<unknown> = Promise.resolve();
async function serializeWrite<T>(operation: () => Promise<T>): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks)
    return navigator.locks.request("powwow-local-files", operation);
  const next = localWriteQueue.then(operation, operation);
  localWriteQueue = next.catch(() => {});
  return next;
}

function assetFolder(artifact: LocalArtifact, blob?: Blob): string {
  const mime = (artifact.mime_type || blob?.type || "").toLowerCase();
  const extension = artifact.name.split(".").at(-1)?.toLowerCase() || "";
  if (
    mime.startsWith("image/") ||
    /^(png|jpe?g|webp|gif|svg|avif|bmp|tiff?|exr|hdr)$/.test(extension)
  )
    return "images";
  if (
    mime.startsWith("model/") ||
    /^(glb|gltf|obj|fbx|stl|blend|usd[azc]?|ply)$/.test(extension)
  )
    return "models";
  if (
    mime.startsWith("video/") ||
    /^(mp4|webm|mov|mkv|avi|m4v)$/.test(extension)
  )
    return "videos";
  if (
    mime.startsWith("audio/") ||
    /^(wav|mp3|ogg|flac|m4a|aac|aiff?|mid|midi)$/.test(extension)
  )
    return "audio";
  if (mime.startsWith("font/") || /^(woff2?|ttf|otf)$/.test(extension))
    return "fonts";
  if (
    mime.startsWith("text/") ||
    /^(pdf|docx?|odt|rtf|txt|md|json|csv|xlsx?|pptx?|html?)$/.test(extension)
  )
    return "documents";
  return "other";
}

async function existingFile(
  directory: LocalDirectoryHandle,
  name: string,
): Promise<File | null> {
  try {
    return await (await directory.getFileHandle(name)).getFile();
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotFoundError")
      return null;
    throw error;
  }
}

type ProjectExport = {
  format: "powwow-project-export";
  version: number;
  account_id: string;
  project_id: string;
  exported_at: string;
  project: unknown;
};

async function claimProjectFolder(
  root: LocalDirectoryHandle,
  accountId: string,
  projectId: string,
): Promise<LocalDirectoryHandle> {
  accountKey(accountId);
  const directory = await directoryAt(root, PROJECT_PARTS, true);
  const file = await existingFile(directory, "project.json");
  if (file) {
    let existing: Partial<ProjectExport> | null = null;
    try {
      existing = JSON.parse(await file.text());
    } catch {
      /* Preserve unknown files. */
    }
    if (
      existing?.format !== "powwow-project-export" ||
      existing.account_id !== accountId ||
      existing.project_id !== projectId
    )
      throw new Error(
        "This folder already contains another project's settings. Choose a separate folder for this project.",
      );
  } else {
    await writeFile(
      directory,
      "project.json",
      JSON.stringify(
        {
          format: "powwow-project-export",
          version: 2,
          account_id: accountId,
          project_id: projectId,
          exported_at: new Date().toISOString(),
          project: null,
        } satisfies ProjectExport,
        null,
        2,
      ),
    );
  }
  return directory;
}

async function availableFilename(
  directory: LocalDirectoryHandle,
  name: string,
  sha256: string,
  size: number,
): Promise<{ name: string; existing: File | null }> {
  const safe = safePart(name);
  const dot = safe.lastIndexOf(".");
  const stem = dot > 0 ? safe.slice(0, dot) : safe;
  const extension = dot > 0 ? safe.slice(dot) : "";
  for (let index = 1; index <= 10000; index++) {
    const candidate = index === 1 ? safe : `${stem} (${index})${extension}`;
    let file: File | null;
    try {
      file = await existingFile(directory, candidate);
    } catch (error) {
      // A directory with this name is also a collision, never a replacement.
      if (error instanceof DOMException && error.name === "TypeMismatchError")
        continue;
      throw error;
    }
    if (!file || (file.size === size && (await digest(file)) === sha256))
      return { name: candidate, existing: file };
  }
  throw new Error(
    "Too many files have this name. Rename the asset before saving it.",
  );
}

async function directoryAt(
  root: LocalDirectoryHandle,
  parts: string[],
  create: boolean,
): Promise<LocalDirectoryHandle> {
  let directory = root;
  for (const part of parts)
    directory = await directory.getDirectoryHandle(part, { create });
  return directory;
}

async function writeFile(
  directory: LocalDirectoryHandle,
  name: string,
  value: Blob | string,
): Promise<LocalFileHandle> {
  const file = await directory.getFileHandle(name, { create: true });
  const stream = await file.createWritable();
  try {
    await stream.write(value);
    await stream.close();
  } catch (error) {
    await stream.abort?.().catch(() => {});
    throw error;
  }
  return file;
}

/** Returns a receipt only after re-reading and verifying the completed disk write. */
export async function saveLocalArtifact(
  accountId: string,
  artifact: LocalArtifact,
  blob: Blob,
): Promise<LocalSaveReceipt> {
  if (blob.size !== artifact.size_bytes)
    throw new Error(
      "The downloaded file is incomplete. Download it again before saving locally.",
    );
  const sha256 = await digest(blob);
  if (!artifact.sha256 || sha256 !== artifact.sha256.toLowerCase())
    throw new Error(
      "The downloaded file did not match its saved fingerprint. Please try again.",
    );
  return serializeWrite(async () => {
    const root = await rootFolder(accountId, artifact.project_id || undefined);
    await claimProjectFolder(
      root,
      accountId,
      artifact.project_id || "workspace",
    );
    const parts = ["src", "assets", assetFolder(artifact, blob)];
    const directory = await directoryAt(root, parts, true);
    const candidate = await availableFilename(
      directory,
      artifact.name,
      sha256,
      blob.size,
    );
    const written =
      candidate.existing ||
      (await (await writeFile(directory, candidate.name, blob)).getFile());
    if (written.size !== blob.size || (await digest(written)) !== sha256)
      throw new Error(
        "The local file could not be verified. Keep the server copy and try saving again.",
      );
    const relativePath = [...parts, candidate.name].join("/");
    const record: SavedFile = {
      accountId,
      artifactId: artifact.id,
      projectId: artifact.project_id || "workspace",
      name: artifact.name,
      relativePath,
      sha256,
      size_bytes: blob.size,
      savedAt: new Date().toISOString(),
      root,
    };
    await stored(FILES, "readwrite", (store) =>
      store.put(record, `${accountKey(accountId)}:${artifact.id}`),
    );
    return { relativePath, sha256, size_bytes: blob.size };
  });
}

/** Copy verified legacy files (or a prior folder's files) without deleting originals. */
export async function migrateLocalArtifact(
  accountId: string,
  artifact: LocalArtifact,
): Promise<LocalSaveReceipt> {
  const record = await stored<SavedFile | undefined>(
    FILES,
    "readonly",
    (store) => store.get(`${accountKey(accountId)}:${artifact.id}`),
  );
  const file = await readLocalArtifact(accountId, artifact.id);
  const root = await rootFolder(accountId, artifact.project_id || undefined);
  if (
    record &&
    record.projectId === (artifact.project_id || "workspace") &&
    record.name === artifact.name &&
    record.sha256 === artifact.sha256.toLowerCase() &&
    record.size_bytes === artifact.size_bytes &&
    record.relativePath.startsWith(
      `src/assets/${assetFolder(artifact, file)}/`,
    ) &&
    (await root.isSameEntry?.(record.root))
  )
    return {
      relativePath: record.relativePath,
      sha256: record.sha256,
      size_bytes: record.size_bytes,
    };
  // The receipt switches only once the new copy has been read back and verified.
  return saveLocalArtifact(accountId, artifact, file);
}

export async function readLocalArtifact(
  accountId: string,
  artifactId: string,
): Promise<File> {
  const record = await stored<SavedFile | undefined>(
    FILES,
    "readonly",
    (store) => store.get(`${accountKey(accountId)}:${artifactId}`),
  );
  if (!record || record.accountId !== accountId)
    throw new Error(
      "This file has not been saved to a folder for this account on this device.",
    );
  if ((await record.root.queryPermission({ mode: "read" })) !== "granted")
    throw new Error(
      "Reconnect the folder containing this file using Project folder.",
    );
  const parts = record.relativePath.split("/");
  const filename = parts.pop()!;
  const directory = await directoryAt(record.root, parts, false);
  const file = await (await directory.getFileHandle(filename)).getFile();
  if (file.size !== record.size_bytes || (await digest(file)) !== record.sha256)
    throw new Error(
      "This local file has changed since it was saved. Restore the original file, or download the original while it is still available.",
    );
  return file;
}

export async function listLocalFiles(
  accountId: string,
  projectId?: string,
): Promise<Omit<SavedFile, "root">[]> {
  const records = await stored<SavedFile[]>(FILES, "readonly", (store) =>
    store.getAll(),
  );
  return records
    .filter(
      (record) =>
        record.accountId === accountKey(accountId) &&
        (!projectId || record.projectId === projectId),
    )
    .map(({ root: _root, ...record }) => record);
}

export async function saveLocalProject(
  accountId: string,
  projectId: string,
  metadata: unknown,
): Promise<string> {
  return serializeWrite(async () => {
    const root = await rootFolder(accountId, projectId);
    const directory = await claimProjectFolder(root, accountId, projectId);
    await writeFile(
      directory,
      "project.json",
      JSON.stringify(
        {
          format: "powwow-project-export",
          version: 2,
          account_id: accountId,
          project_id: projectId,
          exported_at: new Date().toISOString(),
          project: metadata,
        },
        null,
        2,
      ),
    );
    const workspace = (
      metadata as {
        workspace?: {
          brief?: string;
          records?: Record<
            string,
            { title: string; fields: Record<string, string> }[]
          >;
        };
      } | null
    )?.workspace;
    if (workspace) {
      const sections = ["# Project memory", workspace.brief || ""];
      for (const [component, records] of Object.entries(
        workspace.records || {},
      )) {
        if (!records.length) continue;
        sections.push(`## ${component.replaceAll("-", " ")}`);
        for (const record of records) {
          sections.push(`### ${record.title}`);
          for (const [field, value] of Object.entries(record.fields))
            if (value)
              sections.push(`**${field.replaceAll("_", " ")}**\n\n${value}`);
        }
      }
      await writeFile(
        directory,
        "project-memory.md",
        sections.join("\n\n") + "\n",
      );
    }
    return [...PROJECT_PARTS, "project.json"].join("/");
  });
}

/** Explicit download fallback; initiating a download does not prove a disk save. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = safePart(filename);
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}
