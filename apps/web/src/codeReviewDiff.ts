export type DiffLine = {
  kind: 'context' | 'add' | 'remove' | 'note';
  text: string;
  oldLine?: number;
  newLine?: number;
};
export type DiffHunk = { header: string; lines: DiffLine[] };
export type DiffFile = {
  path: string;
  oldPath: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed' | 'binary';
  hunks: DiffHunk[];
  additions: number;
  deletions: number;
};

export const CODE_REVIEW_LIMITS = { files: 200, fileBytes: 1024 * 1024, totalBytes: 8 * 1024 * 1024, lines: 20000 };

export function displayPath(value: string, stripGitPrefix = false): string {
  let path = value.split('\t')[0].trim();
  if (path.startsWith('"')) {
    try { path = JSON.parse(path) as string; }
    catch { throw new Error('This patch uses an unsupported escaped filename. Export it with readable filenames.'); }
  }
  if (path === '/dev/null') return path;
  path = path.replaceAll('\\', '/');
  if (stripGitPrefix) path = path.replace(/^[ab]\//, '');
  if (!path || path.startsWith('/') || /^[a-z]:/i.test(path) || path.split('/').some(part => part === '..') || /[\x00-\x1f]/.test(path)) {
    throw new Error('Use files with relative paths and no parent-directory segments.');
  }
  return path;
}

/** Read-only parser. It never applies a patch or resolves a path on disk. */
export function parseUnifiedDiff(text: string): DiffFile[] {
  if (new TextEncoder().encode(text).length > CODE_REVIEW_LIMITS.fileBytes) throw new Error('Each patch must be 1 MiB or smaller.');
  const lines = text.replaceAll('\r\n', '\n').split('\n');
  if (lines.length > CODE_REVIEW_LIMITS.lines) throw new Error('A patch can contain at most 20,000 lines.');
  const files: DiffFile[] = [];
  let file: DiffFile | undefined;
  let hunk: DiffHunk | undefined;
  let oldRemaining = 0, newRemaining = 0, oldLine = 0, newLine = 0;
  let sawOldHeader = false;
  let sawNewHeader = false;
  function completeHunk() {
    if (hunk && (oldRemaining !== 0 || newRemaining !== 0)) throw new Error(`Incomplete hunk in ${file?.path || 'patch'}. Check the line counts.`);
    hunk = undefined;
  }
  function begin(path: string) {
    completeHunk();
    if (files.length >= CODE_REVIEW_LIMITS.files) throw new Error('A patch can change at most 200 files.');
    file = { path, oldPath: path, status: 'modified', hunks: [], additions: 0, deletions: 0 };
    files.push(file);
    sawOldHeader = false;
    sawNewHeader = false;
  }
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (index === lines.length - 1 && line === '') break;
    if (/^(diff --(?:cc|combined)|@@@)/.test(line)) throw new Error('Combined merge diffs are not supported. Export a unified diff against one parent.');
    if (hunk && (oldRemaining > 0 || newRemaining > 0)) {
      const prefix = line[0];
      if (prefix === '\\') { hunk.lines.push({ kind: 'note', text: line }); continue; }
      if (prefix === ' ' && oldRemaining > 0 && newRemaining > 0) {
        hunk.lines.push({ kind: 'context', text: line.slice(1), oldLine: oldLine++, newLine: newLine++ });
        oldRemaining--; newRemaining--;
      } else if (prefix === '-' && oldRemaining > 0) {
        hunk.lines.push({ kind: 'remove', text: line.slice(1), oldLine: oldLine++ });
        oldRemaining--; file!.deletions++;
      } else if (prefix === '+' && newRemaining > 0) {
        hunk.lines.push({ kind: 'add', text: line.slice(1), newLine: newLine++ });
        newRemaining--; file!.additions++;
      } else throw new Error(`Invalid hunk at patch line ${index + 1}. Check the line counts and prefixes.`);
      continue;
    }
    if (line.startsWith('\\ No newline') && hunk) { hunk.lines.push({ kind: 'note', text: line }); continue; }
    if (line.startsWith('diff --git ')) {
      const match = /^diff --git (?:"(?:\\.|[^"\\])*"|a\/.*?) ("(?:\\.|[^"\\])*"|b\/.*)$/.exec(line);
      if (!match) throw new Error(`Unsupported file header at patch line ${index + 1}.`);
      begin(displayPath(match[1], true));
    } else if (line.startsWith('--- ')) {
      const path = displayPath(line.slice(4), true);
      if (!file || sawOldHeader) begin(path);
      completeHunk();
      file!.oldPath = path;
      sawOldHeader = true;
    } else if (line.startsWith('+++ ')) {
      if (!file || !sawOldHeader) throw new Error('A patch file is missing its original filename header.');
      const path = displayPath(line.slice(4), true);
      file.path = path === '/dev/null' ? file.oldPath : path;
      file.status = path === '/dev/null' ? 'deleted' : file.oldPath === '/dev/null' ? 'added' : file.oldPath !== path ? 'renamed' : 'modified';
      sawNewHeader = true;
    } else if (line.startsWith('@@')) {
      completeHunk();
      const match = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(?:.*)$/.exec(line);
      if (!file || !sawOldHeader || !sawNewHeader || !match) throw new Error(`Invalid hunk header at patch line ${index + 1}.`);
      oldLine = Number(match[1]); newLine = Number(match[3]);
      oldRemaining = match[2] === undefined ? 1 : Number(match[2]);
      newRemaining = match[4] === undefined ? 1 : Number(match[4]);
      if (![oldLine, newLine, oldRemaining, newRemaining].every(Number.isSafeInteger)) throw new Error('Patch line numbers are too large.');
      hunk = { header: line, lines: [] }; file.hunks.push(hunk);
    } else if (file && line.startsWith('rename from ')) {
      file.oldPath = displayPath(line.slice(12)); file.status = 'renamed';
    } else if (file && line.startsWith('rename to ')) {
      file.path = displayPath(line.slice(10)); file.status = 'renamed';
    } else if (file && /^(Binary files |GIT binary patch)/.test(line)) {
      file.status = 'binary';
    } else if (file && line.startsWith('new file mode ')) {
      file.status = 'added';
    } else if (file && line.startsWith('deleted file mode ')) {
      file.status = 'deleted';
    } else if (hunk && /^[ +\-]/.test(line) && line !== '-- ') {
      throw new Error(`Extra hunk content at patch line ${index + 1}. Check the line counts.`);
    }
  }
  completeHunk();
  if (!files.length) throw new Error('No unified diff found. Import a .diff or .patch with file and @@ hunk headers.');
  return files;
}
