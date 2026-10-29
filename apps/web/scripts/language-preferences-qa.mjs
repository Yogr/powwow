import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const output = path.join(root, 'evals/reports/language-preferences');
const base = process.env.POWWOW_QA_URL || 'http://127.0.0.1:5173';
await fs.mkdir(output, { recursive: true });
const report = { note: 'Isolated browser fixtures exercise actual UI modules without paid requests or stored account data.', checks: [], errors: [], screenshots: [] };
const browser = await chromium.launch({ headless: true });
const check = text => { report.checks.push(text); console.log('PASS', text); };
const catalog = {
  languages: [
    { code: 'en', name: 'English', native_name: 'English', locale: 'en-US' },
    { code: 'es', name: 'Spanish', native_name: 'Español', locale: 'es-ES' },
    { code: 'fr', name: 'French', native_name: 'Français', locale: 'fr-FR' },
    { code: 'de', name: 'German', native_name: 'Deutsch', locale: 'de-DE' },
    { code: 'ja', name: 'Japanese', native_name: '日本語', locale: 'ja-JP' },
  ], levels: [{ id: 'beginner', name: 'Just starting', description: 'Start with the basics' }],
  intelligence: { setup_required: false, qualification: 'baseline', qualification_note: 'Fixture', tiers: [
    { id: 'basic', name: 'Basic', description: 'Everyday conversations', enabled: true, model: 'fixture', max_cost_usd: .01 },
    { id: 'smarter', name: 'Smarter', description: 'More detailed guidance', enabled: true, model: 'fixture', max_cost_usd: .02 },
    { id: 'advanced', name: 'Advanced', description: 'Thoughtful language coaching', enabled: true, model: 'fixture', max_cost_usd: .03 },
  ], limits: { daily_budget_usd: 2, daily_turns: 100 } },
};
const html = props => `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1" /></head><body><div id="root" style="height:100dvh"></div><script type="module">
import RefreshRuntime from '/@react-refresh';
RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$=()=>{}; window.$RefreshSig$=()=>type=>type; window.__vite_plugin_react_preamble_installed__=true;
const React = (await import('/node_modules/.vite/deps/react.js')).default;
const ReactDOM = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
await import('/src/styles.css'); await import('/src/creative-studio.css');
const {LanguageLearning}=await import('/src/LanguageLearning.tsx');
const {CreativeShowcase}=await import('/src/CreativeShowcase.tsx');
const {SelectMenu}=await import('/src/SelectMenu.tsx');
const {sortBuilderComponents}=await import('/src/builder.ts');
window.__order=sortBuilderComponents([{id:'storyboard',priority:5},{id:'tasks',priority:99},{id:'characters',priority:4},{id:'design',priority:55}]).map(item=>item.id);
window.__created=[];
const h=React.createElement;
function MenuDialog(){const [value,setValue]=React.useState('one');const ref=React.useRef(null);React.useEffect(()=>{ref.current.showModal()},[]);return h('dialog',{ref,'aria-label':'Menu fixture'},h(SelectMenu,{ariaLabel:'Choice',value,onChange:setValue,options:[{value:'one',label:'One'},{value:'two',label:'Two'},{value:'three',label:'Three',disabled:true}]}),h('button',null,'After selector'));}
const props=${JSON.stringify(props)};
const content=props.mode==='orbit'?h('div',{style:{width:'900px',maxWidth:'100%',height:'450px'}},h(CreativeShowcase)):props.mode==='menu'?h(MenuDialog):h(LanguageLearning,{projectId:'project-fixture',projectName:'My practice',budget:'1.00',accountId:'account-fixture',...props,onProfilesChanged:id=>window.__created.push(id)});
ReactDOM.createRoot(document.getElementById('root')).render(h(React.StrictMode,null,content));
</script></body></html>`;

