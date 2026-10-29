import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const output = path.join(root, 'evals/reports/language-learning');
const base = process.env.POWWOW_QA_URL || 'http://127.0.0.1:5173';
await fs.mkdir(output, { recursive: true });
const report = {
  note: 'Browser fixtures exercise the actual speech hook and language UI. No microphone audio, AI requests, credentials, or stored projects are used.',
  checks: [], errors: [], screenshots: [], layouts: [],
};
const check = (name) => { report.checks.push(name); console.log('PASS', name); };
const browser = await chromium.launch({ headless: true });

function mockBrowserSpeech({ supported = true } = {}) {
  const calls = { recognitions: [], spoken: [], canceled: 0, voices: [{ lang: 'es-ES', name: 'Spanish fixture' }, { lang: 'en-US', name: 'English fixture' }] };
  window.__speechMock = calls;
  localStorage.setItem("powwow.tour:local:language", "seen");
  class Recognition {
    constructor() { this.starts = 0; this.stops = 0; this.aborts = 0; calls.recognitions.push(this); }
    start() { this.starts++; }
    stop() { this.stops++; }
    abort() { this.aborts++; }
    result(text, final = true, index = 0) {
      const results = [];
      results[index] = Object.assign([{ transcript: text }], { isFinal: final });
      this.onresult?.({ resultIndex: index, results });
    }
    fail(error) { this.onerror?.({ error }); }
    end() { this.onend?.(); }
  }
  Object.defineProperty(window, 'SpeechRecognition', { configurable: true, value: supported ? Recognition : undefined });
  Object.defineProperty(window, 'webkitSpeechRecognition', { configurable: true, value: undefined });
  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    configurable: true, value: supported ? class { constructor(text) { this.text = text; } } : undefined,
  });
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: supported ? {
      getVoices: () => calls.voices,
      speak: (utterance) => { calls.spoken.push(utterance); utterance.onstart?.(); },
      cancel: () => { calls.canceled++; },
    } : undefined,
  });
}

const speechHarness = `<!doctype html><html lang="en"><body><div id="root"></div><script type="module">
import React from '/node_modules/.vite/deps/react.js';
import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
import { useLanguageSpeech } from '/src/useLanguageSpeech.ts';
const {createElement:h,useState}=React;
function Lesson() {
  const [draft, setDraft] = useState('');
  const [sent, setSent] = useState(0);
  const voice = useLanguageSpeech({onTranscript: text => setDraft(old => old ? old + ' ' + text : text)});
  window.__speechHook = voice;
  return h('section', null,
    h('textarea', {'aria-label':'Reply', value:draft, onChange:event => setDraft(event.target.value)}),
    h('button', {onClick:()=>voice.startListening('es-ES')}, 'Start microphone'),
    h('button', {onClick:voice.stopListening}, 'Stop microphone'),
    h('button', {onClick:()=>voice.speak('Hola, ¿cómo estás?', 'es-ES')}, 'Read aloud'),
    h('button', {onClick:()=>voice.speak('Hola, ¿cómo estás?', 'es-ES', true)}, 'Read slowly'),
    h('button', {onClick:voice.stopSpeaking}, 'Stop playback'),
    h('button', {onClick:()=>setSent(old=>old+1)}, 'Send'),
    h('output', {'data-testid':'speech-state'}, JSON.stringify({recognitionSupported:voice.recognitionSupported,speechSupported:voice.speechSupported,listening:voice.listening,speaking:voice.speaking,sent})),
    h('div', {role:'alert'}, voice.error));
}
function Harness() {
  const [profile, setProfile] = useState(0);
  return h('main',null,h('button',{onClick:()=>setProfile(old=>old+1)},'Switch learner'),h(Lesson,{key:profile}));
}
ReactDOM.createRoot(document.getElementById('root')).render(h(Harness));
</script></body></html>`;

async function openSpeechHarness(supported = true) {
  const page = await browser.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  await page.addInitScript(mockBrowserSpeech, { supported });
  await page.route('**/__language-speech-test', route => route.fulfill({ contentType: 'text/html', body: speechHarness }));
  await page.goto(`${base}/__language-speech-test`);
  await expect(page.getByRole('button', { name: 'Start microphone', exact: true })).toBeVisible();
  return page;
}

