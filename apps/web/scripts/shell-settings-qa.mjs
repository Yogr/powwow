import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const output = path.join(root, 'evals/reports/shell-settings');
const base = process.env.POWWOW_QA_URL || 'http://127.0.0.1:5173';
await fs.mkdir(output, { recursive: true });
const report = { note: 'Actual App with isolated account/API fixtures. No real AI calls, account changes, or user files.', checks: [], errors: [], screenshots: [], payloads: {} };
const browser = await chromium.launch({ headless: true });
const check = text => { report.checks.push(text); console.log('PASS', text); };
const noPrices = async page => expect(await page.locator('body').innerText()).not.toMatch(/\$\s*\d|\b(?:reply limit|planning run limit|daily budget|reserves \$)\b/i);

async function fixture(viewport = { width: 1440, height: 1000 }) {
  const page = await browser.newPage({ viewport });
  page.on('pageerror', error => report.errors.push(error.message));
  const now = '2026-10-03T16:00:00Z';
  const projects = [{ id: 'project-film', name: 'The Small Adventure', instructions: 'A short family film.', context_mode: 'project', archived: false, created_at: now, updated_at: now }];
  const chats = [
    { id: 'chat-free', project_id: null, title: 'Weekend ideas', context_mode: 'chat', archived: false, created_at: now, updated_at: now },
    { id: 'chat-film', project_id: 'project-film', title: 'Scene notes', context_mode: 'project', archived: false, created_at: now, updated_at: now },
  ];
  const messages = new Map(chats.map(chat => [chat.id, []]));
  const runs = [], artifacts = [];
  const preferences = { app_language: 'en', storage_mode: 'cloud', plan: 'free', storage_quota_bytes: 1000000000, storage_used_bytes: 0, storage_staged_bytes: 0, local_retention_hours: 24, checkout_available: false, component_priorities: {} };
  const catalog = { kinds: [{ id: 'movie', name: 'Movie', icon: 'movie', description: 'Create a movie', components: ['design', 'tasks', 'characters', 'storyboard'], questions: [] }], components: [
    { id: 'storyboard', name: 'Storyboard', description: 'Plan each shot.', icon: 'storyboard', priority: 8 },
    { id: 'tasks', name: 'Task Board', description: 'Remaining work.', icon: 'tasks', priority: 99 },
    { id: 'characters', name: 'Characters', description: 'Meet the cast.', icon: 'characters', priority: 4 },
    { id: 'design', name: 'Project Blueprint', description: 'The shared plan.', icon: 'design', priority: 55 },
  ] };
  let workspace = { version: 1, workspace: { kind: 'movie', initialized: true, brief: 'A small adventure.', answers: {}, assumptions: [], components: ['storyboard', 'tasks', 'characters', 'design'], tasks: [], records: {}, design: '# The Small Adventure\n\nA short family film.', plan_prompt: 'Make a short film.' } };
  const calls = { projects: [], chats: [], chatUpdates: [], messageWrites: [], intents: [], runs: [], uploads: [], preferenceWrites: [] };
  const responseGates = new Map();
  function holdResponse(endpoint, response, method = 'POST') {
    const key = `${method} ${endpoint}`;
    if (responseGates.has(key)) throw new Error(`A response is already held for ${key}`);
    let release, seen = false;
    const released = new Promise(resolve => { release = resolve; });
    responseGates.set(key, { response, released, markSeen: () => { seen = true; } });
    return { waitUntilSeen: () => expect.poll(() => seen, { message: `Waiting for ${key}` }).toBe(true), release };
  }
  await page.route('**/v1/**', async route => {
    const req = route.request(), url = new URL(req.url()), p = url.pathname, method = req.method();
    let data;
    if (p === '/v1/config') data = { auth_mode: 'local' };
    else if (p === '/v1/catalog') data = { models: [], skills: [], capabilities: [{ id: 'chat', enabled: true, available: true }], workflows: [], providers: [] };
    else if (p === '/v1/account/preferences') {
      if (method === 'PATCH') { const patch = req.postDataJSON(); calls.preferenceWrites.push(patch); Object.assign(preferences, patch); }
      data = preferences;
    } else if (p === '/v1/projects') {
      if (method === 'POST') { const body = req.postDataJSON(); calls.projects.push(body); const value = { ...body, id: `project-new-${projects.length}`, archived: false, created_at: now, updated_at: now }; projects.push(value); data = value; }
      else data = projects;
    } else if (p === '/v1/chats') {
      if (method === 'POST') { const body = req.postDataJSON(); calls.chats.push(body); const value = { ...body, id: `chat-created-${calls.chats.length}`, archived: false, created_at: now, updated_at: now }; chats.unshift(value); messages.set(value.id, []); data = value; }
      else data = chats;
    } else if (/^\/v1\/chats\/[^/]+$/.test(p) && method === 'PATCH') {
      const chat = chats.find(item => item.id === p.split('/')[3]);
      if (!chat) throw new Error(`Unknown fixture chat: ${p}`);
      const body = req.postDataJSON(); calls.chatUpdates.push({ id: chat.id, ...body }); Object.assign(chat, body); data = chat;
    } else if (/^\/v1\/chats\/[^/]+\/messages$/.test(p)) {
      const chatId = p.split('/')[3];
      if (method === 'POST') { const body = req.postDataJSON(); calls.messageWrites.push({ chatId, ...body }); const value = { ...body, id: `message-${chatId}-${messages.get(chatId).length}`, chat_id: chatId, role: 'user', created_at: now }; messages.get(chatId).push(value); data = value; }
      else data = messages.get(chatId) || [];
    } else if (p === '/v1/builder/catalog') data = catalog;
    else if (p === '/v1/builder/preview' || p.endsWith('/plan-preview')) data = { eligible: false, reason: 'no_creation_intent', kind: 'other', answers: {} };
    else if (p.endsWith('/workspace')) { if (method === 'PATCH') workspace = { version: workspace.version + 1, workspace: req.postDataJSON().workspace }; data = workspace; }
    else if (p === '/v1/languages/catalog') data = { languages: [{ code: 'en', name: 'English', native_name: 'English', locale: 'en-US' }, { code: 'es', name: 'Spanish', native_name: 'Español', locale: 'es-ES' }], levels: [{ id: 'beginner', name: 'Just starting', description: 'Everyday words' }] };
    else if (p.endsWith('/language/profiles')) data = [];
    else if (p === '/v1/context-grants') data = [];
    else if (p === '/v1/intent') { const body = req.postDataJSON(); calls.intents.push(body); data = { id: `intent-${calls.intents.length}`, capability: 'chat', available: true, needs_image: false, summary: 'A conversation' }; }
    else if (p === '/v1/runs') {
      if (method === 'POST') {
        const body = req.postDataJSON(); calls.runs.push(body);
        const value = { ...body, id: `run-${calls.runs.length}`, project_id: chats.find(chat => chat.id === body.chat_id)?.project_id || null, capability: 'chat', workflow_id: 'chat', status: 'succeeded', stage: 'complete', progress: 1, prompt: messages.get(body.chat_id).at(-1)?.content || '', artifact_ids: [], output_text: `Fixture reply ${calls.runs.length}.`, error: null, estimated_cost_usd: .15, actual_cost_usd: .08, provider: 'fixture', model: 'fixture', model_provenance: {}, context_snapshot: [], attempt: 1, created_at: now, updated_at: now, started_at: now, completed_at: now };
        runs.unshift(value); messages.get(body.chat_id).push({ id: `assistant-${value.id}`, chat_id: body.chat_id, role: 'assistant', content: value.output_text, run_id: value.id, created_at: now }); data = value;
      } else data = runs;
    } else if (p === '/v1/artifacts') data = artifacts;
    else if (p === '/v1/uploads') {
      const body = req.postData() || ''; calls.uploads.push(body);
      const value = { id: `artifact-${calls.uploads.length}`, project_id: null, chat_id: null, name: 'reference.txt', kind: 'file', mime_type: 'text/plain', size_bytes: 22, metadata: {}, storage_mode: 'cloud', available: true, created_at: now, updated_at: now, download_url: '/v1/files/fixture' };
      artifacts.push(value); data = value;
    } else if (p.startsWith('/v1/files/')) { await route.fulfill({ contentType: 'text/plain', body: 'A small reference file.' }); return; }
    else { report.errors.push(`Unmocked endpoint: ${method} ${p}`); await route.fulfill({ status: 500, json: { detail: 'Missing fixture endpoint' } }); return; }
    const gate = responseGates.get(`${method} ${p}`);
    if (gate) {
      responseGates.delete(`${method} ${p}`);
      gate.markSeen(); await gate.released;
      if (gate.response !== undefined) data = gate.response;
    }
    await route.fulfill({ json: data });
  });
  await page.goto(base);
  await expect(page.getByRole('textbox', { name: 'Describe your request' })).toBeVisible();
  return { page, calls, holdResponse, messages };
}

