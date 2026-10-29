export type PendingOperation = {
  key: string;
  scope: string;
  kind: "run" | "retry" | "refinement";
  path: string;
  body: Record<string, unknown>;
  chatId: string;
  prompt: string;
  retryRunId?: string;
  createdAt: string;
};

export function readOperations(scope: string): PendingOperation[] {
  try {
    const data: unknown = JSON.parse(
      sessionStorage.getItem(`powwow.pending.${scope}`) || "[]",
    );
    if (!Array.isArray(data)) return [];
    return data.filter((value): value is PendingOperation =>
      Boolean(
        value &&
        value.scope === scope &&
        typeof value.key === "string" &&
        value.body?.idempotency_key === value.key &&
        (value.path === "/v1/runs" ||
          /^\/v1\/runs\/[a-zA-Z0-9-]+\/retry$/.test(value.path) ||
          /^\/v1\/projects\/[a-zA-Z0-9-]+\/plan-refinement$/.test(value.path)),
      ),
    );
  } catch {
    return [];
  }
}

export function writeOperations(scope: string, operations: PendingOperation[]) {
  // Do not dispatch billable work if its recovery record cannot be saved.
  sessionStorage.setItem(`powwow.pending.${scope}`, JSON.stringify(operations));
}