async function speechChecks() {
  const page = await openSpeechHarness();
  await expect(page.getByTestId('speech-state')).toContainText('"recognitionSupported":true');
  await page.getByRole('button', { name: 'Start microphone', exact: true }).click();
  await page.getByRole('button', { name: 'Start microphone', exact: true }).click();
  expect(await page.evaluate(() => window.__speechMock.recognitions.length)).toBe(1);
  expect(await page.evaluate(() => window.__speechMock.recognitions[0].lang)).toBe('es-ES');
  check('Speech uses the selected locale and prevents duplicate starts during permission/listening');

  await page.evaluate(() => window.__speechMock.recognitions[0].result('provisional', false));
  await expect(page.getByLabel('Reply', { exact: true })).toHaveValue('');
  await page.evaluate(() => { const recognition = window.__speechMock.recognitions[0]; recognition.result('Hoy fue un buen día'); recognition.result('Hoy fue un buen día'); });
  await expect(page.getByLabel('Reply', { exact: true })).toHaveValue('Hoy fue un buen día');
  await expect(page.getByTestId('speech-state')).toContainText('"sent":0');
  check('Only final speech results fill the draft once; recognition never sends a message');

  await page.getByRole('button', { name: 'Stop microphone', exact: true }).click();
  expect(await page.evaluate(() => window.__speechMock.recognitions[0].stops)).toBe(1);
  await page.evaluate(() => { const recognition = window.__speechMock.recognitions[0]; recognition.result('Gracias', true, 1); recognition.end(); });
  await expect(page.getByLabel('Reply', { exact: true })).toHaveValue('Hoy fue un buen día Gracias');
  await expect(page.getByTestId('speech-state')).toContainText('"listening":false');
  check('Stopping accepts the final captured words and end resets the microphone state');

  for (const [code, message] of [['not-allowed', 'Microphone access was not allowed'], ['network', 'could not reach its speech service'], ['no-speech', 'No speech was heard']]) {
    await page.getByRole('button', { name: 'Start microphone', exact: true }).click();
    await page.evaluate(code => window.__speechMock.recognitions.at(-1).fail(code), code);
    await expect(page.getByRole('alert')).toContainText(message);
    await expect(page.getByTestId('speech-state')).toContainText('"listening":false');
  }
  check('Permission, network, and no-speech errors stop recording and give an actionable text fallback');

  await page.getByRole('button', { name: 'Start microphone', exact: true }).click();
  await page.getByRole('button', { name: 'Read slowly', exact: true }).click();
  expect(await page.evaluate(() => window.__speechMock.recognitions.at(-1).aborts)).toBe(1);
  expect(await page.evaluate(() => window.__speechMock.spoken.at(-1).rate)).toBe(0.6);
  expect(await page.evaluate(() => window.__speechMock.spoken.at(-1).voice.lang)).toBe('es-ES');
  await expect(page.getByTestId('speech-state')).toContainText('"speaking":true');
  await page.getByRole('button', { name: 'Start microphone', exact: true }).click();
  expect(await page.evaluate(() => window.__speechMock.canceled)).toBe(1);
  await expect(page.getByTestId('speech-state')).toContainText('"speaking":false');
  check('Read aloud chooses the target voice, supports slow playback, and excludes microphone capture');

  await page.evaluate(() => { window.__lateResult = window.__speechMock.recognitions.at(-1).onresult; });
  await page.getByRole('button', { name: 'Switch learner', exact: true }).click();
  await page.evaluate(() => { window.__lateResult({ resultIndex: 0, results: [Object.assign([{ transcript: 'Old learner speech' }], { isFinal: true })] }); });
  await expect(page.getByLabel('Reply', { exact: true })).toHaveValue('');
  expect(await page.evaluate(() => window.__speechMock.recognitions.at(-1).aborts)).toBe(1);
  check('Unmount aborts recording and ignores late results after switching learners');

  await page.evaluate(() => { window.__speechMock.voices = [{ lang: 'en-US' }]; });
  await page.getByRole('button', { name: 'Read aloud', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('A voice for this language is not installed');
  await expect(page.getByTestId('speech-state')).toContainText('"speaking":false');
  await page.evaluate(() => { window.__speechMock.voices = []; });
  await page.getByRole('button', { name: 'Read aloud', exact: true }).click();
  expect(await page.evaluate(() => window.__speechMock.spoken.at(-1).lang)).toBe('es-ES');
  expect(await page.evaluate(() => window.__speechMock.spoken.at(-1).rate)).toBe(0.95);
  await page.evaluate(() => window.__speechMock.spoken.at(-1).onend());
  await expect(page.getByTestId('speech-state')).toContainText('"speaking":false');
  check('Unavailable target voices explain setup; pending discovery uses browser language resolution and resets after playback');
  await page.evaluate(() => window.__speechHook.speak('Hola. ¿Cómo estás?', 'es-ES', true));
  const firstSentence = await page.evaluate(() => window.__speechMock.spoken.length);
  expect(await page.evaluate(() => window.__speechMock.spoken.at(-1).text)).toBe('Hola.');
  await page.evaluate(() => window.__speechMock.spoken.at(-1).onend());
  await expect.poll(() => page.evaluate(() => window.__speechMock.spoken.length)).toBe(firstSentence + 1);
  expect(await page.evaluate(() => window.__speechMock.spoken.at(-1).text.trim())).toBe('¿Cómo estás?');
  await page.evaluate(() => window.__speechHook.speak('Hola. Another sentence.', 'es-ES', true));
  const beforeStop = await page.evaluate(() => window.__speechMock.spoken.length);
  await page.evaluate(() => { window.__speechMock.spoken.at(-1).onend(); window.__speechHook.stopSpeaking(); });
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.__speechMock.spoken.length)).toBe(beforeStop);
  check('Slow reads sentence by sentence and Stop cancels pending playback between sentences');

  await page.close();

  const unsupported = await openSpeechHarness(false);
  await expect(unsupported.getByTestId('speech-state')).toContainText('"recognitionSupported":false');
  await expect(unsupported.getByTestId('speech-state')).toContainText('"speechSupported":false');
  await unsupported.getByRole('button', { name: 'Start microphone', exact: true }).click();
  await expect(unsupported.getByRole('alert')).toContainText('Speech input is unavailable in this browser');
  await unsupported.getByRole('button', { name: 'Read aloud', exact: true }).click();
  await expect(unsupported.getByRole('alert')).toContainText('Read aloud is unavailable in this browser');
  await unsupported.getByLabel('Reply', { exact: true }).fill('Typing still works');
  check('Browsers without speech APIs retain typing and explain voice availability without crashing');
  await unsupported.close();
}

