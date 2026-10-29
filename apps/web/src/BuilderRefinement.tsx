import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Check, LoaderCircle, Sparkles, Square } from "lucide-react";
import { post, request } from "./api";
import type { Run } from "./api";
import { Modal, running } from "./components";
import type { BuilderTask, WorkspaceEnvelope } from "./builder";

type Proposal = {
  run_id: string;
  version: number;
  design: string;
  tasks: BuilderTask[];
};
export function BuilderRefinement({
  projectId,
  envelope,
  run,
  onStart,
  onCancel,
  onApplied,
}: {
  projectId: string;
  envelope: WorkspaceEnvelope;
  run?: Run;
  budget: string;
  onStart: () => Promise<void>;
  onCancel: (run: Run) => void;
  onApplied: (value: WorkspaceEnvelope) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [proposal, setProposal] = useState<Proposal | null>(null);
  const active = run && running(run.status);
  const stale =
    run && Number(run.settings.workspace_version) !== envelope.version;
  async function start() {
    setBusy(true);
    setError("");
    try {
      await onStart();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  async function review() {
    if (!run) return;
    setBusy(true);
    setError("");
    try {
      setProposal(
        await request<Proposal>(
          `/v1/projects/${projectId}/plan-refinements/${run.id}`,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  async function apply() {
    if (!proposal) return;
    setBusy(true);
    setError("");
    try {
      const saved = await post<WorkspaceEnvelope>(
        `/v1/projects/${projectId}/apply-refinement`,
        { run_id: proposal.run_id, version: proposal.version },
      );
      onApplied(saved);
      setProposal(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section className="builder-refinement" aria-label="AI project planning">
        <Sparkles size={18} />
        <div>
          <strong>
            {active
              ? "Powwow is thinking through your idea"
              : run?.status === "succeeded" && !stale
                ? "A more detailed plan is ready to review"
                : "Make the roadmap specific to your idea"}
          </strong>
          <p>
            {active
              ? "Finding missing steps, testing assumptions, and proposing a blueprint and task breakdown. Your current plan stays editable."
              : run?.status === "failed"
                ? "The planning run could not finish. Your saved roadmap is ready to use; you can try again."
                : stale
                  ? "Your project has changed since the last planning pass. Start a fresh pass to include your latest work."
                  : "An AI planning pass builds on your brief and setup choices. Review its proposal before applying it."}
          </p>
          {error && (
            <div>
              <p role="alert" className="builder-error">
                {error}
              </p>
              {!active && !proposal && (
                <button className="button" disabled={busy} onClick={start}>
                  Start a fresh planning pass
                </button>
              )}
            </div>
          )}
        </div>
        {active ? (
          <button className="button" onClick={() => onCancel(run)}>
            <Square size={12} />
            Stop planning
          </button>
        ) : run?.status === "succeeded" && !stale ? (
          <button className="button" disabled={busy} onClick={review}>
            {busy ? (
              <LoaderCircle size={15} className="spin" />
            ) : (
              <Sparkles size={15} />
            )}
            Review proposed plan
          </button>
        ) : (
          <button className="button" disabled={busy} onClick={start}>
            {busy ? (
              <LoaderCircle size={15} className="spin" />
            ) : (
              <Sparkles size={15} />
            )}
            Deepen with AI
          </button>
        )}
      </section>
      {proposal && (
        <Modal
          title="Review Powwow’s proposed plan"
          onClose={() => !busy && setProposal(null)}
          wide
        >
          <div className="modal-body">
            <p className="muted">
              Applying updates the blueprint and adds proposed tasks. Your
              existing tasks and editor content are kept. Check the choices and
              claims before using them.
            </p>
            <article className="builder-document" style={{ marginTop: 20 }}>
              <ReactMarkdown>{proposal.design}</ReactMarkdown>
            </article>
            <h3>
              {proposal.tasks.length} proposed task
              {proposal.tasks.length === 1 ? "" : "s"}
            </h3>
            <div className="builder-proposal-tasks">
              {proposal.tasks.map((task) => (
                <div key={task.id}>
                  <span className="builder-eyebrow">{task.phase}</span>
                  <strong>{task.title}</strong>
                  <p>{task.description}</p>
                  <ul>
                    {task.acceptance.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {error && (
              <p role="alert" className="builder-error">
                {error}
              </p>
            )}
            <div className="builder-form-actions">
              <button
                className="button"
                disabled={busy}
                onClick={() => setProposal(null)}
              >
                Keep current plan
              </button>
              <button
                className="button primary"
                disabled={busy}
                onClick={apply}
              >
                {busy ? (
                  <LoaderCircle size={15} className="spin" />
                ) : (
                  <Check size={15} />
                )}
                Apply proposed plan
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
