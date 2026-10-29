import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  AudioLines,
  BookOpen,
  Box,
  Camera,
  Check,
  ChevronRight,
  CircleCheck,
  Clapperboard,
  Coins,
  Compass,
  Diamond,
  Eye,
  FileText,
  Gamepad2,
  Gem,
  Globe,
  GraduationCap,
  Heart,
  Layers,
  Leaf,
  Lightbulb,
  LoaderCircle,
  Mic2,
  Monitor,
  Mountain,
  Music2,
  Network,
  Palette,
  PersonStanding,
  Rocket,
  Search,
  Smartphone,
  Sparkles,
  Square,
  Timer,
  User,
  Users,
  WandSparkles,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { post } from "./api";
import { Modal } from "./components";
import {
  builderIcon,
  inferBuilderAnswers,
  sortBuilderComponents,
  builderComponentName,
} from "./builder";
import type {
  BuilderCatalog,
  BuilderComponent,
  BuilderKind,
  BuilderQuestion,
  BuilderWorkspace,
  PlanPreview,
  WorkspaceEnvelope,
} from "./builder";
import "./builder-setup.css";

const choiceIcons: Record<string, LucideIcon> = {
  square: Square,
  box: Box,
  "arrow-right": ArrowRight,
  "arrow-down": ArrowDown,
  diamond: Diamond,
  eye: Eye,
  "person-standing": PersonStanding,
  globe: Globe,
  bot: Gamepad2,
  mountain: Mountain,
  monitor: Monitor,
  smartphone: Smartphone,
  "gamepad-2": Gamepad2,
  user: User,
  users: Users,
  network: Network,
  sparkles: Sparkles,
  compass: Compass,
  zap: Zap,
  leaf: Leaf,
  coins: Coins,
  gem: Gem,
  film: Clapperboard,
  clapperboard: Clapperboard,
  layers: Layers,
  palette: Palette,
  camera: Camera,
  video: Camera,
  timer: Timer,
  clock: Timer,
  hourglass: Timer,
  "book-open": BookOpen,
  library: BookOpen,
  "file-text": FileText,
  wand: WandSparkles,
  search: Search,
  heart: Heart,
  "graduation-cap": GraduationCap,
  music: Music2,
  "music-2": Music2,
  mic: Mic2,
  "audio-lines": AudioLines,
  rocket: Rocket,
};

const messageOf = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";

const planReason = (reason?: string) =>
  ({
    archived: "Restore this project before updating its roadmap.",
    already_planned:
      "This project already has a roadmap. Open its task board and choose Review project setup to revise it.",
    existing_conversation:
      "This project already has a conversation. Open its task board and choose Plan my project to start setup explicitly.",
    no_creation_intent:
      "Tell us what you want to make, or open Plan my project from the task board.",
  })[reason || ""] ||
  reason ||
  "We could not create the roadmap. Your choices are still here; try again.";

function validAnswers(
  kind: BuilderKind | undefined,
  answers: Record<string, string>,
) {
  return Object.fromEntries(
    (kind?.questions || []).flatMap((question) =>
      question.options.some((option) => option.id === answers[question.id])
        ? [[question.id, answers[question.id]]]
        : [],
    ),
  );
}

function ChoiceQuestion({
  question,
  value,
  assumed,
  onChange,
  onRecommend,
}: {
  question: BuilderQuestion;
  value?: string;
  assumed: boolean;
  onChange: (value: string) => void;
  onRecommend: () => void;
}) {
  const recommended = question.options.find(
    (option) => option.id === question.recommended,
  );
  return (
    <fieldset className="bsetup-question">
      <legend>{question.title}</legend>
      <p className="bsetup-question-help">{question.description}</p>
      <div className="bsetup-choice-grid">
        {question.options.map((option) => {
          const Icon = choiceIcons[option.icon || ""] || Lightbulb;
          return (
            <label key={option.id} className="bsetup-choice">
              <input
                className="bsetup-radio"
                type="radio"
                name={`builder-${question.id}`}
                value={option.id}
                checked={value === option.id}
                onChange={() => onChange(option.id)}
              />
              <span className="bsetup-choice-graphic" aria-hidden="true">
                <Icon size={27} strokeWidth={1.5} />
              </span>
              <span className="bsetup-choice-title">{option.label}</span>
              <span className="bsetup-choice-detail">{option.description}</span>
              {option.id === question.recommended && (
                <span className="bsetup-recommended">
                  Recommended starting point
                </span>
              )}
              <span className="bsetup-choice-indicator" aria-hidden="true">
                {value === option.id && <Check size={11} strokeWidth={3} />}
              </span>
            </label>
          );
        })}
      </div>
      {recommended && (
        <button type="button" className="bsetup-choose" onClick={onRecommend}>
          <WandSparkles size={14} />
          {assumed
            ? `Starting with ${recommended.label.toLowerCase()} · change anytime`
            : `Choose for me · ${recommended.label}`}
        </button>
      )}
    </fieldset>
  );
}