async function learningFixture(page, { emptyProfiles = false, archived = false, modelConfigured = true } = {}) {
  const now = new Date().toISOString();
  const project = { id: 'language-qa-project', name: 'Our language practice', instructions: 'A language buddy for our family.', context_mode: 'project', archived };
  const catalog = {
    intelligence: { qualification: 'candidate', qualification_note: 'Candidate awaiting live evaluation.', setup_required: !modelConfigured,
      limits: { daily_budget_usd: 2, daily_turns: 100 },
      tiers: [
        { id: 'basic', name: 'Basic', model: 'gpt-6.1-sol', description: 'Daily conversation candidate.', max_cost_usd: .08192, enabled: modelConfigured },
        { id: 'smarter', name: 'Smarter', model: 'gpt-6.1-sol', description: 'More reasoning.', max_cost_usd: .12288, enabled: modelConfigured },
        { id: 'advanced', name: 'Advanced', model: 'gpt-6-astra', description: 'Our most capable configured candidate.', max_cost_usd: .6144, enabled: modelConfigured },
      ] },
    languages: [
      { code: 'en', name: 'English', native_name: 'English', locale: 'en-US' },
      { code: 'es', name: 'Spanish', native_name: 'Español', locale: 'es-ES' },
      { code: 'ja', name: 'Japanese', native_name: '日本語', locale: 'ja-JP' },
    ],
    levels: [
      { id: 'beginner', name: 'Just starting', description: 'Simple greetings, everyday words, and plenty of support.' },
      { id: 'elementary', name: 'I know a little', description: 'Short exchanges about familiar people and daily life.' },
      { id: 'intermediate', name: 'Keep me talking', description: 'Everyday conversations, stories, and gentle corrections.' },
      { id: 'advanced', name: 'Challenge me', description: 'Nuance, longer ideas, and natural expressions.' },
    ],
  };
  const profiles = emptyProfiles ? [] : [
    { id: 'sam-spanish', project_id: project.id, learner_name: 'Sam', target_language: 'es', native_language: 'en', level: 'beginner', timezone: 'America/New_York', start_date: '2026-10-02', created_at: now, updated_at: now },
    { id: 'marisa-english', project_id: project.id, learner_name: 'Marisa', target_language: 'en', native_language: 'es', level: 'intermediate', timezone: 'America/New_York', start_date: '2026-10-03', created_at: now, updated_at: now },
  ];
  const opening = { text: '¿Cómo estás hoy?', translation: 'How are you today?', segments: [{ text: '¿Cómo ', translation: 'How' }, { text: 'estás ', translation: 'are you' }, { text: 'hoy?', translation: 'today' }], explanation: null, correction: null, show_translation_tip: false, suggested_replies: [{ text: 'Estoy bien, gracias.', translation: 'I am well, thank you.' }], vocabulary: [{ text: 'hoy', translation: 'today', note: 'Use hoy to talk about today.' }], topic: 'Your day' };
  const helpful = { text: '¡Tuve un buen día! Qué bueno. ¿Qué hiciste hoy?', translation: 'I had a good day! How nice. What did you do today?', segments: [{ text: '¡Tuve ', translation: 'I had' }, { text: 'un ', translation: 'a' }, { text: 'buen ', translation: 'good' }, { text: 'día! ', translation: 'day' }, { text: 'Qué ', translation: 'How' }, { text: 'bueno. ', translation: 'nice' }, { text: '¿Qué ', translation: 'What' }, { text: 'hiciste ', translation: 'did you do' }, { text: 'hoy?', translation: 'today' }], explanation: 'Tuve means I had. To talk about a finished day, use the past tense.', correction: { original: 'Yo tengo día bueno', corrected: 'Tuve un buen día.', explanation: 'Tuve describes the past, and buen comes before día.' }, show_translation_tip: true, suggested_replies: [{ text: 'Fui al parque.', translation: 'I went to the park.' }], vocabulary: [{ text: 'Tuve un buen día.', translation: 'I had a good day.', note: 'A useful way to share good news about your day.' }], topic: 'Your day' };
  const dayMap = new Map();
  const details = new Map();
  const phrases = new Map();
  const calls = { turns: [], profiles: [], phrases: [], reviews: [], retries: [], failNextTurn: false };
  const fixtureRun = (id, day, status = 'completed') => ({ id, chat_id: day.chat_id, message_id: `${id}-user`, project_id: project.id, capability: 'chat', workflow_id: 'language_conversation', status, stage: status === 'completed' ? 'complete' : 'failed', progress: 1, prompt: 'Continue the conversation.', settings: {}, attachment_ids: [], artifact_ids: [], output_text: status === 'completed' ? helpful.text : '', error: status === 'failed' ? { code: 'provider_error', message: 'The tutor could not finish this reply.' } : null, estimated_cost_usd: 0, actual_cost_usd: 0, budget_usd: 1, provider: 'fixture', model: 'fixture', model_provenance: {}, context_snapshot: [], attempt: 1, parent_run_id: null, created_at: now, updated_at: now, started_at: now, completed_at: now });
  function makeDays(profile, rich = false) {
    const current = { id: `${profile.id}-today`, profile_id: profile.id, date: '2026-10-03', day_number: rich ? 2 : 1, chat_id: `${profile.id}-chat-today` };
    const older = { id: `${profile.id}-yesterday`, profile_id: profile.id, date: '2026-10-02', day_number: 1, chat_id: `${profile.id}-chat-yesterday` };
    dayMap.set(profile.id, { profile, days: rich ? [older, current] : [current], current_day_id: current.id });
    const coach = (id, reply) => ({ id, role: 'assistant', text: reply.text, reply, run_id: null, created_at: now });
    details.set(current.id, { day: current, turns: rich ? [coach('opening-today', opening), { id: 'learner-today', role: 'user', text: 'Yo tengo día bueno', reply: null, run_id: null, created_at: now }, coach('helpful-today', helpful)] : [], active_run: null, last_run: null });
    if (rich) details.set(older.id, { day: older, turns: [coach('opening-yesterday', { ...opening, text: '¿Qué te gusta hacer?', translation: 'What do you like to do?', segments: [{ text: '¿Qué ', translation: 'What' }, { text: 'te ', translation: 'you' }, { text: 'gusta ', translation: 'like' }, { text: 'hacer?', translation: 'to do' }] })], active_run: null, last_run: null });
    phrases.set(profile.id, []);
  }
  profiles.forEach((profile, index) => makeDays(profile, index === 0));
  await page.route('**/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;
    const method = request.method();
    let data = [];
    if (pathname === '/v1/config') data = { auth_mode: 'local' };
    else if (pathname === '/v1/account/preferences') data = { app_language: 'en', storage_mode: 'cloud', plan: 'free', component_priorities: {}, storage_quota_bytes: 524288000, storage_used_bytes: 0, storage_reserved_bytes: 0, storage_grace_bytes: 0, storage_staged_bytes: 0 };
    else if (pathname === '/v1/projects') data = [project];
    else if (pathname === '/v1/catalog') data = { models: [], skills: [], workflows: [], providers: [], capabilities: [{ id: 'chat', enabled: true }] };
    else if (pathname === '/v1/builder/catalog') data = { kinds: [], components: [
      { id: 'tasks', name: 'Task board', description: 'Tasks', icon: 'tasks' },
      { id: 'design', name: 'Project design', description: 'Design', icon: 'design' },
      { id: 'language', name: 'Language learning', description: 'Your language buddy', icon: 'language' },
    ] };
    else if (pathname === `/v1/projects/${project.id}/workspace`) data = { version: 1, workspace: { kind: 'language', initialized: true, brief: project.instructions, answers: {}, assumptions: [], components: ['tasks', 'design', 'language'], tasks: [], records: {}, design: '# Our language practice', plan_prompt: 'I want to learn Spanish.' } };
    else if (pathname === '/v1/languages/catalog') data = catalog;
    else if (pathname === `/v1/projects/${project.id}/language/profiles`) {
      if (method === 'POST') {
        const body = request.postDataJSON();
        calls.profiles.push(body);
        const created = { ...body, id: `created-profile-${calls.profiles.length}`, project_id: project.id, start_date: '2026-10-03', created_at: now, updated_at: now };
        profiles.push(created);
        makeDays(created);
        data = created;
      } else data = profiles;
    } else if (/^\/v1\/language\/profiles\/[^/]+\/days$/.test(pathname)) data = dayMap.get(pathname.split('/')[4]);
    else if (/^\/v1\/language\/days\/[^/]+$/.test(pathname)) data = details.get(pathname.split('/')[4]);
    else if (/^\/v1\/language\/days\/[^/]+\/turns$/.test(pathname)) {
      const body = request.postDataJSON();
      calls.turns.push(body);
      if (calls.failNextTurn) { calls.failNextTurn = false; await route.fulfill({ status: 503, json: { detail: 'The tutor is temporarily unavailable. Your draft is safe.' } }); return; }
      const detail = details.get(pathname.split('/')[4]);
      const id = `fixture-run-${calls.turns.length}`;
      if (body.text) detail.turns.push({ id: `${id}-user`, role: 'user', text: body.text, reply: null, run_id: id, created_at: now });
      detail.turns.push({ id: `${id}-assistant`, role: 'assistant', text: helpful.text, reply: helpful, run_id: id, created_at: now });
      data = fixtureRun(id, detail.day);
      detail.last_run = data;
    } else if (/^\/v1\/runs\/[^/]+\/retry$/.test(pathname)) {
      const sourceId = pathname.split('/')[3];
      const body = request.postDataJSON();
      calls.retries.push({ sourceId, ...body });
      const detail = [...details.values()].find(item => item.last_run?.id === sourceId);
      data = fixtureRun(`retry-${calls.retries.length}`, detail.day);
      data.parent_run_id = sourceId;
      detail.turns.push({ id: `${data.id}-assistant`, role: 'assistant', text: helpful.text, reply: helpful, run_id: data.id, created_at: now });
      detail.last_run = data;
    } else if (/^\/v1\/language\/profiles\/[^/]+\/phrases$/.test(pathname)) {
      const profileId = pathname.split('/')[4];
      if (method === 'POST') {
        const body = request.postDataJSON();
        calls.phrases.push(body);
        const phrase = { ...body, id: `phrase-${calls.phrases.length}`, profile_id: profileId, due_at: now, review_count: 0, interval_days: 0, last_reviewed_at: null, created_at: now, updated_at: now };
        phrases.get(profileId).push(phrase);
        data = phrase;
      } else data = phrases.get(profileId);
    } else if (/^\/v1\/language\/phrases\/[^/]+$/.test(pathname) && method === 'PATCH') {
      const body = request.postDataJSON();
      calls.reviews.push(body);
      const phrase = [...phrases.values()].flat().find(item => item.id === pathname.split('/')[4]);
      Object.assign(phrase, { review_count: phrase.review_count + 1, interval_days: body.rating === 'good' ? 1 : 0, due_at: new Date(Date.now() + (body.rating === 'good' ? 86400000 : 60000)).toISOString(), last_reviewed_at: now });
      data = phrase;
    } else if (/^\/v1\/language\/profiles\/[^/]+$/.test(pathname)) data = profiles.find(item => item.id === pathname.split('/')[4]);
    await route.fulfill({ json: data });
  });
  return { project, profiles, calls, details, dayMap, phrases, fixtureRun };
}

