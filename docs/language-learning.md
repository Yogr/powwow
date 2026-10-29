# Language learning

Powwow's Language learning tool gives each learner and language a daily conversation journal. Add it with **Add components**, or start a new project with “I want to learn Spanish.” The project keeps its Project Blueprint and Task Board; the sidebar also lists entries such as **Learn: Spanish — Marisa**.

## The learning experience

- A request such as “I want to learn Spanish” starts directly with Spanish, the app language as the fluent language, and a beginner starting level. If the target language is missing, choose it inline. Change the app language in Settings → General; new learners use that preference. Separate learner/language entries keep their own logs.
- Opening a fresh current day starts a short question in the target language through the normal budget-controlled AI queue. Every response remains in that day's log.
- Reply by typing or dictating in either language. Dictation fills the composer for review before sending. A language selector tells the browser which language to listen for.
- AI replies have a full fluent-language translation, hidden initially. **Translate all** reveals that message's translation. Clicking a word reveals its meaning in context underneath it. Phrases and idioms can require a contextual meaning rather than a literal substitution.
- Native-language replies or **I need help** invite a brief explanation and a translation tip. The tutor is instructed to gently recast mistakes and continue with one useful question. For example, “I had a good day” can become **Tuve un buen día**; the tutor must not incorrectly teach that *tengo* means “had.”
- Topic starters help someone begin a conversation. Suggested replies can be placed in the composer before sending.
- Read a response aloud at normal or slower speed. Speech recognition and installed reading voices depend on the browser and device; typed conversation remains available.
- Save useful phrases, try recalling their meaning, reveal the answer, and choose **Again** or **Got it**. The simple review schedule uses 10 minutes for Again and increasing 1/3/7/14/30/60-day intervals for successful recall. This is not an FSRS implementation.

The visual focus is the conversation: quiet dark surfaces, a clear daily timeline, large readable target-language text, and small contextual help directly under the relevant words. The phrase collection sits beside the conversation on wider screens and is available in the same flow on narrow screens.

## Days and profiles

The profile saves the browser's IANA timezone. The server derives the current calendar date in that timezone, including daylight-saving changes. Day numbers are calendar offsets from the profile's starting date: returning after several days can skip numbers. Only days with a created log appear. The current day is the rightmost tab and opens by default. Historical days remain readable without accepting new conversation turns.

Profiles keep independent histories and phrase collections even when they belong to the same project or signed-in family account. These profiles are organizational boundaries within an account, not separate accounts or access controls between family members. Daily learning chats are excluded from ordinary project chat lists and project context. Tutor context uses its own profile's history.

Archived projects retain their saved logs. Restore the project before starting lessons or changing phrases.

## Model and persistence

Language learning uses the OpenAI Responses API through the durable run queue. It does not fall back to the local chat model: Qwen3-4B repeatedly failed the acceptance workflow. The new hosted models are candidates awaiting live evaluation and product review. See the [model quality policy](model-quality-policy.md).

### Connect the hosted model locally

