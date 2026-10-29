import { useCallback, useEffect, useState } from "react";
import { patch, post, request } from "./api";
import type { Chat } from "./api";

export type OrganizationRole = "owner" | "admin" | "member" | "viewer";
export type Organization = {
  id: string;
  name: string;
  role: OrganizationRole;
  plan: string;
  limits: Record<string, number>;
  current_user_id: string;
};
export type Member = {
  user_id: string;
  email?: string | null;
  display_name?: string;
  role: OrganizationRole;
};
export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type ProjectTask = {
  id: string;
  organization_id: string;
  project_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
};
export type SharedAgent = {
  created_by?: string;
  id: string;
  name: string;
  description: string;
  instructions: string;
  model_id?: string | null;
  mcp_ids: string[];
  enabled?: boolean;
  execution_available: boolean;
};
export type OrganizationPolicy = {
  allowed_models: string[] | null;
  allowed_mcps: string[];
  allow_member_agents: boolean;
};
export type Invitation = {
  id: string;
  role: OrganizationRole;
  email?: string | null;
  expires_at: string;
  max_uses: number;
  uses?: number;
  revoked_at?: string | null;
  token?: string;
  invite_code?: string;
};
export const taskStates: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "To do" },
  { id: "in_progress", label: "In progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
];
export const taskLabel = (status: TaskStatus) =>
  taskStates.find((item) => item.id === status)?.label || status;
export const collaborationError = (error: unknown) =>
  error instanceof Error ? error.message : String(error);
export const canManage = (role?: OrganizationRole) =>
  role === "owner" || role === "admin";

export function useCollaboration(active: boolean, accountRevision: number) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    setOrganizations([]);
    setOrganizationId("");
    setTasks([]);
  }, [accountRevision]);
  useEffect(() => {
    if (!active) return;
    const abort = new AbortController();
    setLoading(true);
    void request<Organization[]>("/v1/organizations", { signal: abort.signal })
      .then((items) => {
        if (abort.signal.aborted) return;
        setOrganizations(items);
        setOrganizationId((current) =>
          current && items.some((item) => item.id === current)
            ? current
            : items[0]?.id || "",
        );
        setError("");
      })
      .catch((error) => {
        if (!abort.signal.aborted) setError(collaborationError(error));
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [active, accountRevision, revision]);
  useEffect(() => {
    setTasks([]);
    if (!active || !organizationId) return;
    const abort = new AbortController();
    const load = () =>
      request<ProjectTask[]>(
        `/v1/tasks?assigned_to_me=true&organization_id=${encodeURIComponent(organizationId)}`,
        { signal: abort.signal },
      )
        .then((items) => {
          if (!abort.signal.aborted) setTasks(items);
        })
        .catch((error) => {
          if (!abort.signal.aborted) setError(collaborationError(error));
        });
    void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 15000);
    return () => {
      abort.abort();
      window.clearInterval(timer);
    };
  }, [active, organizationId, revision, accountRevision]);
  return {
    organizations,
    organizationId,
    setOrganizationId,
    tasks,
    error,
    loading,
    refresh,
    organization: organizations.find((item) => item.id === organizationId),
  };
}

export const createTask = (
  projectId: string,
  body: { title: string; description: string; assignee_id?: string | null },
) => post<ProjectTask>(`/v1/projects/${projectId}/tasks`, body);
export const updateTask = (
  id: string,
  body: Partial<
    Pick<ProjectTask, "title" | "description" | "status" | "assignee_id">
  >,
) => patch<ProjectTask>(`/v1/tasks/${id}`, body);
export const openTaskChat = (id: string) =>
  request<Chat>(`/v1/tasks/${id}/chat`, { method: "PUT" });
