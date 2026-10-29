import type { Run } from "./api";

export function ProjectUpdateNotice({ run, onOpen }: { run?: Run; onOpen: (component: string) => void }) {
  const update = run?.model_provenance.project_update as { status?: string; message?: string; changes?: { component: string; title: string }[] } | undefined;
  if (!update) return null;
  if (update.status === "pending") return <div className="project-update-notice" role="status">Saving project updates…</div>;
  if (update.status === "applied") {
    if (!update.changes?.length) return null;
    return <div className="project-update-notice" aria-label="Saved project updates"><span>Updated</span>{update.changes.map((item, index) => <button type="button" key={index} onClick={() => onOpen(item.component)}>{item.title}</button>)}</div>;
  }
  const proposed = run?.model_provenance.project_reply as { records?: { component: string; title: string; fields: { name: string; value: string }[] }[] } | undefined;
  return <details className="project-update-review"><summary>Review project updates</summary><p>{update.message}</p>{proposed?.records?.map((item, index) => <section key={index}><button className="button subtle" onClick={() => onOpen(item.component)}>{item.title}</button>{item.fields.map((field) => <p key={field.name}><strong>{field.name.replaceAll("_", " ")}: </strong>{field.value}</p>)}</section>)}</details>;
}
