import { useEffect, useId, useRef, useState } from "react";
import {
  Image as ImageIcon,
  LoaderCircle,
  Upload,
  WandSparkles,
} from "lucide-react";
import type { Artifact, Run } from "./api";
import { ArtifactThumb, Modal } from "./components";
import { SelectMenu } from "./SelectMenu";
import { useBuilderNavigationGuard } from "./builderNavigation";

export type ImageRecoveryAction =
  | "project-settings"
  | "recover-request"
  | "current-request"
  | "component-session";
export class EntryImageActionError extends Error {
  constructor(
    message: string,
    public action: ImageRecoveryAction,
  ) {
    super(message);
  }
}
export type EntryImageTarget = {
  category_id: string;
  record_id: string;
  field: "reference" | "first_image" | "last_image";
  expected_reference: string;
};
export function EntryImageControl({
  label,
  value,
  artifacts,
  onChange,
  onUpload,
  onGenerate,
  details,
  run,
  onResolveIssue,
  storageReady,
  maxBudget = 1,
}: {
  label: string;
  value: string;
  artifacts: Artifact[];
  onChange: (value: string) => void;
  onUpload?: (file: File) => Promise<Artifact>;
  onGenerate?: (prompt: string) => Promise<Run>;
  details: string;
  run?: Run;
  storageReady?: boolean;
  maxBudget?: number | null;
  onResolveIssue?: (action: ImageRecoveryAction) => void;
}) {
  const id = useId(),
    file = useRef<HTMLInputElement>(null),
    flight = useRef(false),
    mounted = useRef(true);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [dialog, setDialog] = useState(false),
    [prompt, setPrompt] = useState("");
  const [recovery, setRecovery] = useState<ImageRecoveryAction>();
  const [queued, setQueued] = useState<Run>();
  const current =
    run &&
    (!queued || run.id === queued.id || run.created_at > queued.created_at)
      ? run
      : queued;
  const running = Boolean(
    current && !["succeeded", "failed", "cancelled"].includes(current.status),
  );
  const images = artifacts.filter((item) =>
    item.mime_type.startsWith("image/"),
  );
  const selected = images.find((item) => item.id === value);
  useBuilderNavigationGuard(false, busy);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (storageReady && recovery === "project-settings") {
      setError("");
      setRecovery(undefined);
    }
  }, [storageReady, recovery]);
  async function upload(image: File) {
    if (!onUpload || flight.current) return;
    flight.current = true;
    setBusy(true);
    setError("");
    try {
      if (!["image/png", "image/jpeg", "image/webp"].includes(image.type))
        throw new Error("Choose a PNG, JPEG, or WebP image.");
      const artifact = await onUpload(image);
      if (mounted.current) onChange(artifact.id);
    } catch (value) {
      if (mounted.current) {
        setError((value as Error).message);
        setRecovery(
          value instanceof EntryImageActionError ? value.action : undefined,
        );
      }
    } finally {
      flight.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function generate() {
    if (!onGenerate || flight.current) return;
    setRecovery(undefined);
    if (!prompt.trim()) {
      setError("Enter an image description.");
      return;
    }
    if (prompt.trim().length > 7500) {
      setError("Shorten the description to 7,500 characters.");
      return;
    }
    if (running) {
      setError("An image is already generating.");
      setRecovery("current-request");
      return;
    }
    flight.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await onGenerate(prompt.trim());
      if (mounted.current) {
        setQueued(result);
        setDialog(false);
      }
    } catch (value) {
      if (mounted.current) {
        setError((value as Error).message);
        setRecovery(
          value instanceof EntryImageActionError ? value.action : undefined,
        );
      }
    } finally {
      flight.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  const failed = current?.status === "failed";
  return (
    <div className="builder-image-field">
      <label htmlFor={id}>{label}</label>
      <div className={`builder-image-preview ${selected ? "has-image" : ""}`}>
        {selected ? (
          <ArtifactThumb artifact={selected} />
        ) : (
          <div>
            <ImageIcon size={28} />
            <span>{value ? "Image unavailable" : "No image"}</span>
          </div>
        )}
      </div>
      <div className="entry-image-actions">
        <SelectMenu
          id={id}
          ariaLabel={`Choose an image for ${label.toLowerCase()}`}
          value=""
          placeholder="Choose an image"
          disabled={busy}
          options={[
            ...images.map((image) => ({ value: image.id, label: image.name })),
            ...(value ? [{ value: "__remove", label: "Remove image" }] : []),
            ...(onUpload
              ? [
                  {
                    value: "__upload",
                    label: "Upload an image…",
                    icon: <Upload size={15} />,
                  },
                ]
              : []),
          ]}
          onChange={(choice) => {
            setError("");
            if (choice === "__upload") file.current?.click();
            else onChange(choice === "__remove" ? "" : choice);
          }}
        />
        {onGenerate && (
          <button
            type="button"
            className="icon-button entry-image-wand"
            title="Generate image"
            aria-label={`Generate ${label.toLowerCase()}`}
            disabled={busy}
            onClick={() => {
              setPrompt(details);
              setError("");
              setRecovery(undefined);
              setDialog(true);
            }}
          >
            {running ? (
              <LoaderCircle size={17} className="spin" />
            ) : (
              <WandSparkles size={18} />
            )}
          </button>
        )}
      </div>
      <input
        ref={file}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(event) => {
          const image = event.target.files?.[0];
          event.target.value = "";
          if (image) void upload(image);
        }}
      />
      {busy && !dialog && (
        <p className="entry-image-status" role="status">
          Uploading image…
        </p>
      )}
      {running && (
        <p className="entry-image-status" role="status">
          Generating image…
        </p>
      )}
      {failed && (
        <p className="entry-image-error" role="alert">
          {typeof current?.error === "object"
            ? current.error?.message
            : current?.error || "Image generation failed."}
        </p>
      )}
      {Boolean(current?.model_provenance.entry_image) &&
        (current?.model_provenance.entry_image as { status?: string })
          .status === "available_in_assets" && (
          <p className="entry-image-status">
            Image saved in project assets. Choose it above when ready.
          </p>
        )}
      {error && !dialog && (
        <p className="entry-image-error" role="alert">
          {error}
        </p>
      )}
      {dialog && (
        <Modal
          title="Generate image"
          onClose={() => {
            if (!busy) setDialog(false);
          }}
        >
          <form
            className="entry-image-dialog"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void generate();
            }}
          >
            <label htmlFor={`${id}-prompt`}>Image description</label>
            <textarea
              id={`${id}-prompt`}
              autoFocus
              value={prompt}
              disabled={busy}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe the image you want to create"
            />
            <button
              type="button"
              className="button subtle"
              disabled={busy || !details.trim()}
              onClick={() => setPrompt(details)}
            >
              Use entry details
            </button>
            {error && (
              <div className="entry-image-error" role="alert">
                <span>{error}</span>
                {recovery && onResolveIssue && (
                  <button
                    type="button"
                    className="error-link"
                    onClick={() => {
                      if (recovery !== "project-settings") setDialog(false);
                      onResolveIssue(recovery);
                    }}
                  >
                    {
                      {
                        "project-settings": "Edit project",
                        "recover-request": "Recover request",
                        "current-request": "View request",
                        "component-session": "Retry connection",
                      }[recovery]
                    }
                  </button>
                )}
              </div>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="button"
                disabled={busy}
                onClick={() => setDialog(false)}
              >
                Cancel
              </button>
              <button className="button primary" disabled={busy}>
                {busy ? (
                  <LoaderCircle className="spin" size={16} />
                ) : (
                  <WandSparkles size={16} />
                )}
                {maxBudget === null ? "Generate image" : `Generate image · $${maxBudget} max`}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
