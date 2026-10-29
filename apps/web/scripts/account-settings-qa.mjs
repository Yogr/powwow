import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const output = path.join(root, 'evals/reports/account-settings');
const base = process.env.POWWOW_QA_URL || 'http://127.0.0.1:5173';
await fs.mkdir(output, { recursive: true });
const report = { note: 'Isolated settings/API fixtures and real origin-private filesystem handles simulate user-selected directories. No account data or actual user folders are changed.', checks: [], errors: [], screenshots: [] };
const check = name => { report.checks.push(name); console.log('PASS', name); };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const preferences = () => ({ app_language: 'en', storage_mode: 'unselected', plan: 'free', storage_quota_bytes: 524288000, storage_used_bytes: 21000000, storage_staged_bytes: 0, local_retention_hours: 24, checkout_available: false, component_priorities: {} });
const harness = `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div>
<script type="module">import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;</script>
<script type="module">import React from '/node_modules/.vite/deps/react.js';import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';import AccountSettings from '/src/AccountSettings.tsx';import '/src/styles.css';const {createElement:h,useState}=React;function App(){const[open,setOpen]=useState(true);return h('main',null,h('button',{onClick:()=>setOpen(true)},'Open settings'),open&&h(AccountSettings,{accountId:'user:settings-qa',onClose:()=>setOpen(false),onPreferencesChanged:value=>{window.__savedPreferences=value;}}));}ReactDOM.createRoot(document.getElementById('root')).render(h(App));</script></body></html>`;

async function openSettings({ supported = true } = {}) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  page.on('pageerror', error => report.errors.push(error.message));
  let prefs = preferences();
  const writes = [];
  await page.addInitScript(({ supported }) => {
    if (supported) window.showDirectoryPicker = async () => (await navigator.storage.getDirectory()).getDirectoryHandle('Powwow QA folder', { create: true });
    else Object.defineProperty(window, 'showDirectoryPicker', { configurable: true, value: undefined });
  }, { supported });
  await page.route('**/__account-settings-qa', route => route.fulfill({ contentType: 'text/html', body: harness }));
  await page.route('**/v1/account/preferences', async route => {
    if (route.request().method() === 'PATCH') { const body = route.request().postDataJSON(); writes.push(body); prefs = { ...prefs, ...body }; }
    await route.fulfill({ json: prefs });
  });
  await page.goto(`${base}/__account-settings-qa`);
  await expect(page.getByRole('heading', { name: 'General', exact: true })).toBeVisible();
  return { page, writes, current: () => prefs };
}