async function riskPathChecks() {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  page.on('pageerror', error => report.errors.push(error.message));
  await page.addInitScript(mockBrowserSpeech, { supported: true });
  const fixture = await learningFixture(page);
  const today = fixture.details.get('sam-spanish-today');
  today.last_run = fixture.fixtureRun('failed-language-run', today.day, 'failed');
  await page.goto(base);
  await page.getByRole('button', { name: 'Our language practice', exact: true }).click();
  await page.getByRole('button', { name: 'Learn: Spanish — Sam', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('The tutor could not finish this reply.');
  await page.getByRole('button', { name: 'Try this reply again', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.locator('.language-tutor-turn')).toHaveCount(3);
  expect(fixture.calls.retries).toHaveLength(1);
  expect(fixture.calls.retries[0].sourceId).toBe('failed-language-run');
  expect(fixture.calls.retries[0].idempotency_key).toBeTruthy();
  expect(fixture.calls.turns).toHaveLength(0);
  check('A persisted failed tutor run retries through the run retry endpoint and appends the recovered reply without resending the learner message');

  const reply = page.getByRole('textbox', { name: 'Your reply in either language', exact: true });
  await page.getByRole('button', { name: 'Speak', exact: true }).click();
  await page.evaluate(() => { window.__beforeMidnightSpeech = window.__speechMock.recognitions.at(-1).onresult; });
  const tomorrow = { id: 'sam-spanish-tomorrow', profile_id: 'sam-spanish', date: '2026-10-04', day_number: 3, chat_id: 'sam-spanish-chat-tomorrow' };
  const days = fixture.dayMap.get('sam-spanish');
  days.days.push(tomorrow); days.current_day_id = tomorrow.id;
  fixture.details.set(tomorrow.id, { day: tomorrow, turns: [], active_run: null, last_run: null });
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('tab', { name: /Day 3/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.language-tutor-turn')).toHaveCount(1);
  await page.evaluate(() => window.__beforeMidnightSpeech({ resultIndex: 0, results: [Object.assign([{ transcript: 'Words from yesterday' }], { isFinal: true })] }));
  await expect(reply).toHaveValue('');
  expect(await page.evaluate(() => window.__speechMock.recognitions.at(-1).aborts)).toBe(1);
  expect(fixture.calls.turns).toHaveLength(1);
  expect(fixture.calls.turns[0].action).toBe('start');
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('tab', { name: /Day 3/ })).toHaveAttribute('aria-selected', 'true');
  expect(fixture.calls.turns).toHaveLength(1);
  check('A new server-local day becomes the rightmost selected tab, starts one greeting, and discards speech captured for yesterday');

  await reply.fill('Keep my unfinished thought.');
  const nextDay = { id: 'sam-spanish-next-day', profile_id: 'sam-spanish', date: '2026-10-05', day_number: 4, chat_id: 'sam-spanish-chat-next' };
  days.days.push(nextDay); days.current_day_id = nextDay.id;
  fixture.details.set(nextDay.id, { day: nextDay, turns: [], active_run: null, last_run: null });
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('tab', { name: /Day 4/ })).toHaveAttribute('aria-selected', 'false');
  await expect(page.locator('.language-draft-note')).toContainText('Your unsent reply is kept for today');
  await page.getByRole('button', { name: 'Go to today', exact: true }).click();
  await expect(page.getByRole('tab', { name: /Day 4/ })).toHaveAttribute('aria-selected', 'true');
  await expect(reply).toHaveValue('Keep my unfinished thought.');
  check('Midnight preserves an unfinished draft until the learner explicitly moves to the new day');
  await page.close();

  const archive = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  archive.on('pageerror', error => report.errors.push(error.message));
  await archive.addInitScript(mockBrowserSpeech, { supported: true });
  const archived = await learningFixture(archive, { archived: true });
  await archive.goto(base);
  await archive.getByRole('button', { name: 'Archive', exact: true }).click();
  await archive.getByRole('button', { name: 'Our language practice', exact: true }).click();
  await archive.getByRole('button', { name: 'Learn: Spanish — Sam', exact: true }).click();
  await expect(archive.getByText('This archived project is available to read.', { exact: true })).toBeVisible();
  await expect(archive.locator('.language-composer')).toHaveCount(0);
  await archive.locator('.language-tutor-turn').first().getByRole('button', { name: '¿Cómo', exact: true }).click();
  await expect(archive.locator('.language-word-meaning').first()).toContainText('How');
  await expect(archive.getByRole('button', { name: /Save .* to phrase bank/ })).toHaveCount(0);
  expect(archived.calls.turns).toHaveLength(0);
  expect(archived.calls.phrases).toHaveLength(0);
  check('Archived learning profiles preserve readable history and word translations while preventing new messages and phrase writes');
  await archive.close();
}

async function languageUIChecks() {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  page.on('pageerror', error => report.errors.push(error.message));
  await page.addInitScript(mockBrowserSpeech, { supported: true });
  const fixture = await learningFixture(page);
  await page.goto(base);
  await page.getByRole('button', { name: 'Our language practice', exact: true }).click();
  const spanish = page.getByRole('button', { name: 'Learn: Spanish — Sam', exact: true });
  await expect(spanish).toBeVisible();
  await spanish.click();
  await expect(page.getByRole('heading', { name: 'Learn: Spanish', exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: /Day 2/ })).toHaveAttribute('aria-selected', 'true');
  expect(await page.getByRole('tablist', { name: 'Learning days' }).getByRole('tab').allTextContents()).toEqual(['Day 1Oct 2', 'Day 2TodayOct 3']);
  check('Project sidebar exposes learner-specific language tools; the current day opens at the right of the timeline');
  await expect(page.locator('.language-tutor-turn').last()).toContainText('¡Tuve');
  await page.screenshot({ path: path.join(output, 'language-initial-desktop.png'), fullPage: false });
  report.screenshots.push('language-initial-desktop.png');

  const first = page.locator('.language-tutor-turn').first();
  await expect(page.locator('.language-full-translation')).toHaveCount(0);
  await first.getByRole('button', { name: 'Translate all', exact: true }).click();
  await expect(first.locator('.language-full-translation')).toHaveText('How are you today?');
  await first.getByRole('button', { name: 'Hide translation', exact: true }).click();
  await expect(first.locator('.language-full-translation')).toHaveCount(0);
  await first.getByRole('button', { name: '¿Cómo', exact: true }).click();
  await expect(first.locator('.language-word-meaning')).toContainText('How');
  await expect(first.locator('.language-full-translation')).toHaveCount(0);
  check('Coach translations begin hidden; whole-message and individual-word reveals operate independently');

  await expect(page.getByRole('complementary', { name: 'Saved phrases' })).toHaveCount(0);
  await expect(first.locator('.language-word-meaning button')).toHaveCount(0);
  await expect(first.locator('.language-word-help')).toHaveText('Click a word to show translation');
  await expect(page.locator('.language-translation-tip')).toHaveCount(0);
  await expect(page.locator('.language-heading')).not.toContainText('Sam');
  check('The tutor has inline word help, no phrase bank, save icons, brown tip or profile subtext');
  await expect(page.locator('.language-coaching')).toContainText(['Tuve un buen día.', 'Tuve means I had.']);
  const reply = page.getByRole('textbox', { name: 'Your reply in either language', exact: true });
  await page.getByRole('button', { name: 'Fui al parque.', exact: true }).click();
  await expect(reply).toHaveValue('Fui al parque.');
  expect(fixture.calls.turns).toHaveLength(0);
  check('Brief corrections and translation hints render; suggested replies fill an editable draft without sending');

  fixture.calls.failNextTurn = true;
  await reply.fill('I had a good day, but I need help saying it.');
  await page.locator('.language-composer').getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('The tutor is temporarily unavailable');
  await expect(reply).toHaveValue('I had a good day, but I need help saying it.');
  await page.getByRole('button', { name: 'Retry this request', exact: true }).click();
  await expect(reply).toHaveValue('');
  expect(fixture.calls.turns).toHaveLength(2);
  expect(fixture.calls.turns[0].idempotency_key).toBe(fixture.calls.turns[1].idempotency_key);
  expect(fixture.calls.turns[1].text).toBe('I had a good day, but I need help saying it.');
  await expect(page.locator('.language-user-turn').last()).toContainText('I had a good day, but I need help saying it.');
  check('Failed sends retain the native-language draft and retry with the same idempotency key');

  await page.getByRole('button', { name: 'Speak', exact: true }).click();
  await page.evaluate(() => { const recognition = window.__speechMock.recognitions.at(-1); recognition.result('Estoy aprendiendo'); recognition.end(); });
  await expect(reply).toHaveValue('Estoy aprendiendo');
  expect(fixture.calls.turns).toHaveLength(2);
  await page.getByRole('button', { name: 'Speech input language', exact: true }).click();
  await page.getByRole('option', { name: 'English', exact: true }).click();
  await page.getByRole('button', { name: 'Speak', exact: true }).click();
  expect(await page.evaluate(() => window.__speechMock.recognitions.at(-1).lang)).toBe('en-US');
  await page.evaluate(() => { window.__lateUiSpeech = window.__speechMock.recognitions.at(-1).onresult; });
  await page.getByRole('tab', { name: /Day 1/ }).click();
  await expect(page.getByRole('tab', { name: /Day 1/ })).toHaveAttribute('aria-selected', 'true');
  await expect(reply).toHaveCount(0);
  await page.evaluate(() => window.__lateUiSpeech({ resultIndex: 0, results: [Object.assign([{ transcript: 'Late old audio' }], { isFinal: true })] }));
  await expect(page.locator('.language-draft-note')).toContainText('Your unsent reply is kept for today');
  await page.getByRole('tab', { name: /Day 2/ }).click();
  await expect(reply).toHaveValue('Estoy aprendiendo');
  check('Speech supports target/native input, never auto-sends, and cannot write late results across day changes');

  await page.getByRole('tab', { name: /Day 2/ }).press('Home');
  await expect(page.getByRole('tab', { name: /Day 1/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.language-history-note')).toBeVisible();
  await expect(page.locator('.language-composer')).toHaveCount(0);
  await page.getByRole('tab', { name: /Day 1/ }).press('End');
  await expect(page.getByRole('tab', { name: /Day 2/ })).toHaveAttribute('aria-selected', 'true');
  check('Day tabs support keyboard navigation; saved days are read-only and the current draft survives browsing history');

  await reply.fill('');
  await expect(page.locator('.language-tutor-turn').last()).toContainText('¡Tuve');
  await page.locator('.language-page').evaluate(node => { node.scrollTop = 0; });
  await page.screenshot({ path: path.join(output, 'language-desktop.png'), fullPage: false });
  report.screenshots.push('language-desktop.png');
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: width === 768 ? 1024 : 844 });
    await expect.poll(() => page.evaluate(() => Math.round(document.querySelector('.app-shell').getBoundingClientRect().height))).toBe(width === 768 ? 1024 : 844);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `Language workspace overflow at ${width}`).toBeLessThanOrEqual(width + 1);
    const layout = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, pageHeight: document.documentElement.scrollHeight, bodyHeight: document.body.scrollHeight, boxes: ['.app-shell','.main-shell','.builder-workspace-surface','.language-page','.language-composer','.sr-only'].map(selector => { const node = document.querySelector(selector); const box = node.getBoundingClientRect(); const style = getComputedStyle(node); return {selector,top:box.top,bottom:box.bottom,height:box.height,clientHeight:node.clientHeight,scrollHeight:node.scrollHeight,overflow:style.overflow,position:style.position}; }) }));
    report.layouts.push(layout);
    expect(layout.pageHeight, `Document height should remain within viewport at ${width}`).toBeLessThanOrEqual(layout.height + 1);
    await page.locator('.language-page').evaluate(node => { node.scrollTop = 0; });
    await page.screenshot({ path: path.join(output, `language-${width}.png`), fullPage: false });
    report.screenshots.push(`language-${width}.png`);
    await reply.scrollIntoViewIfNeeded();
    await expect(reply).toBeInViewport();
    await expect(page.locator('.language-send')).toBeInViewport();
    await page.screenshot({ path: path.join(output, `language-composer-${width}.png`), fullPage: false });
    report.screenshots.push(`language-composer-${width}.png`);

  }
  check('Language conversations, day tabs and controls fit tablet, 390px and 320px screens');
  await page.setViewportSize({ width: 1440, height: 1000 });
  if (await page.locator('.app-shell.sidebar-closed').count()) await page.getByRole('button', { name: 'Open sidebar', exact: true }).click();
  await page.getByRole('button', { name: 'Learn: English — Marisa', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Learn: English', exact: true })).toBeVisible();
  await expect(page.locator('.language-heading')).not.toContainText('Marisa');
  await expect(page.getByRole('complementary', { name: 'Saved phrases' })).toHaveCount(0);
  check('Switching family learners opens the correct target language and private conversation');
  await page.close();

  const zoom = await browser.newPage({ viewport: { width: 720, height: 500 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  zoom.on('pageerror', error => report.errors.push(error.message));
  await zoom.addInitScript(mockBrowserSpeech, { supported: true });
  await learningFixture(zoom);
  await zoom.goto(base);
  await zoom.getByRole('button', { name: 'Open sidebar', exact: true }).click();
  await zoom.getByRole('button', { name: 'Our language practice', exact: true }).click();
  await zoom.getByRole('button', { name: 'Open sidebar', exact: true }).click();
  await zoom.getByRole('button', { name: 'Learn: Spanish — Sam', exact: true }).click();
  await expect(zoom.locator('.language-tutor-turn').last()).toContainText('¡Tuve');
  await zoom.locator('.language-page').evaluate(node => { node.scrollTop = 0; });
  await zoom.screenshot({ path: path.join(output, 'language-200-percent-equivalent.png'), fullPage: false });
  report.screenshots.push('language-200-percent-equivalent.png');
  await zoom.getByRole('textbox', { name: 'Your reply in either language', exact: true }).scrollIntoViewIfNeeded();
  await expect(zoom.locator('.language-send')).toBeInViewport();
  expect(await zoom.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(721);
  expect(await zoom.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(501);
  await zoom.screenshot({ path: path.join(output, 'language-composer-200-percent-equivalent.png'), fullPage: false });
  report.screenshots.push('language-composer-200-percent-equivalent.png');
  check('At 200% equivalent scale (720px CSS viewport rendered at 2x), content reflows and the composer remains reachable');
  await zoom.close();

  const setup = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  setup.on('pageerror', error => report.errors.push(error.message));
  await setup.addInitScript(mockBrowserSpeech, { supported: false });
  const created = await learningFixture(setup, { emptyProfiles: true });
  await setup.goto(base);
  await setup.getByRole('button', { name: 'Our language practice', exact: true }).click();
  await setup.locator('.project-tools').getByRole('button', { name: 'Language learning', exact: true }).click();
  await expect(setup.getByRole('heading', { name: 'What would you like to speak?' })).toBeVisible();
  await expect(setup.getByRole('button', { name: 'Start learning', exact: true })).toBeDisabled();
  await setup.getByRole('button', { name: 'Language to learn', exact: true }).click();
  await expect(setup.getByRole('option', { name: /^English/ })).toHaveCount(0);
  await setup.getByRole('option', { name: /^Spanish/ }).click();
  await setup.screenshot({ path: path.join(output, 'language-setup-desktop.png'), fullPage: false });
  report.screenshots.push('language-setup-desktop.png');
  await setup.setViewportSize({ width: 320, height: 844 });
  await expect.poll(() => setup.evaluate(() => Math.round(document.querySelector('.app-shell').getBoundingClientRect().height))).toBe(844);
  expect(await setup.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(321);
  await setup.screenshot({ path: path.join(output, 'language-setup-320.png'), fullPage: false });
  report.screenshots.push('language-setup-320.png');
  await setup.getByRole('button', { name: 'Start learning', exact: true }).click();
  await expect(setup.getByRole('heading', { name: 'Learn: Spanish', exact: true })).toBeVisible();
  expect(created.calls.profiles[0]).toMatchObject({ target_language: 'es', native_language: 'en', level: 'beginner' });
  expect(created.calls.profiles[0].learner_name).toBeTruthy();
  expect(created.calls.profiles[0].timezone).toBeTruthy();
  await expect(setup.locator('.language-tutor-turn')).toHaveCount(1);
  expect(created.calls.turns[0].action).toBe('start');
  await expect(setup.getByRole('button', { name: 'Speak', exact: true })).toBeDisabled();
  await expect(setup.locator('.language-composer-note')).toContainText('Voice input isn’t supported in this browser');
  check('Quick setup excludes the app language, saves beginner level/timezone, starts a greeting, and preserves typing without browser voice');
  await setup.close();
}

async function intelligenceChecks() {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', error => report.errors.push(error.message));
  await page.addInitScript(mockBrowserSpeech, { supported: true });
  const fixture = await learningFixture(page);
  await page.goto(base);
  await page.getByRole('button', { name: 'Our language practice', exact: true }).click();
  await page.getByRole('button', { name: 'Learn: Spanish — Sam', exact: true }).click();
  await expect(page.locator('.language-intelligence')).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Your reply in either language', exact: true }).fill('Hola');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect.poll(() => fixture.calls.turns.length).toBe(1);
  expect(fixture.calls.turns[0].intelligence).toBe('basic');
  const mic = await page.getByRole('button', {name:'Speak', exact:true}).boundingBox();
  const send = await page.getByRole('button', {name:'Send', exact:true}).boundingBox();
  expect(send.x - mic.x - mic.width).toBeLessThan(30);
  check('Tutor uses the fixed baseline with mic directly beside Send');
  await page.close();
}

try {
  await speechChecks();
  if (!process.argv.includes('--speech-only')) await languageUIChecks();
  if (!process.argv.includes('--speech-only')) await riskPathChecks();
  if (!process.argv.includes('--speech-only')) await intelligenceChecks();
  expect(report.errors).toEqual([]);
} catch (error) {
  report.errors.push(error.stack || error.message);
  process.exitCode = 1;
  const pages = browser.contexts().flatMap(context => context.pages());
  for (let index = 0; index < pages.length; index++) {
    const filename = `failure-${index}.png`;
    await pages[index].screenshot({ path: path.join(output, filename), fullPage: true }).catch(() => {});
    report.screenshots.push(filename);
  }
} finally {
  await browser.close();
  await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
