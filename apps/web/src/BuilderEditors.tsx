import { lazy, Suspense, useEffect, useId, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Check,
  ChevronRight,
  Film,
  Image as ImageIcon,
  Layers3,
  LoaderCircle,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { Artifact, Run } from "./api";
import type { ReactNode } from "react";
import { EntryImageControl } from "./EntryImageControl";
import type {
  EntryImageTarget,
  ImageRecoveryAction,
} from "./EntryImageControl";
import type { BuilderRecord, BuilderWorkspace } from "./builder";
import {
  canLeaveBuilder,
  useBuilderNavigationGuard,
} from "./builderNavigation";
import {
  ArtifactThumb,
  DownloadButton,
  Modal,
  bytes,
} from "./components";
import "./builder-editors.css";
import { SelectMenu } from "./SelectMenu";

const ModelPreview = lazy(() => import("./ModelPreview"));

function isModelAsset(artifact: Artifact) {
  return (
    artifact.mime_type === "model/gltf-binary" || /\.glb$/i.test(artifact.name)
  );
}

function ProjectModelPreview({ artifact }: { artifact: Artifact }) {
  const loading = (
    <div className="preview-message" role="status">
      <LoaderCircle className="spin" />
      <span>Loading model…</span>
    </div>
  );
  return (
    <div className="builder-asset-full builder-asset-model">
      <Suspense fallback={loading}>
        <ModelPreview artifact={artifact} />
      </Suspense>
    </div>
  );
}

type EditorField = {
  id: string;
  label: string;
  hint?: string;
  placeholder?: string;
  type?: "text" | "long" | "select" | "asset" | "number";
  options?: string[];
  wide?: boolean;
};
type EditorSchema = {
  name: string;
  singular: string;
  description: string;
  titleLabel: string;
  titlePlaceholder: string;
  fields: EditorField[];
};

const schemas: Record<string, EditorSchema> = {
  storyboard: {
    name: "Storyboard",
    singular: "scene",
    titleLabel: "Scene title",
    titlePlaceholder: "Give this scene a working title",
    description:
      "Build the movie scene by scene, with script, camera direction, and both ends of every shot.",
    fields: [
      {
        id: "location",
        label: "Scene heading",
        placeholder: "INT. / EXT. · Location · Time of day",
      },
      {
        id: "duration",
        label: "Duration in seconds",
        type: "number",
        placeholder: "8",
      },
      {
        id: "characters",
        label: "Characters in scene",
        placeholder: "Who appears in this scene?",
        wide: true,
      },
      {
        id: "script",
        label: "Action & dialogue",
        type: "long",
        placeholder:
          "Describe what we see and hear. Add character names before dialogue.",
        wide: true,
      },
      {
        id: "camera",
        label: "Shot & camera movement",
        type: "long",
        placeholder: "Framing, lens, camera position, and movement",
      },
      {
        id: "sound",
        label: "Sound & atmosphere",
        type: "long",
        placeholder: "Music, ambient sound, voice-over, and mood",
      },
      {
        id: "continuity",
        label: "Continuity notes",
        type: "long",
        placeholder: "Details that must match the previous or next scene",
        wide: true,
      },
    ],
  },
  manuscript: {
    name: "Book editor",
    singular: "chapter",
    titleLabel: "Chapter title",
    titlePlaceholder: "Name this chapter",
    description:
      "Organize chapters, develop the outline, and write in a focused manuscript editor.",
    fields: [
      {
        id: "viewpoint",
        label: "Viewpoint",
        placeholder: "Narrator or viewpoint character",
      },
      {
        id: "status",
        label: "Draft status",
        type: "select",
        options: [
          "Outline",
          "First draft",
          "Revising",
          "Ready for review",
          "Complete",
        ],
      },
      {
        id: "outline",
        label: "Chapter outline",
        type: "long",
        placeholder: "Purpose, key events, and what the reader should feel",
        wide: true,
      },
      {
        id: "notes",
        label: "Revision notes",
        type: "long",
        placeholder: "Questions to resolve and details to revisit",
        wide: true,
      },
    ],
  },
};

const aliases: Record<string, string> = {
  chapters: "manuscript",
  book: "manuscript",
  "book-editor": "manuscript",
  "plot-beats": "plot",
  "story-plot": "plot",
  scenes: "storyboard",
  mechanics: "game-design",
  game: "game-design",
  game_design: "game-design",
  locations: "world",
  worldbuilding: "world",
  "world-building": "world",
  screens: "pages",
  "screen-design": "pages",
  curriculum: "lessons",
  sources: "research",
  publishing: "release",
  "release-checklist": "release",
  "asset-library": "assets",
  "audio-script": "audio",
};
const wordCount = (value = "") =>
  value.trim() ? value.trim().split(/\s+/u).length : 0;
const cloneRecord = (record: BuilderRecord): BuilderRecord => ({
  ...record,
  fields: { ...record.fields },
});

export type BuilderEditorsProps = {
  componentId: string;
  workspace: BuilderWorkspace;
  onSave: (workspace: BuilderWorkspace) => Promise<void>;
  onAsk: (prompt: string) => void;
  artifacts: Artifact[];
  projectName: string;
  onExport?: () => void;
  onUploadImage?: (file: File) => Promise<Artifact>;
  onAttachAssets?: (assets: Artifact[]) => Promise<void>;
  onDeleteAsset?: (asset: Artifact) => Promise<void>;
  onGenerateImage?: (prompt: string, target: EntryImageTarget) => Promise<Run>;
  imageRuns?: Run[];
  imageStorageReady?: boolean;
  imageBudget?: number | null;
  onResolveImageIssue?: (action: ImageRecoveryAction) => void;
};

/** Mount with a project ID key so two identically named projects keep separate drafts. */
export function BuilderEditors(props: BuilderEditorsProps) {
  const requested = props.componentId.startsWith("details:")
    ? props.componentId.slice(8)
    : props.componentId;
  const canonicalId = aliases[requested] || requested;
  if (
    canonicalId === "details" ||
    props.workspace.detail_categories?.some((item) => item.id === canonicalId)
  )
    return <ProjectDetails {...props} initialCategory={canonicalId} />;
  if (canonicalId === "assets")
    return <ProjectAssets key={props.projectName} {...props} />;
  const schema = schemas[canonicalId];
  if (!schema)
    return (
      <section className="builder-editor-empty">
        <Layers3 size={30} />
        <h2>This component is not available yet</h2>
        <p>Choose another project component to continue building.</p>
      </section>
    );
  return (
    <RecordEditor
      key={`${props.projectName}:${props.componentId}`}
      {...props}
      schema={schema}
      canonicalId={canonicalId}
    />
  );
}

function ProjectDetails(
  props: BuilderEditorsProps & { initialCategory: string },
) {
  const categories = props.workspace.detail_categories || [];
  const [selected, setSelected] = useState(props.initialCategory);
  const category =
    categories.find((item) => item.id === selected) || categories[0];
  const [editing, setEditing] = useState<"new" | "rename" | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const flight = useRef(false);
  useBuilderNavigationGuard(Boolean(editing && name.trim()), busy);
  async function saveCategory(remove = false) {
    if (flight.current) return;
    const title = name.trim();
    if (
      !remove &&
      (!title ||
        categories.some(
          (item) =>
            item.name.toLocaleLowerCase() === title.toLocaleLowerCase() &&
            (editing !== "rename" || item.id !== category?.id),
        ))
    ) {
      setError("Choose a unique category name.");
      return;
    }
    flight.current = true;
    setBusy(true);
    setError("");
    try {
      const id =
        editing === "rename" || remove
          ? category!.id
          : `detail-${crypto.randomUUID()}`;
      const next = remove
        ? categories.filter((item) => item.id !== id)
        : editing === "rename"
          ? categories.map((item) =>
              item.id === id ? { ...item, name: title } : item,
            )
          : [...categories, { id, name: title }];
      const records = { ...props.workspace.records };
      if (remove) delete records[id];
      await props.onSave({
        ...props.workspace,
        detail_categories: next,
        records,
      });
      setSelected(remove ? next[0]?.id || "" : id);
      setEditing(null);
      setName("");
    } catch (value) {
      setError((value as Error).message);
    } finally {
      flight.current = false;
      setBusy(false);
    }
  }
  const categoryControls = (
    <SelectMenu
      ariaLabel="Category"
      value={category?.id || ""}
      placeholder="Choose category"
      disabled={busy}
      options={[
        ...categories.map((item) => ({ value: item.id, label: item.name })),
        ...(category ? [{ value: "__rename", label: "Edit category…" }] : []),
        ...(props.onExport
          ? [{ value: "__export", label: "Export project notes" }]
          : []),
        {
          value: "__new",
          label: "+ New Category",
          disabled: categories.length >= 40,
        },
      ]}
      onChange={(id) => {
        if (id === "__export") {
          props.onExport?.();
          return;
        }
        if (!canLeaveBuilder()) return;
        if (id === "__new" || id === "__rename") {
          setError("");
          setName(id === "__new" ? "" : category.name);
          setEditing(id === "__new" ? "new" : "rename");
        } else setSelected(id);
      }}
    />
  );
  return (
    <div className="project-details">
      <RecordEditor
        key={category?.id || "empty"}
        {...props}
        componentId={category?.id || ""}
        canonicalId="details"
        sidebarControls={categoryControls}
        entryDisabled={!category}
        schema={{
          name: "Project Details",
          singular: "entry",
          titleLabel: "Name",
          titlePlaceholder: "Give this entry a name",
          description: "",
          fields: [
            {
              id: "description",
              label: "Description",
              type: "long",
              wide: true,
              placeholder: "Everything worth knowing about this entry.",
            },
          ],
        }}
      />
      {editing && (
        <Modal
          title={editing === "new" ? "New category" : "Edit category"}
          onClose={() => {
            if (!busy) setEditing(null);
          }}
        >
          <form
            className="detail-category-form"
            onSubmit={(event) => {
              event.preventDefault();
              void saveCategory();
            }}
          >
            <label>
              Category name
              <input
                autoFocus
                value={name}
                maxLength={80}
                disabled={busy}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Characters or Game mechanics"
              />
            </label>
            {error && <p role="alert">{error}</p>}
            <div className="modal-actions">
              {editing === "rename" && (
                <button
                  type="button"
                  className="button subtle"
                  disabled={
                    busy ||
                    Boolean(props.workspace.records[category.id]?.length)
                  }
                  title="Only empty categories can be removed"
                  onClick={() => void saveCategory(true)}
                >
                  Delete empty category
                </button>
              )}
              <button
                type="button"
                className="button"
                disabled={busy}
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button
                className="button primary"
                disabled={busy || !name.trim()}
              >
                {busy ? "Saving…" : "Save category"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function RecordEditor({
  componentId,
  workspace,
  onSave,
  onAsk,
  artifacts,
  projectName,
  schema,
  canonicalId,
  sidebarControls,
  entryDisabled,
  onUploadImage,
  onGenerateImage,
  imageRuns,
  onResolveImageIssue,
  imageStorageReady,
  imageBudget,
}: BuilderEditorsProps & {
  schema: EditorSchema;
  canonicalId: string;
  sidebarControls?: ReactNode;
  entryDisabled?: boolean;
}) {
  const startingRecords = workspace.records[componentId] || [];
  const [records, setRecords] = useState<BuilderRecord[]>(startingRecords);
  const [draft, setDraft] = useState<BuilderRecord | null>(
    startingRecords[0] ? cloneRecord(startingRecords[0]) : null,
  );
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<{
    kind: "discard" | "delete";
    next?: () => void;
  } | null>(null);
  const savingRef = useRef(false);
  const mounted = useRef(true);
  const workspaceRef = useRef(workspace);
  workspaceRef.current = workspace;
  const savedRecord = records.find((record) => record.id === draft?.id);
  const dirty =
    !!draft &&
    (!savedRecord || JSON.stringify(draft) !== JSON.stringify(savedRecord));
  const newRecord = !!draft && !savedRecord;
  const prefix = useId();
  useBuilderNavigationGuard(dirty, saving);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    const incoming = workspace.records[componentId] || [];
    setDraft((current) => {
      const saved = records.find((item) => item.id === current?.id);
      const latest = incoming.find((item) => item.id === current?.id);
      if (
        current &&
        (!saved || JSON.stringify(current) !== JSON.stringify(saved))
      ) {
        if (!saved || !latest) return current;
        const fields = { ...current.fields };
        for (const key of ["reference", "first_image", "last_image"])
          if (
            (current.fields[key] || "") === (saved.fields[key] || "") &&
            latest.fields[key] !== saved.fields[key]
          )
            fields[key] = latest.fields[key] || "";
        return { ...current, fields };
      }
      const selected = latest || incoming[0];
      return selected ? cloneRecord(selected) : null;
    });
    setRecords(incoming);
  }, [workspace.records, componentId]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function changeField(id: string, value: string) {
    setDraft(
      (current) =>
        current && { ...current, fields: { ...current.fields, [id]: value } },
    );
    setFeedback("");
  }
  function navigate(next: () => void) {
    if (savingRef.current) return;
    if (dirty) setConfirmation({ kind: "discard", next });
    else next();
  }
  function choose(record: BuilderRecord) {
    navigate(() => {
      setDraft(cloneRecord(record));
      setFeedback("");
      setError("");
      setMode("write");
    });
  }
  function addRecord() {
    navigate(() => {
      setDraft({ id: crypto.randomUUID(), title: "", fields: {} });
      setMode("write");
      setFeedback("");
      setError("");
    });
  }
  async function commit(next: BuilderRecord[]): Promise<boolean> {
    if (savingRef.current) return false;
    savingRef.current = true;
    setSaving(true);
    setError("");
    setFeedback("");
    try {
      const latest = workspaceRef.current;
      await onSave({
        ...latest,
        records: { ...latest.records, [componentId]: next },
      });
      if (mounted.current) {
        setRecords(next);
        setFeedback("Saved to this project");
      }
      return true;
    } catch (e) {
      if (mounted.current)
        setError(
          (e as Error).message ||
            "Could not save. Your edits are still here; try again.",
        );
      return false;
    } finally {
      savingRef.current = false;
      if (mounted.current) setSaving(false);
    }
  }
  async function saveDraft(): Promise<boolean> {
    if (!draft) return false;
    if (!draft.title.trim()) {
      setError(`Give this ${schema.singular} a title before saving.`);
      return false;
    }
    const clean = { ...draft, title: draft.title.trim() };
    const next = newRecord
      ? [...records, clean]
      : records.map((record) => (record.id === clean.id ? clean : record));
    if (await commit(next)) {
      if (mounted.current) setDraft(cloneRecord(clean));
      return true;
    }
    return false;
  }
  async function removeRecord() {
    if (!draft) return;
    const next = records.filter((record) => record.id !== draft.id);
    if (await commit(next)) {
      if (mounted.current) {
        setDraft(next[0] ? cloneRecord(next[0]) : null);
        setConfirmation(null);
      }
    }
  }
  async function moveRecord(direction: -1 | 1) {
    if (!draft || dirty) return;
    const index = records.findIndex((record) => record.id === draft.id);
    const destination = index + direction;
    if (index < 0 || destination < 0 || destination >= records.length) return;
    const next = [...records];
    [next[index], next[destination]] = [next[destination], next[index]];
    await commit(next);
  }
  function imageControl(
    field: "reference" | "first_image" | "last_image",
    label: string,
  ) {
    if (!draft) return null;
    const target = {
      category_id: componentId,
      record_id: draft.id,
      field,
      expected_reference: draft.fields[field] || "",
    };
    const run = imageRuns?.find((item) => {
      const entry = item.settings.entry_image as EntryImageTarget | undefined;
      return (
        entry?.category_id === componentId &&
        entry.record_id === draft.id &&
        entry.field === field
      );
    });
    return (
      <EntryImageControl
        key={`${draft.id}:${field}`}
        label={label}
        value={draft.fields[field] || ""}
        artifacts={artifacts}
        onChange={(value) => changeField(field, value)}
        onUpload={onUploadImage}
        details={[
          draft.title,
          ...Object.entries(draft.fields)
            .filter(
              ([key]) =>
                !["reference", "first_image", "last_image"].includes(key),
            )
            .map(([, value]) => value),
        ]
          .filter(Boolean)
          .join("\n\n")}
        run={run}
        onResolveIssue={onResolveImageIssue}
        storageReady={imageStorageReady}
        maxBudget={imageBudget}
        onGenerate={
          onGenerateImage
            ? async (prompt) => {
                if (!draft.title.trim())
                  throw new Error(
                    "Give this entry a name before generating its image.",
                  );
                if (dirty && !(await saveDraft()))
                  throw new Error(
                    "The entry could not be saved. Your draft is still here.",
                  );
                return onGenerateImage(prompt, target);
              }
            : undefined
        }
      />
    );
  }
  async function askForHelp() {
    if (!draft) return;
    if (dirty && !(await saveDraft())) return;
    if (!mounted.current) return;
    const values = Object.entries(draft.fields)
      .filter(([, value]) => value.trim())
      .map(
        ([key, value]) =>
          `${schema.fields.find((field) => field.id === key)?.label || key}: ${value}`,
      )
      .join("\n\n");
    onAsk(
      `Help me develop this ${schema.singular} for my project "${projectName}". Use the project's creative brief and blueprint. Suggest a concrete next improvement and check consistency with the rest of the project.\n\nTitle: ${draft.title || `Untitled ${schema.singular}`}\n${values}\n\nThese are my saved editor notes. Keep suggestions in chat for me to review; do not claim suggestions are already saved to the editor.`,
    );
  }
  const visibleRecords = records.filter((record) =>
    `${record.title} ${Object.values(record.fields).join(" ")}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const selectedIndex = records.findIndex((record) => record.id === draft?.id);
  const totalWords = records.reduce(
    (total, record) => total + wordCount(record.fields.body),
    0,
  );
  const totalSeconds = records.reduce(
    (total, record) => total + (Number(record.fields.duration) || 0),
    0,
  );
  const icon =
    canonicalId === "storyboard" ? (
      <Film size={22} />
    ) : canonicalId === "manuscript" ? (
      <BookOpen size={22} />
    ) : canonicalId === "characters" ? (
      <Users size={22} />
    ) : (
      <Layers3 size={22} />
    );

  return (
    <section className={`builder-editor builder-editor-${canonicalId}`}>
      <header className="builder-editor-heading">
        <div className="builder-editor-identity">
          <span className="builder-editor-mark">{icon}</span>
          <div>
            <p className="builder-editor-eyebrow">{projectName}</p>
            <h2>{schema.name}</h2>
          </div>
        </div>
        <button
          className="button primary"
          onClick={addRecord}
          disabled={saving || entryDisabled}
        >
          <Plus size={15} /> Add {schema.singular}
        </button>
      </header>
      {schema.description && (
        <p className="builder-editor-description">{schema.description}</p>
      )}
      <div
        className="builder-editor-summary"
        hidden={canonicalId === "details"}
      >
        <span>
          {records.length} {schema.singular}
          {records.length === 1 ? "" : "s"}
        </span>
        {canonicalId === "manuscript" && (
          <span>{totalWords.toLocaleString()} saved words</span>
        )}
        {canonicalId === "storyboard" && (
          <span>{totalSeconds.toLocaleString()} seconds planned</span>
        )}
        {canonicalId === "release" && (
          <span>
            {
              records.filter((record) => record.fields.status === "Verified")
                .length
            }{" "}
            verified
          </span>
        )}
        <span>Shared across this project's chats</span>
      </div>
      {!draft && records.length === 0 && canonicalId !== "details" ? (
        <div className="builder-editor-empty">
          {icon}
          <h3>Your first {schema.singular} starts here</h3>
          <p>
            Add your first {schema.singular}, or ask Powwow to help you develop
            one from your project brief.
          </p>
          <div className="builder-editor-actions">
            <button className="button primary" onClick={addRecord}>
              <Plus size={15} /> Add {schema.singular}
            </button>
            <button
              className="button"
              onClick={() =>
                onAsk(
                  `Help me create the first ${schema.singular} for my project "${projectName}" using the project brief, blueprint, and existing work. Propose the ${schema.titleLabel.toLowerCase()} and these fields: ${schema.fields.map((field) => field.label).join(", ")}. Keep this as a draft in chat for me to review and add to ${schema.name}.`,
                )
              }
            >
              <Sparkles size={15} /> Help me start
            </button>
          </div>
        </div>
      ) : (
        <div className="builder-editor-layout">
          <aside
            className="builder-record-list"
            aria-label={`${schema.name} list`}
          >
            <label className="builder-record-search">
              <Search size={15} />
              <input
                aria-label={`Search ${schema.name.toLowerCase()}`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  canonicalId === "details"
                    ? "Find an entry"
                    : "Find in this component"
                }
              />
            </label>
            {sidebarControls && (
              <div className="detail-category-select">{sidebarControls}</div>
            )}
            {newRecord && (
              <div className="builder-new-record">
                <Plus size={14} /> New {schema.singular} · unsaved
              </div>
            )}
            <ol>
              {visibleRecords.map((record) => {
                const index = records.indexOf(record);
                const thumb = artifacts.find(
                  (artifact) =>
                    artifact.id ===
                    (record.fields.first_image || record.fields.reference),
                );
                return (
                  <li key={record.id}>
                    <button
                      className={`builder-record-button ${draft?.id === record.id ? "selected" : ""}`}
                      onClick={() => choose(record)}
                      aria-current={
                        draft?.id === record.id ? "true" : undefined
                      }
                      disabled={saving}
                    >
                      {(thumb || canonicalId === "details") && (
                        <span className="builder-record-thumb">
                          {thumb ? (
                            <ArtifactThumb artifact={thumb} />
                          ) : (
                            <ImageIcon size={22} aria-label="No image" />
                          )}
                        </span>
                      )}
                      <span
                        className="builder-record-index"
                        hidden={canonicalId === "details"}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="builder-record-copy">
                        <strong>{record.title}</strong>
                        <small>
                          {canonicalId === "manuscript"
                            ? `${wordCount(record.fields.body).toLocaleString()} words · ${record.fields.status || "Outline"}`
                            : canonicalId === "storyboard"
                              ? [
                                  record.fields.location,
                                  record.fields.duration &&
                                    `${record.fields.duration}s`,
                                ]
                                  .filter(Boolean)
                                  .join(" · ") || "Scene details"
                              : record.fields.description ||
                                record.fields.status ||
                                record.fields.role ||
                                record.fields.act ||
                                record.fields.category ||
                                record.fields.when ||
                                schema.singular}
                        </small>
                      </span>
                      <ChevronRight size={14} />
                    </button>
                  </li>
                );
              })}
            </ol>
            {visibleRecords.length === 0 && search && (
              <p className="builder-list-note">
                No matching {schema.singular}s.
              </p>
            )}
            <button
              className="builder-list-add"
              hidden={canonicalId === "details"}
              onClick={addRecord}
              disabled={saving}
            >
              <Plus size={15} /> Add {schema.singular}
            </button>
          </aside>
          {!draft && canonicalId === "details" && (
            <div className="builder-editor-empty">
              <BookOpen size={28} />
              <h3>
                {entryDisabled
                  ? "Start with a category"
                  : "Add your first entry"}
              </h3>
              <p>
                {entryDisabled
                  ? "Choose + New Category from the dropdown."
                  : ""}
              </p>
            </div>
          )}
          {draft && (
            <div className="builder-record-detail">
              <div className="builder-record-toolbar">
                <div className="builder-record-position">
                  <span>
                    {newRecord
                      ? "New draft"
                      : `${schema.singular[0].toUpperCase() + schema.singular.slice(1)} ${selectedIndex + 1} of ${records.length}`}
                  </span>
                  <span className="builder-draft-state">
                    {dirty ? "Unsaved changes" : "Saved"}
                  </span>
                </div>
                <div className="builder-editor-actions">
                  <button
                    className="icon-button"
                    aria-label={`Move ${schema.singular} earlier`}
                    title={
                      dirty ? "Save before changing order" : "Move earlier"
                    }
                    onClick={() => void moveRecord(-1)}
                    disabled={saving || dirty || selectedIndex <= 0}
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Move ${schema.singular} later`}
                    title={dirty ? "Save before changing order" : "Move later"}
                    onClick={() => void moveRecord(1)}
                    disabled={
                      saving ||
                      dirty ||
                      selectedIndex < 0 ||
                      selectedIndex >= records.length - 1
                    }
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    className="icon-button builder-delete"
                    aria-label={`Delete ${schema.singular}`}
                    onClick={() => setConfirmation({ kind: "delete" })}
                    disabled={saving || newRecord}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <fieldset className="builder-editor-fields" disabled={saving}>
                {canonicalId === "details" && (
                  <div className="detail-entry-image">
                    {imageControl("reference", "Image")}
                  </div>
                )}
                <label
                  className="builder-field builder-field-wide"
                  htmlFor={`${prefix}-title`}
                >
                  <span>{schema.titleLabel}</span>
                  <input
                    id={`${prefix}-title`}
                    className="builder-record-title"
                    value={draft.title}
                    onChange={(event) => {
                      setDraft({ ...draft, title: event.target.value });
                      setFeedback("");
                    }}
                    placeholder={schema.titlePlaceholder}
                    maxLength={240}
                  />
                </label>
                {canonicalId === "storyboard" && (
                  <div className="builder-storyboard-frames builder-field-wide">
                    {imageControl("first_image", "First frame")}
                    <span className="builder-frame-arrow">
                      <ChevronRight size={18} />
                    </span>
                    {imageControl("last_image", "Last frame")}
                  </div>
                )}
                {schema.fields.map((field) => (
                  <RecordField
                    key={field.id}
                    field={field}
                    value={draft.fields[field.id] || ""}
                    artifacts={artifacts}
                    onChange={(value) => changeField(field.id, value)}
                    prefix={prefix}
                  />
                ))}
                {canonicalId === "manuscript" && (
                  <div className="builder-manuscript builder-field-wide">
                    <div className="builder-manuscript-toolbar">
                      <span>Manuscript</span>
                      <div
                        className="builder-editor-mode"
                        role="group"
                        aria-label="Manuscript mode"
                      >
                        <button
                          type="button"
                          aria-pressed={mode === "write"}
                          className={mode === "write" ? "selected" : ""}
                          onClick={() => setMode("write")}
                        >
                          Write
                        </button>
                        <button
                          type="button"
                          aria-pressed={mode === "preview"}
                          className={mode === "preview" ? "selected" : ""}
                          onClick={() => setMode("preview")}
                        >
                          Read
                        </button>
                      </div>
                      <small>
                        {wordCount(draft.fields.body).toLocaleString()} words ·{" "}
                        {Math.max(
                          1,
                          Math.ceil(wordCount(draft.fields.body) / 220),
                        )}{" "}
                        min read
                      </small>
                    </div>
                    {mode === "write" ? (
                      <textarea
                        className="builder-manuscript-input"
                        aria-label="Chapter manuscript"
                        value={draft.fields.body || ""}
                        onChange={(event) =>
                          changeField("body", event.target.value)
                        }
                        placeholder="Your chapter begins here…"
                        spellCheck
                      />
                    ) : (
                      <article className="builder-manuscript-preview">
                        <h2>{draft.title || "Untitled chapter"}</h2>
                        {draft.fields.body ? (
                          <ReactMarkdown>{draft.fields.body}</ReactMarkdown>
                        ) : (
                          <p className="builder-preview-placeholder">
                            Switch to Write to begin your chapter.
                          </p>
                        )}
                      </article>
                    )}
                    <p className="builder-field-hint">
                      Use Markdown for headings, emphasis, and lists. Read mode
                      shows your current draft.
                    </p>
                  </div>
                )}
              </fieldset>
              <footer className="builder-editor-savebar">
                <div className="builder-save-feedback" aria-live="polite">
                  {error ? (
                    <span className="builder-editor-error" role="alert">
                      {error}
                    </span>
                  ) : feedback ? (
                    <span className="builder-editor-success">
                      <Check size={14} />
                      {feedback}
                    </span>
                  ) : null}
                </div>
                <div className="builder-editor-actions">
                  <button
                    className="button"
                    onClick={() => void askForHelp()}
                    disabled={saving}
                  >
                    <Sparkles size={15} /> {dirty ? "Save & ask" : "Ask Powwow"}
                  </button>
                  <button
                    className="button primary"
                    onClick={() => void saveDraft()}
                    disabled={saving || !dirty}
                  >
                    {saving ? (
                      <LoaderCircle className="spin" size={15} />
                    ) : (
                      <Save size={15} />
                    )}
                    {saving ? "Saving…" : `Save ${schema.singular}`}
                  </button>
                </div>
              </footer>
            </div>
          )}
        </div>
      )}
      {confirmation && (
        <Modal
          title={
            confirmation.kind === "delete"
              ? `Delete this ${schema.singular}?`
              : "Keep your draft?"
          }
          onClose={() => {
            if (!saving) setConfirmation(null);
          }}
        >
          <div className="builder-confirm-content">
            <p>
              {confirmation.kind === "delete"
                ? `“${draft?.title || `Untitled ${schema.singular}`}” will be removed from this project. This cannot be undone.`
                : "This draft has unsaved changes. Save it before opening another item, or discard the changes."}
            </p>
            {error && (
              <p className="builder-editor-error" role="alert">
                {error}
              </p>
            )}
            <div className="builder-editor-actions">
              <button
                className="button"
                onClick={() => setConfirmation(null)}
                disabled={saving}
              >
                {confirmation.kind === "delete" ? "Cancel" : "Keep editing"}
              </button>
              <button
                className="button primary"
                disabled={saving}
                onClick={() => {
                  if (confirmation.kind === "delete") void removeRecord();
                  else {
                    const next = confirmation.next;
                    setConfirmation(null);
                    next?.();
                  }
                }}
              >
                {saving
                  ? "Saving…"
                  : confirmation.kind === "delete"
                    ? `Delete ${schema.singular}`
                    : "Discard changes"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}

function RecordField({
  field,
  value,
  artifacts,
  onChange,
  prefix,
}: {
  field: EditorField;
  value: string;
  artifacts: Artifact[];
  onChange: (value: string) => void;
  prefix: string;
}) {
  if (field.type === "asset")
    return (
      <div
        className={`builder-field ${field.wide ? "builder-field-wide" : ""}`}
      >
        <ImageField
          label={field.label}
          value={value}
          artifacts={artifacts}
          onChange={onChange}
        />
      </div>
    );
  const id = `${prefix}-${field.id}`;
  return (
    <div className={`builder-field ${field.wide ? "builder-field-wide" : ""}`}>
      <label htmlFor={id}>{field.label}</label>
      {field.type === "long" ? (
        <textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          rows={4}
        />
      ) : field.type === "select" ? (
        <SelectMenu
          id={id}
          ariaLabel={field.label}
          value={value}
          onChange={onChange}
          options={[
            { value: "", label: "Choose when ready" },
            ...(field.options || []).map((option) => ({
              value: option,
              label: option,
            })),
          ]}
        />
      ) : (
        <input
          id={id}
          type={field.type === "number" ? "number" : "text"}
          min={field.type === "number" ? 0 : undefined}
          step={field.type === "number" ? "any" : undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
        />
      )}
      {field.hint && <small className="builder-field-hint">{field.hint}</small>}
    </div>
  );
}

function ImageField({
  label,
  value,
  artifacts,
  onChange,
}: {
  label: string;
  value: string;
  artifacts: Artifact[];
  onChange: (value: string) => void;
}) {
  const images = artifacts.filter(
    (artifact) =>
      artifact.mime_type.startsWith("image/") || artifact.kind === "image",
  );
  const selected = images.find((artifact) => artifact.id === value);
  const id = useId();
  return (
    <div className="builder-image-field">
      <label htmlFor={id}>{label}</label>
      <div className={`builder-image-preview ${selected ? "has-image" : ""}`}>
        {selected ? (
          <ArtifactThumb artifact={selected} />
        ) : (
          <div>
            <ImageIcon size={27} />
            <span>
              {value
                ? "This image is no longer available"
                : "No image selected"}
            </span>
          </div>
        )}
      </div>
      <SelectMenu
        id={id}
        ariaLabel={label}
        value={value}
        onChange={onChange}
        options={[
          { value: "", label: "Choose an image" },
          ...(value && !selected
            ? [{ value, label: "Unavailable image" }]
            : []),
          ...images.map((image) => ({ value: image.id, label: image.name })),
        ]}
      />
    </div>
  );
}

function assetReview(artifact: Artifact) {
  return artifact.metadata?.quality_review as { passed?: boolean; issues?: string[] } | undefined;
}

function ProjectAssets({
  artifacts,
  projectName,
  onAsk,
  onAttachAssets,
  onDeleteAsset,
}: BuilderEditorsProps) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Artifact | null>(null);
  const [error, setError] = useState("");
  const [attaching, setAttaching] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const kindOf = (artifact: Artifact) =>
    artifact.mime_type.startsWith("image/")
      ? "image"
      : artifact.mime_type.startsWith("video/")
        ? "video"
        : artifact.mime_type.startsWith("audio/")
          ? "audio"
          : isModelAsset(artifact)
            ? "model"
            : "other";
  const filtered = artifacts.filter(
    (artifact) =>
      !artifact.metadata?.auxiliary &&
      (filter === "all" || kindOf(artifact) === filter) &&
      artifact.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <section className="builder-editor builder-assets">
      <header className="builder-editor-heading">
        <div className="builder-editor-identity">
          <span className="builder-editor-mark">
            <Layers3 size={22} />
          </span>
          <div>
            <p className="builder-editor-eyebrow">{projectName}</p>
            <h2>Project assets</h2>
          </div>
        </div>
        <button
          className="button primary"
          onClick={() =>
            onAsk(
              `Help me create the next asset for my project "${projectName}". Review the project brief and identify what is most useful to create next. Use the project's visual direction and character references.`,
            )
          }
        >
          <Sparkles size={15} /> Create with Powwow
        </button>
      </header>
      <div className="builder-asset-controls">
        <div
          className="builder-editor-mode"
          role="group"
          aria-label="Filter assets"
        >
          {["all", "image", "video", "audio", "model", "other"].map((kind) => (
            <button
              key={kind}
              className={filter === kind ? "selected" : ""}
              aria-pressed={filter === kind}
              onClick={() => setFilter(kind)}
            >
              {kind === "all"
                ? "All files"
                : kind === "model"
                  ? "Models"
                  : kind[0].toUpperCase() + kind.slice(1)}
            </button>
          ))}
        </div>
        <label className="builder-record-search">
          <Search size={15} />
          <input
            aria-label="Search project assets"
            placeholder="Find an asset"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>
      {filtered.length ? (
        <div className="builder-asset-grid">
          {filtered.map((artifact) => (
            <button
              key={artifact.id}
              className="builder-asset-card"
              onClick={() => {
                setSelected(artifact);
                setError("");
              }}
            >
              <div className="builder-asset-thumb">
                <ArtifactThumb artifact={artifact} />
              </div>
              <strong>{artifact.name}</strong>
              <small>
                {kindOf(artifact)} · {bytes(artifact.size_bytes)}
              </small>
              {assetReview(artifact)?.passed === false && <small className="builder-editor-error">Needs review</small>}
            </button>
          ))}
        </div>
      ) : (
        <div className="builder-editor-empty">
          <ImageIcon size={32} />
          <h3>
            {artifacts.length ? "No matching assets" : "No project assets"}
          </h3>
          {(filter !== "all" || search) && (
            <button
              className="button"
              onClick={() => {
                setFilter("all");
                setSearch("");
              }}
            >
              <X size={14} /> Clear filters
            </button>
          )}
        </div>
      )}
      {selected && (
        <Modal title={selected.name} onClose={() => { if (!deleting) setSelected(null); }} wide>
          <div className="builder-asset-dialog">
            {isModelAsset(selected) ? (
              <ProjectModelPreview key={selected.id} artifact={selected} />
            ) : (
              <div className="builder-asset-full">
                <ArtifactThumb artifact={selected} />
              </div>
            )}
            <p>
              {selected.mime_type} · {bytes(selected.size_bytes)}
            </p>
            {assetReview(selected)?.passed === false && (
              <p className="builder-editor-error" role="alert">{assetReview(selected)?.issues?.join(" ") || "This model needs review."}</p>
            )}
            {error && (
              <p className="builder-editor-error" role="alert">
                {error}
              </p>
            )}
            <div className="builder-editor-actions">
              <button
                className="button"
                disabled={attaching || deleting || !onAttachAssets}
                onClick={async () => {
                  if (attaching || !onAttachAssets) return;
                  setAttaching(true);
                  setError("");
                  try {
                    await onAttachAssets([selected]);
                    setSelected(null);
                  } catch (value) {
                    setError((value as Error).message);
                  } finally {
                    setAttaching(false);
                  }
                }}
              >
                {attaching ? (
                  <LoaderCircle className="spin" size={15} />
                ) : (
                  <Plus size={15} />
                )}{" "}
                Add to message
              </button>
              <DownloadButton artifact={selected} onError={setError} />
              {onDeleteAsset && <button
                className="button"
                disabled={attaching || deleting}
                onClick={async () => {
                  if (deleting || !window.confirm(`Permanently delete “${selected.name}” from Powwow? This cannot be undone. Project and chat references to this file will stop working. Copies already saved to your computer remain.`)) return;
                  setDeleting(true);
                  setError("");
                  try {
                    await onDeleteAsset(selected);
                    setSelected(null);
                  } catch (value) {
                    setError((value as Error).message);
                  } finally {
                    setDeleting(false);
                  }
                }}
              >
                {deleting ? <LoaderCircle className="spin" size={15} /> : <Trash2 size={15} />}
                {deleting ? "Deleting…" : "Delete permanently"}
              </button>}
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
