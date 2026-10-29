import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';
import { parseUnifiedDiff, displayPath } from '../src/codeReviewDiff.ts';

const output = fileURLToPath(new URL('../../../evals/reports/code-review/', import.meta.url));
await fs.mkdir(output, { recursive: true });
const checks = [];
const check = name => { checks.push(name); console.log('PASS', name); };
const patch = `diff --git a/src/greeting.ts b/src/greeting.ts
index 2a2a2a..3b3b3b 100644
--- a/src/greeting.ts
+++ b/src/greeting.ts
@@ -1,3 +1,4 @@ greeting
 export function greeting() {
-  return 'hello';
+  const name = 'Powwow';
+  return 'Hello, ' + name;
 }
diff --git a/README.md b/README.md
new file mode 100644
--- /dev/null
+++ b/README.md
@@ -0,0 +1 @@
+# Powwow
`;
const parsed = parseUnifiedDiff(patch);
assert.equal(parsed.length, 2);
assert.equal(parsed[0].additions, 2);
assert.equal(parsed[0].deletions, 1);
assert.deepEqual(parsed[0].hunks[0].lines.at(-1), { kind: 'context', text: '}', oldLine: 3, newLine: 4 });
assert.equal(parsed[1].status, 'added');
check('Multi-file unified diff and old/new line numbers');
assert.equal(parseUnifiedDiff('--- a/old.txt\n+++ /dev/null\n@@ -1 +0,0 @@\n-old\n')[0].status, 'deleted');
assert.equal(parseUnifiedDiff('diff --git a/a b/b\nsimilarity index 100%\nrename from a\nrename to b\n')[0].status, 'renamed');
assert.equal(parseUnifiedDiff('diff --git a/pic.png b/pic.png\nBinary files a/pic.png and b/pic.png differ\n')[0].status, 'binary');
assert.equal(parseUnifiedDiff('--- a/a\n+++ b/a\n@@ -1 +1 @@\n--- original\n+++ changed\n')[0].hunks[0].lines[1].text, '++ changed');
assert.equal(parseUnifiedDiff('--- a/a\n+++ b/a\n@@ -1 +1 @@\n-old\n\\ No newline at end of file\n+new\n\\ No newline at end of file\n')[0].hunks[0].lines.length, 4);
assert.equal(parseUnifiedDiff('diff --git "a/a name.txt" "b/a name.txt"\n--- "a/a name.txt"\n+++ "b/a name.txt"\n@@ -1 +1 @@\n-old\n+new\n')[0].path, 'a name.txt');
check('Added, deleted, renamed, binary, header-like content and no-newline cases');
assert.throws(() => parseUnifiedDiff(patch.replace('-1,3 +1,4', '-1,4 +1,4')), /Invalid hunk/);
assert.throws(() => parseUnifiedDiff('--- a/a\n+++ b/a\n@@ -1 +1 @@\n-old\n'), /Incomplete hunk/);
assert.throws(() => parseUnifiedDiff('--- a/a\n@@ -1 +1 @@\n-old\n+new\n'), /Invalid hunk header/);
assert.throws(() => parseUnifiedDiff('diff --cc a\n@@@ -1,1 -1,1 +1,1 @@@\n'), /Combined merge/);
assert.throws(() => parseUnifiedDiff('plain text'), /No unified diff/);
assert.throws(() => displayPath('a/../../secret', true), /relative paths/);
assert.throws(() => parseUnifiedDiff('x'.repeat(1024 * 1024 + 1)), /1 MiB/);
check('Malformed/unsupported patch, path and resource limits reject clearly');

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1360, height: 960 }, reducedMotion: 'reduce' });
const errors = []; let apiCalls = 0;
page.on('pageerror', error => errors.push(error.message));
await page.route('**/v1/**', route => { apiCalls++; return route.fulfill({ status: 500, body: 'Code review must not call the API.' }); });
await page.route('**/__code-review-qa', route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module">import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;</script></body></html>` }));
try {
  await page.goto(`${process.env.POWWOW_QA_URL || 'http://127.0.0.1:5173'}/__code-review-qa`);
  await page.evaluate(async () => {
    const reactModule = await import('/node_modules/.vite/deps/react.js');
    const React = reactModule.default || reactModule;
    const domModule = await import('/node_modules/.vite/deps/react-dom_client.js');
    const { createRoot } = domModule.default || domModule;
    const { default: CodeReview } = await import('/src/CodeReview.tsx');
    await import('/src/styles.css');
    createRoot(document.getElementById('root')).render(React.createElement(CodeReview, { projectName: 'Review fixture' }));
  });
  await expect(page.getByRole('heading', { name: 'Review a patch or browse source' })).toBeVisible();
  const input = page.getByLabel('Import source or patch files');
  await input.setInputFiles({ name: 'changes.patch', mimeType: 'text/plain', buffer: Buffer.from(patch) });
  await expect(page.getByRole('region', { name: 'Unified diff' })).toContainText("const name = 'Powwow';");
  await expect(page.locator('.code-review-line.remove .code-review-number').first()).toHaveText('2');
  await expect(page.locator('.code-review-line.add .code-review-number').nth(1)).toHaveText('2');
  await page.getByRole('checkbox', { name: 'Reviewed' }).check();
  await expect(page.locator('.code-review-tree-heading')).toContainText('1 reviewed');
  check('Browser imports patch, shows tree and line numbers, and tracks review');

  await page.getByRole('button', { name: 'Edit patch', exact: true }).click();
  const editor = page.getByRole('textbox', { name: 'Full patch · changes.patch' });
  await editor.fill(patch.replace('-1,3 +1,4', '-1,8 +1,4'));
  await page.getByRole('button', { name: 'Update preview' }).click();
  await expect(page.getByRole('alert')).toContainText('Invalid hunk');
  await expect(page.getByRole('button', { name: 'Download patch' })).toBeDisabled();
  await editor.fill(patch.replace("'Hello, '", "'Welcome, '"));
  await page.getByRole('button', { name: 'Update preview' }).click();
  await expect(page.getByRole('region', { name: 'Unified diff' })).toContainText('Welcome,');
  await expect(page.getByRole('checkbox', { name: 'Reviewed' })).not.toBeChecked();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download patch' }).click();
  const exported = await downloadEvent;
  assert.equal(exported.suggestedFilename(), 'changes.patch');
  assert.match(await fs.readFile(await exported.path(), 'utf8'), /Welcome,/);
  check('Invalid edits preserved, valid patch preview resets review, and download contains edits');

  await input.setInputFiles({ name: 'unsafe.html', mimeType: 'text/plain', buffer: Buffer.from('<script>window.__codeReviewXss = true</script>\n' + 'long source '.repeat(100)) });
  await expect(page.getByRole('region', { name: 'Source code' })).toContainText('<script>');
  assert.equal(await page.evaluate(() => window.__codeReviewXss), undefined);
  await page.getByRole('button', { name: 'Edit source' }).click();
  await page.getByRole('textbox', { name: 'unsafe.html', exact: true }).fill('export const edited = true;\n');
  await page.getByRole('button', { name: 'Update preview' }).click();
  await expect(page.getByRole('region', { name: 'Source code' })).toContainText('export const edited');
  const sourceDownloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download file' }).click();
  const sourceExport = await sourceDownloadEvent;
  assert.equal(await fs.readFile(await sourceExport.path(), 'utf8'), 'export const edited = true;\n');
  check('HTML displays as text; source editing and download work without execution');

  await input.setInputFiles({ name: 'too-large.txt', mimeType: 'text/plain', buffer: Buffer.alloc(1024 * 1024 + 1, 'x') });
  await expect(page.getByRole('alert')).toContainText('exceeds 1 MiB');
  await expect(page.getByRole('region', { name: 'Source code' })).toContainText('export const edited');
  check('Oversized import rejected without losing existing review');
  const fixtureFolder = path.join(output, 'source-fixture');
  await fs.mkdir(path.join(fixtureFolder, 'src'), { recursive: true });
  await fs.writeFile(path.join(fixtureFolder, 'src', 'folder-test.ts'), 'export const folder = true;\n');
  await fs.writeFile(path.join(fixtureFolder, '.env'), 'SYNTHETIC_TEST_VALUE=never-import-me\n');
  await page.getByLabel('Import source folder').setInputFiles(fixtureFolder);
  await expect(page.locator('.code-review-notice')).toContainText('1 skipped');
  await expect(page.getByRole('region', { name: 'Source code' })).toContainText('folder = true');
  await expect(page.getByRole('button', { name: '.env', exact: true })).toHaveCount(0);
  check('Folder import keeps relative tree and skips .env files');

  await page.getByRole('button', { name: 'greeting.ts M', exact: false }).click();
  await page.screenshot({ path: path.join(output, 'desktop.png'), fullPage: true });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(page.getByRole('region', { name: 'Unified diff' })).toBeVisible();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, `Page overflows at ${width}px`);
    await page.getByRole('button', { name: 'Wrap code lines' }).click();
    await page.getByRole('button', { name: 'Wrap code lines' }).click();
    await page.screenshot({ path: path.join(output, `mobile-${width}.png`), fullPage: true });
  }
  check('390px phone and 320px reflow layouts have no page overflow');
  assert.equal(apiCalls, 0);
  assert.deepEqual(errors, []);
  check('No API requests or browser errors');
  await fs.writeFile(path.join(output, 'report.json'), JSON.stringify({ note: 'Local synthetic inputs only. No model calls, GitHub connection or code execution.', checks, errors, apiCalls }, null, 2));
} finally { await browser.close(); }
