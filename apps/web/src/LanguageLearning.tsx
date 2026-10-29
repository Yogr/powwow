import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  Coffee,
  Globe2,
  Headphones,
  Languages,
  LoaderCircle,
  MessageCircle,
  Mic,
  Pause,
  Send,
  Sparkles,
  Square,
  Volume2,
  X,
} from "lucide-react";
import { request } from "./api";
import type { Run } from "./api";
import { running } from "./components";
import { useBuilderNavigationGuard } from "./builderNavigation";
import { useLanguageSpeech } from "./useLanguageSpeech";
import { SelectMenu } from "./SelectMenu";
import type {
  LanguageCatalog,
  LanguageProfile,
  LanguageDay,
  LanguageTurn,
  LanguageDays,
  LanguageDayDetail,
  IntelligenceTier,
} from "./language";
import "./language-learning.css";

type Props = {
  projectId: string;
  projectName: string;
  profileId?: string;
  initialTargetLanguage?: string;
  initialNativeLanguage?: string;
  initialLevel?: string;
  appLanguage?: string;
  defaultLearnerName?: string;
  accountId?: string;
  onProfilesChanged: (profileId?: string) => void;
  budget: string;
  archived?: boolean;
  onError?: (message: string) => void;
};
const errorText = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
const key = () => crypto.randomUUID();
const dayLabel = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
const runError = (run?: Run | null) =>
  typeof run?.error === "string" ? run.error : run?.error?.message;
const topics = [
  { label: "My day", text: "Let's talk about my day.", icon: Coffee },
  {
    label: "Food",
    text: "Let's talk about food and ordering something to eat.",
    icon: Coffee,
  },
  {
    label: "Travel",
    text: "Let's practice a conversation while traveling.",
    icon: Globe2,
  },
  {
    label: "Hobbies",
    text: "Let's talk about hobbies and things I enjoy.",
    icon: Sparkles,
  },
  {
    label: "Work & school",
    text: "Let's talk about work or school.",
    icon: BookOpen,
  },
];

export function LanguageLearning(props: Props) {
  const [createdId, setCreatedId] = useState<string>();
  const [catalog, setCatalog] = useState<LanguageCatalog>();
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    setError("");
    request<LanguageCatalog>("/v1/languages/catalog", { signal: abort.signal })
      .then(setCatalog)
      .catch((e) => {
        if (!abort.signal.aborted) setError(errorText(e));
      });
    return () => abort.abort();
  }, [reload]);
  const id = props.profileId || createdId;
  if (props.archived && !id)
    return (
      <section className="language-page language-loading">
        <BookOpen size={25} />
        <p>Restore this project to add a language learning space.</p>
      </section>
    );
  if (!catalog)
    return (
      <section
        className="language-page language-loading"
        aria-label="Language learning"
      >
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button className="button" onClick={() => setReload((n) => n + 1)}>
              Try again
            </button>
          </>
        ) : (
          <>
            <LoaderCircle className="spin" size={22} />
            <p>Opening your learning space…</p>
          </>
        )}
      </section>
    );
  return id ? (
    <LearningSpace key={id} {...props} catalog={catalog} profileId={id} />
  ) : (
    <LanguageSetup
      {...props}
      catalog={catalog}
      onCreated={(profile) => {
        setCreatedId(profile.id);
        props.onProfilesChanged(profile.id);
      }}
    />
  );
}
export default LanguageLearning;

function languageCode(
  value: string | undefined,
  catalog: LanguageCatalog,
): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLocaleLowerCase();
  const code = normalized.split(/[-_]/)[0];
  return catalog.languages.find(
    (language) =>
      language.code === normalized ||
      language.code === code ||
      language.name.toLocaleLowerCase() === normalized ||
      language.native_name.toLocaleLowerCase() === normalized,
  )?.code;
}

