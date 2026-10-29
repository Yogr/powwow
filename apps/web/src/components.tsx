import { lazy, Suspense, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  X,
  Check,
  LoaderCircle,
  AlertCircle,
  Box,
  Image,
  Film,
  MessageSquare,
  WandSparkles,
  Download,
} from "lucide-react";
import { authenticatedBlob } from "./api";
import type { Artifact } from "./api";

export const capabilityNames: Record<string, string> = {
  auto: "Let Powwow choose",
  chat: "Write, think & research",
  text_to_image: "Create an image",
  image_to_video: "Animate an image",
  image_to_3d: "Make a 3D model",
};
export const capabilityIcons = {
  auto: WandSparkles,
  chat: MessageSquare,
  text_to_image: Image,
  image_to_video: Film,
  image_to_3d: Box,
};
export const running = (status: string) =>
  !["succeeded", "failed", "cancelled"].includes(status);
export const pretty = (value?: string) =>
  (value || "Preparing")
    .replace(/[_.-]/g, " ")
    .replace(/^./, (value) => value.toUpperCase());
export const relativeTime = (date: string) => {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(date).getTime()) / 60000),
  );
  return minutes < 1
    ? "Just now"
    : minutes < 60
      ? `${minutes}m ago`
      : minutes < 1440
        ? `${Math.floor(minutes / 60)}h ago`
        : new Date(date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          });
};
export const bytes = (size?: number) =>
  !size
    ? "—"
    : size < 1024 * 1024
      ? `${Math.round(size / 1024)} KB`
      : `${(size / 1024 / 1024).toFixed(1)} MB`;
export const isDemo = (artifact: Artifact) =>
  artifact.is_demo ||
  artifact.metadata?.demo === true ||
  artifact.metadata?.is_demo === true ||
  artifact.metadata?.simulated === true ||
  artifact.metadata?.mode === "demo" ||
  artifact.metadata?.provider === "demo";

export function Brand({
  small = false,
  variant = "monochrome",
}: {
  small?: boolean;
  variant?: "color" | "monochrome";
}) {
  return (
    <span className={`brand ${small ? "brand-small" : ""}`}>
      <img
        className="brand-flame"
        src="/brand/powwow-flame-restored.png"
        width="51"
        height="66"
        alt=""
      />
      {!small && (
        <img
          className="brand-wordmark"
          src={`/brand/powwow-logo-${variant}.svg`}
          width="1055"
          height="188"
          alt="Powwow"
        />
      )}
    </span>
  );
}

export function Modal({
  title,
  children,
  onClose,
  wide = false,
  compact = false,
  anchor,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  compact?: boolean;
  anchor?: HTMLElement | null;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current!;
    const previousFocus = document.activeElement;
      dialog.showModal();
      const place = () => {
        if (!anchor) return;
        const rect = anchor.getBoundingClientRect();
        dialog.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - dialog.offsetWidth - 8))}px`;
        dialog.style.top = `${Math.max(8, Math.min(rect.bottom + 8, window.innerHeight - dialog.offsetHeight - 8))}px`;
      };
      place();
      const observer = new ResizeObserver(place);
      observer.observe(dialog);
      window.addEventListener("resize", place);
      window.addEventListener("scroll", place, true);
    const close = (event: Event) => {
      event.preventDefault();
      closeRef.current();
    };
    dialog.addEventListener("cancel", close);
    return () => {
        dialog.removeEventListener("cancel", close);
        observer.disconnect();
        window.removeEventListener("resize", place);
        window.removeEventListener("scroll", place, true);
      dialog.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
        className={`modal ${wide ? "modal-wide" : ""} ${compact ? "modal-compact" : ""} ${anchor ? "modal-anchored" : ""}`}
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-header">
        <h2 id={titleId}>{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={19} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export function Status({ status }: { status: string }) {
  return (
    <span className={`status status-${status}`}>
      {status === "succeeded" ? (
        <Check size={13} />
      ) : status === "failed" ? (
        <AlertCircle size={13} />
      ) : running(status) ? (
        <LoaderCircle size={13} className="spin" />
      ) : (
        <X size={13} />
      )}{" "}
      {pretty(status === "succeeded" ? "complete" : status)}
    </span>
  );
}

export function useMediaUrl(path?: string) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    setUrl("");
    setError("");
    if (!path) return;
    let dead = false;
    let objectUrl = "";
    authenticatedBlob(path)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (!dead) setUrl(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      })
      .catch((e) => {
        if (!dead) setError(e.message);
      });
    return () => {
      dead = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);
  return { url, error };
}

export async function downloadArtifact(artifact: Artifact) {
  const blob = await authenticatedBlob(
    artifact.download_url ||
      artifact.url ||
      `/v1/artifacts/${artifact.id}/download`,
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = artifact.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const ModelThumbnail = lazy(() => import("./ModelPreview"));

export function ArtifactThumb({ artifact }: { artifact: Artifact }) {
  const kind =
    artifact.kind ||
    (artifact.mime_type.startsWith("image/")
      ? "image"
      : artifact.mime_type.startsWith("video/")
        ? "video"
        : "model3d");
  const { url } = useMediaUrl(
    kind === "image"
      ? artifact.preview_url || artifact.url
      : kind === "model3d" ? undefined : artifact.preview_url,
  );
  return kind === "model3d" ? <Suspense fallback={<Box size={35} />}><ModelThumbnail artifact={artifact} /></Suspense> : url ? (
    <img src={url} alt={artifact.name} />
  ) : (
    <div className={`artifact-placeholder ${kind}`}>
      {kind === "video" ? (
        <Film size={32} />
      ) : kind === "model3d" ? (
        <Box size={35} />
      ) : (
        <Image size={32} />
      )}
    </div>
  );
}

export function DownloadButton({
  artifact,
  onError,
}: {
  artifact: Artifact;
  onError: (error: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="button primary"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await downloadArtifact(artifact);
        } catch (e) {
          onError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? (
        <LoaderCircle size={15} className="spin" />
      ) : (
        <Download size={15} />
      )}{" "}
      Save to device
    </button>
  );
}
