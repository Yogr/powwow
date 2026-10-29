import { useState } from "react";
import SelectMenu from "./SelectMenu";
import {
  Box,
  Check,
  FolderOpen,
  Link2,
  LockKeyhole,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Modal, pretty, relativeTime, capabilityNames } from "./components";
import { post, request, patch } from "./api";
import type {
  Project,
  Chat,
  Artifact,
  Grant,
  Model,
  Skill,
  Capability,
  Run,
} from "./api";

export type Catalog = {
  models: Model[];
  skills: Skill[];
  capabilities: Capability[];
  workflows: {
    id: string;
    name?: string;
    description?: string;
    version?: string;
    stages?: unknown[];
  }[];
  providers: {
    id: string;
    name?: string;
    available?: boolean;
    enabled?: boolean;
    status?: string;
  }[];
};

export function ContextPanel({
  project,
  chat,
  projects,
  chats,
  artifacts,
  grants,
  onRefresh,
  onError,
  onClose,
}: {
  project: Project;
  chat?: Chat;
  projects: Project[];
  chats: Chat[];
  artifacts: Artifact[];
  grants: Grant[];
  onRefresh: () => void;
  onError: (error: string) => void;
  onClose: () => void;
}) {
  const [scope, setScope] = useState<string>(
    chat?.context_mode || project.context_mode || "project",
  );
  const [sourceType, setSourceType] = useState("project");
  const [sourceId, setSourceId] = useState("");
  const [busy, setBusy] = useState(false);
  const sources =
    sourceType === "project"
      ? projects
          .filter((p) => p.id !== project.id)
          .map((p) => ({ id: p.id, name: p.name }))
      : sourceType === "chat"
        ? chats
            .filter((c) => c.id !== chat?.id)
            .map((c) => ({ id: c.id, name: c.title }))
        : artifacts.map((a) => ({ id: a.id, name: a.name }));
  async function saveScope(value: string) {
    setBusy(true);
    try {
      await patch(
        `/v1/${chat ? `chats/${chat.id}` : `projects/${project.id}`}`,
        { context_mode: value },
      );
      setScope(value);
      onRefresh();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function grant() {
    if (!sourceId) return;
    setBusy(true);
    try {
      await post("/v1/context-grants", {
        destination_project_id: project.id,
        source_type: sourceType,
        source_id: sourceId,
        mode: sourceType === "project" ? "live" : "snapshot",
      });
      setSourceId("");
      onRefresh();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Choose what Powwow can use" onClose={onClose} wide>
      <div className="modal-body">
        <p className="muted">
          Give each conversation the right context. Your other projects stay
          separate unless you share them.
        </p>
        <div className="scope-options">
          {[
            {
              id: "chat",
              title: "This chat only",
              description: "Messages and attachments in this conversation.",
              icon: LockKeyhole,
            },
            {
              id: "project",
              title: "This project",
              description: `Eligible sources in ${project.name}.`,
              icon: FolderOpen,
            },
            {
              id: "selected",
              title: "Selected sources",
              description:
                "This conversation and the sources you explicitly share.",
              icon: Link2,
            },
          ].map((item) => (
            <button
              key={item.id}
              disabled={busy}
              className={`scope-option ${scope === item.id ? "selected" : ""}`}
              onClick={() => saveScope(item.id)}
            >
              <item.icon size={20} />
              <span>
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
              {scope === item.id && <Check size={17} />}
            </button>
          ))}
        </div>
        <div className="section-heading">
          <h3>Shared with this project</h3>
          <span className="count">
            {grants.filter((g) => !g.revoked_at).length}
          </span>
        </div>
        {grants
          .filter((g) => !g.revoked_at)
          .map((g) => (
            <div className="grant-row" key={g.id}>
              <Link2 size={16} />
              <span>
                <strong>
                  {g.source_name ||
                    (g.source_type === "project"
                      ? projects.find((p) => p.id === g.source_id)?.name
                      : g.source_type === "chat"
                        ? chats.find((c) => c.id === g.source_id)?.title
                        : artifacts.find((a) => a.id === g.source_id)?.name) ||
                    "Shared source"}
                </strong>
                <small>
                  {g.mode === "live"
                    ? "Live project link"
                    : `Snapshot · ${new Date(g.created_at).toLocaleDateString()}`}
                </small>
              </span>
              <button
                className="icon-button"
                aria-label="Revoke shared source"
                onClick={async () => {
                  try {
                    await request(`/v1/context-grants/${g.id}`, {
                      method: "DELETE",
                    });
                    onRefresh();
                  } catch (e) {
                    onError((e as Error).message);
                  }
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        {!grants.filter((g) => !g.revoked_at).length && (
          <div className="inline-empty">
            <ShieldCheck size={19} />
            <span>No outside sources are shared.</span>
          </div>
        )}
        <div className="grant-form">
          <label>
            Source type
            <SelectMenu
              ariaLabel="Source type"
              value={sourceType}
              onChange={(value) => {
                setSourceType(value);
                setSourceId("");
              }}
              options={[
                { value: "project", label: "Project · live link" },
                { value: "chat", label: "Chat · snapshot" },
                { value: "artifact", label: "Artifact · snapshot" },
              ]}
            />
          </label>
          <label>
            Source
            <SelectMenu
              ariaLabel="Source"
              value={sourceId}
              onChange={setSourceId}
              options={[
                { value: "", label: "Choose a source" },
                ...sources.map((source) => ({
                  value: source.id,
                  label: source.name,
                })),
              ]}
            />
          </label>
          <button
            className="button primary"
            disabled={!sourceId || busy}
            onClick={grant}
          >
            <Plus size={15} /> Share source
          </button>
        </div>
        <p className="footnote">
          Revoking a source stops future retrieval. Answers and snapshots
          already created keep their content. Project links never follow other
          links.
        </p>
      </div>
    </Modal>
  );
}

export function RunDetails({ run }: { run?: Run }) {
  const skills = Array.isArray(run?.model_provenance.skills)
    ? run.model_provenance.skills.filter(
        (skill): skill is string => typeof skill === "string",
      )
    : [];
  const sourceTitle = (source: Record<string, unknown>) =>
    String(
      source.name ||
        source.title ||
        (source.source_type === "message"
          ? source.role === "user"
            ? "Your message"
            : "Earlier response"
          : pretty(String(source.source_type || "Shared context"))),
    );
  return (
    <section className="details-content">
      <div className="section-heading">
        <h3>About this result</h3>
        <Box size={17} />
      </div>
      {!run ? (
        <p className="muted">
          See how Powwow approached your request and which context it used.
        </p>
      ) : (
        <>
          <dl className="detail-list">
            <div>
              <dt>Outcome</dt>
              <dd>
                {capabilityNames[run.capability] || pretty(run.capability)}
              </dd>
            </div>
            <div>
              <dt>Model</dt>
              <dd>{run.model || run.model_id || "Chosen by Powwow"}</dd>
            </div>
            {run.settings.project_experience === true && <>
              <div><dt>Classifier</dt><dd>{String((run.model_provenance.classifier as { model?: string } | undefined)?.model || (run.status === "failed" || run.status === "cancelled" ? "Not completed" : "Pending"))}</dd></div>
              <div><dt>Response source</dt><dd>{run.model_provenance.response_source === "authored_experience_intro" ? "Authored experience welcome" : run.model_provenance.response_source === "clarification" ? "Clarification" : !run.output_text ? "No response generated" : "Model response"}</dd></div>
              <div><dt>Quality status</dt><dd>Candidate · live evaluation and owner review pending</dd></div>
            </>}
            {skills.length > 0 && (
              <div>
                <dt>Guidance used</dt>
                <dd>
                  {skills
                    .map((skill) => pretty(skill.replace(/@.*$/, "")))
                    .join(", ")}
                </dd>
              </div>
            )}
            <div>
              <dt>Started</dt>
              <dd>{relativeTime(run.created_at)}</dd>
            </div>
          </dl>
          <h4>Context used</h4>
          <div className="context-sources">
            {run.context_snapshot.map((source, index) => (
              <details
                key={`${String(source.source_id || source.url || index)}`}
              >
                <summary>{sourceTitle(source)}</summary>
                <p>{String(source.content || "Included with this request.")}</p>
                {typeof source.url === "string" && (
                  <a href={source.url} target="_blank" rel="noreferrer">
                    Read source
                  </a>
                )}
              </details>
            ))}
            {run.context_snapshot.length === 0 && (
              <p className="muted">No additional context was included.</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