async function openFixture(props = {}, viewport = { width: 1200, height: 900 }) {
  const page = await browser.newPage({ viewport });
  const calls = { profiles: [], turns: [] };
  const state = { profile: null, turns: [], last_run: null };
  const day = { id: 'day-fixture', profile_id: 'profile-fixture', date: '2026-10-03', day_number: 1, chat_id: 'chat-fixture' };
  page.on('pageerror', error => report.errors.push(error.message));
  await page.route('**/__language-preferences-fixture', route => route.fulfill({ contentType: 'text/html', body: html(props) }));
  await page.route('**/v1/**', async route => {
    const request = route.request();
    const url = new URL(request.url()).pathname;
    let data;
    if (url === '/v1/languages/catalog') data = catalog;
    else if (url.endsWith('/language/profiles') && request.method() === 'POST') {
      const body = request.postDataJSON(); calls.profiles.push(body);
      state.profile = { id: 'profile-fixture', project_id: 'project-fixture', ...body, start_date: day.date, created_at: `${day.date}T12:00:00Z` };
      data = state.profile;
    } else if (url.endsWith('/phrases')) data = [];
    else if (url.endsWith('/profiles/profile-fixture/days')) data = { profile: state.profile, days: [day], current_day_id: day.id };
    else if (url.endsWith('/days/day-fixture/turns')) {
      calls.turns.push(request.postDataJSON());
      const run = { id: 'run-fixture', status: 'succeeded', settings: {} };
      state.last_run = run;
      state.turns = [{ id: 'turn-fixture', role: 'assistant', text: 'Hola, ¿cómo estás?', created_at: `${day.date}T12:01:00Z`, reply: { text: 'Hola, ¿cómo estás?', translation: 'Hello, how are you?', segments: [{ text: 'Hola, ', translation: 'Hello' }, { text: '¿cómo ', translation: 'how' }, { text: 'estás?', translation: 'are you' }], show_translation_tip: false, suggested_replies: [], vocabulary: [] } }];
      data = run;
    } else if (url.endsWith('/days/day-fixture')) data = { day, turns: state.turns, active_run: null, last_run: state.last_run };
    else { report.errors.push(`Unmocked endpoint: ${request.method()} ${url}`); data = {}; }
    await route.fulfill({ json: data });
  });
  await page.goto(`${base}/__language-preferences-fixture`);
  return { page, calls };
}