async function openSidebar(page) {
  const trigger = page.getByRole('button', { name: 'Open sidebar', exact: true });
  if (await trigger.isVisible()) await trigger.click();
  await expect.poll(async () => (await page.locator('.sidebar').boundingBox())?.x ?? -100).toBeGreaterThanOrEqual(-1);
}
async function closeSidebar(page) { const trigger = page.getByRole('button', { name: 'Collapse sidebar', exact: true }); if (await trigger.isVisible()) await trigger.click(); }
async function openSettings(page, section = 'Settings') {
  await openSidebar(page); await page.getByRole('button', { name: 'Account menu', exact: true }).click(); await page.getByRole('menuitem', { name: section, exact: true }).click(); await expect(page.getByRole('dialog', { name: 'Settings', exact: true })).toBeVisible();
}
async function screenshot(page, name) { await page.screenshot({ path: path.join(output, name), fullPage: true }); report.screenshots.push(name); }
async function releaseResponse(page, gate, endpoint) {
  const responded = page.waitForResponse(response => new URL(response.url()).pathname === endpoint && response.request().method() === 'POST');
  gate.release(); await (await responded).finished();
  await expect(page.getByRole('button', { name: 'Add to your message', exact: true })).toBeEnabled();
}

try {
  const desktop = await fixture(), page = desktop.page, calls = desktop.calls;
  for (const name of ['Home', 'Explore', 'Library']) await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0);
  await expect(page.locator('.standalone-chat-list').getByRole('button', { name: 'Weekend ideas', exact: true })).toBeVisible();
  await expect(page.locator('.standalone-chat-list').getByRole('button', { name: 'Scene notes', exact: true })).toHaveCount(0);
  await expect(page.locator('.breadcrumb-project')).toHaveText('Chats');
  await expect(page.getByRole('button', { name: 'Intelligence level', exact: true })).toBeVisible();
  const initialComposer = await page.locator('.composer-inner').evaluate(node => {
    const area = node.querySelector('textarea').getBoundingClientRect();
    const add = node.querySelector('[aria-label="Add to your message"]').getBoundingClientRect();
    const send = node.querySelector('[aria-label="Send request"]').getBoundingClientRect();
    return { inputWidth: area.width, totalWidth: node.getBoundingClientRect().width, addLeft: add.left, sendLeft: send.left };
  });
  expect(initialComposer.inputWidth / initialComposer.totalWidth).toBeGreaterThan(.8);
  expect(initialComposer.addLeft).toBeLessThan(initialComposer.sendLeft);
  await noPrices(page);
  await screenshot(page, 'shell-home-desktop.png');
  check('Shell opens in standalone Chats with separate project/chat lists and no Home, Explore or Library navigation');

  const add = page.getByRole('button', { name: 'Add to your message', exact: true });
  await add.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Add a file for reference', exact: true })).toBeFocused();
  await page.getByRole('menuitem', { name: 'Add a file for reference', exact: true }).press('End');
  await expect(page.getByRole('menuitemcheckbox', { name: 'Allow web search', exact: true })).toBeFocused();
  await expect(page.getByRole('menuitemcheckbox', { name: 'Allow web search', exact: true })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('menuitemcheckbox', { name: 'Allow web search', exact: true }).press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0); await expect(add).toBeFocused();
  check('Composer plus menu exposes file/components/web controls; web defaults on and keyboard arrows/Escape work');

  await add.click(); const choose = page.waitForEvent('filechooser');
  await page.getByRole('menuitem', { name: 'Add a file for reference', exact: true }).click();
  await (await choose).setFiles({ name: 'reference.txt', mimeType: 'text/plain', buffer: Buffer.from('A small reference file.') });
  await expect(page.locator('.attachment-chip')).toContainText('reference.txt'); expect(calls.uploads).toHaveLength(1);
  await page.getByRole('button', { name: 'Remove reference.txt', exact: true }).click();
  check('Add file opens the picker and attaches an in-memory reference using the selected cloud storage');

  await add.click(); await page.getByRole('menuitem', { name: 'Add components', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Add components to a project', exact: true })).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'The Small Adventure', exact: true })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Close dialog', exact: true }).click();
  await page.locator('.project-select').filter({ hasText: 'The Small Adventure' }).click();
  await expect(page.getByRole('heading', { name: 'Blueprint', exact: true })).toBeVisible();
  const names = await page.locator('.project-tools > button').allTextContents();
  expect(names.slice(0, 4)).toEqual(['Project Blueprint', 'Task Board', 'Characters', 'Storyboard']);
  await expect(page.locator('.project-tools').getByRole('button', { name: 'Scene notes', exact: true })).toBeVisible();
  await noPrices(page); await screenshot(page, 'shell-blueprint-desktop.png');
  check('Add components requires a project; project navigation opens Blueprint with Blueprint first, Tasks second, and catalog priority thereafter');

  await page.locator('.project-tools').getByRole('button', { name: 'Scene notes', exact: true }).click();
  await add.click(); await page.getByRole('menuitem', { name: 'Add components', exact: true }).click();
  await expect(page.getByRole('dialog', { name: "Your project's tools", exact: true })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Close dialog', exact: true }).click();
  check('The same component action opens the project-local component picker from a project chat');

  await page.locator('.standalone-new-chat').click();
  await page.getByRole('textbox', { name: 'Describe your request' }).fill('Tell me a lighthearted fact.');
  await page.getByRole('button', { name: 'Send request', exact: true }).click();
  await expect(page.getByText('Fixture reply 1.', { exact: true })).toBeVisible();
  expect(calls.chats[0]).toMatchObject({ project_id: null, context_mode: 'chat' });
  expect(calls.intents[0]).toMatchObject({ intelligence: 'basic', allow_web_search: true });
  expect(calls.runs[0].settings).toMatchObject({ intelligence: 'basic', web_search: true });
  check('A new standalone chat sends project_id:null and Basic/web-enabled routing to both intent and run endpoints');

  await page.getByRole('button', { name: 'Intelligence level', exact: true }).click();
  await page.getByRole('menuitemradio', { name: /^Smarter/ }).click();
  await add.click(); await page.getByRole('menuitemcheckbox', { name: 'Allow web search', exact: true }).click();
  await page.getByRole('textbox', { name: 'Describe your request' }).fill('Explain why that happens.');
  await page.getByRole('button', { name: 'Send request', exact: true }).click();
  await expect(page.getByText('Fixture reply 2.', { exact: true })).toBeVisible();
  expect(calls.intents[1]).toMatchObject({ intelligence: 'smarter', allow_web_search: false });
  expect(calls.runs[1].settings).toMatchObject({ intelligence: 'smarter', web_search: false });
  await page.getByRole('button', { name: 'Intelligence level', exact: true }).click();
  await page.getByRole('menuitemradio', { name: /^Super/ }).click();
  await page.getByRole('textbox', { name: 'Describe your request' }).fill('Give me one more interesting connection.');
  await page.getByRole('button', { name: 'Send request', exact: true }).click();
  await expect(page.getByText('Fixture reply 3.', { exact: true })).toBeVisible();
  expect(calls.intents[2]).toMatchObject({ intelligence: 'super', allow_web_search: false });
  expect(calls.runs[2].settings).toMatchObject({ intelligence: 'super', web_search: false });
  await noPrices(page); report.payloads = { chats: calls.chats, intents: calls.intents, runSettings: calls.runs.map(run => run.settings) };
  check('Smarter and Super choices, plus disabled web search, reach outbound requests without displaying run prices');

  await openSettings(page);
  await expect(page.getByRole('heading', { name: 'General', exact: true })).toBeVisible();
  await noPrices(page);
  await page.getByRole('button', { name: 'App language', exact: true }).click();
  await page.getByRole('option', { name: 'Español', exact: true }).click();
  await page.getByRole('button', { name: 'Save language', exact: true }).click();
  expect(calls.preferenceWrites.at(-1)).toEqual({ app_language: 'es' });
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await screenshot(page, 'settings-general-desktop.png');
  await page.getByRole('button', { name: 'Storage', exact: true }).click();
  await noPrices(page);
  await page.getByRole('button', { name: 'Subscription', exact: true }).click();
  await expect(page.getByText('$20', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Checkout not available', exact: true })).toBeDisabled();
  await screenshot(page, 'settings-subscription-desktop.png');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await noPrices(page);
  check('Account menu opens Settings; language saves through preferences and pricing appears only on Subscription with checkout disabled');
  await page.close();

  const previewRace = await fixture();
  const previewGate = previewRace.holdResponse('/v1/builder/preview', { eligible: true, reason: 'creation_intent', kind: 'movie', answers: {} });
  await previewRace.page.getByRole('textbox', { name: 'Describe your request' }).fill('I want to make a short movie about a tiny astronaut.');
  await previewRace.page.getByRole('button', { name: 'Send request', exact: true }).click();
  await previewGate.waitUntilSeen();
  await previewRace.page.locator('.standalone-chat-list').getByRole('button', { name: 'Weekend ideas', exact: true }).click();
  await expect(previewRace.page.locator('.breadcrumb-current')).toHaveText('Weekend ideas');
  const previewDraft = await previewRace.page.getByRole('textbox', { name: 'Describe your request' }).inputValue();
  await releaseResponse(previewRace.page, previewGate, '/v1/builder/preview');
  await expect(previewRace.page.locator('.breadcrumb-project')).toHaveText('Chats');
  await expect(previewRace.page.locator('.breadcrumb-current')).toHaveText('Weekend ideas');
  await expect(previewRace.page.getByRole('textbox', { name: 'Describe your request' })).toHaveValue(previewDraft);
  expect(previewRace.calls.projects).toHaveLength(0); expect(previewRace.calls.chats).toHaveLength(0);
  expect(previewRace.calls.intents).toHaveLength(0); expect(previewRace.calls.runs).toHaveLength(0);
  await expect(previewRace.page.getByRole('dialog')).toHaveCount(0);
  await previewRace.page.close();
  check('Navigating to an existing chat during the first project preview ignores the stale response without creating a project or replacing the composer text');

  const intentRace = await fixture();
  const intentGate = intentRace.holdResponse('/v1/intent');
  await intentRace.page.getByRole('textbox', { name: 'Describe your request' }).fill('Tell me about constellations.');
  await intentRace.page.getByRole('button', { name: 'Send request', exact: true }).click();
  await intentGate.waitUntilSeen();
  await intentRace.page.locator('.project-select').filter({ hasText: 'The Small Adventure' }).click();
  await intentRace.page.locator('.project-tools').getByRole('button', { name: 'Scene notes', exact: true }).click();
  await expect(intentRace.page.locator('.breadcrumb-current')).toHaveText('Scene notes');
  const intentDraft = await intentRace.page.getByRole('textbox', { name: 'Describe your request' }).inputValue();
  await releaseResponse(intentRace.page, intentGate, '/v1/intent');
  await expect(intentRace.page.locator('.breadcrumb-project')).toHaveText('The Small Adventure');
  await expect(intentRace.page.locator('.breadcrumb-current')).toHaveText('Scene notes');
  await expect(intentRace.page.getByRole('textbox', { name: 'Describe your request' })).toHaveValue(intentDraft);
  expect(intentRace.calls.projects).toHaveLength(0); expect(intentRace.calls.chats).toHaveLength(0);
  expect(intentRace.calls.messageWrites).toHaveLength(0); expect(intentRace.calls.runs).toHaveLength(0);
  await intentRace.page.close();
  check('Navigating to a project chat while intent detection is pending does not create a chat, send a message or run, or select the old conversation');

  const uploadRace = await fixture();
  const uploadGate = uploadRace.holdResponse('/v1/uploads');
  await uploadRace.page.getByRole('button', { name: 'Add to your message', exact: true }).click();
  const raceChooser = uploadRace.page.waitForEvent('filechooser');
  await uploadRace.page.getByRole('menuitem', { name: 'Add a file for reference', exact: true }).click();
  await (await raceChooser).setFiles({ name: 'reference.txt', mimeType: 'text/plain', buffer: Buffer.from('An original composer reference.') });
  await uploadGate.waitUntilSeen();
  await uploadRace.page.locator('.standalone-chat-list').getByRole('button', { name: 'Weekend ideas', exact: true }).click();
  await uploadRace.page.getByRole('textbox', { name: 'Describe your request' }).fill('This chat has no reference file.');
  await releaseResponse(uploadRace.page, uploadGate, '/v1/uploads');
  await expect(uploadRace.page.locator('.breadcrumb-current')).toHaveText('Weekend ideas');
  await expect(uploadRace.page.getByRole('textbox', { name: 'Describe your request' })).toHaveValue('This chat has no reference file.');
  await expect(uploadRace.page.locator('.attachment-chip')).toHaveCount(0);
  expect(uploadRace.calls.uploads).toHaveLength(1); expect(uploadRace.calls.runs).toHaveLength(0);
  await uploadRace.page.close();
  check('A delayed upload remains detached after navigation and cannot attach itself to the destination composer');

  const moveCase = await fixture();
  moveCase.messages.get('chat-free').push({ id: 'move-marker', chat_id: 'chat-free', role: 'assistant', content: 'The moved conversation is open.', created_at: '2026-10-03T16:00:00Z' });
  await moveCase.page.locator('.project-select').filter({ hasText: 'The Small Adventure' }).click();
  await expect(moveCase.page.getByRole('heading', { name: 'Blueprint', exact: true })).toBeVisible();
  await moveCase.page.getByRole('button', { name: 'Options for Weekend ideas', exact: true }).click();
  await moveCase.page.getByRole('menuitem', { name: 'Move to project', exact: true }).click();
  await moveCase.page.getByRole('dialog', { name: 'Move conversation', exact: true }).getByRole('button', { name: 'The Small Adventure', exact: true }).click();
  await expect(moveCase.page.getByText('The moved conversation is open.', { exact: true })).toBeVisible();
  await expect(moveCase.page.locator('.breadcrumb-current')).toHaveText('Weekend ideas');
  await expect(moveCase.page.locator('.breadcrumb-project')).toHaveText('The Small Adventure');
  await expect(moveCase.page.getByRole('heading', { name: 'Blueprint', exact: true })).toHaveCount(0);
  await expect(moveCase.page.locator('.standalone-chat-list').getByRole('button', { name: 'Weekend ideas', exact: true })).toHaveCount(0);
  await expect(moveCase.page.locator('.project-tools').getByRole('button', { name: 'Weekend ideas', exact: true })).toBeVisible();
  expect(moveCase.calls.chatUpdates).toEqual([{ id: 'chat-free', project_id: 'project-film' }]);
  await moveCase.page.close();
  check('Moving a standalone chat from its row menu while viewing Blueprint opens that moved chat in the destination project');

  for (const width of [390, 320]) {
    const mobile = await fixture({ width, height: 844 });
    const p = mobile.page;
    expect(await p.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
    await expect(p.getByRole('button', { name: 'Add to your message', exact: true })).toBeInViewport();
    await expect(p.getByRole('button', { name: 'Intelligence level', exact: true })).toBeInViewport();
    await screenshot(p, `shell-home-${width}.png`);
    await p.getByRole('button', { name: 'Add to your message', exact: true }).click();
    await expect(p.getByRole('menuitemcheckbox', { name: 'Allow web search', exact: true })).toBeInViewport();
    await screenshot(p, `shell-menu-${width}.png`);
    await p.getByRole('menuitemcheckbox', { name: 'Allow web search', exact: true }).press('Escape');
    await openSidebar(p); await expect(p.locator('.standalone-chat-list')).toBeInViewport();
    await screenshot(p, `shell-sidebar-${width}.png`);
    await p.locator('.project-select').filter({ hasText: 'The Small Adventure' }).click();
    await expect(p.getByRole('heading', { name: 'Blueprint', exact: true })).toBeVisible();
    expect(await p.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
    await screenshot(p, `shell-blueprint-${width}.png`);
    await openSettings(p); await expect(p.getByRole('button', { name: 'App language', exact: true })).toBeInViewport();
    expect(await p.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
    await screenshot(p, `settings-general-${width}.png`);
    await p.getByRole('button', { name: 'Done', exact: true }).click(); await closeSidebar(p); await p.close();
  }
  check('Desktop, 390px and 320px shells keep navigation, menu actions, Blueprint and Settings reachable without horizontal overflow');
  expect(report.errors).toEqual([]);
} catch (error) {
  report.errors.push(error.stack || error.message); process.exitCode = 1;
  for (const [index, page] of browser.contexts().flatMap(context => context.pages()).entries()) await page.screenshot({ path: path.join(output, `failure-${index}.png`), fullPage: true }).catch(() => {});
} finally {
  await browser.close(); await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2));
}
