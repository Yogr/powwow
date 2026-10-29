import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Circle,
  Code2,
  Copy,
  Folder,
  ListTodo,
  LockKeyhole,
  Plus,
  RefreshCw,
  Settings2,
  Users,
  X,
} from "lucide-react";
import { patch, post, request } from "./api";
import type { Project } from "./api";
import { Modal } from "./components";
import {
  canManage,
  collaborationError,
  createTask,
  taskLabel,
  taskStates,
  updateTask,
} from "./collaboration";
import type {
  Invitation,
  Member,
  Organization,
  OrganizationPolicy,
  ProjectTask,
  SharedAgent,
  useCollaboration,
} from "./collaboration";
import "./collaboration.css";

type CollaborationState = ReturnType<typeof useCollaboration>;
export function OrganizationNav({
  state,
  view,
  selectedTask,
  onNavigate,
  onSwitch,
  onTask,
}: {
  state: CollaborationState;
  view: string;
  selectedTask?: string;
  onNavigate: (view: string) => void;
  onSwitch: (id: string) => void;
  onTask: (task: ProjectTask) => void;
}) {
  return (
    <div className="organization-nav">
      <label className="organization-select">
        <Users size={16} />
        <select
          aria-label="Organization"
          value={state.organizationId}
          onChange={(event) => onSwitch(event.target.value)}
        >
          {!state.organizations.length && (
            <option value="">Personal workspace</option>
          )}
          {state.organizations.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <button
          className="icon-button"
          aria-label="Manage organization"
          onClick={() => onNavigate("collab:organization")}
        >
          <Settings2 size={16} />
        </button>
      </label>
      <button
        className={`collab-nav-item ${view === "collab:home" ? "active" : ""}`}
        onClick={() => onNavigate("collab:home")}
      >
        <ListTodo size={17} />
        My tasks
        <span className="collab-count">
          {state.tasks.filter((item) => item.status !== "done").length}
        </span>
      </button>
      <button
        className={`collab-nav-item ${view === "collab:agents" ? "active" : ""}`}
        onClick={() => onNavigate("collab:agents")}
      >
        <Bot size={17} />
        Agents
      </button>
      <button className={`collab-nav-item ${view === "collab:code" ? "active" : ""}`} onClick={() => onNavigate("collab:code")}><Code2 size={17}/>Code review</button>
      {state.tasks
        .filter((item) => item.status !== "done")
        .slice(0, 8)
        .map((task) => (
          <button
            key={task.id}
            className={`collab-task-nav ${selectedTask === task.id ? "active" : ""}`}
            onClick={() => onTask(task)}
            title={task.title}
          >
            <Circle size={12} />
            <span>{task.title}</span>
          </button>
        ))}
    </div>
  );
}

function ErrorMessage({ error }: { error: string }) {
  return error ? (
    <p className="collab-error" role="alert">
      {error}
    </p>
  ) : null;
}
function Loading() {
  return (
    <p className="collab-empty" role="status">
      Loading…
    </p>
  );
}
function TaskRows({
  tasks,
  projects,
  onOpen,
}: {
  tasks: ProjectTask[];
  projects: Project[];
  onOpen: (task: ProjectTask) => void;
}) {
  return (
    <div className="collab-task-list">
      {tasks.map((task) => (
        <button
          className="collab-task-row"
          key={task.id}
          onClick={() => onOpen(task)}
        >
          {task.status === "done" ? (
            <CheckCircle2 size={18} />
          ) : (
            <Circle size={18} />
          )}
          <span className="collab-task-title">
            <strong>{task.title}</strong>
            <small>
              {projects.find((item) => item.id === task.project_id)?.name ||
                "Project"}
            </small>
          </span>
          <span className={`collab-status status-${task.status}`}>
            {taskLabel(task.status)}
          </span>
          <ArrowRight size={15} />
        </button>
      ))}
    </div>
  );
}

export function CollaborationHome({
  state,
  projects,
  onTask,
  onProject,
  onManage,
  onCreateProject,
}: {
  state: CollaborationState;
  projects: Project[];
  onTask: (task: ProjectTask) => void;
  onProject: (id: string) => void;
  onManage: () => void;
  onCreateProject: () => void;
}) {
  const [filter, setFilter] = useState("open");
  const tasks = state.tasks.filter(
    (task) =>
      filter === "all" ||
      (filter === "done" ? task.status === "done" : task.status !== "done"),
  );
  return (
    <section className="collab-page">
      <header className="collab-heading">
        <div>
          <span className="collab-eyebrow">
            {state.organization?.name || "Powwow"}
          </span>
          <h1>My tasks</h1>
        </div>
        <button className="button" onClick={onManage}>
          <Users size={16} />
          {state.organization ? "Invite people" : "Create organization"}
        </button>
      </header>
      <ErrorMessage error={state.error} />
      {state.loading ? (
        <Loading />
      ) : !state.organization ? (
        <div className="collab-onboarding">
          <Users size={28} />
          <h2>Start a shared workspace</h2>
          <p>Create an organization or join with an invite.</p>
          <button className="button primary" onClick={onManage}>
            Get started <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <>
          <div className="collab-toolbar">
            <div
              className="collab-segmented"
              aria-label="Filter assigned tasks"
            >
              {[
                { id: "open", label: "Open" },
                { id: "done", label: "Done" },
                { id: "all", label: "All" },
              ].map((item) => (
                <button
                  key={item.id}
                  aria-pressed={filter === item.id}
                  onClick={() => setFilter(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              className="icon-button"
              aria-label="Refresh tasks"
              onClick={state.refresh}
            >
              <RefreshCw size={16} />
            </button>
          </div>
          {tasks.length ? (
            <TaskRows tasks={tasks} projects={projects} onOpen={onTask} />
          ) : (
            <div className="collab-empty">
              <CheckCircle2 size={24} />
              <h2>
                {filter === "done"
                  ? "No completed tasks"
                  : "No tasks assigned to you"}
              </h2>
              <p>Open a project to add or pick up a task.</p>
            </div>
          )}
          <div className="collab-section-heading">
            <h2>Projects</h2>
            {state.organization.role !== "viewer" && (
              <button className="button subtle" onClick={onCreateProject}>
                <Plus size={16} />
                New project
              </button>
            )}
          </div>
          <div className="collab-project-grid">
            {projects
              .filter((item) => !item.archived)
              .map((project) => (
                <button
                  key={project.id}
                  className="collab-project"
                  onClick={() => onProject(project.id)}
                >
                  <Folder size={21} />
                  <strong>{project.name}</strong>
                  <ArrowRight size={15} />
                </button>
              ))}
          </div>
          {!projects.length && (
            <p className="collab-empty">No shared projects yet.</p>
          )}
        </>
      )}
    </section>
  );
}

export function SharedTaskBoard({
  project,
  organization,
  onOpen,
  onChange,
}: {
  project: Project;
  organization: Organization;
  onOpen: (task: ProjectTask) => void;
  onChange: () => void;
}) {
  const [tasks, setTasks] = useState<ProjectTask[]>([]),
    [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [creating, setCreating] = useState(false);
  const [query, setQuery] = useState(""),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true);
    void Promise.all([
      request<ProjectTask[]>(`/v1/projects/${project.id}/tasks`, {
        signal: abort.signal,
      }),
      request<Member[]>(`/v1/organizations/${organization.id}/members`, {
        signal: abort.signal,
      }),
    ])
      .then(([tasks, members]) => {
        setTasks(tasks);
        setMembers(members);
        setError("");
      })
      .catch((error) => {
        if (!abort.signal.aborted) setError(collaborationError(error));
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [project.id, organization.id, revision]);
  return (
    <section className="collab-page collab-board-page">
      <header className="collab-heading">
        <div>
          <span className="collab-eyebrow">{project.name}</span>
          <h1>Task board</h1>
        </div>
        {organization.role !== "viewer" && (
          <button className="button primary" onClick={() => setCreating(true)}>
            <Plus size={16} />
            Add task
          </button>
        )}
      </header>
      <ErrorMessage error={error} />
      <div className="collab-toolbar">
        <input
          aria-label="Search project tasks"
          placeholder="Search tasks"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button
          className="icon-button"
          aria-label="Refresh board"
          onClick={() => setRevision((value) => value + 1)}
        >
          <RefreshCw size={16} />
        </button>
      </div>
      {loading ? (
        <Loading />
      ) : (
        <div className="collab-board">
          {taskStates.map((state) => {
            const items = tasks.filter(
              (task) =>
                task.status === state.id &&
                `${task.title} ${task.description}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
            );
            return (
              <section className="collab-column" key={state.id}>
                <header>
                  <span className={`collab-dot ${state.id}`} />
                  <h2>{state.label}</h2>
                  <span>{items.length}</span>
                </header>
                {items.map((task) => (
                  <button
                    className="collab-task-card"
                    key={task.id}
                    onClick={() => onOpen(task)}
                  >
                    <strong>{task.title}</strong>
                    {task.description && <p>{task.description}</p>}
                    <span className="collab-assignee">
                      <Users size={13} />
                      {members.find(
                        (member) => member.user_id === task.assignee_id,
                      )?.display_name ||
                        (task.assignee_id ? "Member" : "Unassigned")}
                    </span>
                  </button>
                ))}
                {!items.length && (
                  <span className="collab-column-empty">No tasks</span>
                )}
              </section>
            );
          })}
        </div>
      )}
      {creating && (
        <TaskEditor
          members={members}
          onClose={() => setCreating(false)}
          onSave={async (values) => {
            await createTask(project.id, values);
            setCreating(false);
            setRevision((value) => value + 1);
            onChange();
          }}
        />
      )}
    </section>
  );
}

function TaskEditor({
  task,
  members,
  onClose,
  onSave,
}: {
  task?: ProjectTask;
  members: Member[];
  onClose: () => void;
  onSave: (body: {
    title: string;
    description: string;
    assignee_id: string | null;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState(task?.title || ""),
    [description, setDescription] = useState(task?.description || ""),
    [assignee, setAssignee] = useState(task?.assignee_id || "");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const flight = useRef(false);
  async function save(event: FormEvent) {
    event.preventDefault();
    if (flight.current) return;
    flight.current = true;
    setBusy(true);
    setError("");
    try {
      await onSave({
        title: title.trim(),
        description,
        assignee_id: assignee || null,
      });
    } catch (error) {
      setError(collaborationError(error));
    } finally {
      flight.current = false;
      setBusy(false);
    }
  }
  return (
    <Modal
      title={task ? "Edit task" : "Add task"}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form className="collab-form" onSubmit={(event) => void save(event)}>
        <label>
          Title
          <input
            autoFocus
            required
            maxLength={200}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label>
          Description
          <textarea
            rows={6}
            maxLength={20000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <label>
          Assign to
          <select
            value={assignee}
            onChange={(event) => setAssignee(event.target.value)}
          >
            <option value="">Unassigned</option>
            {members.filter(member => member.role !== "viewer" || member.user_id === assignee).map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.display_name || member.user_id}
              </option>
            ))}
          </select>
        </label>
        <ErrorMessage error={error} />
        <div className="collab-form-actions">
          <button
            type="button"
            className="button"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="button primary" disabled={busy || !title.trim()}>
            {busy ? "Saving…" : "Save task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function TaskContext({
  task,
  organization,
  onChanged,
  onClose,
}: {
  task: ProjectTask;
  organization: Organization;
  onChanged: (task: ProjectTask) => void;
  onClose: () => void;
}) {
  const [members, setMembers] = useState<Member[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [editing, setEditing] = useState(false),
    [expanded, setExpanded] = useState(true);
  useEffect(() => {
    const abort = new AbortController();
    void request<Member[]>(`/v1/organizations/${organization.id}/members`, {
      signal: abort.signal,
    })
      .then(setMembers)
      .catch((error) => {
        if (!abort.signal.aborted) setError(collaborationError(error));
      });
    return () => abort.abort();
  }, [organization.id]);
  async function save(body: Parameters<typeof updateTask>[1]) {
    setBusy(true);
    setError("");
    try {
      onChanged(await updateTask(task.id, body));
    } catch (error) {
      setError(collaborationError(error));
    } finally {
      setBusy(false);
    }
  }
  const writable = organization.role !== "viewer";
  return (
    <section className="collab-task-context" aria-label="Task description">
      <div className="collab-context-title">
        <button
          className="collab-task-toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          <ListTodo size={18} />
          <h1>{task.title}</h1>
        </button>
        {writable && <span className="collab-private">
          <LockKeyhole size={12} />
          Private chat
        </span>}
        <button
          className="icon-button"
          aria-label="Close task"
          onClick={onClose}
        >
          <X size={17} />
        </button>
      </div>
      {expanded && (
        <>
          <p className="collab-description">
            {task.description || "No description."}
          </p>
          <div className="collab-task-actions">
            <select
              aria-label="Task status"
              value={task.status}
              disabled={busy || !writable}
              onChange={(event) =>
                void save({
                  status: event.target.value as ProjectTask["status"],
                })
              }
            >
              {taskStates.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <select
              aria-label="Task assignee"
              value={task.assignee_id || ""}
              disabled={busy || !writable}
              onChange={(event) =>
                void save({ assignee_id: event.target.value || null })
              }
            >
              <option value="">Unassigned</option>
              {members.filter(member => member.role !== "viewer" || member.user_id === task.assignee_id).map((member) => (
                <option value={member.user_id} key={member.user_id} disabled={member.role === "viewer"}>
                  {member.display_name || member.user_id}
                </option>
              ))}
            </select>
            {writable && task.assignee_id !== organization.current_user_id && (
              <button
                className="button subtle"
                disabled={busy}
                onClick={() =>
                  void save({ assignee_id: organization.current_user_id })
                }
              >
                Assign to me
              </button>
            )}
            {writable && (
              <button
                className="button subtle"
                disabled={busy}
                onClick={() => setEditing(true)}
              >
                Edit
              </button>
            )}
          </div>
          <ErrorMessage error={error} />
        </>
      )}
      {editing && (
        <TaskEditor
          task={task}
          members={members}
          onClose={() => setEditing(false)}
          onSave={async (body) => {
            const updated = await updateTask(task.id, body);
            onChanged(updated);
            setEditing(false);
          }}
        />
      )}
    </section>
  );
}

export function OrganizationSettings({
  state,
  onJoined,
}: {
  state: CollaborationState;
  onJoined: () => void;
}) {
  const [tab, setTab] = useState(new URLSearchParams(window.location.search).has("invite") ? "create / join" : "people"),
    [name, setName] = useState(""),
    [token, setInviteToken] = useState(
      () => new URLSearchParams(window.location.search).get("invite") || "",
    );
  const [displayName, setDisplayName] = useState("");
  const [members, setMembers] = useState<Member[]>([]),
    [invites, setInvites] = useState<Invitation[]>([]),
    [usage, setUsage] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [createdInvite, setCreatedInvite] = useState<Invitation | null>(null),
    [copied, setCopied] = useState(false),
    [email, setEmail] = useState(""),
    [role, setRole] = useState("member"),
    [maxUses, setMaxUses] = useState(1);
  const [policy, setPolicy] = useState<OrganizationPolicy | null>(null),
    [models, setModels] = useState(""),
    [modelMode, setModelMode] = useState("configured"),
    [mcps, setMcps] = useState("");
  const [revision, setRevision] = useState(0),
    [loading, setLoading] = useState(false),
    [saved, setSaved] = useState(false);
  const flight = useRef(false);
  const org = state.organization,
    manage = canManage(org?.role);
  useEffect(() => {
    setMembers([]);
    setInvites([]);
    setPolicy(null);
    setUsage(null);
    setCreatedInvite(null);
    setSaved(false);
    if (!org) return;
    const abort = new AbortController();
    setLoading(true);
    void Promise.all([
      request<Member[]>(`/v1/organizations/${org.id}/members`, {
        signal: abort.signal,
      }),
      manage
        ? request<Invitation[]>(`/v1/organizations/${org.id}/invites`, {
            signal: abort.signal,
          })
        : Promise.resolve([]),
      manage
        ? request<OrganizationPolicy>(`/v1/organizations/${org.id}/policy`, {
            signal: abort.signal,
          })
        : Promise.resolve(null),
      manage
        ? request<Record<string, unknown>>(
            `/v1/organizations/${org.id}/usage`,
            { signal: abort.signal },
          )
        : Promise.resolve(null),
    ])
      .then(([members, invites, policy, usage]) => {
        if (abort.signal.aborted) return;
        setMembers(members);
        setInvites(invites);
        setPolicy(policy);
        setUsage(usage);
        setModels(policy?.allowed_models?.join("\n") || "");
        setModelMode(
          policy?.allowed_models === null
            ? "configured"
            : policy?.allowed_models?.length
              ? "selected"
              : "disabled",
        );
        setMcps(policy?.allowed_mcps.join("\n") || "");
        setError("");
      })
      .catch((error) => {
        if (!abort.signal.aborted) setError(collaborationError(error));
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [org?.id, manage, revision]);
  async function act(action: () => Promise<void>) {
    if (flight.current) return;
    flight.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (error) {
      setError(collaborationError(error));
    } finally {
      flight.current = false;
      setBusy(false);
    }
  }
  const inviteLink = createdInvite
    ? `${window.location.origin}/?invite=${encodeURIComponent(createdInvite.token || createdInvite.invite_code || "")}`
    : "";
  const split = (value: string) => [
    ...new Set(
      value
        .split(/[\n,]/)
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
  return (
    <section className="collab-page collab-settings">
      <header className="collab-heading">
        <div>
          <span className="collab-eyebrow">Organization</span>
          <h1>{org?.name || "Your workspace"}</h1>
        </div>
        {org && <span className="collab-status">{org.role}</span>}
      </header>
      <div className="collab-segmented collab-settings-tabs">
        {(org
          ? ["people", ...(manage ? ["access", "usage"] : []), "create / join"]
          : ["create / join"]
        ).map((item) => (
          <button
            key={item}
            aria-pressed={(org ? tab : "create / join") === item}
            onClick={() => setTab(item)}
          >
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>
      <ErrorMessage error={error} />
      {loading ? (
        <Loading />
      ) : !org || tab === "create / join" ? (
        <div className="collab-two-columns">
          <form
            className="collab-form"
            onSubmit={(event) => {
              event.preventDefault();
              void act(async () => {
                const created = await post<Organization>("/v1/organizations", {
                  name: name.trim(),
                });
                state.setOrganizationId(created.id);
                state.refresh();
                setName("");
                setTab("people");
                onJoined();
              });
            }}
          >
            <h2>Create an organization</h2>
            <label>
              Name
              <input
                required
                maxLength={120}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Team, family, or project group"
              />
            </label>
            <button className="button primary" disabled={busy || !name.trim()}>
              Create organization
            </button>
          </form>
          <form
            className="collab-form"
            onSubmit={(event) => {
              event.preventDefault();
              void act(async () => {
                let value = token.trim();
                try {
                  value = new URL(value).searchParams.get("invite") || value;
                } catch {
                  /* A plain invite code is valid. */
                }
                const joined = await post<Organization>("/v1/invites/accept", { token: value, display_name: displayName });
                state.setOrganizationId(joined.id);
                window.history.replaceState({}, "", window.location.pathname);
                state.refresh();
                setInviteToken("");
                setTab("people");
                onJoined();
              });
            }}
          >
            <h2>Join an organization</h2>
            <label>
              Invite link or code
              <input
                required
                value={token}
                onChange={(event) => setInviteToken(event.target.value)}
                autoComplete="off"
              />
            </label>
            <button className="button" disabled={busy || !token.trim()}>
              Join organization
            </button>
          </form>
        </div>
      ) : tab === "people" ? (
        <>
          <form className="collab-profile-form" onSubmit={event => { event.preventDefault(); void act(async () => { await patch(`/v1/organizations/${org.id}/members/${org.current_user_id}`, { display_name: displayName.trim() }); setRevision(value => value + 1); setDisplayName(""); }); }}>
            <label>Your name<input maxLength={100} placeholder={members.find(member => member.user_id === org.current_user_id)?.display_name || "Your name"} value={displayName} onChange={event => setDisplayName(event.target.value)}/></label><button className="button" disabled={busy || !displayName.trim()}>Save name</button>
          </form>
          <div className="collab-section-heading">
            <h2>
              People{" "}
              <span className="collab-count">
                {members.length} / {org.limits.members}
              </span>
            </h2>
          </div>
          <div className="collab-member-list">
            {members.map((member) => (
              <div className="collab-member" key={member.user_id}>
                <span className="collab-avatar">
                  {(member.display_name || "M")[0].toUpperCase()}
                </span>
                <strong>
                  {member.display_name || "Member"}
                  {member.user_id === org.current_user_id && (
                    <small> (you)</small>
                  )}
                </strong>
                {manage &&
                member.role !== "owner" && (org.role === "owner" || member.role !== "admin") &&
                member.user_id !== org.current_user_id ? (
                  <>
                    <select
                      aria-label={`Role for ${member.display_name || "member"}`}
                      disabled={busy}
                      value={member.role}
                      onChange={(event) =>
                        void act(async () => {
                          await patch(
                            `/v1/organizations/${org.id}/members/${member.user_id}`,
                            { role: event.target.value },
                          );
                          setRevision((value) => value + 1);
                        })
                      }
                    >
                      {[
                        "member",
                        "viewer",
                        ...(org.role === "owner" ? ["admin"] : []),
                      ].map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <button
                      className="button subtle"
                      disabled={busy}
                      onClick={() =>
                        void act(async () => {
                          await request(
                            `/v1/organizations/${org.id}/members/${member.user_id}`,
                            { method: "DELETE" },
                          );
                          setRevision((value) => value + 1);
                        })
                      }
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <span className="collab-status">{member.role}</span>
                )}
              </div>
            ))}
          </div>
          {manage && (
            <>
              <form
                className="collab-form collab-invite-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void act(async () => {
                    const invite = await post<Invitation>(
                      `/v1/organizations/${org.id}/invites`,
                      {
                        role,
                        expires_in_days: 7,
                        max_uses: maxUses,
                        email: email.trim() || null,
                      },
                    );
                    setCreatedInvite(invite);
                    setCopied(false);
                    setInvites((items) => [invite, ...items]);
                  });
                }}
              >
                <h2>Invite people</h2>
                <div className="collab-invite-fields">
                  <label>
                    Email restriction <span className="muted">optional</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@example.com"
                    />
                  </label>
                  <label>
                    Role
                    <select
                      value={role}
                      onChange={(event) => setRole(event.target.value)}
                    >
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                      {org.role === "owner" && (
                        <option value="admin">Admin</option>
                      )}
                    </select>
                  </label>
                  <label>
                    Uses
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={maxUses}
                      onChange={(event) =>
                        setMaxUses(Number(event.target.value))
                      }
                    />
                  </label>
                </div>
                <div className="collab-form-actions">
                  <span className="muted">Expires in 7 days</span>
                  <button className="button primary" disabled={busy}>
                    Create invite
                  </button>
                </div>
              </form>
              {createdInvite && (
                <div className="collab-created-invite" role="status">
                  <label>
                    Invite link
                    <input
                      readOnly
                      value={inviteLink}
                      onFocus={(event) => event.target.select()}
                    />
                  </label>
                  <div className="collab-form-actions">
                    <code>{createdInvite.invite_code}</code>
                    <button
                      className="button"
                      onClick={() =>
                        void navigator.clipboard
                          .writeText(inviteLink)
                          .then(() => setCopied(true))
                          .catch(() =>
                            setError("Select and copy the invite link."),
                          )
                      }
                    >
                      {copied ? <Check size={15} /> : <Copy size={15} />}{" "}
                      {copied ? "Copied" : "Copy link"}
                    </button>
                    <a
                      className="button"
                      href={`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Join ${org.name} on Powwow`)}&body=${encodeURIComponent(inviteLink)}`}
                    >
                      Open email draft
                    </a>
                    {navigator.share && (
                      <button
                        className="button"
                        onClick={() =>
                          void navigator
                            .share({
                              title: `Join ${org.name}`,
                              url: inviteLink,
                            })
                            .catch((error) => {
                              if (error.name !== "AbortError")
                                setError(collaborationError(error));
                            })
                        }
                      >
                        Share
                      </button>
                    )}
                  </div>
                </div>
              )}
              {invites.length > 0 && (
                <div className="collab-invites">
                  <h2>Invites</h2>
                  {invites.map((invite) => (
                    <div className="collab-invite-row" key={invite.id}>
                      <span>
                        {invite.email || "Invite link"}
                        <small>
                          {invite.role} · expires{" "}
                          {new Date(invite.expires_at).toLocaleDateString()}
                        </small>
                      </span>
                      {invite.revoked_at ? (
                        <span>Revoked</span>
                      ) : (
                        <button
                          className="button subtle"
                          disabled={busy}
                          onClick={() =>
                            void act(async () => {
                              await request(
                                `/v1/organizations/${org.id}/invites/${invite.id}`,
                                { method: "DELETE" },
                              );
                              if (createdInvite?.id === invite.id)
                                setCreatedInvite(null);
                              setRevision((value) => value + 1);
                            })
                          }
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      ) : tab === "access" && policy ? (
        <form
          className="collab-form collab-policy"
          onSubmit={(event) => {
            event.preventDefault();
            void act(async () => {
              const savedPolicy = await request<OrganizationPolicy>(
                `/v1/organizations/${org.id}/policy`,
                {
                  method: "PUT",
                  body: JSON.stringify({
                    ...policy,
                    allowed_models:
                      modelMode === "configured"
                        ? null
                        : modelMode === "disabled"
                          ? []
                          : split(models),
                    allowed_mcps: split(mcps),
                  }),
                },
              );
              setPolicy(savedPolicy);
              setSaved(true);
            });
          }}
        >
          <h2>Models and tools</h2>
          <label>
            Model access
            <select
              value={modelMode}
              onChange={(event) => {
                setModelMode(event.target.value);
                setSaved(false);
              }}
            >
              <option value="configured">Configured models</option>
              <option value="selected">Selected models</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>
          {modelMode === "selected" && (
            <label>
              Allowed model IDs
              <textarea
                required
                rows={4}
                value={models}
                placeholder="One model ID per line"
                onChange={(event) => {
                  setModels(event.target.value);
                  setSaved(false);
                }}
              />
            </label>
          )}
          <label>
            Allowed MCP IDs
            <textarea
              rows={3}
              value={mcps}
              placeholder="One MCP ID per line"
              onChange={(event) => {
                setMcps(event.target.value);
                setSaved(false);
              }}
            />
            <small>MCP execution is not connected yet.</small>
          </label>
          <label className="collab-checkbox">
            <input
              type="checkbox"
              checked={policy.allow_member_agents}
              onChange={(event) => {
                setPolicy({
                  ...policy,
                  allow_member_agents: event.target.checked,
                });
                setSaved(false);
              }}
            />
            Members can create agents
          </label>
          <div className="collab-form-actions">
            {saved && <span role="status">Saved</span>}
            <button className="button primary" disabled={busy}>
              {busy ? "Saving…" : "Save access"}
            </button>
          </div>
        </form>
      ) : tab === "usage" && usage ? (
        <div className="collab-usage">
          <h2>Free plan</h2>
          <dl>
            {[
              ["People", `${usage.members} / ${org.limits.members}`],
              ["Projects", `${usage.projects} / ${org.limits.projects}`],
              ["Agents", `${usage.agents} / ${org.limits.agents}`],
              [
                "Storage",
                `${Math.round(Number(usage.storage_used_bytes || 0) / 1024 ** 2)} / ${Math.round(org.limits.storage_bytes / 1024 ** 2)} MB`,
              ],
              [
                "AI cost recorded",
                `$${Number(usage.ai_spent_usd || 0).toFixed(2)}`,
              ],
              [
                "AI reserved",
                `$${Number(usage.ai_reserved_usd || 0).toFixed(2)}`,
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="muted">
            Paid plans and organization billing are not available yet. AI costs
            are tracked separately from collaboration limits.
          </p>
        </div>
      ) : null}
    </section>
  );
}

export function OrganizationAgents({
  organization,
}: {
  organization?: Organization;
}) {
  const [agents, setAgents] = useState<SharedAgent[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [editing, setEditing] = useState<SharedAgent | "new" | null>(null),
    [revision, setRevision] = useState(0),
    [policy, setPolicy] = useState<OrganizationPolicy | null>(null);
  useEffect(() => {
    setAgents([]);
    setPolicy(null);
    if (!organization) {
      setLoading(false);
      return;
    }
    const abort = new AbortController();
    setLoading(true);
    void Promise.all([
      request<SharedAgent[]>(`/v1/organizations/${organization.id}/agents`, {
        signal: abort.signal,
      }),
      request<OrganizationPolicy>(
        `/v1/organizations/${organization.id}/policy`,
        { signal: abort.signal },
      ),
    ])
      .then(([items, policy]) => {
        setAgents(items);
        setPolicy(policy);
        setError("");
      })
      .catch((error) => {
        if (!abort.signal.aborted) setError(collaborationError(error));
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [organization?.id, revision]);
  const writable =
    organization &&
    (canManage(organization.role) ||
      (organization.role === "member" && policy?.allow_member_agents));
  return (
    <section className="collab-page">
      <header className="collab-heading">
        <div>
          <span className="collab-eyebrow">
            {organization?.name || "Organization"}
          </span>
          <h1>Agents</h1>
        </div>
        {writable && (
          <button className="button primary" onClick={() => setEditing("new")}>
            <Plus size={16} />
            Create agent
          </button>
        )}
      </header>
      <ErrorMessage error={error} />
      {loading ? (
        <Loading />
      ) : !organization ? (
        <p className="collab-empty">
          Create or join an organization to share agents.
        </p>
      ) : (
        <>
          <p className="collab-note">
            Shared agent definitions. Agent execution is not connected yet.
          </p>
          {!agents.length ? (
            <div className="collab-empty">
              <Bot size={26} />
              <h2>No agents yet</h2>
              <p>Save instructions for your organization.</p>
            </div>
          ) : (
            <div className="collab-agent-grid">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  className="collab-agent-card"
                  onClick={() => setEditing(agent)}
                >
                  <Bot size={22} />
                  <h2>{agent.name}</h2>
                  <p>{agent.description || "No description"}</p>
                  <span className="collab-status">Definition</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {editing && organization && (
        <AgentEditor
          key={typeof editing === "string" ? editing : editing.id}
          organization={organization}
          agent={editing === "new" ? undefined : editing}
          writable={Boolean(writable && (editing === "new" || canManage(organization.role) || editing.created_by === organization.current_user_id))}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setRevision((value) => value + 1);
          }}
        />
      )}
    </section>
  );
}

function AgentEditor({
  organization,
  agent,
  writable,
  onClose,
  onSaved,
}: {
  organization: Organization;
  agent?: SharedAgent;
  writable: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(agent?.name || ""),
    [description, setDescription] = useState(agent?.description || ""),
    [instructions, setInstructions] = useState(agent?.instructions || ""),
    [model, setModel] = useState(agent?.model_id || "");
  const [mcps, setMcps] = useState(agent?.mcp_ids.join("\n") || "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const flight = useRef(false);
  async function save(event: FormEvent) {
    event.preventDefault();
    if (flight.current) return;
    flight.current = true;
    setBusy(true);
    setError("");
    try {
      const body = {
        name: name.trim(),
        description,
        instructions,
        model_id: model.trim() || null,
        mcp_ids: [...new Set(mcps.split(/[\n,]/).map(value => value.trim()).filter(Boolean))],
      };
      if (agent)
        await patch(
          `/v1/organizations/${organization.id}/agents/${agent.id}`,
          body,
        );
      else await post(`/v1/organizations/${organization.id}/agents`, body);
      onSaved();
    } catch (error) {
      setError(collaborationError(error));
    } finally {
      flight.current = false;
      setBusy(false);
    }
  }
  async function remove() {
    if (!agent || flight.current) return;
    flight.current = true; setBusy(true); setError("");
    try { await request(`/v1/organizations/${organization.id}/agents/${agent.id}`, { method: "DELETE" }); onSaved(); }
    catch(error) { setError(collaborationError(error)); }
    finally { flight.current = false; setBusy(false); }
  }
  return (
    <Modal
      title={agent ? agent.name : "Create agent"}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form className="collab-form" onSubmit={(event) => void save(event)}>
        <label>
          Name
          <input
            required
            maxLength={120}
            readOnly={!writable}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label>
          Description
          <input
            maxLength={1000}
            readOnly={!writable}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <label>
          Instructions
          <textarea
            required
            rows={8}
            maxLength={20000}
            readOnly={!writable}
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
          />
        </label>
        <label>
          Model ID <span className="muted">optional</span>
          <input
            readOnly={!writable}
            value={model}
            onChange={(event) => setModel(event.target.value)}
          />
        </label>
        <label>MCP IDs <span className="muted">optional</span><textarea rows={2} value={mcps} readOnly={!writable} onChange={event => setMcps(event.target.value)} placeholder="Organization-approved MCP IDs"/><small>Execution is not connected yet.</small></label>
        <ErrorMessage error={error} />
        {writable && (
          <div className="collab-form-actions">
            {agent && <button type="button" className="button subtle" disabled={busy} onClick={() => confirmDelete ? void remove() : setConfirmDelete(true)}>{confirmDelete ? "Confirm delete" : "Delete agent"}</button>}
            <button
              className="button primary"
              disabled={busy || !name.trim() || !instructions.trim()}
            >
              {busy ? "Saving…" : "Save agent"}
            </button>
          </div>
        )}
      </form>
    </Modal>
  );
}