try {
  const auto = await openFixture({ initialTargetLanguage: 'Spanish', appLanguage: 'en', defaultLearnerName: 'Marisa' });
  await expect(auto.page.getByRole('heading', { name: 'Learn: Spanish', exact: true })).toBeVisible();
  await expect(auto.page.locator('.language-tutor-turn')).toHaveCount(1);
  expect(auto.calls.profiles).toHaveLength(1);
  expect(auto.calls.profiles[0]).toMatchObject({ learner_name: 'Marisa', target_language: 'es', native_language: 'en', level: 'beginner' });
  expect(auto.calls.turns).toHaveLength(1);
  await expect(auto.page.getByText('I’m comfortable speaking')).toHaveCount(0);
  check('A language from the prompt opens one learner and one greeting under StrictMode using the app language');
  await auto.page.locator('.language-intelligence summary').click();
  await expect(auto.page.getByRole('button', { name: /Super/ })).toBeVisible();
  await expect(auto.page.getByText('Advanced', { exact: true })).toHaveCount(0);
  expect(await auto.page.locator('body').innerText()).not.toMatch(/\$|reserves|budget|Reply limit|Account limits/);
  await auto.page.getByRole('button', { name: /Super/ }).click();
  expect(await auto.page.evaluate(() => localStorage.getItem('powwow:language-intelligence:account-fixture:profile-fixture'))).toBe('advanced');
  check('Basic, Smarter and Super hide price details while scoped preferences preserve the backend advanced id');
  await auto.page.screenshot({ path: path.join(output, 'language-warm-desktop.png'), fullPage: true }); report.screenshots.push('language-warm-desktop.png');
  expect(await auto.page.evaluate(() => window.__order)).toEqual(['design', 'tasks', 'characters', 'storyboard']);
  check('Blueprint and task board precede tools sorted by catalog priority');
  await auto.page.close();

  const inline = await openFixture({ appLanguage: 'fr', defaultLearnerName: 'Nora' }, { width: 320, height: 844 });
  await expect(inline.page.getByRole('heading', { name: 'What would you like to speak?' })).toBeVisible();
  expect(inline.calls.profiles).toHaveLength(0);
  await expect(inline.page.getByRole('dialog')).toHaveCount(0);
  await expect(inline.page.getByRole('textbox')).toHaveCount(0);
  await inline.page.getByRole('button', { name: 'Language to learn', exact: true }).click();
  await expect(inline.page.getByRole('listbox', { name: 'Language to learn' })).toBeVisible();
  await expect(inline.page.getByRole('option', { name: /French/ })).toHaveCount(0);
  await inline.page.getByRole('listbox').press('g');
  await inline.page.getByRole('listbox').press('Enter');
  await expect(inline.page.getByRole('button', { name: 'Language to learn' })).toHaveText('German');
  await inline.page.screenshot({ path: path.join(output, 'language-inline-320.png'), fullPage: true }); report.screenshots.push('language-inline-320.png');
  expect(await inline.page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(321);
  await inline.page.getByRole('button', { name: 'Start learning', exact: true }).click();
  await expect(inline.page.getByRole('heading', { name: 'Learn: German', exact: true })).toBeVisible();
  expect(inline.calls.profiles[0]).toMatchObject({ learner_name: 'Nora', target_language: 'de', native_language: 'fr' });
  check('Target-only inline setup supports keyboard selection at320px without fluent-language, name or level questions');
  await inline.page.close();

  const same = await openFixture({ appLanguage: 'en', initialTargetLanguage: 'en' });
  await expect(same.page.getByRole('heading', { name: 'What would you like to speak?' })).toBeVisible();
  expect(same.calls.profiles).toHaveLength(0);
  await expect(same.page.getByText('Choose another language to practice.', { exact: false })).toBeVisible();
  check('Matching target and app language asks only for a different target without inventing a fluent language');
  await same.page.close();

  const menu = await openFixture({ mode: 'menu' });
  await menu.page.getByRole('button', { name: 'Choice' }).click();
  await expect(menu.page.getByRole('dialog').getByRole('listbox')).toBeVisible();
  await menu.page.getByRole('listbox').press('End');
  await menu.page.getByRole('listbox').press('Enter');
  await expect(menu.page.getByRole('button', { name: 'Choice' })).toHaveText('Two');
  await menu.page.getByRole('button', { name: 'Choice' }).press('ArrowDown');
  await menu.page.getByRole('listbox').press('Escape');
  await expect(menu.page.getByRole('button', { name: 'Choice' })).toBeFocused();
  await menu.page.getByRole('button', { name: 'Choice' }).click();
  await menu.page.getByRole('listbox').press('Tab');
  await expect(menu.page.getByRole('button', { name: 'After selector' })).toBeFocused();
  check('Modern dropdown stays in the modal top layer; keyboard navigation skips disabled options and restores focus');
  await menu.page.close();

  const orbit = await openFixture({ mode: 'orbit' });
  await expect(orbit.page.locator('.orbit-card')).toHaveCount(6);
  expect(await orbit.page.locator('.creative-showcase button').count()).toBe(0);
  await expect(orbit.page.locator('.creative-showcase')).toHaveAttribute('aria-hidden', 'true');
  const card = orbit.page.locator('.orbit-card').first();
  const before = await card.evaluate(node => node.style.transform);
  await orbit.page.locator('.orbit-stage').hover();
  await orbit.page.waitForTimeout(150);
  expect(await card.evaluate(node => node.style.transform)).not.toBe(before);
  await orbit.page.emulateMedia({ reducedMotion: 'reduce' });
  await orbit.page.waitForTimeout(70);
  const paused = await card.evaluate(node => node.style.transform);
  await orbit.page.waitForTimeout(150);
  expect(await card.evaluate(node => node.style.transform)).toBe(paused);
  check('Creation orbit is decorative, keeps rotating on hover, and respects reduced motion');
  await orbit.page.close();
  expect(report.errors).toEqual([]);
} catch (error) {
  report.errors.push(error.stack || error.message); process.exitCode = 1;
  for (const [index, page] of browser.contexts().flatMap(context => context.pages()).entries()) {
    await page.screenshot({ path: path.join(output, `failure-${index}.png`), fullPage: true }).catch(() => {});
  }
} finally {
  await browser.close(); await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2));
}
