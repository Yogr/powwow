import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { ArrowRight, Check, Plus, Sparkles } from "lucide-react";
import { request } from "./api";
import { Modal } from "./components";
import { builderIcon } from "./builder";
import type { BuilderCatalog, BuilderWorkspace } from "./builder";
import type { Run } from "./api";
import "./project-experience.css";

export function projectComponents(workspace?: BuilderWorkspace) {
  const ids = [...new Set(workspace?.components || [])];
  return workspace?.kind === "language" || workspace?.kind === "book"
    ? ids.filter((id) => id !== "design" && id !== "tasks")
    : ids;
}

export function ProjectTabs({
  workspace,
  catalog,
  view,
  onOpen,
  onAdd,
}: {
  workspace: BuilderWorkspace;
  catalog: BuilderCatalog;
  view: string;
  onOpen: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <nav className="project-component-tabs" aria-label="Project components">
      {projectComponents(workspace).map((id, index) => {
        const Icon = builderIcon(id);
        return (
          <button
            key={id}
            style={{ "--arrival-index": index } as CSSProperties}
            aria-current={
              view === `builder:${id}` || view.startsWith(`builder:${id}:`)
                ? "page"
                : undefined
            }
            onClick={() => onOpen(id)}
          >
            <Icon size={16} />
            {catalog.components.find((item) => item.id === id)?.name || id}
          </button>
        );
      })}
      <button
        className="project-add-tab"
        onClick={onAdd}
        aria-label="Add project components"
      >
        <Plus size={16} />
      </button>
    </nav>
  );
}

export function ProjectThinking({ run, onDetails, onStop }: {
  run?: Run; onDetails?: () => void; onStop?: () => void;
}) {
  const [started] = useState(Date.now);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const timestamp = Date.parse(run?.started_at || run?.created_at || "");
  const elapsed = Math.max(0, Math.floor((now - (Number.isFinite(timestamp) ? timestamp : started)) / 1000));
  const status = ({
    queued: "Waiting to start", prepare: "Reading your request", lookup: "Looking up sources",
    classify: "Planning", experience_setup: "Setting up your project",
    interpret: "Working through the details", validate: "Checking the response", save: "Saving your work",
  } as Record<string, string>)[run?.stage || run?.status || "prepare"] || "Thinking";
  return <div className="project-thinking" aria-busy="true">
    <div className="thinking-beacon" aria-hidden="true"><Sparkles size={23} /></div>
    <div className="project-thinking-body">
      <div className="project-thinking-heading"><span key={status} className="thinking-status" role="status">{status}<span className="thinking-dots" aria-hidden="true">…</span></span>
        <span className="thinking-elapsed" aria-label={`${elapsed} seconds elapsed`}>{elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`}</span>
      </div>
      <div className="thinking-activity" aria-hidden="true"><span /></div>
      <div className="project-thinking-actions">
        {onDetails && <button onClick={onDetails}>Details</button>}
        {onStop && <button onClick={onStop}>Stop</button>}
      </div>
    </div>
  </div>;
}

export function ExperienceTour({
  kind,
  accountId,
  catalog,
  workspace,
  intro,
  arriving,
}: {
  kind: string;
  accountId: string;
  catalog: BuilderCatalog;
  workspace: BuilderWorkspace;
  intro?: string;
  arriving: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const storageKey = `powwow.tour:${accountId}:${kind}`;
  useEffect(() => {
    if (arriving) return;
    let alive = true;
    try {
      if (localStorage.getItem(storageKey)) return;
    } catch {
      /* Server is authoritative. */
    }
    void request<string[]>("/v1/account/experience-tours")
      .then((seen) => {
        if (alive) setOpen(!seen.includes(kind));
      })
      .catch(() => {
        if (alive) setOpen(true);
      });
    return () => {
      alive = false;
    };
  }, [kind, storageKey, arriving]);
  const name =
    catalog.kinds.find((item) => item.id === kind)?.name ||
    (kind === "book"
      ? "your novel"
      : kind === "language"
        ? "Language Studio"
        : "your project");
  const tools = projectComponents(workspace)
    .map((id) => catalog.components.find((item) => item.id === id))
    .filter((item) => !!item);
  const pages =
    kind === "language"
      ? [
          {
            title: "Your personal language tutor",
            text: "Practice reading and speaking through short daily conversations. Start with a few words, ask for help, and build from there.",
          },
          {
            title: "Understand as you go",
            text: "Click a word to show its translation, or translate the whole sentence. Listen to the tutor, then use Slow to hear it at a gentler pace.",
          },
          {
            title: "Make it a conversation",
            text: "Type or speak into the chat at the bottom. Ask about something you enjoy, mix in your fluent language when you need help, and return to earlier conversations in the day tabs.",
          },
        ]
      : [
          {
            title: `Welcome to ${name}`,
            text:
              intro ||
              "Tell Powwow what you have in mind. Your ideas and details will take shape in the components of this project.",
          },
          {
            title: "A place for each idea",
            text:
              kind === "book"
                ? "Project Details keeps your characters, story ideas, and references in categories you can customize. Write your chapters in the Book & Script Editor."
                : "Use the tabs to open your project's components. Start with what you need; add more components as your work grows.",
          },
          {
            title: "Keep the conversation going",
            text: "The chat stays at the bottom while you work. Add ideas, ask for changes, or describe what comes next. Powwow saves the details into the relevant components.",
          },
        ];
  async function finish() {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await request(`/v1/account/experience-tours/${kind}`, { method: "PUT" });
      try {
        localStorage.setItem(storageKey, "seen");
      } catch {
        /* Persisted on the account. */
      }
      setOpen(false);
    } catch {
      setError("Couldn't save this preference. Try again.");
    } finally {
      setSaving(false);
    }
  }
  if (!open) return null;
  return (
    <Modal title="Welcome to your project" onClose={() => void finish()}>
      <div className="experience-tour">
        <div className="tour-symbol" aria-hidden="true">
          <Sparkles size={30} />
        </div>
        <span className="tour-progress">
          {step + 1} / {pages.length}
        </span>
        <div key={step} className="tour-page">
          <h2>{pages[step].title}</h2>
          <p>{pages[step].text}</p>
        </div>
        {step === 1 && kind !== "language" && (
          <div className="tour-components">
            {tools.map((tool) => (
              <span key={tool.id}>{tool.name}</span>
            ))}
          </div>
        )}
        {error && <p role="alert">{error}</p>}
        <div className="tour-actions">
          <button
            className="button subtle"
            disabled={saving}
            onClick={() => (step ? setStep(step - 1) : void finish())}
          >
            {step ? "Back" : "Skip tour"}
          </button>
          <button
            className="button primary"
            disabled={saving}
            onClick={() =>
              step < pages.length - 1 ? setStep(step + 1) : void finish()
            }
          >
            {step < pages.length - 1 ? (
              <>
                Next <ArrowRight size={15} />
              </>
            ) : (
              <>
                Let's begin <Check size={15} />
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
