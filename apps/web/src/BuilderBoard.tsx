import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Compass,
  Download,
  FileText,
  Flag,
  LayoutList,
  ListTodo,
  LoaderCircle,
  Plus,
  Search,
  Sparkles,
  Columns3,
  LockKeyhole,
  Trash2,
} from "lucide-react";
import { Modal } from "./components";
import { SelectMenu } from "./SelectMenu";
import {
  builderIcon,
  downloadText,
  sortBuilderComponents,
  builderComponentName,
} from "./builder";
import type { BuilderCatalog, BuilderTask, BuilderWorkspace } from "./builder";
import "./builder.css";
import {
  canLeaveBuilder,
  useBuilderNavigationGuard,
} from "./builderNavigation";

type Props = {
  workspace: BuilderWorkspace;
  projectName: string;
  catalog: BuilderCatalog;
  onSave: (workspace: BuilderWorkspace) => Promise<void>;
  onSetup: () => void;
  onOpen: (component: string) => void;
  onAsk: (prompt: string) => void;
};
const statuses: {
  id: BuilderTask["status"];
  name: string;
  description: string;
}[] = [
  { id: "todo", name: "To do", description: "Your next building blocks" },
  { id: "doing", name: "In progress", description: "Keep your focus here" },
  {
    id: "blocked",
    name: "Needs a decision",
    description: "Clear the way forward",
  },
  { id: "done", name: "Done", description: "One step closer" },
];
export function BuilderBoard({
  workspace,
  projectName,
  catalog,
  onSave,
  onSetup,
  onOpen,
  onAsk,
}: Props) {
  const [layout, setLayout] = useState("board"),
    [query, setQuery] = useState(""),
    [phase, setPhase] = useState("all");
  const [editing, setEditing] = useState<BuilderTask | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const completed = workspace.tasks.filter(
    (task) => task.status === "done",
  ).length;
  const blockers = (task: BuilderTask) =>
    task.depends_on
      .map((id) => workspace.tasks.find((item) => item.id === id))
      .filter((item): item is BuilderTask => !!item && item.status !== "done");
  const next =
    workspace.tasks.find((task) => task.status === "doing") ||
    workspace.tasks.find(
      (task) => task.status === "todo" && !blockers(task).length,
    );
  const tasks = workspace.tasks.filter(
    (task) =>
      (phase === "all" || task.phase === phase) &&
      `${task.title} ${task.description}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const kind = catalog.kinds.find((item) => item.id === workspace.kind);
  const Icon = builderIcon(workspace.kind || "other");
  function askTask(task: BuilderTask) {
    onAsk(
      `Help me work on this project task: ${task.title}\n\n${task.description}\n\nDone when:\n${task.acceptance.map((item) => `- ${item}`).join("\n")}\n\nUse our saved blueprint and creative records. Start with one small useful step. Use the tools available in this workspace. Do not call this task complete until its acceptance criteria have been checked.`,
    );
  }
  async function saveTask(task: BuilderTask) {
    if (["doing", "done"].includes(task.status) && blockers(task).length) {
      setError(
        "Complete the prerequisites first, or change this task to To do or Needs a decision.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const updated = workspace.tasks.some((item) => item.id === task.id)
        ? workspace.tasks.map((item) => (item.id === task.id ? task : item))
        : [...workspace.tasks, task];
      await onSave({ ...workspace, tasks: updated });
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="builder-page" aria-label="Project task board">
      <header className="builder-heading">
        <div>
          <span className="builder-eyebrow">
            <Icon size={14} />
            {kind?.name || "YOUR PROJECT"}
          </span>
          <h1>
            From idea to <span>made it.</span>
          </h1>
          <p>
            A clear next step. Everything you need, right here in {projectName}.
          </p>
        </div>
        <button className="button" onClick={onSetup}>
          <Compass size={16} />
          {workspace.initialized ? "Review project setup" : "Plan my project"}
        </button>
      </header>
      {!workspace.initialized ? (
        <div className="builder-start">
          <div className="builder-start-icon">
            <Compass size={34} />
          </div>
          <span className="builder-eyebrow">MEET YOUR PROJECT GUIDE</span>
          <h2>Big idea? Start with a small step.</h2>
          <p>
            Tell us what you want to make. We’ll help choose a direction, write
            a blueprint, and break the work into steps you can actually follow.
          </p>
          <div className="builder-start-steps">
            <span>
              <Check size={16} />
              Simple setup choices
            </span>
            <span>
              <Check size={16} />
              The right creative tools
            </span>
            <span>
              <Check size={16} />A roadmap you can edit
            </span>
          </div>
          <button className="button primary" onClick={onSetup}>
            Let’s map it out <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div className="builder-overview">
          <div className="builder-next">
            <span className="builder-eyebrow">
              <Sparkles size={14} />
              {next
                ? "YOUR NEXT STEP"
                : completed === workspace.tasks.length && workspace.tasks.length
                  ? "ROADMAP COMPLETE"
                  : "CLEAR THE WAY"}
            </span>
            <h2>
              {next?.title ||
                (completed === workspace.tasks.length && workspace.tasks.length
                  ? "Look at what you’ve made."
                  : "Review the decisions holding things up.")}
            </h2>
            <p>
              {next?.description ||
                "Keep your roadmap current as you learn more about your project."}
            </p>
            {next && (
              <button className="button primary" onClick={() => askTask(next)}>
                Work on this with Powwow <ArrowRight size={16} />
              </button>
            )}
          </div>
          <div className="builder-progress">
            <span className="builder-eyebrow">YOUR PROGRESS</span>
            <strong>
              {completed}
              <span> / {workspace.tasks.length}</span>
            </strong>
            <p>tasks checked off</p>
            <progress
              value={completed}
              max={workspace.tasks.length || 1}
              aria-label="Completed tasks"
            />
            <button onClick={() => onOpen("design")}>
              <FileText size={16} />
              Read the blueprint <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
      <div className="builder-toolbar">
        <div className="builder-toolbar-title">
          <ListTodo size={18} />
          <h2>Task board</h2>
          <span>{workspace.tasks.length}</span>
        </div>
        <div className="builder-toolbar-actions">
          <label className="builder-search">
            <Search size={15} />
            <input
              aria-label="Search tasks"
              placeholder="Find a task"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <SelectMenu
            ariaLabel="Filter tasks by phase"
            value={phase}
            onChange={setPhase}
            options={[
              { value: "all", label: "All phases" },
              ...[...new Set(workspace.tasks.map((task) => task.phase))].map(
                (value) => ({ value, label: value }),
              ),
            ]}
          />
          <div className="builder-view-switch">
            <button
              aria-label="Board view"
              aria-pressed={layout === "board"}
              onClick={() => setLayout("board")}
            >
              <Columns3 size={17} />
            </button>
            <button
              aria-label="List view"
              aria-pressed={layout === "list"}
              onClick={() => setLayout("list")}
            >
              <LayoutList size={17} />
            </button>
          </div>
          <button
            className="button"
            onClick={() => {
              setError("");
              setEditing({
                id: crypto.randomUUID(),
                title: "",
                description: "",
                status: "todo",
                phase: "Build",
                acceptance: [],
                depends_on: [],
                component: "tasks",
              });
            }}
          >
            <Plus size={16} />
            Add task
          </button>
        </div>
      </div>
      <div
        className={`builder-board ${layout === "list" ? "builder-list" : ""}`}
      >
        {statuses.map((status) => (
          <section
            className={`builder-column status-${status.id}`}
            key={status.id}
            aria-label={status.name}
          >
            <header>
              <span className="builder-status-dot" />
              <h3>{status.name}</h3>
              <span>
                {tasks.filter((task) => task.status === status.id).length}
              </span>
            </header>
            <p className="builder-column-hint">{status.description}</p>
            <div className="builder-cards">
              {tasks
                .filter((task) => task.status === status.id)
                .map((task) => (
                  <button
                    className="builder-task"
                    key={task.id}
                    onClick={() => {
                      setError("");
                      setEditing({
                        ...task,
                        acceptance: [...task.acceptance],
                        depends_on: [...task.depends_on],
                      });
                    }}
                  >
                    <span className="builder-task-phase">{task.phase}</span>
                    <strong>{task.title}</strong>
                    <p>{task.description}</p>
                    <footer>
                      {task.status === "done" ? (
                        <span>
                          <CheckCircle2 size={13} />
                          Completed
                        </span>
                      ) : blockers(task).length ? (
                        <span>
                          <LockKeyhole size={13} />
                          {blockers(task).length} prerequisite
                          {blockers(task).length > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span>
                          <Circle size={12} />
                          Ready to start
                        </span>
                      )}
                      <span>{task.acceptance.length} checks</span>
                    </footer>
                  </button>
                ))}
              {!tasks.some((task) => task.status === status.id) && (
                <div className="builder-empty-column">
                  {query || phase !== "all"
                    ? "No matching tasks"
                    : status.id === "done"
                      ? "Your wins will collect here."
                      : "Nothing here yet."}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
      {editing && (
        <Modal
          title={
            workspace.tasks.some((task) => task.id === editing.id)
              ? "Task details"
              : "Add a task"
          }
          onClose={() => !busy && setEditing(null)}
          wide
        >
          <form
            className="builder-task-form"
            onSubmit={(e) => {
              e.preventDefault();
              void saveTask(editing);
            }}
          >
            <fieldset className="builder-edit-fields" disabled={busy}>
              <label>
                Task title
                <input
                  required
                  maxLength={200}
                  value={editing.title}
                  onChange={(e) =>
                    setEditing({ ...editing, title: e.target.value })
                  }
                />
              </label>
              <label>
                What needs to happen?
                <textarea
                  rows={4}
                  value={editing.description}
                  onChange={(e) =>
                    setEditing({ ...editing, description: e.target.value })
                  }
                />
              </label>
              <div className="builder-form-pair">
                <label>
                  Status
                  <SelectMenu
                    ariaLabel="Status"
                    value={editing.status}
                    onChange={(value) =>
                      setEditing({
                        ...editing,
                        status: value as BuilderTask["status"],
                      })
                    }
                    options={statuses.map((status) => ({
                      value: status.id,
                      label: status.name,
                      disabled:
                        ["doing", "done"].includes(status.id) &&
                        blockers(editing).length > 0,
                    }))}
                  />
                </label>
                <label>
                  Phase
                  <input
                    required
                    value={editing.phase}
                    onChange={(e) =>
                      setEditing({ ...editing, phase: e.target.value })
                    }
                  />
                </label>
              </div>
              <label>
                Done when <small>One check per line</small>
                <textarea
                  rows={4}
                  value={editing.acceptance.join("\n")}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      acceptance: e.target.value.split("\n"),
                    })
                  }
                />
              </label>
              <label>
                Creative tool
                <SelectMenu
                  ariaLabel="Creative tool"
                  value={editing.component}
                  onChange={(value) =>
                    setEditing({ ...editing, component: value })
                  }
                  options={sortBuilderComponents(
                    workspace.components.map(
                      (id) =>
                        catalog.components.find((item) => item.id === id) || {
                          id,
                          name: id,
                          description: "",
                          icon: "",
                        },
                    ),
                  ).map((component) => ({
                    value: component.id,
                    label: builderComponentName(component),
                  }))}
                />
              </label>
              <fieldset className="builder-dependencies">
                <legend>
                  <Flag size={14} />
                  Finish these tasks first
                </legend>
                {workspace.tasks
                  .filter((task) => task.id !== editing.id)
                  .map((task) => (
                    <label key={task.id}>
                      <input
                        type="checkbox"
                        checked={editing.depends_on.includes(task.id)}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            depends_on: e.target.checked
                              ? [...editing.depends_on, task.id]
                              : editing.depends_on.filter(
                                  (id) => id !== task.id,
                                ),
                          })
                        }
                      />
                      <span>{task.title}</span>
                      {task.status === "done" && <Check size={14} />}
                    </label>
                  ))}
                {!workspace.tasks.filter((task) => task.id !== editing.id)
                  .length && <p>No other tasks yet.</p>}
              </fieldset>
              {blockers(editing).length > 0 && (
                <p className="builder-note">
                  Complete the prerequisites before moving this task to In
                  progress or Done.
                </p>
              )}
              {error && (
                <p role="alert" className="builder-error">
                  {error}
                </p>
              )}
            </fieldset>
            <footer className="builder-form-actions">
              {workspace.tasks.some((task) => task.id === editing.id) && (
                <button
                  type="button"
                  className="button"
                  disabled={busy}
                  onClick={async () => {
                    if (
                      !window.confirm(
                        `Remove “${editing.title}” from the task board? Its prerequisite links will also be removed.`,
                      )
                    )
                      return;
                    setBusy(true);
                    setError("");
                    try {
                      await onSave({
                        ...workspace,
                        tasks: workspace.tasks
                          .filter((task) => task.id !== editing.id)
                          .map((task) => ({
                            ...task,
                            depends_on: task.depends_on.filter(
                              (id) => id !== editing.id,
                            ),
                          })),
                      });
                      setEditing(null);
                    } catch (e) {
                      setError(e instanceof Error ? e.message : String(e));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <Trash2 size={14} />
                  Remove
                </button>
              )}
              <button
                type="button"
                className="button"
                disabled={busy || !editing.title.trim()}
                onClick={async () => {
                  if (
                    ["doing", "done"].includes(editing.status) &&
                    blockers(editing).length
                  ) {
                    setError(
                      "Complete the prerequisites first, or change this task to To do or Needs a decision.",
                    );
                    return;
                  }
                  setBusy(true);
                  setError("");
                  try {
                    const tasks = workspace.tasks.some(
                      (item) => item.id === editing.id,
                    )
                      ? workspace.tasks.map((item) =>
                          item.id === editing.id ? editing : item,
                        )
                      : [...workspace.tasks, editing];
                    await onSave({ ...workspace, tasks });
                    setEditing(null);
                    askTask(editing);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : String(e));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <Sparkles size={15} />
                Ask Powwow
              </button>
              <button
                className="button primary"
                disabled={busy || !editing.title.trim()}
              >
                {busy ? (
                  <LoaderCircle className="spin" size={15} />
                ) : (
                  <Check size={15} />
                )}
                {busy ? "Saving…" : "Save task"}
              </button>
            </footer>
          </form>
        </Modal>
      )}
    </section>
  );
}

export function BuilderDesign({
  workspace,
  onSave,
  onSetup,
  onAsk,
}: Pick<Props, "workspace" | "onSave" | "onSetup" | "onAsk">) {
  const [draft, setDraft] = useState(workspace.design),
    [editing, setEditing] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const dirty = editing && draft !== workspace.design;
  useBuilderNavigationGuard(dirty, busy);
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);
  async function save() {
    setBusy(true);
    setError("");
    try {
      await onSave({ ...workspace, design: draft });
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="builder-page builder-design">
      <header className="builder-heading">
        <div>
          <span className="builder-eyebrow">
            <Compass size={14} />
            THE SHARED PLAN
          </span>
          <h1>Blueprint</h1>
          <p>Your destination, decisions, and the path to a first version.</p>
        </div>
        <div className="builder-heading-actions">
          <button
            className="button"
            onClick={() => {
              if (canLeaveBuilder()) {
                setEditing(false);
                onSetup();
              }
            }}
          >
            <Compass size={15} />
            Review setup
          </button>
          <button
            className="button"
            disabled={!workspace.design}
            onClick={() =>
              downloadText("project-blueprint.md", workspace.design)
            }
          >
            <Download size={15} />
            Export
          </button>
          {!editing && (
            <button
              className="button primary"
              onClick={() => {
                setDraft(workspace.design);
                setEditing(true);
              }}
            >
              Edit blueprint
            </button>
          )}
        </div>
      </header>
      {!workspace.design && !editing ? (
        <div className="builder-start">
          <FileText size={30} />
          <h2>Give your idea a direction.</h2>
          <p>
            Guided setup will create a blueprint, record your choices, and build
            the first task list.
          </p>
          <button
            className="button primary"
            onClick={() => {
              if (canLeaveBuilder()) {
                setEditing(false);
                onSetup();
              }
            }}
          >
            Plan my project <ArrowRight size={15} />
          </button>
        </div>
      ) : editing ? (
        <div className="builder-design-editor">
          <label>
            Blueprint <span className="muted">Markdown supported</span>
            <textarea
              aria-label="Blueprint content"
              rows={26}
              disabled={busy}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          </label>
          {error && (
            <p role="alert" className="builder-error">
              {error}
            </p>
          )}
          <footer className="builder-form-actions">
            <button
              className="button"
              disabled={busy}
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
            <button className="button primary" disabled={busy} onClick={save}>
              {busy ? "Saving…" : "Save blueprint"}
            </button>
          </footer>
        </div>
      ) : (
        <>
          <article className="builder-document">
            <ReactMarkdown>{workspace.design}</ReactMarkdown>
          </article>
          <button
            className="button"
            onClick={() =>
              onAsk(
                "Review our saved blueprint. Identify the most important open decision, explain the tradeoffs simply, and help me resolve it before building. Focus on a small first version.",
              )
            }
          >
            <Sparkles size={16} />
            Think through this plan with Powwow
          </button>
        </>
      )}
    </section>
  );
}