function LanguageSetup({
  projectId,
  projectName,
  initialTargetLanguage,
  initialLevel,
  appLanguage,
  defaultLearnerName,
  catalog,
  onCreated,
}: Props & {
  catalog: LanguageCatalog;
  onCreated: (profile: LanguageProfile) => void;
}) {
  const native =
    languageCode(appLanguage, catalog) ||
    languageCode(navigator.language, catalog) ||
    "en";
  const inferredTarget = languageCode(initialTargetLanguage, catalog);
  const [target, setTarget] = useState(
    inferredTarget && inferredTarget !== native ? inferredTarget : "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const active = useRef<AbortController | null>(null);
  const creating = useRef(false);
  const attempted = useRef(false);
  const mounted = useRef(true);
  const options = catalog.languages.filter(
    (language) => language.code !== native,
  );
  const valid = options.some((language) => language.code === target);
  const level = catalog.levels.some((item) => item.id === initialLevel)
    ? initialLevel
    : catalog.levels.find((item) => item.id === "beginner")?.id ||
      catalog.levels[0]?.id ||
      "beginner";
  useBuilderNavigationGuard(false, busy);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      active.current?.abort();
    };
  }, []);

  async function create() {
    if (!valid || creating.current) return;
    creating.current = true;
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setError("");
    try {
      const profile = await request<LanguageProfile>(
        `/v1/projects/${projectId}/language/profiles`,
        {
          method: "POST",
          signal: controller.signal,
          body: JSON.stringify({
            learner_name: (defaultLearnerName?.trim() || "My practice").slice(
              0,
              100,
            ),
            target_language: target,
            native_language: native,
            level,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          }),
        },
      );
      if (mounted.current && !controller.signal.aborted) onCreated(profile);
    } catch (error) {
      if (mounted.current && !controller.signal.aborted)
        setError(errorText(error));
    } finally {
      creating.current = false;
      if (mounted.current && !controller.signal.aborted) setBusy(false);
    }
  }
  useEffect(() => {
    let canceled = false;
    // The first StrictMode effect is cleaned up before this microtask runs.
    void Promise.resolve().then(() => {
      if (
        !canceled &&
        !attempted.current &&
        inferredTarget &&
        inferredTarget !== native &&
        valid
      ) {
        attempted.current = true;
        void create();
      }
    });
    return () => {
      canceled = true;
    };
  }, [inferredTarget, native, valid]);

  if (busy && inferredTarget && !error)
    return (
      <section className="language-page language-loading" aria-live="polite">
        <LoaderCircle className="spin" size={22} />
        <p>
          Opening your{" "}
          {catalog.languages.find((language) => language.code === target)?.name}{" "}
          conversation…
        </p>
      </section>
    );
  return (
    <section className="language-page language-setup language-quick-start">
      <div className="language-eyebrow">
        <Languages size={15} /> LANGUAGE STUDIO <span>/ {projectName}</span>
      </div>
      <header className="language-quick-header">
        <span className="language-quick-icon">
          <MessageCircle size={25} strokeWidth={1.5} />
        </span>
        <h1>What would you like to speak?</h1>
        <p>
          Choose a language and start a conversation. Your buddy will help you
          find the words.
        </p>
      </header>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void create();
        }}
      >
        <fieldset className="language-quick-choices" disabled={busy}>
          <legend className="sr-only">Choose a language to learn</legend>
          <div className="language-choice-grid">
            {options
              .filter((language) =>
                ["es", "fr", "ja", "de", "it", "en"].includes(language.code),
              )
              .slice(0, 6)
              .map((language) => (
                <label className="language-choice" key={language.code}>
                  <input
                    type="radio"
                    name="learning-language"
                    checked={target === language.code}
                    onChange={() => setTarget(language.code)}
                  />
                  <span className="language-native-name" lang={language.code}>
                    {language.native_name}
                  </span>
                  <span>{language.name}</span>
                  <span className="language-choice-check" aria-hidden="true">
                    {target === language.code && <Check size={13} />}
                  </span>
                </label>
              ))}
          </div>
          <div className="language-quick-all">
            <span>Explore more languages</span>
            <SelectMenu
              ariaLabel="Language to learn"
              value={target}
              onChange={setTarget}
              disabled={busy}
              placeholder="Choose a language"
              options={options.map((language) => ({
                value: language.code,
                label: language.name,
                description: language.native_name,
              }))}
            />
          </div>
        </fieldset>
        {inferredTarget === native && (
          <p className="language-quick-note">
            Choose another language to practice. Your app language is{" "}
            {
              catalog.languages.find((language) => language.code === native)
                ?.name
            }
            .
          </p>
        )}
        {error && (
          <p className="language-error" role="alert">
            {error}
          </p>
        )}
        <footer className="language-quick-footer">
          <span>Daily conversations. A little help whenever you need it.</span>
          <button className="button primary" disabled={!valid || busy}>
            {busy ? (
              <LoaderCircle size={16} className="spin" />
            ) : (
              <ArrowRight size={16} />
            )}
            {error ? "Try again" : "Start learning"}
          </button>
        </footer>
      </form>
    </section>
  );
}