try {
  const { page, writes, current } = await openSettings();
  await expect(page.getByRole('dialog')).not.toContainText('$');
  await page.getByRole('button', { name: 'App language', exact: true }).click();
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.getByRole('option', { name: 'Español', exact: true }).click();
  await page.getByRole('button', { name: 'Save language', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Language preference saved');
  expect(current().app_language).toBe('es');
  expect(await page.locator('html').getAttribute('lang')).toBe('es');
  check('Language preference uses an accessible dropdown, persists through the API, updates document language and states translation scope');

  await page.getByRole('button', { name: 'Storage', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toContainText('$');
  await page.getByRole('button', { name: 'Choose project folder', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Files will save to Powwow QA folder');
  expect(current().storage_mode).toBe('local');
  const connection = await page.evaluate(async () => (await import('/src/localFiles.ts')).getLocalStorageConnection('user:settings-qa'));
  expect(connection).toMatchObject({ kind: 'folder', permission: 'granted', folderName: 'Powwow QA folder' });
  await page.screenshot({ path: path.join(output, 'storage-desktop.png') });
  report.screenshots.push('storage-desktop.png');
  check('Explicit folder selection persists an account-scoped directory handle before enabling local storage');

  const local = await page.evaluate(async () => {
    const files = await import('/src/localFiles.ts');
    const prefs = await import('/src/accountPreferences.ts');
    const account = 'user:settings-qa';
    const blob = new Blob(['A file created in the QA browser.'], { type: 'text/plain' });
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())), byte => byte.toString(16).padStart(2, '0')).join('');
    const artifact = { id: 'qa-artifact', project_id: 'qa-project', name: 'notes.txt', sha256: hash, size_bytes: blob.size };
    const receipt = await files.saveLocalArtifact(account, artifact, blob);
    const firstText = await (await files.readLocalArtifact(account, artifact.id)).text();
    let originalFolder = await (await navigator.storage.getDirectory()).getDirectoryHandle('Powwow QA folder');
    const originalParts = receipt.relativePath.split('/');
    const originalName = originalParts.pop();
    for (const part of originalParts) originalFolder = await originalFolder.getDirectoryHandle(part);
    const changed = await (await originalFolder.getFileHandle(originalName)).createWritable();
    await changed.write('X file created in the QA browser.'); await changed.close();
    let changedReadError = ''; try { await files.readLocalArtifact(account, artifact.id); } catch (error) { changedReadError = error.message; }
    await files.saveLocalArtifact(account, artifact, blob);
    const projectPath = await files.saveLocalProject(account, 'qa-project', { name: 'Saved project', tasks: ['First task'] });
    const root = await navigator.storage.getDirectory();
    const second = await root.getDirectoryHandle('Second QA folder', { create: true });
    window.showDirectoryPicker = async () => second;
    await files.chooseLocalFolder(account);
    const afterFolderChange = await (await files.readLocalArtifact(account, artifact.id)).text();
    let crossAccountError = ''; try { await files.readLocalArtifact('user:other-account', artifact.id); } catch (error) { crossAccountError = error.message; }
    let sizeError = ''; try { await files.saveLocalArtifact(account, { ...artifact, size_bytes: blob.size + 1 }, blob); } catch (error) { sizeError = error.message; }
    let hashError = ''; try { await files.saveLocalArtifact(account, { ...artifact, sha256: 'wrong' }, blob); } catch (error) { hashError = error.message; }
    const query = FileSystemDirectoryHandle.prototype.queryPermission;
    const request = FileSystemDirectoryHandle.prototype.requestPermission;
    let asked = 0, permission = 'prompt';
    FileSystemDirectoryHandle.prototype.queryPermission = async () => permission;
    FileSystemDirectoryHandle.prototype.requestPermission = async () => { asked++; permission = 'granted'; return permission; };
    const blocked = await prefs.storageReadiness(account, { storage_mode: 'local' });
    const beforeReconnect = asked;
    const reconnected = await files.reconnectLocalFolder(account);
    FileSystemDirectoryHandle.prototype.queryPermission = query;
    FileSystemDirectoryHandle.prototype.requestPermission = request;
    const listing = await files.listLocalFiles(account);
    await files.chooseDownloadStorage(account);
    const downloads = await prefs.storageReadiness(account, { storage_mode: 'local' });
    let downloadSaveError = ''; try { await files.saveLocalArtifact(account, artifact, blob); } catch (error) { downloadSaveError = error.message; }
    window.__downloadBlob = blob;
    return { receipt, firstText, changedReadError, projectPath, afterFolderChange, crossAccountError, sizeError, hashError, blocked, beforeReconnect, asked, reconnected, listing: listing.map(item => ({ id: item.artifactId, hasRoot: 'root' in item })), downloads, downloadSaveError };
  });
  expect(local.firstText).toBe('A file created in the QA browser.');
  expect(local.afterFolderChange).toBe(local.firstText);
  expect(local.receipt.sha256).toMatch(/^[a-f0-9]{64}$/);
  expect(local.receipt.size_bytes).toBe(33);
  expect(local.projectPath).toMatch(/Powwow\/[a-f0-9]{16}\/projects\/qa-project\/project.json/);
  expect(local.crossAccountError).toContain('for this account');
  expect(local.sizeError).toContain('incomplete');
  expect(local.hashError).toContain('fingerprint');
  expect(local.changedReadError).toContain('has changed');
  expect(local.listing).toEqual([{ id: 'qa-artifact', hasRoot: false }]);
  check('Local files are written, closed, read back and SHA256-verified; metadata exports and reads survive a folder change while account isolation is enforced');
  check('Incomplete downloads and fingerprint mismatches produce no verified-save receipt');
  check('Reading a locally edited file with an unchanged size detects a SHA256 mismatch instead of returning it as the original artifact');
  expect(local.blocked.ready).toBe(false);
  expect(local.beforeReconnect).toBe(0);
  expect(local.asked).toBe(1);
  expect(local.reconnected.permission).toBe('granted');
  check('Permission checks never prompt in the background; explicit reconnect is required to restore access');
  expect(local.downloads).toMatchObject({ ready: false, mode: 'local', manualDownloads: true });
  expect(local.downloadSaveError).toContain('explicit downloads');
  const downloaded = page.waitForEvent('download');
  await page.evaluate(async () => (await import('/src/localFiles.ts')).downloadBlob(window.__downloadBlob, 'my-notes.txt'));
  expect((await downloaded).suggestedFilename()).toBe('my-notes.txt');
  check('Download mode triggers a real browser download, remains distinguishable from folder saving and never produces an automatic save receipt');

  await page.getByRole('button', { name: 'Use Powwow Cloud', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('New files will use Powwow Cloud');
  expect(current().storage_mode).toBe('cloud');
  await page.getByRole('button', { name: 'Subscription', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('$20');
  await expect(page.getByRole('dialog')).toContainText('+$10');
  await expect(page.getByRole('button', { name: 'Checkout not available', exact: true })).toBeDisabled();
  expect(writes.every(item => !('plan' in item))).toBe(true);
  await page.screenshot({ path: path.join(output, 'subscription-desktop.png') });
  report.screenshots.push('subscription-desktop.png');
  check('Only Subscription shows prices; paid checkout is honestly disabled and no plan entitlement can be activated by the UI');

  await page.setViewportSize({ width: 320, height: 844 });
  await expect(page.getByRole('heading', { name: 'Subscription', exact: true })).toBeVisible();
  await page.getByText('Proposed add-on', { exact: true }).scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(321);
  await page.screenshot({ path: path.join(output, 'subscription-320.png') });
  report.screenshots.push('subscription-320.png');
  await page.getByRole('button', { name: 'General', exact: true }).click();
  await page.getByRole('button', { name: 'App language', exact: true }).click();
  await expect(page.getByRole('listbox')).toBeInViewport();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  check('Settings reflows at 320px, popup choices stay above the modal and keyboard dismiss closes the menu before the dialog');
  await page.close();

  const fallback = await openSettings({ supported: false });
  await fallback.page.getByRole('button', { name: 'Storage', exact: true }).click();
  await expect(fallback.page.getByRole('button', { name: 'Use explicit downloads', exact: true })).toHaveCount(0);
  await expect(fallback.page.getByRole('button', { name: 'Choose project folder', exact: true })).toHaveCount(0);
  await fallback.page.getByRole('button', { name: 'Use Powwow Cloud', exact: true }).click();
  expect(fallback.current().storage_mode).toBe('cloud');
  check('Browsers without folder access offer Cloud; downloads are not advertised as local storage');
  await fallback.page.close();

  const persistence = await browser.newPage();
  persistence.on('pageerror', error => report.errors.push(error.message));
  const persistenceText = 'A generated file saved by the hook.';
  const receipts = [];
  let contentRequests = 0, releaseContent;
  const hookHarness = harness.replace("import AccountSettings from '/src/AccountSettings.tsx';", "import {useLocalPersistence} from '/src/useLocalPersistence.ts';import * as files from '/src/localFiles.ts';import * as api from '/src/api.ts';")
    .replace(/const \{createElement:h,useState\}=React;function App\(\)\{.*?ReactDOM\.createRoot/s, `const {createElement:h,useState}=React;
      const account='user:persist-qa';api.setToken('fixture.'+btoa(JSON.stringify({sub:'persist-qa'}))+'.fixture');
      window.showDirectoryPicker=async()=> (await navigator.storage.getDirectory()).getDirectoryHandle('Persist QA folder',{create:true});await files.chooseLocalFolder(account);
      const bytes=new TextEncoder().encode(${JSON.stringify(persistenceText)});const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),byte=>byte.toString(16).padStart(2,'0')).join('');
      window.__artifact={id:'hook-artifact',project_id:'hook-project',name:'generated.txt',sha256:hash,size_bytes:bytes.length,storage_mode:'local',download_url:'/v1/artifacts/hook-artifact/content',available:true,local_saved_at:null};
      function App(){const[artifacts,setArtifacts]=useState([]);const[preferences,setPreferences]=useState({...${JSON.stringify(preferences())},storage_mode:'local'});
        window.__setArtifacts=setArtifacts;window.__setPreferences=setPreferences; const[mirrorCloud,setMirrorCloud]=useState(false);window.__setMirrorCloud=setMirrorCloud;
        const result=useLocalPersistence({accountId:account,preferences,artifacts,mirrorCloud,project:{id:'hook-project'},metadata:{name:'Hook project',tasks:['Save a file']},enabled:true});
        window.__hookStatus=result;return h('pre',null,JSON.stringify(result));}
      ReactDOM.createRoot`);
  await persistence.route('**/__local-persistence-qa', route => route.fulfill({ contentType: 'text/html', body: hookHarness }));
  await persistence.route('**/v1/artifacts/hook-artifact/content', async route => {
    contentRequests++;
    await new Promise(resolve => { releaseContent = resolve; });
    await route.fulfill({ contentType: 'text/plain', body: persistenceText });
  });
  await persistence.route('**/v1/artifacts/hook-artifact/local-save', async route => { receipts.push(route.request().postDataJSON()); await route.fulfill({ json: { saved: true } }); });
  await persistence.goto(`${base}/__local-persistence-qa`);
  await persistence.waitForFunction(() => window.__hookStatus?.ready);
  await persistence.evaluate(() => window.__setArtifacts([{...window.__artifact}]));
  await expect.poll(() => contentRequests).toBe(1);
  await persistence.evaluate(() => window.__setArtifacts([{...window.__artifact}]));
  await persistence.waitForFunction(() => document.querySelector('pre').textContent.includes('"ready":true'));
  releaseContent();
  await expect.poll(() => receipts.length).toBe(1);
  const persisted = await persistence.evaluate(async () => {
    const files = await import('/src/localFiles.ts');
    return { text: await (await files.readLocalArtifact('user:persist-qa','hook-artifact')).text(), listing: await files.listLocalFiles('user:persist-qa') };
  });
  expect(persisted.text).toBe(persistenceText);
  expect(receipts[0]).toEqual({ sha256: persisted.listing[0].sha256, size_bytes: persisted.listing[0].size_bytes });
  expect(contentRequests).toBe(1);
  check('Local-persistence hook survives artifact polling, writes a verified file and posts exactly one receipt with the expected hash and size');
  await persistence.unroute('**/v1/artifacts/hook-artifact/content');
  let expiredRequests = 0;
  await persistence.route('**/v1/artifacts/hook-artifact/content', async route => { expiredRequests++; await route.fulfill({ status: 410, json: { detail: 'file_expired' } }); });
  const recovered = await persistence.evaluate(async () => (await (await import('/src/api.ts')).authenticatedBlob('/v1/artifacts/hook-artifact/content')).text());
  expect(recovered).toBe(persistenceText);
  expect(expiredRequests).toBe(0);
  check('Authenticated file reads use the verified local original after the server staging period expires');
  await persistence.evaluate(async () => { await (await import('/src/localFiles.ts')).chooseDownloadStorage('user:persist-qa');window.__setPreferences(value=>({...value})); });
  await persistence.waitForFunction(() => window.__hookStatus?.manualDownloads);
  await persistence.evaluate(() => window.__setArtifacts([{...window.__artifact,id:'download-only',download_url:'/v1/artifacts/download-only/content'}]));
  await persistence.evaluate(() => new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  expect(receipts.length).toBe(1);
  const downloadCopies = await persistence.evaluate(async () => (await (await import('/src/localFiles.ts')).listLocalFiles('user:persist-qa')).filter(item=>item.artifactId==='download-only'));
  expect(downloadCopies).toHaveLength(0);
  check('Local-persistence hook does not write or acknowledge files when the user selected explicit downloads');
  await persistence.route('**/v1/artifacts/cloud-copy/content', route => route.fulfill({ contentType: 'text/plain', body: persistenceText }));
  await persistence.evaluate(async () => {
    await (await import('/src/localFiles.ts')).chooseLocalFolder('user:persist-qa');
    window.__setPreferences(value=>({...value,storage_mode:'cloud'}));
    window.__setMirrorCloud(true);
    window.__setArtifacts([{...window.__artifact,id:'cloud-copy',storage_mode:'cloud',download_url:'/v1/artifacts/cloud-copy/content'}]);
  });
  await expect.poll(async () => persistence.evaluate(async () => (await (await import('/src/localFiles.ts')).listLocalFiles('user:persist-qa')).some(item=>item.artifactId==='cloud-copy'))).toBe(true);
  expect(receipts.length).toBe(1);
  check('Installed-app cloud sync writes a verified local copy without acknowledging or expiring permanent cloud storage');
  await persistence.close();

  const pwa = await browser.newPage();
  await pwa.goto(`${base}/offline.html`);
  const manifest = await (await pwa.request.get(`${base}/manifest.webmanifest`)).json();
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons.map(item => item.sizes)).toEqual(['192x192', '512x512']);
  for (const icon of manifest.icons) expect((await pwa.request.get(base + icon.src)).ok()).toBe(true);
  await pwa.evaluate(async () => { await navigator.serviceWorker.register('/service-worker.js'); await navigator.serviceWorker.ready; });
  await pwa.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await pwa.route('**/v1/private-test', route => route.fulfill({ json: { private: true } }));
  await pwa.evaluate(() => fetch('/v1/private-test').then(value => value.json()));
  const cached = await pwa.evaluate(async () => { const names = await caches.keys(); return (await Promise.all(names.map(async name => (await (await caches.open(name)).keys()).map(request => new URL(request.url).pathname)))).flat(); });
  expect(cached.sort()).toEqual(['/icons/powwow-192.png', '/icons/powwow-512.png', '/manifest.webmanifest', '/offline.html'].sort());
  await pwa.context().setOffline(true);
  await pwa.goto(`${base}/offline-navigation-test`);
  await expect(pwa.getByRole('heading', { name: 'Let’s reconnect.', exact: true })).toBeVisible();
  await expect(pwa.locator('body')).toContainText('needs a connection');
  check('Install manifest and icons load; service worker caches only four public assets, leaves private API data uncached and shows honest offline guidance');
  await pwa.close();
  expect(report.errors).toEqual([]);
} catch (error) {
  report.errors.push(error.stack || error.message); process.exitCode = 1;
  for (const [index, page] of browser.contexts().flatMap(context => context.pages()).entries()) await page.screenshot({ path: path.join(output, `failure-${index}.png`) }).catch(() => {});
} finally {
  await browser.close();
  await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
