import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';

const base = process.env.POWWOW_QA_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = { note: 'Isolated browser filesystem and API fixtures. No user folders, account data, or paid requests.', checks: [], errors: [] };
const check = name => { report.checks.push(name); console.log('PASS', name); };
const page = await browser.newPage();
page.on('pageerror', error => report.errors.push(error.message));
let networkCalls = 0;
await page.route('**/v1/**', route => { networkCalls++; return route.fulfill({ status: 500, json: { detail: 'Unexpected network request in filesystem QA' } }); });
await page.route('**/__local-files-layout-qa', route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><body><div id="root"></div>
<script type="module">import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;</script></body></html>` }));

try {
  await page.goto(`${base}/__local-files-layout-qa`);
  await page.evaluate(async () => {
    window.files = await import('/src/localFiles.ts');
    window.qaRoot = await (await navigator.storage.getDirectory()).getDirectoryHandle('layout-qa', { create: true });
    window.showDirectoryPicker = async () => window.qaRoot;
    await window.files.chooseLocalFolder('layout-account', 'layout-project');
    window.makeArtifact = async (id, name, content, mime_type = '') => {
      const blob = new Blob([content], { type: mime_type });
      const sha256 = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())), n => n.toString(16).padStart(2, '0')).join('');
      return { artifact: { id, name, project_id: 'layout-project', mime_type, size_bytes: blob.size, sha256 }, blob };
    };
    window.readPath = async (root, path) => {
      const parts = path.split('/');
      for (const part of parts.slice(0, -1)) root = await root.getDirectoryHandle(part);
      return (await (await root.getFileHandle(parts.at(-1))).getFile()).text();
    };
    window.writePath = async (root, path, value) => {
      const parts = path.split('/');
      for (const part of parts.slice(0, -1)) root = await root.getDirectoryHandle(part, { create: true });
      const stream = await (await root.getFileHandle(parts.at(-1), { create: true })).createWritable();
      await stream.write(value); await stream.close();
    };
    window.seedLegacy = async (item, path) => {
      await window.writePath(window.qaRoot, path, item.blob);
      await new Promise((resolve, reject) => {
        const open = indexedDB.open('powwow-local-files-v1', 1);
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result, transaction = db.transaction('files', 'readwrite');
          transaction.objectStore('files').put({ accountId: 'layout-account', artifactId: item.artifact.id, projectId: 'layout-project', name: item.artifact.name, relativePath: path, sha256: item.artifact.sha256, size_bytes: item.blob.size, savedAt: new Date().toISOString(), root: window.qaRoot }, `layout-account:${item.artifact.id}`);
          transaction.oncomplete = () => { db.close(); resolve(); };
          transaction.onerror = () => reject(transaction.error);
        };
      });
    };
  });

  const saved = await page.evaluate(async () => {
    const paths = [];
    for (const [id, name, mime] of [['image','hero.png','image/png'],['model','hero.glb','model/gltf-binary'],['video','arrival.mp4','video/mp4'],['audio','footsteps.wav','audio/wav'],['document','scene.md','text/markdown'],['font','heading.woff2','font/woff2'],['other','archive.zip','application/zip']]) {
      const {artifact,blob} = await window.makeArtifact(id,name,`${id} bytes`,mime);
      paths.push((await window.files.saveLocalArtifact('layout-account',artifact,blob)).relativePath);
    }
    const projectPath = await window.files.saveLocalProject('layout-account','layout-project',{name:'My project',workspace:{brief:'A clear project brief'}});
    return { paths, projectPath, manifest: JSON.parse(await window.readPath(window.qaRoot,projectPath)), memory: await window.readPath(window.qaRoot,'.powwow/project-memory.md') };
  });
  expect(saved.paths).toEqual(['src/assets/images/hero.png','src/assets/models/hero.glb','src/assets/videos/arrival.mp4','src/assets/audio/footsteps.wav','src/assets/documents/scene.md','src/assets/fonts/heading.woff2','src/assets/other/archive.zip']);
  expect(saved.projectPath).toBe('.powwow/project.json');
  expect(saved.manifest.project.name).toBe('My project');
  expect(saved.memory).toContain('A clear project brief');
  check('Descriptive filenames and media folders are directly under the selected root; metadata stays in .powwow');

  const collisions = await page.evaluate(async () => {
    await window.writePath(window.qaRoot,'src/assets/images/keep.png','user original');
    const first = await window.makeArtifact('collision-a','keep.png','generated image A','image/png');
    const second = await window.makeArtifact('collision-b','keep.png','generated image B','image/png');
    const receipts = await Promise.all([first,second].map(item => window.files.saveLocalArtifact('layout-account',item.artifact,item.blob)));
    const repeated = await window.files.saveLocalArtifact('layout-account',first.artifact,first.blob);
    await window.writePath(window.qaRoot,receipts[0].relativePath,'edited output');
    const repaired = await window.files.saveLocalArtifact('layout-account',first.artifact,first.blob);
    return { paths:receipts.map(item=>item.relativePath), repeat:repeated.relativePath, repaired:repaired.relativePath, original:await window.readPath(window.qaRoot,'src/assets/images/keep.png'), edited:await window.readPath(window.qaRoot,receipts[0].relativePath), generated:await (await window.files.readLocalArtifact('layout-account','collision-a')).text() };
  });
  expect(collisions.paths).toEqual(['src/assets/images/keep (2).png','src/assets/images/keep (3).png']);
  expect(collisions.repeat).toBe(collisions.paths[0]);
  expect(collisions.repaired).toBe('src/assets/images/keep (4).png');
  expect(collisions.original).toBe('user original');
  expect(collisions.edited).toBe('edited output');
  expect(collisions.generated).toBe('generated image A');
  check('Concurrent name conflicts receive readable numeric suffixes; repeats reuse verified copies and preserve user edits');

  const integrity = await page.evaluate(async () => {
    const item=await window.makeArtifact('bad-save','never.png','expected bytes','image/png');
    const errors=[];
    for (const artifact of [{...item.artifact,size_bytes:1000},{...item.artifact,sha256:'wrong'}]) {
      try { await window.files.saveLocalArtifact('layout-account',artifact,item.blob); } catch(error) { errors.push(error.message); }
    }
    return { errors, saved:(await window.files.listLocalFiles('layout-account')).some(item=>item.artifactId==='bad-save') };
  });
  expect(integrity.errors[0]).toContain('incomplete');
  expect(integrity.errors[1]).toContain('fingerprint');
  expect(integrity.saved).toBe(false);
  check('Incomplete or fingerprint-mismatched downloads never receive a local-save receipt');

  const migration = await page.evaluate(async () => {
    const item=await window.makeArtifact('legacy-model','restored-hero.glb','legacy GLB bytes','model/gltf-binary');
    const path='Powwow/old-account-hash/projects/old-project/files/legacy-id-image.glb';
    await window.seedLegacy(item,path);
    const before=await (await window.files.readLocalArtifact('layout-account',item.artifact.id)).text();
    const receipt=await window.files.migrateLocalArtifact('layout-account',item.artifact);
    const after=await (await window.files.readLocalArtifact('layout-account',item.artifact.id)).text();
    const broken=await window.makeArtifact('broken-legacy','broken.glb','trusted GLB bytes','model/gltf-binary');
    const brokenPath='Powwow/old-account-hash/projects/old-project/files/broken.glb';
    await window.seedLegacy(broken,brokenPath);
    await window.writePath(window.qaRoot,brokenPath,'changed GLB bytes');
    let error='';try{await window.files.migrateLocalArtifact('layout-account',broken.artifact);}catch(problem){error=problem.message;}
    return {before,after,receipt,original:await window.readPath(window.qaRoot,path),error,brokenReceipt:(await window.files.listLocalFiles('layout-account')).find(item=>item.artifactId==='broken-legacy').relativePath};
  });
  expect(migration.receipt.relativePath).toBe('src/assets/models/restored-hero.glb');
  expect(migration.before).toBe(migration.after);
  expect(migration.original).toBe(migration.after);
  expect(migration.error).toContain('has changed');
  expect(migration.brokenReceipt).toContain('Powwow/old-account-hash');
  check('Legacy files copy into the new layout with verified receipts; originals remain and changed legacy files are not trusted');

  const isolation = await page.evaluate(async () => {
    let projectConflict='',accountConflict='',readConflict='';
    try{await window.files.connectLocalFolder('layout-account','another-project',window.qaRoot);}catch(error){projectConflict=error.message;}
    try{await window.files.connectLocalFolder('another-account','layout-project',window.qaRoot);}catch(error){accountConflict=error.message;}
    try{await window.files.readLocalArtifact('another-account','legacy-model');}catch(error){readConflict=error.message;}
    const secondRoot=await(await navigator.storage.getDirectory()).getDirectoryHandle('other-project-root',{create:true});
    await window.files.connectLocalFolder('layout-account','another-project',secondRoot);
    await window.files.saveLocalProject('layout-account','another-project',{name:'Another project'});
    return {projectConflict,accountConflict,readConflict,manifest:JSON.parse(await window.readPath(window.qaRoot,'.powwow/project.json')).project.name,other:JSON.parse(await window.readPath(secondRoot,'.powwow/project.json')).project.name};
  });
  expect(isolation.projectConflict).toContain('separate folder');
  expect(isolation.accountConflict).toContain('separate folder');
  expect(isolation.readConflict).toContain('for this account');
  expect(isolation.manifest).toBe('My project');
  expect(isolation.other).toBe('Another project');
  check('Separate project/account handles and folder ownership prevent cross-project metadata overwrites');

  const relocated = await page.evaluate(async () => {
    const item=await window.makeArtifact('relocated','new-home.png','keep the original copy','image/png');
    const oldReceipt=await window.files.saveLocalArtifact('layout-account',item.artifact,item.blob);
    const nextRoot=await(await navigator.storage.getDirectory()).getDirectoryHandle('replacement-root',{create:true});
    await window.files.connectLocalFolder('layout-account','layout-project',nextRoot);
    const before=await(await window.files.readLocalArtifact('layout-account',item.artifact.id)).text();
    const nextReceipt=await window.files.migrateLocalArtifact('layout-account',item.artifact);
    const original=await window.readPath(window.qaRoot,oldReceipt.relativePath);
    const copied=await window.readPath(nextRoot,nextReceipt.relativePath);
    await window.files.connectLocalFolder('layout-account','layout-project',window.qaRoot);
    return {before,original,copied,path:nextReceipt.relativePath};
  });
  expect(relocated.before).toBe('keep the original copy');
  expect(relocated.original).toBe(relocated.before);
  expect(relocated.copied).toBe(relocated.before);
  expect(relocated.path).toBe('src/assets/images/new-home.png');
  check('Changing a project folder preserves old reads and copies verified assets directly into the replacement root');

  await page.evaluate(async () => {
    const item=await window.makeArtifact('hook-expired','expired-reference.png','reference bytes from expired staging','image/png');
    await window.seedLegacy(item,'Powwow/old-account-hash/projects/old-project/files/expired.png');
    const React=(await import('/node_modules/.vite/deps/react.js')).default;
    const ReactDOM=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const {useLocalPersistence}=await import('/src/useLocalPersistence.ts');
    const artifacts=[{...item.artifact,storage_mode:'local',available:false,local_saved_at:'2026-10-01T00:00:00Z'}];
    const preferences={storage_mode:'local'};
    function App(){const state=useLocalPersistence({accountId:'layout-account',preferences,artifacts,project:{id:'layout-project'},metadata:{name:'My project'},enabled:true});window.hookState=state;return React.createElement('pre',null,JSON.stringify(state));}
    ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
  });
  await expect.poll(()=>page.evaluate(async()=>(await window.files.listLocalFiles('layout-account')).find(item=>item.artifactId==='hook-expired')?.relativePath)).toBe('src/assets/images/expired-reference.png');
  expect(networkCalls).toBe(0);
  expect(await page.evaluate(()=>window.hookState.problem)).toBe('');
  check('The actual persistence hook automatically migrates previously saved, expired assets entirely from verified local bytes');

  expect(report.errors).toEqual([]);
} catch(error) {
  report.failure=error.stack || error.message;
  process.exitCode=1;
} finally {
  await fs.mkdir('evals/reports/local-files-layout',{recursive:true});
  await fs.writeFile('evals/reports/local-files-layout/report.json',JSON.stringify(report,null,2)+'\n');
  await browser.close();
}
if(report.failure) console.error(report.failure);
