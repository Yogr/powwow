import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronRight, Code2, Download, FileCode2, Folder, FolderOpen, GitCompareArrows, Pencil, Upload, WrapText, X } from 'lucide-react';
import { CODE_REVIEW_LIMITS, displayPath, parseUnifiedDiff } from './codeReviewDiff';
import type { DiffFile } from './codeReviewDiff';
import './code-review.css';

type Document = { id: string; name: string; path: string; kind: 'source' | 'patch'; text: string; original: string; files: DiffFile[]; bytes: number };
type Entry = { id: string; document: Document; path: string; diff?: DiffFile };
type TreeNode = { name: string; path: string; children: Map<string, TreeNode>; entries: Entry[] };

function download(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name.split('/').at(-1) || 'changes.patch'; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function fileTree(entries: Entry[]) {
  const root: TreeNode = { name: '', path: '', children: new Map(), entries: [] };
  for (const entry of entries) {
    const parts = entry.path.split('/'); let node = root;
    for (const part of parts.slice(0, -1)) {
      if (!node.children.has(part)) node.children.set(part, { name: part, path: `${node.path}/${part}`, children: new Map(), entries: [] });
      node = node.children.get(part)!;
    }
    node.entries.push(entry);
  }
  return root;
}

export default function CodeReview({ projectName }: { projectName?: string } = {}) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selected, setSelected] = useState('');
  const [wrap, setWrap] = useState(true);
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null), folderInput = useRef<HTMLInputElement>(null);
  const importing = useRef(false);
  const entries = useMemo<Entry[]>(() => documents.flatMap(doc => doc.kind === 'source' ? [{ id: doc.id, document: doc, path: doc.path }] : doc.files.map((diff, index) => ({ id: `${doc.id}:${index}`, document: doc, path: diff.path, diff }))), [documents]);
  const active = entries.find(entry => entry.id === selected) || entries[0];
  const visible = entries.filter(entry => entry.path.toLowerCase().includes(filter.toLowerCase()));
  const tree = useMemo(() => fileTree(visible), [visible]);
  const dirty = documents.some(doc => doc.text !== doc.original || (drafts[doc.id] !== undefined && drafts[doc.id] !== doc.text));
  const activeDraft = active ? drafts[active.document.id] ?? active.document.text : '';
  const changedDraft = active ? activeDraft !== active.document.text : false;

  useEffect(() => { folderInput.current?.setAttribute('webkitdirectory', ''); }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  async function importFiles(list: FileList | null, folder: boolean) {
    if (!list?.length || importing.current) return;
    importing.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const files = Array.from(list);
      if (files.length + documents.length > CODE_REVIEW_LIMITS.files) throw new Error('Import up to 200 files. Choose a smaller folder or clear this review.');
      const total = files.reduce((sum, file) => sum + file.size, documents.reduce((sum, doc) => sum + doc.bytes, 0));
      if (total > CODE_REVIEW_LIMITS.totalBytes) throw new Error('This review is limited to 8 MiB. Choose fewer files.');
      const imported: Document[] = [];
      let skipped = 0;
      for (const file of files) {
        const relativePath = folder ? file.webkitRelativePath.split('/').slice(1).join('/') || file.name : file.name;
        if (/(^|\/)(\.git|node_modules|\.env(?:\.[^/]*)?|dist|build)(\/|$)/.test(relativePath)) { skipped++; continue; }
        if (file.size > CODE_REVIEW_LIMITS.fileBytes) throw new Error(`${file.name} exceeds 1 MiB. Choose a smaller file.`);
        const data = new Uint8Array(await file.arrayBuffer());
        let text: string;
        try { text = new TextDecoder('utf-8', { fatal: true }).decode(data); }
        catch { skipped++; continue; }
        if (text.includes('\0')) { skipped++; continue; }
        if (text.split('\n').length > CODE_REVIEW_LIMITS.lines) throw new Error(`${file.name} exceeds 20,000 lines.`);
        const kind = /\.(diff|patch)$/i.test(file.name) ? 'patch' : 'source';
        imported.push({ id: crypto.randomUUID(), name: file.name, path: displayPath(relativePath), kind, text, original: text, files: kind === 'patch' ? parseUnifiedDiff(text) : [], bytes: file.size });
      }
      const newEntries = imported.reduce((sum, doc) => sum + (doc.kind === 'patch' ? doc.files.length : 1), entries.length);
      if (newEntries > CODE_REVIEW_LIMITS.files) throw new Error('This review can show at most 200 source or changed files.');
      if (!imported.length) throw new Error('No readable UTF-8 source files found. Binary, dependency, build and .env files are skipped.');
      setDocuments(previous => [...previous, ...imported]);
      setSelected(imported[0].kind === 'patch' ? `${imported[0].id}:0` : imported[0].id);
      setEditing(false); setFilter('');
      setNotice(`${imported.length} ${imported.length === 1 ? 'file' : 'files'} imported${skipped ? ` · ${skipped} skipped` : ''}.`);
    } catch (value) { setError(value instanceof Error ? value.message : 'Unable to import these files.'); }
    finally { importing.current = false; setBusy(false); if (fileInput.current) fileInput.current.value = ''; if (folderInput.current) folderInput.current.value = ''; }
  }
  function updatePreview() {
    if (!active) return;
    try {
      const bytes = new TextEncoder().encode(activeDraft).length;
      if (bytes > CODE_REVIEW_LIMITS.fileBytes || activeDraft.split('\n').length > CODE_REVIEW_LIMITS.lines) throw new Error('Keep each draft within 1 MiB and 20,000 lines.');
      const files = active.document.kind === 'patch' ? parseUnifiedDiff(activeDraft) : [];
      if (entries.filter(entry => entry.document.id !== active.document.id).length + Math.max(1, files.length) > CODE_REVIEW_LIMITS.files) throw new Error('This review can show at most 200 source or changed files.');
      if (documents.filter(doc => doc.id !== active.document.id).reduce((sum, doc) => sum + doc.bytes, bytes) > CODE_REVIEW_LIMITS.totalBytes) throw new Error('Keep the complete review within 8 MiB.');
      setDocuments(previous => previous.map(doc => doc.id === active.document.id ? { ...doc, text: activeDraft, bytes, files } : doc));
      setReviewed(previous => new Set([...previous].filter(id => id !== active.document.id && !id.startsWith(`${active.document.id}:`))));
      setSelected(active.document.kind === 'patch' ? `${active.document.id}:0` : active.document.id);
      setEditing(false); setError(''); setNotice('Preview updated. Download to keep your edits.');
    } catch (value) { setError((value as Error).message); }
  }
  function clear() {
    if (dirty && !window.confirm('Clear this review and discard its drafts? Download edits first to keep them.')) return;
    setDocuments([]); setDrafts({}); setReviewed(new Set()); setSelected(''); setError(''); setNotice(''); setEditing(false);
  }
  function renderTree(node: TreeNode) {
    return <>{[...node.children.values()].sort((a, b) => a.name.localeCompare(b.name)).map(child => <details open key={child.path} className="code-review-directory"><summary><ChevronRight size={13} /><Folder size={14} /><span>{child.name}</span></summary><div>{renderTree(child)}</div></details>)}{node.entries.sort((a, b) => a.path.localeCompare(b.path)).map(entry => <button type="button" key={entry.id} title={entry.path} className={`code-review-file ${active?.id === entry.id ? 'is-selected' : ''}`} aria-current={active?.id === entry.id ? 'true' : undefined} onClick={() => { setSelected(entry.id); setEditing(false); setError(''); }}><FileCode2 size={15} /><span>{entry.path.split('/').at(-1)}</span>{entry.diff && <small>{entry.diff.status === 'added' ? 'A' : entry.diff.status === 'deleted' ? 'D' : entry.diff.status === 'renamed' ? 'R' : 'M'}</small>}{reviewed.has(entry.id) && <Check size={14} aria-label="Reviewed" />}</button>)}</>;
  }

  return <section className="code-review" aria-label="Code review">
    <header className="code-review-heading"><div><h1>Code</h1><p>{projectName ? `${projectName} · ` : ''}Local review</p></div><div className="code-review-actions"><button className="button" type="button" disabled={busy} onClick={() => fileInput.current?.click()}><Upload size={16} />{busy ? 'Importing…' : 'Import files'}</button><button className="button secondary" type="button" disabled={busy} onClick={() => folderInput.current?.click()}><FolderOpen size={16} />Import folder</button>{documents.length > 0 && <button className="code-review-icon" aria-label="Clear review" title="Clear review" disabled={busy} onClick={clear}><X size={17} /></button>}</div></header>
    <input ref={fileInput} type="file" multiple hidden aria-label="Import source or patch files" onChange={event => void importFiles(event.target.files, false)} />
    <input ref={folderInput} type="file" multiple hidden aria-label="Import source folder" onChange={event => void importFiles(event.target.files, true)} />
    {error && <p className="code-review-error" role="alert">{error}</p>}
    <p className="code-review-notice" role="status">{notice || 'Files stay in this view. Download edits before leaving.'}</p>
    {!active ? <div className="code-review-empty"><GitCompareArrows size={30} /><h2>Review a patch or browse source</h2><p>Import .diff, .patch, or text files.</p><span>Up to 200 files · 1 MiB per file · 8 MiB total</span></div> : <div className="code-review-workspace">
      <aside className="code-review-sidebar" aria-label="Imported files"><div className="code-review-tree-heading"><strong>Files <span>{entries.length}</span></strong><span>{reviewed.size} reviewed</span></div><input type="search" aria-label="Filter files" placeholder="Find a file" value={filter} onChange={event => setFilter(event.target.value)} /><nav aria-label="File browser">{renderTree(tree)}{visible.length === 0 && <p className="code-review-no-files">No matching files.</p>}</nav></aside>
      <div className="code-review-main"><div className="code-review-file-heading"><div><h2 title={active.path}><Code2 size={16} />{active.path}</h2>{active.diff && <p><span className="code-review-status">{active.diff.status}</span><span className="code-review-added">+{active.diff.additions}</span><span className="code-review-removed">−{active.diff.deletions}</span>{active.diff.status === 'renamed' && <span>from {active.diff.oldPath}</span>}</p>}</div><label className="code-review-reviewed"><input type="checkbox" checked={reviewed.has(active.id)} onChange={event => { const checked = event.target.checked; setReviewed(previous => { const next = new Set(previous); if (checked) next.add(active.id); else next.delete(active.id); return next; }); }} />Reviewed</label></div>
      <div className="code-review-toolbar"><div><button className={!editing ? 'is-active' : ''} type="button" aria-pressed={!editing} onClick={() => setEditing(false)}>{active.diff ? 'Diff' : 'Source'}</button><button className={editing ? 'is-active' : ''} type="button" aria-pressed={editing} onClick={() => setEditing(true)}><Pencil size={14} />{active.diff ? 'Edit patch' : 'Edit source'}</button>{active.document.text !== active.document.original && <span className="code-review-draft">Edited</span>}</div><div><button type="button" className={wrap ? 'is-active' : ''} aria-pressed={wrap} aria-label="Wrap code lines" title="Wrap code lines" onClick={() => setWrap(value => !value)}><WrapText size={16} /></button><button type="button" disabled={changedDraft} title={changedDraft ? 'Update the preview before downloading' : undefined} onClick={() => { download(active.document.text, active.document.name); setNotice('Download started. Your original files are unchanged.'); }}><Download size={15} />{active.diff ? 'Download patch' : 'Download file'}</button></div></div>
      {editing ? <div className="code-review-editor"><label htmlFor="code-review-draft">{active.diff ? `Full patch · ${active.document.name}` : active.path}</label><textarea id="code-review-draft" spellCheck={false} autoCapitalize="off" autoCorrect="off" wrap={wrap ? 'soft' : 'off'} value={activeDraft} maxLength={CODE_REVIEW_LIMITS.fileBytes} onChange={event => { setDrafts(previous => ({ ...previous, [active.document.id]: event.target.value })); setError(''); }} /><div><span>Edits stay in this tab until downloaded.</span><button type="button" className="button" onClick={updatePreview} disabled={!changedDraft}>Update preview</button></div></div> : <div className={`code-review-code ${wrap ? 'is-wrapped' : ''}`} tabIndex={0} role="region" aria-label={active.diff ? 'Unified diff' : 'Source code'}>{active.diff ? active.diff.hunks.length ? active.diff.hunks.map((hunk, hunkIndex) => <div key={hunkIndex} className="code-review-hunk"><div className="code-review-hunk-heading">{hunk.header}</div>{hunk.lines.map((line, index) => <div key={index} className={`code-review-line ${line.kind}`}><span className="code-review-number" aria-label={line.oldLine === undefined ? undefined : `Old line ${line.oldLine}`}>{line.oldLine ?? ''}</span><span className="code-review-number" aria-label={line.newLine === undefined ? undefined : `New line ${line.newLine}`}>{line.newLine ?? ''}</span><span className="code-review-sign" aria-hidden="true">{line.kind === 'add' ? '+' : line.kind === 'remove' ? '−' : ''}</span><code>{line.text || ' '}</code></div>)}</div>) : <p className="code-review-meta">{active.diff.status === 'binary' ? 'Binary change. Contents cannot be previewed as text.' : 'File metadata changed. No text hunks in this patch.'}</p> : active.document.text.replaceAll('\r\n', '\n').split('\n').map((line, index) => <div className="code-review-line source" key={index}><span className="code-review-number">{index + 1}</span><code>{line || ' '}</code></div>)}</div>}
      </div>
    </div>}
  </section>;
}
