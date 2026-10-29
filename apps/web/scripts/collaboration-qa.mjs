import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const base = process.env.POWWOW_QA_URL || 'http://127.0.0.1:5173';
const output = path.resolve('evals/reports/collaboration');
await fs.mkdir(output, { recursive: true });
const report = { note: 'Actual app with isolated API fixtures; verifies UI behavior, not live AI quality or production authorization.', checks: [], errors: [], screenshots: [] };
const check = name => { report.checks.push(name); console.log('PASS', name); };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const now = '2026-10-26T12:00:00Z';
async function fixture({ viewport = { width: 1440, height: 960 }, role = 'owner', empty = false } = {}) {
  const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
  page.on('pageerror', error => report.errors.push(error.message));
  const limits = { members: 5, projects: 3, agents: 3, storage_bytes: 524288000, tasks_per_project: 500 };
  const org = { id: 'org-studio', name: 'Northstar Studio', role, plan: 'free', current_user_id: 'user-a', limits, created_at: now };
  const organizations = empty ? [] : [org];
  const members = [{ user_id: 'user-a', display_name: 'Alex', role, created_at: now }, { user_id: 'user-b', display_name: 'Morgan', role: 'member', created_at: now }];
  const projects = empty ? [] : [{ id: 'project-a', organization_id: org.id, name: 'Field Notes', instructions: '', context_mode: 'project', storage_mode: 'cloud', archived: false, created_at: now, updated_at: now }];
  const tasks = empty ? [] : [{ id: 'task-a', organization_id: org.id, project_id: 'project-a', title: 'Review the mobile onboarding flow', description: 'Check sign-up, project access, and the first assigned task.\nDocument anything that blocks a new collaborator.', status: 'in_progress', assignee_id: 'user-a', created_at: now, updated_at: now }, { id: 'task-b', organization_id: org.id, project_id: 'project-a', title: 'Build the project asset library', description: 'Organize shared images and source files.', status: 'todo', assignee_id: 'user-b', created_at: now, updated_at: now }, { id: 'task-c', organization_id: org.id, project_id: 'project-a', title: 'Check the release checklist', description: 'Verify the finished work.', status: 'review', assignee_id: null, created_at: now, updated_at: now }];
  const chats = [], invites = [], agents = [];
  let policy = { allowed_models: null, allowed_mcps: [], allow_member_agents: true };
  let patchGate;
  const holdTaskPatch = () => { let release; const wait = new Promise(resolve => release = resolve); patchGate = { wait, release, seen:false }; return patchGate; };
  const writes = [];
  await page.route('**/v1/**', async route => {
    const req = route.request(), url = new URL(req.url()), p = url.pathname, method = req.method();
    const body = ['POST', 'PATCH', 'PUT'].includes(method) ? req.postDataJSON() : undefined;
    if (method !== 'GET') writes.push({ path: p, method, body });
    let data;
    if (p === '/v1/config') data = { auth_mode: 'local' };
    else if (p === '/v1/catalog') data = { models: [], skills: [], capabilities: [{ id: 'chat', enabled: true, available: true }], workflows: [], providers: [] };
    else if (p === '/v1/account/preferences') data = { app_language: 'en', storage_mode: 'cloud', plan: 'free', storage_quota_bytes: 524288000, storage_used_bytes: 0, storage_reserved_bytes: 0, checkout_available: false, component_priorities: {} };
    else if (p === '/v1/organizations') { if (method === 'POST') { organizations.push({ ...org, ...body }); data = organizations.at(-1); } else data = organizations; }
    else if (p.endsWith('/members')) data = members;
    else if (/\/members\//.test(p)) { const member = members.find(item => item.user_id === p.split('/').at(-1)); if (method === 'PATCH') Object.assign(member, body); else members.splice(members.indexOf(member), 1); data = member; }
    else if (p.endsWith('/invites')) { if (method === 'POST') { data = { id: `invite-${invites.length}`, ...body, token: 'EXAMPLE-INVITE-CODE', invite_code: 'EXAMPLE-INVITE-CODE', expires_at: '2026-11-02T12:00:00Z', uses: 0 }; invites.push(data); } else data = invites; }
    else if (p === '/v1/invites/accept') { data = {...org,id:'org-joined',name:'Weekend Crew'}; organizations.push(data); }
    else if (/\/invites\//.test(p)) { data = invites.find(item => item.id === p.split('/').at(-1)); data.revoked_at = now; }
    else if (p.endsWith('/policy')) { if (method === 'PUT') policy = body; data = policy; }
    else if (p.endsWith('/usage')) data = { members: members.length, projects: projects.length, agents: agents.length, tasks: tasks.length, storage_used_bytes: 10485760, storage_reserved_bytes: 0, ai_spent_usd: 0, ai_reserved_usd: 0, limits, checkout_available: false };
    else if (p.endsWith('/agents')) { if (method === 'POST') { data = { id: `agent-${agents.length}`, ...body, execution_available: false }; agents.push(data); } else data = agents; }
    else if (/\/agents\//.test(p)) { data = agents.find(item => item.id === p.split('/').at(-1)); if(method==='DELETE') agents.splice(agents.indexOf(data),1); else Object.assign(data, body); }
    else if (p === '/v1/projects') { if (method === 'POST') { data = { id: `project-${projects.length}`, ...body, archived: false, created_at: now, updated_at: now }; projects.push(data); } else data = projects; }
    else if (p === '/v1/tasks') data = tasks.filter(item => item.assignee_id === 'user-a');
    else if (p.endsWith('/tasks') && p.startsWith('/v1/projects/')) { if (method === 'POST') { data = { id: `task-${tasks.length}`, organization_id: org.id, project_id: p.split('/')[3], status: 'todo', ...body, created_at: now, updated_at: now }; tasks.push(data); } else data = tasks.filter(item => item.project_id === p.split('/')[3]); }
    else if (/^\/v1\/tasks\/[^/]+$/.test(p)) { data = tasks.find(item => item.id === p.split('/').at(-1)); Object.assign(data, body); if(patchGate) { const gate=patchGate;patchGate=null;gate.seen=true;await gate.wait; } }
    else if (p.startsWith('/v1/tasks/') && p.endsWith('/chat')) { const task = tasks.find(item => item.id === p.split('/')[3]); data = { id: `chat-${task.id}`, project_id: task.project_id, title: task.title, context_mode: 'project', archived: false, created_at: now, updated_at: now }; if (!chats.some(item => item.id === data.id)) chats.push(data); }
    else if (p === '/v1/chats') data = chats;
    else if (p.endsWith('/messages')) data = [];
    else if (p === '/v1/builder/catalog') data = { kinds: [], components: [{id:'design',name:'Blueprint',icon:'design',priority:0},{id:'tasks',name:'Task board',icon:'tasks',priority:1},{id:'details',name:'Project details',icon:'details',priority:2}] };
    else if (p.endsWith('/workspace')) data = { version: 1, workspace: { initialized: true, kind: 'software', brief: '', answers: {}, assumptions: [], components: ['design','tasks','details'], tasks: [], records: {}, design: '', plan_prompt: '' } };
    else if (p === '/v1/languages/catalog') data = { languages: [], levels: [] };
    else if (p.endsWith('/language/profiles') || ['/v1/context-grants','/v1/runs','/v1/artifacts'].includes(p)) data = [];
    else { report.errors.push(`Unmocked ${method} ${p}`); await route.fulfill({ status: 500, json: { detail: 'Missing fixture' } }); return; }
    await route.fulfill({ json: data });
  });
  await page.goto(base);
  await expect(page.getByRole('heading', { name: 'My tasks', exact: true })).toBeVisible();
  return { page, writes, tasks, organizations, holdTaskPatch };
}
async function screenshot(page, name) { await page.screenshot({ path: path.join(output, name), fullPage: true }); report.screenshots.push(name); }
try {
  const { page, writes, tasks, holdTaskPatch } = await fixture();
  await expect(page.getByRole('button', { name: /Review the mobile onboarding flow Field Notes/ })).toBeVisible();
  await screenshot(page, 'my-tasks-desktop.png');
  check('Assigned tasks appear in the left navigation and organization home');
  await page.getByRole('button', { name: /Review the mobile onboarding flow Field Notes/ }).click();
  await expect(page.getByRole('region', { name: 'Task description' })).toContainText('Check sign-up');
  await expect(page.getByText('Private chat', { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Describe your request' })).toBeVisible();
  expect(writes.filter(item => item.path === '/v1/runs' || item.path === '/v1/intent')).toHaveLength(0);
  await page.getByRole('combobox', { name: 'Task status', exact: true }).selectOption('review');
  await expect.poll(() => tasks[0].status).toBe('review');
  await screenshot(page, 'task-chat-desktop.png');
  check('Task opens its private chat without submitting a model request; status persists through API');
  await page.getByRole('button', { name: 'Close task', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Task board', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('Test invitation acceptance');
  await page.getByRole('textbox', { name: 'Description', exact: true }).fill('Verify a new collaborator can join.');
  await page.getByRole('combobox', { name: 'Assign to', exact: true }).selectOption('user-a');
  await page.getByRole('button', { name: 'Save task', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Test invitation acceptance Verify/ })).toBeVisible();
  await screenshot(page, 'board-desktop.png');
  check('Shared board creates tasks with description and organization member assignment');
  await page.getByRole('button', { name: 'Manage organization', exact: true }).click();
  await page.getByRole('button', { name: 'Create invite', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Invite link', exact: true })).toHaveValue(/\?invite=EXAMPLE/);
  await expect(page.getByRole('link', { name: 'Open email draft', exact: true })).toHaveAttribute('href', /^mailto:/);
  await page.getByRole('button', { name: 'Revoke', exact: true }).click();
  await expect(page.getByText('Revoked', { exact: true })).toBeVisible();
  check('Expiring invitation supports copy link, code, email draft and revocation');
  await page.getByRole('button', { name: 'Access', exact: true }).click();
  await page.getByRole('combobox', { name: 'Model access', exact: true }).selectOption('disabled');
  await page.getByRole('button', { name: 'Save access', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Saved');
  expect(writes.findLast(item => item.path.endsWith('/policy')).body.allowed_models).toEqual([]);
  check('Organization model policy distinguishes configured access from explicit deny-all');
  await page.getByRole('button', { name: 'Agents', exact: true }).click();
  await page.getByRole('button', { name: 'Create agent', exact: true }).click();
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Release reviewer');
  await page.getByRole('textbox', { name: 'Instructions', exact: true }).fill('Review the release checklist and report evidence.');
  await page.getByRole('button', { name: 'Save agent', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Release reviewer', exact: true })).toBeVisible();
  await expect(page.getByText('Shared agent definitions. Agent execution is not connected yet.')).toBeVisible();
  await page.getByRole('button', { name: /Release reviewer No description/ }).click();
  await page.getByRole('button', { name: 'Delete agent', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm delete', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No agents yet', exact: true })).toBeVisible();
  check('Shared agent definition is saved and execution availability is explicit');
  await page.getByRole('button', { name: 'Code review', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Code', exact: true })).toBeVisible();
  await page.getByLabel('Import source or patch files').setInputFiles({name:'review.txt',mimeType:'text/plain',buffer:Buffer.from('Keep this imported work during navigation.\n')});
  await expect(page.getByRole('region', {name:'Source code'})).toContainText('Keep this imported work');
  await page.getByRole('button', { name: /^My tasks/ }).click();
  await page.getByRole('button', { name: 'Code review', exact: true }).click();
  await expect(page.getByRole('region', {name:'Source code'})).toContainText('Keep this imported work');
  check('Imported code remains available across workspace navigation');
  await page.getByRole('button', { name: /^My tasks/ }).click();
  await page.getByRole('button', { name: /Review the mobile onboarding flow Field Notes/ }).click();
  const gate=holdTaskPatch();
  await page.getByRole('combobox', {name:'Task status',exact:true}).selectOption('done');
  await expect.poll(()=>gate.seen).toBe(true);
  await page.getByRole('button', {name:'Close task',exact:true}).click();
  await page.getByRole('button', {name:/Build the project asset library Organize/}).click();
  gate.release();
  await expect(page.getByRole('region',{name:'Task description'})).toContainText('Build the project asset library');
  await expect(page.getByRole('region',{name:'Task description'})).not.toContainText('Review the mobile onboarding');
  check('Delayed task saves do not replace the newly selected task or private chat');
  await page.getByRole('button', { name: /^My tasks/ }).click();
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Local', exact: true })).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Project Name', exact: true }).fill('Shared launch');
  await page.getByRole('dialog').getByRole('button', { name: 'Create project', exact: true }).click();
  await expect.poll(() => writes.filter(item => item.path === '/v1/projects' && item.method === 'POST').length).toBe(1);
  expect(writes.findLast(item => item.path === '/v1/projects').body).toMatchObject({organization_id:'org-studio',storage_mode:'cloud'});
  check('New organization projects use cloud storage and include the organization ID; code review is reachable');
  await page.goto(`${base}/?invite=EXAMPLE-INVITE-CODE`);
  await expect(page.getByRole('textbox', {name:'Invite link or code',exact:true})).toHaveValue('EXAMPLE-INVITE-CODE');
  await page.getByRole('button', {name:'Join organization',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Weekend Crew',exact:true})).toBeVisible();
  expect(new URL(page.url()).searchParams.has('invite')).toBe(false);
  check('Invite deep links select the joined organization and remove the token from the address bar');
  await page.close();

  const mobile = await fixture({ viewport: { width: 390, height: 844 } });
  await screenshot(mobile.page, 'my-tasks-mobile.png');
  expect(await mobile.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await mobile.page.getByRole('button', { name: /Review the mobile onboarding flow Field Notes/ }).click();
  expect(await mobile.page.locator('.main-shell').evaluate(element=>getComputedStyle(element).backgroundImage)).toBe('none');
  await expect(mobile.page.getByRole('combobox', { name: 'Task status' })).toBeVisible();
  await screenshot(mobile.page, 'task-chat-mobile.png');
  expect(await mobile.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await mobile.page.getByRole('button', { name: 'Close task', exact: true }).click();
  await expect(mobile.page.getByRole('heading', { name: 'Task board', exact: true })).toBeVisible();
  await screenshot(mobile.page, 'board-mobile.png');
  check('390px phone layout has task actions and stacked board columns without page overflow');
  await mobile.page.close();

  const viewer = await fixture({ role: 'viewer', viewport: { width: 760, height: 900 } });
  await viewer.page.getByRole('button', { name: /Review the mobile onboarding flow Field Notes/ }).click();
  await expect(viewer.page.getByRole('combobox', { name: 'Task status' })).toBeDisabled();
  await expect(viewer.page.getByRole('combobox', { name: 'Task assignee' })).toBeDisabled();
  expect(viewer.writes.filter(item => item.path.endsWith('/chat'))).toHaveLength(0);
  await viewer.page.getByRole('button', { name: 'Close task', exact: true }).click();
  await expect(viewer.page.getByRole('button', { name: 'Add task', exact: true })).toHaveCount(0);
  check('Viewer controls are read-only; backend authorization is tested separately');
  await viewer.page.close();

  const onboarding = await fixture({ empty: true });
  await onboarding.page.getByRole('button', { name: 'Get started', exact: true }).click();
  await onboarding.page.getByRole('textbox', { name: 'Name', exact: true }).fill('Family projects');
  await onboarding.page.getByRole('button', { name: 'Create organization', exact: true }).click();
  await expect(onboarding.page.getByRole('heading', { name: 'Family projects', exact: true })).toBeVisible();
  check('New user can create an organization without an existing project');
  await onboarding.page.close();
  expect(report.errors).toEqual([]);
} catch (error) { report.errors.push(error.stack || String(error)); process.exitCode = 1; }
finally { await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2)); await browser.close(); }
console.log(JSON.stringify(report, null, 2));