1. Create an OpenAI API project, enable API billing, and create a project key in the [API dashboard](https://platform.openai.com/api-keys). API access is separate from a ChatGPT subscription. Check model access and provider spending controls in that project.
2. From the Powwow root, run `./scripts/configure-openai.ps1`. Its hidden prompt saves `OPENAI_API_KEY` in ignored `.env` and restarts only the API and worker. Do not paste the key into chat, source files, frontend variables, or a shell command argument. If a job is active, let it finish and run `./scripts/restart-api.ps1` afterward.
3. Reload the app and open **Learn: Spanish**. **Intelligence** offers Basic, Smarter, and Super. The selected level applies to new replies and explicit retries. Saved histories remain available without a configured key.
4. For the automated smoke test, set `POWWOW_QA_CREDENTIALS` to the absolute path of your ignored private QA account JSON (the local setup uses `.data/supabase-qa.json`), then run `node scripts/language-live-qa.mjs` from `apps/web`. This tests six real turns with the Basic candidate. It makes paid API calls only when configured, with a reservation ceiling of about $0.50 for all six Basic calls combined. `POWWOW_LANGUAGE_TIER=smarter` or `advanced` selects another candidate (`advanced` is the internal identifier for Super); Super can reserve up to about $3.69 across six calls and may hit the default $2 daily cap. Inspect the saved report and review the actual teaching before approving a baseline.

The secure setup command has no key purchase or billing action. The server uses the key; the browser only receives configuration status, model names, and allowances. `store: false` disables Responses storage; it is not a claim of zero provider retention.

### Initial intelligence candidates

Rates checked October 3, 2026, standard service tier. They are model API costs, not customer retail prices.

| Level | Candidate / reasoning | Input / output per million tokens | Conservative reservation per reply |
| --- | --- | --- | --- |
| Basic | GPT-6.1 Sol / low | $2 / $10 | $0.081920 |
| Smarter | GPT-6.1 Sol / high | $2 / $10 | $0.122880 |
| Super | GPT-6 Astra / high | $10 / $50 | $0.614400 |

The server bounds input conservatively at 16,384 tokens using UTF-8 bytes plus framing/schema headroom. It trims older conversation context while retaining the instructions and current message. Output caps are 4,096 tokens for Basic and 8,192 for the other levels, including reasoning. Reservations use the more expensive cache-write input rate ($2.50 or $12.50 per million) for all input; returned token counts settle a conservative internal cost estimate. Invoice reconciliation is still required. Sources: [GPT-6.1 Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol), [GPT-6 Astra](https://developers.openai.com/api/docs/models/gpt-6-astra).

[Anthropic's Claude Sonnet 5.5](https://platform.claude.com/docs/en/models/overview) is a useful comparison candidate at $2 input / $10 output per million tokens. An Anthropic adapter has not been added yet. Compare it on the same teaching cases if Sol fails the quality bar or measured economics favor it.

Default server limits are `LANGUAGE_DAILY_BUDGET_USD=2`, `LANGUAGE_DAILY_TURN_LIMIT=100`, and `HOSTED_CHAT_TIMEOUT_SECONDS=120`. Daily limits apply across all language profiles/projects in an account and reset at midnight UTC; lesson days still follow the learner's timezone. Every admitted attempt counts toward the daily reply limit. Existing per-run and account lifetime spending limits also apply.

There is one provider request per run, without automatic repair passes or model downgrades. Failed validation still settles known token usage. Cancellation after dispatch may wait for the provider response or timeout and can incur cost. Timeouts, uncertain server responses, and worker crashes after dispatch retain the reservation and block retry pending operator billing review. Stored response IDs and run IDs support that review; there is no invoice-reconciliation UI yet. Check provider usage before manually settling an uncertain reservation.

The model returns a validated object with target text, full translation, contextual word segments, optional explanation/correction, a translation-tip flag, suggested replies, and vocabulary. Segment text must reconstruct the response exactly, including spaces and punctuation. Missing whitespace at segment boundaries can be restored from the full response without changing any gloss. Changed words, accents, or punctuation still fail validation. Invalid output fails the turn visibly instead of exposing raw JSON or inventing missing meanings.

Conversation starts use a stable per-day idempotency key. Other turns carry individual keys so a lost HTTP response can be retried without creating a second turn. One reply can run at a time in a daily conversation.

| API | Purpose |
| --- | --- |
| `GET /v1/languages/catalog` | Language names, speech locales, starting levels, intelligence candidates and limits |
| `GET/POST /v1/projects/{project_id}/language/profiles` | List or create learner/language profiles |
| `GET /v1/language/profiles/{profile_id}` | Read an owned profile |
| `GET /v1/language/profiles/{profile_id}/days` | List days and open the current day where allowed |
| `GET /v1/language/days/{day_id}` | Read turns and active/last run |
| `POST /v1/language/days/{day_id}/turns` | Start, reply, request a topic, or ask for help |
| `GET/POST /v1/language/profiles/{profile_id}/phrases` | Read or save useful phrases |
| `PATCH /v1/language/phrases/{phrase_id}` | Record a recall rating and schedule the next review |

## Research and implementation choices

Sources reviewed on October 3, 2026:

| Source | Observation and decision |
| --- | --- |
| [Duolingo's description of Max](https://blog.duolingo.com/duolingo-max/) | Describes topic-led conversation, roleplay, feedback, and transcripts. Powwow includes approachable conversation starters, brief feedback, and a saved daily dialogue. This public product description is a design reference, not evidence that our implementation improves fluency. |
| [Anki manual: background](https://docs.ankiweb.net/background.html) | Explains active recall and spaced repetition. Powwow's phrase review asks learners to recall before revealing meaning, then records a simple interval. No Anki integration or equivalence is claimed. |
| [Council of Europe: CEFR level descriptions](https://www.coe.int/en/web/common-european-framework-reference-languages/level-descriptions) | Uses descriptions of communicative ability. Powwow offers plain-language starting choices and adjusts conversation difficulty; it does not award CEFR levels. |
| [MDN: SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition) | Recognition has limited browser availability and may send audio to an online service. Powwow starts it only after the microphone action, labels the dependency, preserves typed input, and handles denial or missing support. |
| [MDN: SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis) | Browser synthesis exposes installed voices. Powwow uses the target locale, offers slower playback, and reports unavailable voices. |
| [OpenAI: structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs) | Strict structured output supplies the bilingual reply fields. Server validation still checks exact word boundaries and required meanings. Schema compliance does not establish translation or teaching accuracy. |

Automatic pronunciation scoring, certified level testing, and a dedicated speech provider are not implemented. Browser transcription is not a pronunciation assessment. Before broad release, evaluate teaching accuracy, naturalness, and word segmentation across all offered languages with fluent speakers.

## Local checks

Use `./scripts/start-local.ps1` and open `http://localhost:5173`. API and worker processes must restart after Python changes; Vite reloads frontend edits.

Browser interaction checks live in `apps/web/scripts/language-qa.mjs`. Reports and screenshots are written to `evals/reports/language-learning`. Speech checks use controlled browser API fixtures, so they verify interaction and lifecycle behavior rather than microphone hardware or voice quality. Backend tests exercise ownership, daily boundaries, structured output, and durable turns against the repository's test database setup.