export type BuilderSetupProps = {
  projectId: string;
  projectName: string;
  catalog: BuilderCatalog;
  initialPrompt?: string;
  initialKind?: string;
  existing?: WorkspaceEnvelope;
  explicit?: boolean;
  planningBudget?: string;
  appLanguage?: string;
  onComplete: (envelope: WorkspaceEnvelope) => void;
  onClose: () => void;
};

export function BuilderSetup({
  projectId,
  projectName,
  catalog,
  initialPrompt = "",
  initialKind,
  existing,
  explicit = true,
  appLanguage = "en",
  onComplete,
  onClose,
}: BuilderSetupProps) {
  const [idea, setIdea] = useState(
    initialPrompt ||
      existing?.workspace.plan_prompt ||
      existing?.workspace.brief ||
      "",
  );
  const [previewedIdea, setPreviewedIdea] = useState("");
  const [kindId, setKindId] = useState(
    initialKind || existing?.workspace.kind || "",
  );
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [manual, setManual] = useState<Record<string, string>>(
    existing?.workspace.answers || {},
  );
  const [delegated, setDelegated] = useState<string[]>([]);
  const [extracted, setExtracted] = useState<Record<string, string>>({});
  const [editExtracted, setEditExtracted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const started = useRef(false);
  const mounted = useRef(true);
  const kind = catalog.kinds.find((item) => item.id === kindId);
  const questions = (kind?.questions || []).filter(
    (question) => kind?.id !== "language" || question.id !== "native_language",
  );
  const inferredNative = kind?.questions
    .find((question) => question.id === "native_language")
    ?.options.some((option) => option.id === appLanguage)
    ? appLanguage
    : "en";
  const answered: Record<string, string> = {
    ...validAnswers(kind, extracted),
    ...validAnswers(kind, manual),
    ...(kind?.id === "language"
      ? {
          native_language:
            existing?.workspace.answers.native_language || inferredNative,
        }
      : {}),
  };
  const remaining = questions.filter(
    (question) =>
      editExtracted || !extracted[question.id] || manual[question.id],
  );
  const currentQuestion =
    remaining[Math.min(questionIndex, Math.max(remaining.length - 1, 0))];
  const tools = sortBuilderComponents(
    catalog.components.filter((component) =>
      (kind?.components || ["design", "tasks"]).includes(component.id),
    ),
  );
  const actualAnswers = Object.fromEntries(
    questions.map((question) => [
      question.id,
      answered[question.id] || question.recommended,
    ]),
  );

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // The shared dialog closes on Escape; hold it open while the save is in flight.
  useEffect(() => {
    const dialog = bodyRef.current?.closest("dialog");
    const holdWhilePending = (event: Event) => {
      if (pending) event.preventDefault();
    };
    dialog?.addEventListener("cancel", holdWhilePending);
    return () => dialog?.removeEventListener("cancel", holdWhilePending);
  }, [pending]);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    bodyRef.current?.querySelector(".bsetup-content")?.scrollTo({ top: 0 });
  }, [step, questionIndex]);

  useEffect(() => {
    if (error)
      bodyRef.current
        ?.querySelector(".bsetup-error")
        ?.scrollIntoView({ block: "nearest" });
  }, [error]);

  async function preview() {
    if (pending || !idea.trim() || !kind) return;
    setPending(true);
    setError("");
    try {
      const result = await post<PlanPreview>(
        `/v1/projects/${encodeURIComponent(projectId)}/plan-preview`,
        {
          prompt: idea.trim(),
          kind: kind.id,
          explicit,
        },
      );
      if (!mounted.current) return;
      if (!result.eligible) throw new Error(planReason(result.reason));
      setExtracted(validAnswers(kind, result.answers));
      setPreviewedIdea(idea.trim());
      setQuestionIndex(0);
      setEditExtracted(false);
      setStep(1);
    } catch (error) {
      if (mounted.current) setError(messageOf(error));
    } finally {
      if (mounted.current) setPending(false);
    }
  }

  useEffect(() => {
    if (started.current || !initialPrompt.trim() || !initialKind || !kind)
      return;
    started.current = true;
    setExtracted(inferBuilderAnswers(initialPrompt, kind));
    void preview();
    // Initial chat interception is prepared once; later edits use Continue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function changeKind(id: string) {
    if (id === kindId) return;
    setKindId(id);
    setManual({});
    setExtracted({});
    setDelegated([]);
    setQuestionIndex(0);
    setError("");
  }

  function choose(question: BuilderQuestion, value: string, assume = false) {
    setManual((previous) => ({ ...previous, [question.id]: value }));
    setDelegated((previous) =>
      assume
        ? [...new Set([...previous, question.id])]
        : previous.filter((id) => id !== question.id),
    );
  }

  async function createPlan() {
    if (pending || !idea.trim() || !kind) return;
    if (idea.trim() !== previewedIdea) {
      await preview();
      return;
    }
    setPending(true);
    setError("");
    try {
      const result = await post<
        WorkspaceEnvelope & { eligible: boolean; reason?: string }
      >(`/v1/projects/${encodeURIComponent(projectId)}/plan`, {
        prompt: idea.trim(),
        kind: kind.id,
        // Omitted recommendations are saved by the planner as assumptions.
        answers: Object.fromEntries(
          Object.entries(answered).filter(([id]) => !delegated.includes(id)),
        ),
        explicit,
      });
      if (!mounted.current) return;
      if (!result.eligible || !result.workspace)
        throw new Error(planReason(result.reason));
      onComplete({ version: result.version, workspace: result.workspace });
    } catch (error) {
      if (mounted.current) setError(messageOf(error));
    } finally {
      if (mounted.current) setPending(false);
    }
  }

  function advance() {
    setError("");
    if (step === 0) {
      void preview();
      return;
    }
    if (step === 1 && questionIndex < remaining.length - 1) {
      setQuestionIndex((index) => index + 1);
      return;
    }
    setStep(2);
  }

  const isLastQuestion =
    !currentQuestion || questionIndex >= remaining.length - 1;
  const extractedQuestions = questions.filter(
    (question) => extracted[question.id] && !manual[question.id],
  );

  return (
    <Modal
      title={
        existing?.workspace.initialized
          ? "Shape your project"
          : "Your idea starts here"
      }
      wide
      onClose={() => {
        if (!pending) onClose();
      }}
    >
      <div className="bsetup" ref={bodyRef} aria-busy={pending}>
        <div className="bsetup-content">
          <ol className="bsetup-progress" aria-label="Project setup progress">
            {["Your idea", "A few choices", "Your roadmap"].map(
              (label, index) => (
                <li
                  key={label}
                  aria-current={step === index ? "step" : undefined}
                  className={step > index ? "is-complete" : ""}
                >
                  <span className="bsetup-step-number" aria-hidden="true">
                    {step > index ? <Check size={13} /> : index + 1}
                  </span>
                  <span>{label}</span>
                </li>
              ),
            )}
          </ol>
          <div className="bsetup-intro">
            <div className="bsetup-eyebrow">
              <Compass size={14} /> Project guide · {projectName}
            </div>
            <h3 ref={headingRef} tabIndex={-1}>
              {step === 0
                ? "What would you love to make?"
                : step === 1
                  ? "Let's make it yours."
                  : "A place for every next step."}
            </h3>
            <p>
              {step === 0
                ? "Start with your idea. We'll help with the decisions, make a plan, and put the right creative tools in your project."
                : step === 1
                  ? "Choose what feels right. Unsure? Use a recommended starting point and adjust it as you build."
                  : "Your project will have an editable blueprint, an ordered task board, and the tools to bring your idea to life."}
            </p>
          </div>
          <fieldset disabled={pending}>
            {step === 0 && (
              <>
                <label className="bsetup-label" htmlFor="builder-idea">
                  The idea
                </label>
                <textarea
                  id="builder-idea"
                  className="bsetup-idea"
                  value={idea}
                  maxLength={20000}
                  placeholder="I'd love to make a game where you explore a tiny planet and help its creatures build a home…"
                  onChange={(event) => setIdea(event.target.value)}
                />
                <p className="bsetup-help">
                  Tell us what it does, who it's for, and anything you've
                  already decided. A sentence is enough to start.
                </p>
                <fieldset>
                  <legend className="bsetup-label">What are you making?</legend>
                  <div className="bsetup-kind-grid">
                    {catalog.kinds.map((item) => {
                      const Icon = builderIcon(item.id);
                      return (
                        <label key={item.id} className="bsetup-kind">
                          <input
                            className="bsetup-radio"
                            type="radio"
                            name="builder-kind"
                            checked={kindId === item.id}
                            onChange={() => changeKind(item.id)}
                          />
                          <Icon
                            size={24}
                            strokeWidth={1.6}
                            aria-hidden="true"
                          />
                          <span>{item.name}</span>
                          {kindId === item.id && (
                            <span
                              className="bsetup-kind-check"
                              aria-hidden="true"
                            >
                              <Check size={13} />
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                <div className="bsetup-kind-description" aria-live="polite">
                  <Sparkles size={14} />
                  <span>
                    {kind?.description ||
                      "Every kind of project gets a task board and a project blueprint."}
                  </span>
                </div>
              </>
            )}
            {step === 1 && (
              <>
                {extractedQuestions.length > 0 && (
                  <div className="bsetup-extracted">
                    <p className="bsetup-extracted-heading">
                      <Check size={15} /> Picked up from your idea
                    </p>
                    <ul className="bsetup-extracted-list">
                      {extractedQuestions.map((question) => (
                        <li key={question.id}>
                          {
                            question.options.find(
                              (option) => option.id === extracted[question.id],
                            )?.label
                          }
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="bsetup-text-button"
                      onClick={() => {
                        setEditExtracted((value) => !value);
                        setQuestionIndex(0);
                      }}
                    >
                      {editExtracted
                        ? "Keep these choices"
                        : "Change these choices"}
                    </button>
                  </div>
                )}
                {currentQuestion ? (
                  <>
                    <div className="bsetup-question-count" aria-live="polite">
                      Choice {questionIndex + 1} of {remaining.length}
                    </div>
                    <ChoiceQuestion
                      key={currentQuestion.id}
                      question={currentQuestion}
                      value={answered[currentQuestion.id]}
                      assumed={delegated.includes(currentQuestion.id)}
                      onChange={(value) => choose(currentQuestion, value)}
                      onRecommend={() =>
                        choose(
                          currentQuestion,
                          currentQuestion.recommended,
                          true,
                        )
                      }
                    />
                  </>
                ) : (
                  <div className="bsetup-all-set">
                    <CircleCheck size={26} />
                    <span>
                      Your idea already covers these choices. Review the tools
                      and plan before getting started.
                    </span>
                  </div>
                )}
                {currentQuestion && (
                  <button
                    className="bsetup-text-button"
                    type="button"
                    onClick={() => {
                      setError("");
                      setStep(2);
                    }}
                  >
                    Use recommendations for the remaining choices{" "}
                    <ChevronRight size={12} />
                  </button>
                )}
              </>
            )}
            {step === 2 && (
              <>
                <label className="bsetup-label" htmlFor="builder-review-idea">
                  Your {kind?.name.toLowerCase() || "project"} idea
                </label>
                <textarea
                  id="builder-review-idea"
                  className="bsetup-idea"
                  value={idea}
                  maxLength={20000}
                  onChange={(event) => setIdea(event.target.value)}
                />
                <p className="bsetup-help">
                  {idea.trim() !== previewedIdea
                    ? "Your idea changed. Review updated choices before creating the roadmap."
                    : "You can edit this brief now. To change setup choices, use Back to choices."}
                </p>
                <div className="bsetup-review-grid">
                  <section aria-labelledby="builder-tools-title">
                    <h4 id="builder-tools-title">In your project sidebar</h4>
                    <ul className="bsetup-tool-list">
                      {tools.map((component) => {
                        const Icon = builderIcon(component.id);
                        return (
                          <li key={component.id}>
                            <Icon size={16} />
                            <div>
                              {builderComponentName(component)}
                              <small>{component.description}</small>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                  <section aria-labelledby="builder-decisions-title">
                    <h4 id="builder-decisions-title">
                      Your starting decisions
                    </h4>
                    <dl className="bsetup-summary">
                      {questions.map((question) => {
                        const assumption =
                          !answered[question.id] ||
                          delegated.includes(question.id);
                        const selected = question.options.find(
                          (option) => option.id === actualAnswers[question.id],
                        );
                        return (
                          <div key={question.id}>
                            <dt>{question.title}</dt>
                            <dd>
                              {selected?.label}
                              <span className="bsetup-assumption">
                                {assumption
                                  ? "Starting assumption"
                                  : extracted[question.id] &&
                                      !manual[question.id]
                                    ? "From your idea"
                                    : "Your choice"}
                              </span>
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </section>
                </div>
                <div className="bsetup-note">
                  <RouteMark />
                  <div>
                    <h4>Start small. Finish something real.</h4>
                    <p>
                      We'll break the work into decisions, a first complete
                      version, checks, and a release. Each task has a clear
                      outcome. Recommendations stay visible in your blueprint so
                      you can revisit them.
                    </p>
                  </div>
                </div>
                {existing?.workspace.initialized && (
                  <p className="bsetup-help">
                    Your existing creative records and completed work stay in
                    this project. The guide adds planning detail for this
                    request.
                  </p>
                )}
              </>
            )}
          </fieldset>
          {error && (
            <div className="bsetup-error" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>
        <div className="bsetup-footer">
          <span className="bsetup-footer-note">
            {pending
              ? step === 2
                ? "Building your roadmap and project tools…"
                : "Finding the decisions already in your idea…"
              : existing?.workspace.initialized
                ? "Your existing tasks and creative work are kept."
                : "Includes a guided plan. Review its proposal before applying."}
          </span>
          <div className="bsetup-actions">
            {step > 0 && (
              <button
                type="button"
                className="bsetup-action"
                disabled={pending}
                onClick={() => {
                  setError("");
                  if (step === 2) {
                    setStep(1);
                    setQuestionIndex(0);
                  } else if (questionIndex > 0)
                    setQuestionIndex((index) => index - 1);
                  else setStep(0);
                }}
              >
                <ArrowLeft size={14} />
                {step === 2 ? "Back to choices" : "Back"}
              </button>
            )}
            {step < 2 ? (
              <button
                type="button"
                className="bsetup-action bsetup-action-primary"
                disabled={pending || (step === 0 && (!idea.trim() || !kind))}
                onClick={advance}
              >
                {pending ? (
                  <LoaderCircle size={15} className="bsetup-busy" />
                ) : null}
                {pending
                  ? "Reading your idea…"
                  : step === 0
                    ? "Find my next steps"
                    : isLastQuestion
                      ? "Review my plan"
                      : answered[currentQuestion?.id]
                        ? "Next choice"
                        : "Use recommendation"}
                {!pending && <ArrowRight size={14} />}
              </button>
            ) : (
              <button
                type="button"
                className="bsetup-action bsetup-action-primary"
                disabled={pending || !idea.trim() || !kind}
                onClick={() => void createPlan()}
              >
                {pending ? (
                  <LoaderCircle size={15} className="bsetup-busy" />
                ) : (
                  <Compass size={15} />
                )}
                {pending
                  ? "Creating your roadmap…"
                  : idea.trim() !== previewedIdea
                    ? "Review updated idea"
                    : existing?.workspace.initialized
                      ? "Update project roadmap"
                      : "Create my roadmap"}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function RouteMark() {
  return <Compass size={19} aria-hidden="true" />;
}

const componentGroups: { title: string; ids: string[] }[] = [
  { title: "Project", ids: ["design", "tasks", "details"] },
  { title: "Create", ids: ["storyboard", "manuscript", "assets", "language"] },
];

export function ComponentPicker({
  catalog,
  workspace,
  onSave,
  onClose,
}: {
  catalog: BuilderCatalog;
  workspace: BuilderWorkspace;
  onSave: (ids: string[]) => Promise<void>;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(
    () => new Set(workspace.components),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const groups = useMemo(() => {
    const known = new Set(componentGroups.flatMap((group) => group.ids));
    const extra = catalog.components
      .filter((component) => !known.has(component.id))
      .map((component) => component.id);
    return [
      ...componentGroups,
      ...(extra.length ? [{ title: "More tools", ids: extra }] : []),
    ];
  }, [catalog]);
  const mode = catalog.kinds.find((kind) => kind.id === workspace.kind);
  const modeTools = mode?.recommended_components || mode?.components || [];

  useEffect(() => {
    const dialog = bodyRef.current?.closest("dialog");
    const cancel = (event: Event) => {
      if (pending) event.preventDefault();
    };
    dialog?.addEventListener("cancel", cancel);
    return () => dialog?.removeEventListener("cancel", cancel);
  }, [pending]);

  async function save() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await onSave([...selected]);
      onClose();
    } catch (error) {
      setError(messageOf(error));
    } finally {
      setPending(false);
    }
  }

  function renderComponent(component: BuilderComponent) {
    const Icon = builderIcon(component.id);
    return (
      <label className="btools-item" key={component.id}>
        <input
          type="checkbox"
          checked={selected.has(component.id)}
          disabled={pending}
          onChange={() =>
            setSelected((previous) => {
              const next = new Set(previous);
              if (next.has(component.id)) next.delete(component.id);
              else next.add(component.id);
              return next;
            })
          }
        />
        <span>
          <span className="btools-name">
            <Icon size={16} />
            {builderComponentName(component)}
          </span>
          <span className="btools-description">{component.description}</span>
          {modeTools.includes(component.id) ? (
            <span className="btools-required">Suggested for your project</span>
          ) : null}
        </span>
      </label>
    );
  }

  return (
    <Modal
      title="Your project's tools"
      onClose={() => {
        if (!pending) onClose();
      }}
      wide
    >
      <div className="btools" ref={bodyRef} aria-busy={pending}>
        <div className="btools-intro">
          <h3>Make room for what you need.</h3>
          <p>
            Choose the tools that belong in this project's sidebar. Shared
            characters, scenes, and references stay together as your idea grows.
          </p>
        </div>
        {groups.map((group) => {
          const items = sortBuilderComponents(
            catalog.components.filter((component) =>
              group.ids.includes(component.id) && (!(workspace.kind === "language" || workspace.kind === "book") || !["design", "tasks"].includes(component.id)),
            ),
          );
          return items.length ? (
            <fieldset className="btools-group" key={group.title}>
              <legend>{group.title}</legend>
              <div className="btools-grid">{items.map(renderComponent)}</div>
            </fieldset>
          ) : null;
        })}
        {error && (
          <div className="bsetup-error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        <div className="bsetup-footer">
          <span className="bsetup-footer-note">
            Hiding a tool keeps its saved content. Add it back whenever you need
            it.
          </span>
          <div className="bsetup-actions">
            <button
              className="bsetup-action"
              disabled={pending}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="bsetup-action bsetup-action-primary"
              disabled={pending}
              onClick={() => void save()}
            >
              {pending ? (
                <LoaderCircle size={15} className="bsetup-busy" />
              ) : (
                <Check size={15} />
              )}
              {pending ? "Saving tools…" : `Save ${selected.size} tools`}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