type PendingTurn = {
  dayId: string;
  text: string;
  action: "reply" | "start" | "topic" | "help";
  id: string;
  intelligence: IntelligenceTier;
  budget: number;
};

function LearningSpace({
  profileId,
  catalog,
  budget,
  archived = false,
}: Props & { profileId: string; catalog: LanguageCatalog }) {
  const intelligence: IntelligenceTier = "basic";
  const modelReady = !catalog.intelligence?.setup_required;
  const selectedPolicy = catalog.intelligence?.tiers.find(
    (tier) => tier.id === intelligence,
  );
  const canAfford =
    !selectedPolicy || Number(budget) >= selectedPolicy.max_cost_usd;
  const canGenerate = modelReady && canAfford;
  const [profile, setProfile] = useState<LanguageProfile>();
  const [days, setDays] = useState<LanguageDay[]>([]);
  const [currentDayId, setCurrentDayId] = useState<string | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [detail, setDetail] = useState<LanguageDayDetail>();
  const [draft, setDraft] = useState("");
  const [inputLanguage, setInputLanguage] = useState("target");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<PendingTurn | null>(null);
  const [retryRun, setRetryRun] = useState<{
    runId: string;
    id: string;
    intelligence: IntelligenceTier;
    budget: number;
  } | null>(null);
  const [retryLoad, setRetryLoad] = useState(0);
  const [showTopics, setShowTopics] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const abort = useRef(new AbortController());
  const selectedRef = useRef<string | null>(null);
  const currentRef = useRef<string | null>(null);
  const draftRef = useRef("");
  const busyRef = useRef(false);
  const sentRef = useRef<PendingTurn | null>(null);
  const mounted = useRef(true);
  const autoStarted = useRef(new Set<string>());
  const transcriptRef = useRef<HTMLDivElement>(null);
  const todayTabRef = useRef<HTMLButtonElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const target = catalog.languages.find(
    (item) => item.code === profile?.target_language,
  );
  const native = catalog.languages.find(
    (item) => item.code === profile?.native_language,
  );
  const speech = useLanguageSpeech({
    onTranscript: (text) => {
      if (mounted.current)
        setDraft((old) => (old ? `${old.trimEnd()} ${text}` : text));
    },
  });
  draftRef.current = draft;
  selectedRef.current = selectedDayId;
  currentRef.current = currentDayId;
  const activeRun = detail?.active_run;
  const active = Boolean(activeRun && running(activeRun.status));
  busyRef.current = submitting || active;
  const historical = selectedDayId !== currentDayId;
  useBuilderNavigationGuard(Boolean(draft.trim()), submitting);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (draftRef.current.trim()) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, []);
  useEffect(() => {
    mounted.current = true;
    abort.current = new AbortController();
    return () => {
      mounted.current = false;
      abort.current.abort();
    };
  }, []);

  async function refreshDays(initial = false) {
    const data = await request<LanguageDays>(
      `/v1/language/profiles/${profileId}/days`,
      { signal: abort.current.signal },
    );
    if (!mounted.current) return;
    const previousCurrent = currentRef.current;
    setProfile(data.profile);
    setDays([...data.days].sort((a, b) => a.date.localeCompare(b.date)));
    setCurrentDayId(data.current_day_id);
    currentRef.current = data.current_day_id;
    if (
      initial ||
      !selectedRef.current ||
      (selectedRef.current === previousCurrent &&
        previousCurrent !== data.current_day_id &&
        !draftRef.current.trim() &&
        !busyRef.current)
    ) {
      const nextDay = data.current_day_id || data.days.at(-1)?.id || null;
      if (nextDay !== selectedRef.current) {
        speech.abortListening();
        speech.stopSpeaking();
      }
      setSelectedDayId(nextDay);
    }
  }

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    void refreshDays(true)
      .catch((e) => {
        if (alive && !abort.current.signal.aborted) setError(errorText(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    const refresh = () => {
      void refreshDays().catch((e) => {
        if (alive && !abort.current.signal.aborted) setError(errorText(e));
      });
    };
    const interval = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    return () => {
      alive = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [profileId, retryLoad]);

  useEffect(() => {
    if (!selectedDayId) return;
    const controller = new AbortController();
    setDetail((old) => (old?.day.id === selectedDayId ? old : undefined));
    let timer = 0;
    let lastPollError = "";
    async function poll() {
      try {
        const value = await request<LanguageDayDetail>(
          `/v1/language/days/${selectedDayId}`,
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        if (lastPollError) {
          const recoveredError = lastPollError;
          setError((old) => (old === recoveredError ? "" : old));
          lastPollError = "";
        }
        setDetail(value);
        if (value.active_run && running(value.active_run.status)) {
          timer = window.setTimeout(poll, 1400);
        } else {
          if (value.last_run?.status === "failed" && !submitting) {
            setError(
              runError(value.last_run) ||
                "Your learning buddy could not finish that reply. Your conversation is saved.",
            );
            if (
              sentRef.current?.dayId === selectedDayId &&
              sentRef.current.text &&
              !draftRef.current
            )
              setDraft(sentRef.current.text);
          }
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          lastPollError = errorText(e);
          setError(lastPollError);
          timer = window.setTimeout(poll, 5000);
        }
      }
    }
    void poll();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [selectedDayId, submitting, retryLoad]);

  useEffect(() => {
    todayTabRef.current?.scrollIntoView({ block: "nearest", inline: "end" });
  }, [days.length]);
  useEffect(() => {
    const transcript = transcriptRef.current;
    if (!transcript) return;
    const latest = Array.from(
      transcript.querySelectorAll<HTMLElement>(".language-tutor-turn"),
    ).at(-1);
    const top = active
      ? transcript.scrollHeight
      : latest
        ? latest.getBoundingClientRect().top -
          transcript.getBoundingClientRect().top +
          transcript.scrollTop -
          8
        : 0;
    transcript.scrollTo({
      top: Math.max(0, top),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, [detail?.turns.length, active]);
  useEffect(() => {
    if (
      !archived &&
      canGenerate &&
      selectedDayId &&
      detail?.day.id === selectedDayId &&
      !detail.turns.length &&
      !detail.active_run &&
      !detail.last_run &&
      !autoStarted.current.has(selectedDayId) &&
      selectedDayId === currentDayId
    ) {
      autoStarted.current.add(selectedDayId);
      void send("", "start");
    }
  }, [
    detail,
    archived,
    selectedDayId,
    currentDayId,
    canGenerate,
    intelligence,
  ]);

  async function send(
    text: string,
    action: PendingTurn["action"] = "reply",
    retry?: PendingTurn,
  ) {
    if (
      archived ||
      !canGenerate ||
      !selectedDayId ||
      historical ||
      busyRef.current ||
      (action === "reply" && speech.listening) ||
      (action === "reply" && !text.trim())
    )
      return;
    const item =
      retry ||
      (pending?.dayId === selectedDayId &&
      pending.text === text.trim() &&
      pending.action === action
        ? pending
        : {
            dayId: selectedDayId,
            text: text.trim(),
            action,
            id: action === "start" ? `language-start-${selectedDayId}` : key(),
            intelligence,
            budget: Number(budget),
          });
    busyRef.current = true;
    speech.abortListening();
    setSubmitting(true);
    setPending(item);
    setError("");
    try {
      const run = await request<Run>(`/v1/language/days/${item.dayId}/turns`, {
        method: "POST",
        signal: abort.current.signal,
        body: JSON.stringify({
          text: item.text,
          action: item.action,
          idempotency_key: item.id,
          budget_usd: item.budget,
          intelligence: item.intelligence,
        }),
      });
      if (!mounted.current) return;
      sentRef.current = item;
      setPending(null);
      setError("");
      if (action === "reply" && draftRef.current.trim() === text.trim())
        setDraft("");
      setShowTopics(false);
      setDetail((old) =>
        old ? { ...old, active_run: run, last_run: run } : old,
      );
    } catch (e) {
      if (!abort.current.signal.aborted) setError(errorText(e));
    } finally {
      if (mounted.current) {
        setSubmitting(false);
        busyRef.current = false;
      }
    }
  }

  function selectDay(id: string) {
    if (id === selectedDayId || submitting) return;
    speech.abortListening();
    speech.stopSpeaking();
    setSelectedDayId(id);
    setShowTopics(false);
    setError("");
  }
  async function cancel() {
    if (!activeRun) return;
    try {
      await request(`/v1/runs/${activeRun.id}/cancel`, {
        method: "POST",
        body: "{}",
        signal: abort.current.signal,
      });
      if (mounted.current) setRetryLoad((n) => n + 1);
    } catch (e) {
      if (!abort.current.signal.aborted) setError(errorText(e));
    }
  }
  async function retryFailedRun() {
    const previous = detail?.last_run;
    if (archived || !modelReady || historical || !previous || busyRef.current)
      return;
    const item =
      retryRun?.runId === previous.id
        ? retryRun
        : {
            runId: previous.id,
            id: key(),
            intelligence,
            budget: Number(budget),
          };
    busyRef.current = true;
    setRetryRun(item);
    setSubmitting(true);
    setError("");
    try {
      const run = await request<Run>(`/v1/runs/${item.runId}/retry`, {
        method: "POST",
        signal: abort.current.signal,
        body: JSON.stringify({
          idempotency_key: item.id,
          budget_usd: item.budget,
          intelligence: item.intelligence,
        }),
      });
      if (mounted.current) {
        setRetryRun(null);
        setError("");
        setDetail((old) =>
          old ? { ...old, active_run: run, last_run: run } : old,
        );
        if (draftRef.current.trim() === sentRef.current?.text) setDraft("");
      }
    } catch (e) {
      if (!abort.current.signal.aborted) setError(errorText(e));
    } finally {
      if (mounted.current) {
        busyRef.current = false;
        setSubmitting(false);
      }
    }
  }
  const selectedDay = days.find((item) => item.id === selectedDayId);
  const lastReply = detail?.turns
    .filter((turn) => turn.role === "assistant")
    .at(-1)?.reply;
  const inputLocale =
    inputLanguage === "native" ? native?.locale : target?.locale;

  if (!profile)
    return (
      <section className="language-page language-loading">
        {loading ? (
          <>
            <LoaderCircle className="spin" size={22} />
            <p>Opening your conversation…</p>
          </>
        ) : (
          <>
            <p className="language-error" role="alert">
              {error || "Your learning space could not be opened."}
            </p>
            <button
              className="button"
              onClick={() => setRetryLoad((n) => n + 1)}
            >
              Try again
            </button>
          </>
        )}
      </section>
    );
  return (
    <section className="language-page language-workspace">
      <header className="language-heading">
        <div>
          <div className="language-eyebrow">
            <Languages size={14} /> LANGUAGE STUDIO
          </div>
          <h1>
            Learn: <span>{target?.name || profile.target_language}</span>
          </h1>
        </div>
      </header>
      {!modelReady && <p className="language-error" role="status">Language conversations are unavailable. Your saved journal is still available.</p>}
      {modelReady && !canAfford && (
        <p className="language-error" role="status">
          This conversation exceeds the current request budget.
        </p>
      )}
      <nav className="language-days" aria-label="Daily conversations">
        <div role="tablist" aria-label="Learning days">
          {days.map((day) => (
            <button
              type="button"
              role="tab"
              key={day.id}
              id={`language-day-tab-${day.id}`}
              aria-selected={day.id === selectedDayId}
              aria-controls="language-day-panel"
              tabIndex={day.id === selectedDayId ? 0 : -1}
              ref={day.id === currentDayId ? todayTabRef : undefined}
              onClick={() => selectDay(day.id)}
              onKeyDown={(event) => {
                if (
                  !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                    event.key,
                  )
                )
                  return;
                event.preventDefault();
                const index = days.findIndex((item) => item.id === day.id);
                const next =
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? days.length - 1
                      : (index +
                          (event.key === "ArrowRight" ? 1 : -1) +
                          days.length) %
                        days.length;
                selectDay(days[next].id);
                document
                  .getElementById(`language-day-tab-${days[next].id}`)
                  ?.focus();
              }}
            >
              <span>
                Day {day.day_number}
                {day.id === currentDayId && <i>Today</i>}
              </span>
              <small>{dayLabel(day.date)}</small>
            </button>
          ))}
        </div>
      </nav>
      <div className="language-body">
        <div
          className="language-conversation"
          role="tabpanel"
          id="language-day-panel"
          aria-labelledby={
            selectedDayId ? `language-day-tab-${selectedDayId}` : undefined
          }
        >
          <div className="language-session-label">
            <span>
              <span className="language-status-dot" />
              Your conversation
              {selectedDay && <small> / Day {selectedDay.day_number}</small>}
            </span>
            <button
              className="language-text-button"
              onClick={() => setShowGuide((v) => !v)}
              aria-expanded={showGuide}
            >
              <CircleHelp size={14} /> How it works
            </button>
          </div>
          {showGuide && (
            <div className="language-guide">
              <div>
                <Languages size={19} />
                <p>
                  <strong>A little help, whenever you need it.</strong> Click a
                  word to see its meaning underneath. Choose{" "}
                  <b>Translate all</b> for the full message. You can answer in
                  either language.
                </p>
              </div>
              <button
                aria-label="Dismiss translation guide"
                onClick={() => setShowGuide(false)}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {(historical || archived) && (
            <div className="language-history-note">
              <BookOpen size={15} />
              <span>
                {archived
                  ? "This archived project is available to read."
                  : "This day is saved in your journal."}
              </span>
              {currentDayId && (
                <button
                  onClick={() => {
                    if (currentDayId) selectDay(currentDayId);
                  }}
                >
                  Go to today <ArrowRight size={13} />
                </button>
              )}
            </div>
          )}
          <div
            className="language-transcript"
            ref={transcriptRef}
            aria-label="Conversation messages"
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
          >
            {!selectedDayId && (
              <div className="language-welcome">
                <BookOpen size={24} />
                <h2>No conversations yet.</h2>
                <p>Restore this project to begin learning.</p>
              </div>
            )}
            {!detail && selectedDayId && (
              <div className="language-inline-loading">
                <LoaderCircle size={18} className="spin" />
                Opening this day…
              </div>
            )}
            {detail?.turns.map((turn) =>
              turn.role === "assistant" ? (
                <TutorTurn
                  key={turn.id}
                  turn={turn}
                  targetCode={profile.target_language}
                  nativeCode={profile.native_language}
                  targetLocale={target?.locale || profile.target_language}
                  speech={speech}
                />
              ) : (
                <article className="language-user-turn" key={turn.id}>
                  <div className="language-turn-label">
                    {profile.learner_name}
                  </div>
                  <p dir="auto">{turn.text}</p>
                </article>
              ),
            )}
            {detail && !detail.turns.length && !active && !submitting && (
              <div className="language-welcome">
                <div className="language-welcome-icon">
                  <MessageCircle size={28} strokeWidth={1.4} />
                </div>
                <div className="language-eyebrow">
                  A FEW WORDS GO A LONG WAY
                </div>
                <h2>
                  {historical
                    ? "A quiet day in your journal."
                    : !modelReady
                      ? "Your learning space is ready."
                      : "What’s on your mind today?"}
                </h2>
                <p>
                  {historical
                    ? "No conversation was recorded on this day."
                    : !modelReady
                      ? "A connected language model will bring your daily conversations to life."
                      : `Your buddy will start in ${target?.name || profile.target_language}. There’s no pressure to get every word right.`}
                </p>
                {!historical &&
                  !archived &&
                  canGenerate &&
                  !detail.last_run && (
                    <button
                      className="button primary"
                      onClick={() => void send("", "start")}
                    >
                      <MessageCircle size={16} />
                      Start today’s conversation
                    </button>
                  )}
                <div className="language-welcome-hint">
                  <Languages size={15} />
                  Tap any word for a little help.
                </div>
              </div>
            )}
            {(active || submitting) && (
              <div className="language-thinking" role="status">
                <span className="language-tutor-avatar">
                  <Sparkles size={16} />
                </span>
                <span>Your buddy is thinking…</span>
                <LoaderCircle size={14} className="spin" />
                {active && (
                  <button onClick={() => void cancel()}>
                    <Square size={12} />
                    Stop
                  </button>
                )}
              </div>
            )}
          </div>
          {(error || detail?.last_run?.status === "cancelled") && (
            <div className="language-error-block" role="alert">
              <p>
                {error || "The reply was stopped. Your conversation is saved."}
              </p>
              {!archived &&
                !historical &&
                pending?.dayId === selectedDayId &&
                !active && (
                  <button
                    className="button"
                    disabled={submitting}
                    onClick={() =>
                      void send(pending.text, pending.action, pending)
                    }
                  >
                    Retry this request
                  </button>
                )}
              {!archived &&
                !historical &&
                pending?.dayId !== selectedDayId &&
                !active &&
                (retryRun ||
                  ["failed", "cancelled"].includes(
                    detail?.last_run?.status || "",
                  )) && (
                  <button
                    className="button"
                    disabled={submitting}
                    onClick={() => void retryFailedRun()}
                  >
                    Try this reply again
                  </button>
                )}
            </div>
          )}
          {speech.error && (
            <p className="language-error" role="alert">
              {speech.error}{" "}
              <button
                className="language-text-button"
                onClick={speech.clearError}
              >
                Dismiss
              </button>
            </p>
          )}
          {!historical && !archived && modelReady && (
            <div className="language-composer-area">
              {lastReply?.suggested_replies?.length && !active ? (
                <div className="language-suggestions">
                  <span>Try a reply</span>
                  {lastReply.suggested_replies.map((suggestion, index) => (
                    <SuggestedReply
                      key={`${detail?.turns.length}-${index}`}
                      text={suggestion.text}
                      translation={suggestion.translation}
                      targetCode={profile.target_language}
                      nativeCode={profile.native_language}
                      onUse={(text) => {
                        setDraft(text);
                        composerRef.current?.focus();
                      }}
                    />
                  ))}
                </div>
              ) : null}
              <div className="language-topic-actions">
                <button
                  className="language-text-button"
                  aria-expanded={showTopics}
                  onClick={() => setShowTopics((v) => !v)}
                >
                  <Sparkles size={14} />
                  Pick a topic
                  <ChevronDown size={12} />
                </button>
                <button
                  className="language-text-button"
                  disabled={
                    !canGenerate ||
                    active ||
                    submitting ||
                    !detail?.turns.length
                  }
                  onClick={() => void send("", "help")}
                >
                  <CircleHelp size={14} />I need a little help
                </button>
              </div>
              {showTopics && (
                <div className="language-topics">
                  {topics.map((topic) => {
                    const Icon = topic.icon;
                    return (
                      <button
                        key={topic.label}
                        disabled={active || submitting}
                        onClick={() => void send(topic.text, "topic")}
                      >
                        <Icon size={15} />
                        {topic.label}
                      </button>
                    );
                  })}
                </div>
              )}
              <form
                className="language-composer"
                onSubmit={(event) => {
                  event.preventDefault();
                  void send(draft);
                }}
              >
                <label className="sr-only" htmlFor="language-reply">
                  Your reply in either language
                </label>
                <textarea
                  id="language-reply"
                  ref={composerRef}
                  rows={2}
                  dir="auto"
                  maxLength={6000}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    if (pending && e.target.value !== pending.text)
                      setPending(null);
                  }}
                  placeholder={`Say something in ${target?.name || "your new language"}… or ask for help in ${native?.name || "your language"}.`}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      (event.ctrlKey || event.metaKey)
                    ) {
                      event.preventDefault();
                      void send(draft);
                    }
                  }}
                />
                <div className="language-composer-toolbar">
                  <div className="language-voice-controls">
                    <label>
                      <span className="sr-only">Speech input language</span>
                      <SelectMenu
                        ariaLabel="Speech input language"
                        disabled={speech.listening}
                        value={inputLanguage}
                        onChange={setInputLanguage}
                        options={[
                          {
                            value: "target",
                            label: target?.name || profile.target_language,
                          },
                          {
                            value: "native",
                            label: native?.name || profile.native_language,
                          },
                        ]}
                      />
                    </label>
                    <button
                      type="button"
                      className={
                        speech.listening
                          ? "language-mic listening"
                          : "language-mic"
                      }
                      disabled={
                        !speech.recognitionSupported || active || submitting
                      }
                      onClick={() =>
                        speech.listening
                          ? speech.stopListening()
                          : speech.startListening(inputLocale || "en-US", true)
                      }
                      aria-pressed={speech.listening}
                    >
                      {speech.listening ? (
                        <Square size={15} />
                      ) : (
                        <Mic size={16} />
                      )}
                      {speech.listening ? "Stop recording" : "Speak"}
                    </button>

                  </div>
                  <button
                    className="language-send"
                    type="submit"
                    disabled={
                      !draft.trim() ||
                      !canGenerate ||
                      active ||
                      submitting ||
                      !detail ||
                      speech.listening
                    }
                  >
                    {submitting ? (
                      <LoaderCircle size={16} className="spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    Send
                  </button>
                </div>
              </form>
              {(speech.listening || !speech.recognitionSupported) && <div className="language-composer-note">
                <span>
                  {speech.listening
                    ? "Listening… review your words before sending."
                    : speech.recognitionSupported
                      ? "Voice drafts your reply and may use your browser’s online speech service."
                      : "Voice input isn’t supported in this browser. You can still type your reply."}
                </span>
              </div>}
            </div>
          )}
          {historical && draft.trim() && (
            <p className="language-draft-note">
              Your unsent reply is kept for today.{" "}
              <button
                onClick={() => {
                  if (currentDayId) selectDay(currentDayId);
                }}
              >
                Continue your draft
              </button>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

type Speech = ReturnType<typeof useLanguageSpeech>;

function TutorTurn({
  turn,
  targetCode,
  nativeCode,
  targetLocale,
  speech,
}: {
  turn: LanguageTurn;
  targetCode: string;
  nativeCode: string;
  targetLocale: string;
  speech: Speech;
}) {
  const [translated, setTranslated] = useState(false);
  const [revealed, setRevealed] = useState<number[]>([]);
  const reply = turn.reply;
  return (
    <article className="language-tutor-turn">
      <div className="language-turn-label">
        <span className="language-tutor-avatar">
          <Sparkles size={14} />
        </span>
        Your learning buddy
      </div>
      <div className="language-tutor-content">
        {!!reply?.segments?.length && <p className="language-word-help">Click a word to show translation</p>}
        <div className="language-message" lang={targetCode} dir="auto">
          {reply?.segments?.length
            ? reply.segments.map((segment, index) => {
                const visible = revealed.includes(index);
                return segment.text.trim() &&
                  segment.translation.trim() &&
                  /[\p{L}\p{N}]/u.test(segment.text) ? (
                  <span
                    className={`language-word ${visible ? "is-revealed" : ""}`}
                    key={index}
                  >
                    <button
                      aria-expanded={visible}
                      aria-controls={`word-meaning-${turn.id}-${index}`}
                      onClick={() =>
                        setRevealed((old) =>
                          visible
                            ? old.filter((value) => value !== index)
                            : [...old, index],
                        )
                      }
                    >
                      {segment.text}
                    </button>
                    {visible && (
                      <span
                        className="language-word-meaning"
                        id={`word-meaning-${turn.id}-${index}`}
                        lang={nativeCode}
                        dir="auto"
                      >
                        <span>{segment.translation}</span>

                      </span>
                    )}
                  </span>
                ) : (
                  <span key={index}>{segment.text}</span>
                );
              })
            : turn.text}
        </div>
        {translated && reply?.translation && (
          <p
            className="language-full-translation"
            lang={nativeCode}
            dir="auto"
            id={`translation-${turn.id}`}
          >
            {reply.translation}
          </p>
        )}
        <div className="language-message-actions">
          {reply?.translation && (
            <button
              className={`language-translate ${translated ? "selected" : ""}`}
              aria-expanded={translated}
              aria-controls={`translation-${turn.id}`}
              onClick={() => setTranslated((v) => !v)}
            >
              <Languages size={15} />
              {translated ? "Hide translation" : "Translate all"}
            </button>
          )}
          <button
            disabled={!speech.speechSupported}
            onClick={() => speech.speak(reply?.text || turn.text, targetLocale)}
          >
            <Volume2 size={14} />
            Listen
          </button>
          <button
            disabled={!speech.speechSupported}
            onClick={() =>
              speech.speak(reply?.text || turn.text, targetLocale, true)
            }
          >
            <Headphones size={14} />
            Slow
          </button>
          {speech.speaking && (
            <button onClick={speech.stopSpeaking}>
              <Pause size={13} />
              Stop audio
            </button>
          )}
        </div>
        {reply?.correction && (
          <div className="language-coaching">
            <span className="language-coaching-label">A more natural way</span>
            <p className="language-correction" lang={targetCode} dir="auto">
              {reply.correction.corrected}
            </p>
            <p lang={nativeCode} dir="auto">
              {reply.correction.explanation}
            </p>
          </div>
        )}
        {reply?.explanation && (
          <div className="language-coaching">
            <span className="language-coaching-label">A little guidance</span>
            <p lang={nativeCode} dir="auto">
              {reply.explanation}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

function SuggestedReply({
  text,
  translation,
  targetCode,
  nativeCode,
  onUse,
}: {
  text: string;
  translation: string;
  targetCode: string;
  nativeCode: string;
  onUse?: (text: string) => void;
}) {
  const [reveal, setReveal] = useState(false);
  return (
    <span className="language-suggestion">
      <span className="language-suggestion-controls">
        {onUse ? (
          <button lang={targetCode} dir="auto" onClick={() => onUse(text)}>
            {text}
            <ArrowRight size={12} />
          </button>
        ) : (
          <span lang={targetCode} dir="auto">
            {text}
          </span>
        )}
        <button
          className="language-suggestion-meaning"
          aria-label={
            reveal ? `Hide meaning of ${text}` : `Show meaning of ${text}`
          }
          aria-expanded={reveal}
          onClick={() => setReveal((v) => !v)}
        >
          <Languages size={13} />
        </button>
      </span>
      {reveal && (
        <span
          lang={nativeCode}
          dir="auto"
          className="language-suggestion-translation"
        >
          {translation}
        </span>
      )}
    </span>
  );
}

