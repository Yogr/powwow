import {
  Fragment,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CSSProperties,
  FormEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import ReactMarkdown from "react-markdown";
import {
  Archive,
  ArrowRight,
  ArrowUp,
  Box,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Copy,
  Film,
  Folder,
  Download,
  Globe,
  Info,
  Layers,
  Link2,
  LoaderCircle,
  Menu,
  Mic,
  MessageSquare,
  MoreHorizontal,
  PanelLeftClose,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Square,
  Star,
  Settings2,
  HardDrive,
  CreditCard,
  LogOut,
  PencilLine,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  ApiError,
  authenticatedBlob,
  assetUrl,
  configureAuth,
  list,
  patch,
  post,
  request,
  setToken,
  supabase,
} from "./api";
import type {
  Artifact,
  Chat,
  Grant,
  Message,
  Project,
  Run,
  IntentDecision,
} from "./api";
import {
  ArtifactThumb,
  Brand,
  bytes,
  capabilityIcons,
  capabilityNames,
  DownloadButton,
  isDemo,
  Modal,
  pretty,
  relativeTime,
  running,
  Status,
  useMediaUrl,
} from "./components";
import { ContextPanel, RunDetails } from "./Panels";
import type { Catalog } from "./Panels";
import { CreativeShowcase, promptIdeas } from "./CreativeShowcase";
import { readOperations, writeOperations } from "./operations";
import type { PendingOperation } from "./operations";
import { builderIcon, sortBuilderComponents } from "./builder";
import type {
  BuilderCatalog,
  BuilderWorkspace,
  WorkspaceEnvelope,
} from "./builder";
import { BuilderBoard, BuilderDesign } from "./BuilderBoard";
import { BuilderSetup, ComponentPicker } from "./BuilderSetup";
import { BuilderEditors } from "./BuilderEditors";
import { AssetPicker } from "./AssetPicker";
import { EntryImageActionError } from "./EntryImageControl";
import type {
  EntryImageTarget,
  ImageRecoveryAction,
} from "./EntryImageControl";
import { BuilderRefinement } from "./BuilderRefinement";
import { canLeaveBuilder } from "./builderNavigation";
import type { LanguageCatalog, LanguageProfile } from "./language";
import { PopoverMenu } from "./PopoverMenu";
import AccountSettings from "./AccountSettings";
import {
  loadAccountPreferences,
  saveAccountPreferences,
  storageReadiness,
} from "./accountPreferences";
import type { AccountPreferences } from "./accountPreferences";
import { useLocalPersistence } from "./useLocalPersistence";
import { downloadBlob } from "./localFiles";
import NewProjectDialog from "./NewProjectDialog";
import {
  ExperienceTour,
  ProjectTabs,
  ProjectThinking,
  projectComponents,
} from "./ProjectExperience";
import { ProjectUpdateNotice } from "./ProjectUpdateNotice";
import { useLanguageSpeech } from "./useLanguageSpeech";
import StorageUpgrade from "./StorageUpgrade";
import ProjectFolder, { ProjectFolderControl } from "./ProjectFolder";
import { builderViewId } from "./builder";
import { useCollaboration, openTaskChat } from "./collaboration";
import type { ProjectTask } from "./collaboration";
import { CollaborationHome, OrganizationAgents, OrganizationNav, OrganizationSettings, SharedTaskBoard, TaskContext } from "./CollaborationWorkspace";
const ModelPreview = lazy(() => import("./ModelPreview"));
const CodeReview = lazy(() => import("./CodeReview"));
const LanguageLearning = lazy(() => import("./LanguageLearning"));

const emptyCatalog: Catalog = {
  models: [],
  skills: [],
  capabilities: [],
  workflows: [],
  providers: [],
};
type Editor = {
  type: "project" | "chat";
  id?: string;
  value: string;
  instructions?: string;
};
const errorText = (error: unknown) =>
  error instanceof Error ? error.message : String(error);
const runErrorCode = (run: Run) =>
  typeof run.error === "object" && run.error ? run.error.code : "";
const uncertainRunErrors = new Set([
  "submission_uncertain",
  "cancellation_unconfirmed",
]);
const sourceRunErrors = new Set([
  "image_required",
  "image_missing",
  "source_selection_required",
  "source_too_large",
]);
const blockedRunRetries = new Set([
  ...uncertainRunErrors,
  ...sourceRunErrors,
  "workflow_unavailable",
  "quality_review_failed",
  "quality_review_required",
  "invalid_finish_plan",
]);
function canUpgradeProductionReview(run: Run) {
  const stages = run.model_provenance?.production as Record<string, {
    status?: string;
    result?: { provenance?: { policy?: { model?: string } } };
  }> | undefined;
  const stage = stages?.[String(run.settings.production_active_stage || "")];
  return run.workflow_id === "asset.production.v1" && run.attempt < 2 &&
    ["response_incomplete", "invalid_finish_plan"].includes(runErrorCode(run)) &&
    stage?.status === "completed" && stage.result?.provenance?.policy?.model === "gpt-6.1-sol";
}
function mediaPlanSteps(run: Run) {
  const intent = run.settings.experience_intent as
    { media?: { steps?: unknown; tasks?: unknown } } | undefined;
  const plan = (run.settings.task_plan || run.settings.media_plan || intent?.media) as
    { steps?: unknown; tasks?: { output_name: string; instructions: string }[] } | undefined;
  if (Array.isArray(plan?.tasks)) return plan.tasks.map(task => `${task.output_name}: ${task.instructions}`);
  return Array.isArray(plan?.steps)
    ? plan.steps.filter((step): step is string => typeof step === "string")
    : [];
}
const readPreference = (key: string, fallback: string) => {
  try {
    return localStorage.getItem(`powwow.${key}`) || fallback;
  } catch {
    return fallback;
  }
};

export default function App() {
  const [projectBudget, setProjectBudget] = useState(1);
  const [spendingLimitsEnabled, setSpendingLimitsEnabled] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]),
    [chats, setChats] = useState<Chat[]>([]),
    [messages, setMessages] = useState<Message[]>([]),
    [runs, setRuns] = useState<Run[]>([]),
    [artifacts, setArtifacts] = useState<Artifact[]>([]),
    [grants, setGrants] = useState<Grant[]>([]);
  const [, setCatalog] = useState<Catalog>(emptyCatalog),
    [projectId, setProjectId] = useState(readPreference("project", "")),
    [chatId, setChatId] = useState(readPreference("chat", ""));
  const [ready, setReady] = useState(false),
    [offline, setOffline] = useState(""),
    [loading, setLoading] = useState(true),
    [local, setLocal] = useState(true),
    [authReady, setAuthReady] = useState(false),
    [userEmail, setUserEmail] = useState(""),
    [needsLogin, setNeedsLogin] = useState(false);
  const [authRevision, setAuthRevision] = useState(0);
  const collaboration = useCollaboration(ready && !needsLogin, authRevision);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const taskNavigation = useRef(0);
  const [view, setView] = useState(new URLSearchParams(window.location.search).has("invite") ? "collab:organization" : "collab:home"),
    [mobileTab, setMobileTab] = useState("chat"),
    [sidebar, setSidebar] = useState(window.innerWidth > 800),
    [search, setSearch] = useState(""),
    [archived, setArchived] = useState(false),
    [searchOpen, setSearchOpen] = useState(false);
  const [prompt, setPrompt] = useState(""),
    [capability, setCapability] = useState("auto"),
    [attachments, setAttachments] = useState<Artifact[]>([]),
    [sending, setSending] = useState(false),
    [uploading, setUploading] = useState(false),
    [webSearch, setWebSearch] = useState(true);
  const aspect = "1:1",
    budget = projectBudget.toFixed(2);
  const intelligence = "super" as const;
  const [preferences, setPreferences] = useState<AccountPreferences | null>(
    null,
  );
  const [accountSection, setAccountSection] = useState<
    "general" | "storage" | "subscription"
  >("general");
  const [projectLinkOpen, setProjectLinkOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const newProjectAnchor = useRef<HTMLElement | null>(null);
  const [storageUpgradeOpen, setStorageUpgradeOpen] = useState(false);
  const [projectFolderOpen, setProjectFolderOpen] = useState(false);
  const addComponentsAfterCreate = useRef(false);
  const navigationVersion = useRef(0);
  const experienceNavigation = useRef(new Map<string, number>());
  const [arrivingProject, setArrivingProject] = useState("");
  const [projectChatExpanded, setProjectChatExpanded] = useState(false);
  const componentSession =
    view.startsWith("builder:") && !view.startsWith("builder:language")
      ? builderViewId(view.slice(8)).split(":")[0]
      : "";
  const componentChatName = builderCatalogName(componentSession);
  const [sessionReadyFor, setSessionReadyFor] = useState("");
  const [sessionError, setSessionError] = useState("");
  const [sessionRevision, setSessionRevision] = useState(0);
  const [understanding, setUnderstanding] = useState(false);
  const [intentFeedback, setIntentFeedback] = useState<{
    kind: "image" | "unavailable";
    capability: string;
    summary: string;
  } | null>(null);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(
      null,
    ),
    [outputOpen, setOutputOpen] = useState(true),
    [outputTab, setOutputTab] = useState("preview"),
    [accountOpen, setAccountOpen] = useState(false),
    [contextOpen, setContextOpen] = useState(false),
    [editor, setEditor] = useState<Editor | null>(null),
    [menu, setMenu] = useState<string | null>(null),
    [moveChat, setMoveChat] = useState<Chat | null>(null),
    [toast, setToast] = useState(""),
    [error, setError] = useState("");
  const [detailsRun, setDetailsRun] = useState<Run | null>(null);
  const [builderCatalog, setBuilderCatalog] = useState<BuilderCatalog>({
    kinds: [],
    components: [],
  });
  const [projectWorkspace, setProjectWorkspace] =
    useState<WorkspaceEnvelope | null>(null);
  const [workspaceError, setWorkspaceError] = useState("");
  const [workspaceReload, setWorkspaceReload] = useState(0);
  const [languageProfiles, setLanguageProfiles] = useState<LanguageProfile[]>(
    [],
  );
  const [profilesReadyFor, setProfilesReadyFor] = useState("");
  const [languageCatalog, setLanguageCatalog] = useState<LanguageCatalog>({
    languages: [],
    levels: [],
  });
  const [languageReload, setLanguageReload] = useState(0);
  const [builderSetup, setBuilderSetup] = useState<{
    prompt: string;
    kind?: string;
    explicit: boolean;
    projectId?: string;
  } | null>(null);
  const [componentPicker, setComponentPicker] = useState(false);
  const [assetPicker, setAssetPicker] = useState<"all" | "image" | null>(null);
  const assetAttachFlight = useRef(false);
  const workspaceFlight = useRef(false);
  const [outputWidth, setOutputWidth] = useState(
    Number(readPreference("outputWidth", "48")),
  );
  const [pendingOperations, setPendingOperations] = useState<
    PendingOperation[]
  >([]);
  const [busyOperationKeys, setBusyOperationKeys] = useState<string[]>([]);
  const operationScope = useRef("local");
  const operationsRef = useRef<PendingOperation[]>([]);
  const operationFlights = useRef(new Set<string>());
  const fileRef = useRef<HTMLInputElement>(null),
    composerRef = useRef<HTMLTextAreaElement>(null),
    bottomRef = useRef<HTMLDivElement>(null),
    selectedChatRef = useRef(chatId),
    selectedProjectRef = useRef(projectId),
    submissionRef = useRef(false),
    loadedMessageCount = useRef(0);
  const project = projects.find((p) => p.id === projectId),
    chat = chats.find((c) => c.id === chatId),
    chatRuns = runs.filter((r) => r.chat_id === chatId),
    activeRun = chatRuns.find((r) => running(r.status)),
    lastRun = chatRuns[0],
    activeArtifacts = artifacts.filter((a) => a.chat_id === chatId),
    currentArtifact = selectedArtifact
      ? artifacts.find((a) => a.id === selectedArtifact.id) || selectedArtifact
      : activeArtifacts[0];
  const showOutput = outputOpen && Boolean(currentArtifact) && view === "chat";
  const sessionReady =
    !componentSession ||
    (sessionReadyFor === `${projectId}:${componentSession}` &&
      chats.some(
        (item) =>
          item.id === chatId &&
          item.project_id === projectId &&
          item.component_id === componentSession,
      ));
  function builderCatalogName(id: string) {
    return (
      (
        {
          design: "Blueprint",
          tasks: "Task Board",
          details: "Project Details",
          storyboard: "Storyboard",
          manuscript: "Book & Script Editor",
          assets: "Asset Library",
        } as Record<string, string>
      )[id] || "Component"
    );
  }
  const draftScope = `${operationScope.current}:${projectId}:${componentSession || `chat:${chatId}`}`;
  const draftValues = useRef({ prompt, attachments, capability });
  const sessionDrafts = useRef(new Map<string, typeof draftValues.current>());
  const previousDraftScope = useRef(draftScope);
  if (previousDraftScope.current === draftScope)
    draftValues.current = { prompt, attachments, capability };
  useEffect(() => {
    if (previousDraftScope.current === draftScope) return;
    sessionDrafts.current.set(previousDraftScope.current, draftValues.current);
    const draft = sessionDrafts.current.get(draftScope);
    setPrompt(draft?.prompt || "");
    setAttachments(draft?.attachments || []);
    setCapability(draft?.capability || "auto");
    setIntentFeedback(null);
    setProjectChatExpanded(false);
    previousDraftScope.current = draftScope;
  }, [draftScope]);
  useEffect(() => {
    if (!ready || needsLogin || !projectId || !componentSession) return;
    let active = true;
    setSessionReadyFor("");
    setSessionError("");
    setMessages([]);
    selectedChatRef.current = "";
    setChatId("");
    void request<Chat>(
      `/v1/projects/${projectId}/components/${componentSession}/chat`,
      { method: "PUT" },
    )
      .then((session) => {
        if (!active) return;
        setChats((items) => [
          session,
          ...items.filter((item) => item.id !== session.id),
        ]);
        selectedChatRef.current = session.id;
        setChatId(session.id);
        setSessionReadyFor(`${projectId}:${componentSession}`);
      })
      .catch((value) => {
        if (active) setSessionError(errorText(value));
      });
    return () => {
      active = false;
    };
  }, [ready, needsLogin, projectId, componentSession, sessionRevision]);
  const speech = useLanguageSpeech({
    onTranscript: (text) => {
      setPrompt(
        (draft) => `${draft}${draft && !/\s$/.test(draft) ? " " : ""}${text}`,
      );
      setIntentFeedback(null);
    },
  });
  useEffect(() => {
    speech.abortListening();
    speech.clearError();
  }, [
    projectId,
    chatId,
    view,
    needsLogin,
    speech.abortListening,
    speech.clearError,
  ]);
  const completedProjectRuns = runs
    .filter((run) => run.project_id === projectId && run.status === "succeeded")
    .map(
      (run) =>
        `${run.id}:${(run.model_provenance.project_update as { status?: string } | undefined)?.status || ""}`,
    )
    .join(",");
  const experienceWelcome = runs.find(
    (run) => run.project_id === projectId && run.settings?.experience_intro,
  );
  useEffect(() => {
    const completed = runs.find(
      (run) =>
        run.chat_id === chatId &&
        run.status === "succeeded" &&
        run.settings?.experience_ready &&
        run.settings?.experience_destination &&
        experienceNavigation.current.has(run.id),
    );
    if (!completed) return;
    const origin = experienceNavigation.current.get(completed.id);
    experienceNavigation.current.delete(completed.id);
    if (origin !== navigationVersion.current || !canLeaveBuilder()) return;
    const originProject = selectedProjectRef.current;
    void Promise.all([
      request<WorkspaceEnvelope>(
        `/v1/projects/${completed.project_id}/workspace`,
      ),
      request<Project>(`/v1/projects/${completed.project_id}`),
    ])
      .then(([envelope, destination]) => {
        if (
          origin !== navigationVersion.current ||
          selectedProjectRef.current !== originProject
        )
          return;
        selectedProjectRef.current = destination.id;
        setProjectId(destination.id);
        setProjects((items) => [
          destination,
          ...items.filter((item) => item.id !== destination.id),
        ]);
        setProjectWorkspace(envelope);
        setLanguageReload((value) => value + 1);
        setArrivingProject(destination.id);
        setView(
          `builder:${builderViewId(String(completed.settings.experience_destination))}`,
        );
        setMobileTab("chat");
      })
      .catch((reportError) => setError(errorText(reportError)));
  }, [runs, chatId, projectId]);
  useEffect(() => {
    if (!arrivingProject) return;
    const timer = window.setTimeout(
      () => setArrivingProject(""),
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1800,
    );
    return () => window.clearTimeout(timer);
  }, [arrivingProject]);
  const streamingRun = chatRuns.find(
    (run) =>
      run.capability === "chat" &&
      run.output_text &&
      !messages.some(
        (message) => message.role === "assistant" && message.run_id === run.id,
      ),
  );
  const notify = useCallback((message: string) => setToast(message), []);
  const reportError = useCallback((message: string) => setError(message), []);
  const effectivePreferences = useMemo(
    () =>
      preferences
        ? {
            ...preferences,
            storage_mode: project?.storage_mode || preferences.storage_mode,
          }
        : null,
    [preferences, project?.storage_mode],
  );
  const localFiles = useLocalPersistence({
    accountId: operationScope.current,
    preferences: effectivePreferences,
    mirrorCloud: true,
    artifacts,
    project,
    enabled: ready && !needsLogin && (!project || Boolean(projectWorkspace)),
    metadata: {
      details: project,
      workspace: projectWorkspace?.workspace,
      chats: chats.filter((item) => item.project_id === projectId),
    },
  });
  function openAccount(section: "general" | "storage" | "subscription") {
    setAccountSection(section);
    setAccountOpen(true);
  }
  function ensureStorage() {
    if (localFiles.ready) return true;
    setProjectLinkOpen(false);
    if (project) setProjectFolderOpen(true);
    else openAccount("storage");
    return false;
  }
  function openNewProject(forComponents = false, anchor?: HTMLElement) {
    if (!canLeaveBuilder()) return;
    newProjectAnchor.current =
      anchor ||
      (document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null);
    addComponentsAfterCreate.current = forComponents;
    setProjectLinkOpen(false);
    setNewProjectOpen(true);
  }
  useEffect(() => {
    const upgrade = () => setStorageUpgradeOpen(true);
    window.addEventListener("powwow-storage-upgrade", upgrade);
    return () => window.removeEventListener("powwow-storage-upgrade", upgrade);
  }, []);
  function restoreOperations(scope: string) {
    if (operationScope.current !== scope) sessionDrafts.current.clear();
    operationScope.current = scope;
    operationsRef.current = readOperations(scope);
    setPendingOperations(operationsRef.current);
  }
  function saveOperations(operations: PendingOperation[]) {
    writeOperations(operationScope.current, operations);
    operationsRef.current = operations;
    setPendingOperations(operations);
  }
  function removeOperation(operation: PendingOperation) {
    if (operation.scope === operationScope.current)
      saveOperations(
        operationsRef.current.filter((item) => item.key !== operation.key),
      );
    else
      writeOperations(
        operation.scope,
        readOperations(operation.scope).filter(
          (item) => item.key !== operation.key,
        ),
      );
  }
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 800px)");
    const collapse = (event: MediaQueryListEvent) => {
      if (event.matches) setSidebar(false);
    };
    media.addEventListener("change", collapse);
    return () => media.removeEventListener("change", collapse);
  }, []);
  useEffect(() => {
    selectedChatRef.current = chatId;
    localStorage.setItem("powwow.chat", chatId);
  }, [chatId]);
  useEffect(() => {
    selectedProjectRef.current = projectId;
    localStorage.setItem("powwow.project", projectId);
  }, [projectId]);
  useEffect(() => {
    const input = composerRef.current;
    if (!input) return;
    input.style.height = "auto";
    if (!messages.length)
      input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
  }, [prompt, messages.length, view, ready]);
  useEffect(() => {
    localStorage.setItem("powwow.outputWidth", String(outputWidth));
  }, [outputWidth]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        setSearchOpen(true);
        setSidebar(true);
      }
      if (event.key === "Escape") {
        setMenu(null);
        setError("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const refresh = useCallback(async () => {
    const account = operationScope.current;
    const [p, c, r, a] = await Promise.all([
      request<Project[]>("/v1/projects"),
      request<Chat[]>("/v1/chats"),
      request<Run[]>("/v1/runs"),
      request<Artifact[]>("/v1/artifacts"),
    ]);
    if (operationScope.current !== account) return;
    setProjects(list(p));
    setChats(list(c));
    setRuns(list(r).sort((a, b) => b.created_at.localeCompare(a.created_at)));
    setArtifacts(
      list(a).sort((a, b) => b.created_at.localeCompare(a.created_at)),
    );
    setOffline("");
    if (selectedProjectRef.current) {
      const destination = selectedProjectRef.current;
      const data = await request<Grant[]>(
        `/v1/context-grants?destination_project_id=${destination}`,
      );
      if (operationScope.current !== account) return;
      if (selectedProjectRef.current === destination) setGrants(list(data));
      const envelope = await request<WorkspaceEnvelope>(
        `/v1/projects/${destination}/workspace`,
      );
      if (operationScope.current === account && selectedProjectRef.current === destination)
        setProjectWorkspace((current) =>
          current && current.version > envelope.version ? current : envelope,
        );
    }
  }, []);
  const loadMessages = useCallback(async (id: string) => {
    if (!id) {
      setMessages([]);
      return;
    }
    const data = await request<Message[]>(`/v1/chats/${id}/messages`);
    if (selectedChatRef.current === id) setMessages(list(data));
  }, []);
  useEffect(() => {
    let alive = true;
    let subscription: { unsubscribe: () => void } | undefined;
    request<{
      auth_mode: string;
      supabase_url?: string;
      supabase_anon_key?: string;
      max_run_budget_usd?: number;
      spending_limits_enabled?: boolean;
    }>("/v1/config")
      .then(async (config) => {
        if (!alive) return;
        setSpendingLimitsEnabled(config.spending_limits_enabled !== false);
        if (
          typeof config.max_run_budget_usd === "number" &&
          config.max_run_budget_usd > 0
        )
          setProjectBudget(config.max_run_budget_usd);
        setLocal(config.auth_mode === "local");
        if (config.auth_mode === "local") restoreOperations("local");
        if (config.auth_mode === "supabase") {
          const client = configureAuth(
            config.supabase_url,
            config.supabase_anon_key,
          );
          if (!client)
            throw new Error(
              "Supabase authentication is enabled, but its public configuration is missing.",
            );
          const { data } = await client.auth.getSession();
          restoreOperations(
            data.session ? `user:${data.session.user.id}` : "signed-out",
          );
          setToken(data.session?.access_token || null);
          setUserEmail(data.session?.user.email || "");
          setNeedsLogin(!data.session);
          selectedProjectRef.current = "";
          selectedChatRef.current = "";
          setProjectId("");
          setChatId("");
          let accountId = data.session?.user.id;
          subscription = client.auth.onAuthStateChange((_event, session) => {
            if (accountId !== session?.user.id) {
              accountId = session?.user.id;
              setAuthRevision((value) => value + 1);
              restoreOperations(
                session ? `user:${session.user.id}` : "signed-out",
              );
              setReady(false);
              setProjects([]);
              setChats([]);
              setMessages([]);
              setRuns([]);
              setArtifacts([]);
              setGrants([]);
              setSelectedArtifact(null);
              setAttachments([]);
              setPrompt("");
              setDetailsRun(null);
              setProjectWorkspace(null);
              setBuilderSetup(null);
              setComponentPicker(false);
              setWorkspaceError("");
              setIntentFeedback(null);
              setView(new URLSearchParams(window.location.search).has("invite") ? "collab:organization" : "collab:home");
              setSelectedTask(null);
              taskNavigation.current += 1;
              setMobileTab("chat");
              setAccountOpen(false);
              setContextOpen(false);
              setEditor(null);
              setNewProjectOpen(false);
              setStorageUpgradeOpen(false);
              setMoveChat(null);
              setArchived(false);
              setSearch("");
              setSearchOpen(false);
              setCapability("auto");
              setWebSearch(true);
              setPreferences(null);
              selectedProjectRef.current = "";
              selectedChatRef.current = "";
              setProjectId("");
              setChatId("");
            }
            setToken(session?.access_token || null);
            setUserEmail(session?.user.email || "");
            setNeedsLogin(!session);
            setAuthReady(true);
          }).data.subscription;
        }
        setAuthReady(true);
      })
      .catch((e) => {
        if (alive) {
          setOffline(errorText(e));
          setLoading(false);
        }
      });
    return () => {
      alive = false;
      subscription?.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!authReady || needsLogin) return;
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        await refresh();
        if (!alive) return;
        const data = await request<Catalog>("/v1/catalog");
        if (!alive) return;
        setCatalog({ ...emptyCatalog, ...data });
        const allProjects = await request<Project[]>("/v1/projects");
        const allChats = await request<Chat[]>("/v1/chats");
        if (!alive) return;
        const savedChat = allChats.find(
          (c) => c.id === selectedChatRef.current && !c.archived,
        );
        const savedProject = allProjects.find(
          (p) =>
            p.id === (savedChat?.project_id || selectedProjectRef.current) &&
            !p.archived,
        );
        const destination = savedProject?.id || "";
        setProjectId(destination);
        selectedProjectRef.current = destination;
        if (savedChat?.component_id && savedProject)
          setView(`builder:${savedChat.component_id}`);
        if (!savedChat || (savedChat.project_id && !savedProject)) {
          setChatId("");
          selectedChatRef.current = "";
        }
        if (alive) {
          setReady(true);
          setLoading(false);
        }
      } catch (e) {
        if (alive) {
          setOffline(errorText(e));
          setLoading(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [authReady, authRevision, needsLogin, refresh]);
  useEffect(() => {
    if (!ready) return;
    setMessages([]);
    loadedMessageCount.current = 0;
    loadMessages(chatId).catch((e) => setOffline(errorText(e)));
    setSelectedArtifact(null);
  }, [chatId, ready, loadMessages]);
  useEffect(() => {
    if (!ready || !projectId) {
      setGrants([]);
      return;
    }
    request<Grant[]>(`/v1/context-grants?destination_project_id=${projectId}`)
      .then(setGrants)
      .catch((e) => reportError(errorText(e)));
  }, [projectId, ready, reportError]);
  useEffect(() => {
    if (!ready || needsLogin) return;
    const controller = new AbortController();
    loadAccountPreferences(operationScope.current, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setPreferences(value);
      })
      .catch((e) => {
        if (!controller.signal.aborted) reportError(errorText(e));
      });
    return () => controller.abort();
  }, [ready, needsLogin, reportError]);
  useEffect(() => {
    if (!ready || needsLogin) return;
    let alive = true;
    request<BuilderCatalog>("/v1/builder/catalog")
      .then((data) => {
        if (alive) setBuilderCatalog(data);
      })
      .catch((e) => {
        if (alive) setWorkspaceError(errorText(e));
      });
    return () => {
      alive = false;
    };
  }, [ready, needsLogin, workspaceReload]);
  useEffect(() => {
    setProjectWorkspace(null);
    setWorkspaceError("");
  }, [projectId, ready, needsLogin]);
  useEffect(() => {
    if (!ready || needsLogin || !projectId) return;
    let alive = true;
    request<WorkspaceEnvelope>(`/v1/projects/${projectId}/workspace`)
      .then((data) => {
        if (alive)
          setProjectWorkspace((current) =>
            current && current.version > data.version ? current : data,
          );
      })
      .catch((e) => {
        if (alive) setWorkspaceError(errorText(e));
      });
    return () => {
      alive = false;
    };
  }, [projectId, ready, needsLogin, workspaceReload, completedProjectRuns]);
  useEffect(() => {
    if (
      !ready ||
      needsLogin ||
      !builderCatalog.components.some((item) => item.id === "language")
    )
      return;
    let alive = true;
    request<LanguageCatalog>("/v1/languages/catalog")
      .then((data) => {
        if (alive) setLanguageCatalog(data);
      })
      .catch((e) => {
        if (alive) reportError(errorText(e));
      });
    return () => {
      alive = false;
    };
  }, [ready, needsLogin, builderCatalog, reportError]);
  useEffect(() => {
    setLanguageProfiles([]);
    setProfilesReadyFor("");
    if (
      !ready ||
      needsLogin ||
      !projectId ||
      !builderCatalog.components.some((item) => item.id === "language")
    )
      return;
    let alive = true;
    request<LanguageProfile[]>(`/v1/projects/${projectId}/language/profiles`)
      .then((data) => {
        if (alive) {
          setLanguageProfiles(data);
          setProfilesReadyFor(projectId);
        }
      })
      .catch((e) => {
        if (alive) reportError(errorText(e));
      });
    return () => {
      alive = false;
    };
  }, [
    projectId,
    ready,
    needsLogin,
    builderCatalog,
    languageReload,
    reportError,
  ]);
  const languageName = (code: string) =>
    languageCatalog.languages.find((item) => item.code === code)?.name || code;
  function refreshLanguageProfiles(createdProfileId?: string) {
    const destination = projectId;
    if (createdProfileId) setView(`builder:language:${createdProfileId}`);
    setLanguageReload((value) => value + 1);
    request<WorkspaceEnvelope>(`/v1/projects/${destination}/workspace`)
      .then((data) => {
        if (selectedProjectRef.current === destination)
          setProjectWorkspace(data);
      })
      .catch((e) => reportError(errorText(e)));
  }
  async function saveWorkspace(workspace: BuilderWorkspace) {
    if (!projectWorkspace || !projectId)
      throw new Error("Open the project again before saving.");
    if (project?.archived)
      throw new Error("Restore this project before editing its tools.");
    if (workspaceFlight.current)
      throw new Error(
        "Your previous change is still saving. Try again in a moment.",
      );
    workspaceFlight.current = true;
    const destination = projectId;
    try {
      const saved = await request<WorkspaceEnvelope>(
        `/v1/projects/${destination}/workspace`,
        {
          method: "PUT",
          body: JSON.stringify({
            version: projectWorkspace.version,
            workspace,
          }),
        },
      );
      if (selectedProjectRef.current === destination)
        setProjectWorkspace(saved);
    } finally {
      workspaceFlight.current = false;
    }
  }
  function openProjectTool(component: string) {
    if (!canLeaveBuilder()) return;
    taskNavigation.current += 1;
    setSelectedTask(null);
    speech.abortListening();
    speech.clearError();
    navigationVersion.current += 1;
    setView(component === "tasks" && project?.organization_id ? "collab:board" : `builder:${builderViewId(component)}`);
    setMobileTab("chat");
    setMenu(null);
    if (window.innerWidth < 800) setSidebar(false);
  }
  function askFromBuilder(text: string) {
    if (componentSession) {
      setPrompt(text);
      setCapability("chat");
      setProjectChatExpanded(true);
      setTimeout(() => composerRef.current?.focus(), 0);
      return;
    }
    selectedChatRef.current = "";
    setChatId("");
    setView("chat");
    setMobileTab("chat");
    setSelectedArtifact(null);
    setAttachments([]);
    setIntentFeedback(null);
    setWebSearch(true);
    setPrompt(text);
    setCapability("chat");
    if (window.innerWidth < 800) setSidebar(false);
    setTimeout(() => composerRef.current?.focus(), 0);
  }
  async function completeBuilderSetup(envelope: WorkspaceEnvelope) {
    const firstPlan = !projectWorkspace?.workspace.initialized;
    const original = builderSetup?.prompt || envelope.workspace.plan_prompt;
    setProjectWorkspace(envelope);
    setBuilderSetup(null);
    setPrompt("");
    setView(
      envelope.workspace.kind === "language"
        ? "builder:language"
        : envelope.workspace.kind === "book"
          ? "builder:plot"
          : `builder:${envelope.workspace.components[0] || "design"}`,
    );
    setMobileTab("chat");
    setArrivingProject(projectId);
    if (original && !chats.some((item) => item.project_id === projectId)) {
      try {
        const created = await post<Chat>("/v1/chats", {
          project_id: projectId,
          title: "Create the project",
          context_mode: project?.context_mode || "project",
        });
        await post(`/v1/chats/${created.id}/messages`, {
          content: original,
          attachment_ids: [],
        });
        await refresh();
      } catch (e) {
        reportError(
          `Your roadmap is saved. The project chat could not be created: ${errorText(e)}`,
        );
      }
    }
    if (firstPlan && envelope.workspace.kind !== "language") {
      try {
        await startPlanRefinement();
      } catch (e) {
        reportError(
          `Your starter roadmap is saved. AI planning needs another try: ${errorText(e)}`,
        );
      }
    }
  }
  async function startPlanRefinement() {
    if (!projectId) return;
    if (operationsRef.current.length)
      throw new Error(
        "Recover the pending request before starting another planning pass.",
      );
    const key = crypto.randomUUID();
    const operation: PendingOperation = {
      key,
      scope: operationScope.current,
      kind: "refinement",
      path: `/v1/projects/${projectId}/plan-refinement`,
      chatId: "",
      prompt: "Deepen the project plan",
      createdAt: new Date().toISOString(),
      body: { budget_usd: Number(budget), idempotency_key: key },
    };
    saveOperations([...operationsRef.current, operation]);
    await executeOperation(operation);
    await refresh();
  }
  useEffect(() => {
    if (!ready || needsLogin) return;
    let busy = false;
    const timer = setInterval(
      async () => {
        if (busy) return;
        busy = true;
        try {
          await refresh();
          await loadMessages(selectedChatRef.current);
        } catch (e) {
          setOffline(errorText(e));
        } finally {
          busy = false;
        }
      },
      activeRun ? 1500 : 6000,
    );
    return () => clearInterval(timer);
  }, [ready, needsLogin, activeRun?.id, refresh, loadMessages]);
  useEffect(() => {
    if (messages.length !== loadedMessageCount.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      loadedMessageCount.current = messages.length;
    }
  }, [messages.length]);

  function selectProject(id: string) {
    if (!canLeaveBuilder()) return;
    taskNavigation.current += 1;
    setSelectedTask(null);
    const destinationProject = projects.find(item => item.id === id);
    if (destinationProject?.organization_id) collaboration.setOrganizationId(destinationProject.organization_id);
    speech.abortListening();
    speech.clearError();
    navigationVersion.current += 1;
    if (id !== projectId) {
      setProjectWorkspace(null);
      setLanguageProfiles([]);
    }
    selectedProjectRef.current = id;
    setProjectId(id);
    setChatId("");
    selectedChatRef.current = "";
    setMessages([]);
    setPrompt("");
    setCapability("auto");
    setIntentFeedback(null);
    setView(destinationProject?.organization_id ? "collab:board" : "chat");
    setBuilderSetup(null);
    setComponentPicker(false);
    setMobileTab("chat");
    setSelectedArtifact(null);
    setMenu(null);
    setAttachments([]);
    if (window.innerWidth < 800) setSidebar(false);
  }
  function navigateCollaboration(destination: string) {
    if (!canLeaveBuilder()) return;
    taskNavigation.current += 1;
    setSelectedTask(null);
    speech.abortListening();
    setView(destination);
    setBuilderSetup(null);
    setComponentPicker(false);
    if (window.innerWidth < 800) setSidebar(false);
  }
  function switchOrganization(id: string) {
    if (!canLeaveBuilder()) return;
    selectProject("");
    collaboration.setOrganizationId(id);
    navigateCollaboration("collab:home");
  }
  async function selectTask(task: ProjectTask) {
    if (!canLeaveBuilder()) return;
    if (collaboration.organizations.find(item => item.id === task.organization_id)?.role === "viewer") {
      selectProject(task.project_id);
      setSelectedTask(task);
      setView("collab:task");
      return;
    }
    const version = ++taskNavigation.current;
    try {
      const session = await openTaskChat(task.id);
      if (version !== taskNavigation.current) return;
      setChats(items => [session, ...items.filter(item => item.id !== session.id)]);
      selectChat(session);
      collaboration.setOrganizationId(task.organization_id);
      setSelectedTask(task);
      setView("chat");
    } catch (error) { if (version === taskNavigation.current) reportError(errorText(error)); }
  }
  function selectChat(value: Chat) {
    if (!canLeaveBuilder()) return;
    taskNavigation.current += 1;
    setSelectedTask(null);
    speech.abortListening();
    speech.clearError();
    navigationVersion.current += 1;
    if (value.project_id !== projectId) {
      setProjectWorkspace(null);
      setLanguageProfiles([]);
    }
    selectedProjectRef.current = value.project_id || "";
    setBuilderSetup(null);
    setComponentPicker(false);
    setProjectId(value.project_id || "");
    selectedChatRef.current = value.id;
    setChatId(value.id);
    setView(value.component_id ? `builder:${value.component_id}` : "chat");
    setMobileTab("chat");
    setSelectedArtifact(null);
    setAttachments([]);
    setMenu(null);
    if (window.innerWidth < 800) setSidebar(false);
  }
  function newChat(standalone = false) {
    if (!canLeaveBuilder()) return;
    taskNavigation.current += 1;
    setSelectedTask(null);
    speech.abortListening();
    speech.clearError();
    navigationVersion.current += 1;
    if (standalone) {
      setProjectId("");
      selectedProjectRef.current = "";
      setProjectWorkspace(null);
      setLanguageProfiles([]);
    }
    selectedChatRef.current = "";
    setChatId("");
    setView("chat");
    setMobileTab("chat");
    setSelectedArtifact(null);
    setPrompt("");
    setAttachments([]);
    setCapability("auto");
    setIntentFeedback(null);
    setWebSearch(true);
    if (window.innerWidth < 800) setSidebar(false);
    setTimeout(() => composerRef.current?.focus(), 0);
  }
  async function saveEditor(event: FormEvent) {
    event.preventDefault();
    if (!editor?.value.trim()) return;
    try {
      if (editor.id) {
        await patch(
          `/v1/${editor.type === "project" ? "projects" : "chats"}/${editor.id}`,
          editor.type === "project"
            ? {
                name: editor.value.trim(),
                instructions: editor.instructions || "",
              }
            : { title: editor.value.trim() },
        );
      } else {
        if (!ensureStorage()) return;
        const p = await post<Project>("/v1/projects", {
          name: editor.value.trim(),
          instructions: editor.instructions || "",
          context_mode: "project",
        });
        selectProject(p.id);
        if (addComponentsAfterCreate.current) {
          setComponentPicker(true);
          addComponentsAfterCreate.current = false;
        }
      }
      await refresh();
      setEditor(null);
      notify("Saved to your workspace");
    } catch (e) {
      reportError(errorText(e));
    }
  }
  async function archiveItem(type: string, id: string, restore = false) {
    try {
      await patch(`/v1/${type}/${id}`, { archived: !restore });
      await refresh();
      setMenu(null);
      if (type === "chats" && chatId === id) newChat();
      notify(
        restore
          ? "Restored to your workspace"
          : "Archived. Find it in Archive to restore it.",
      );
    } catch (e) {
      reportError(errorText(e));
    }
  }
  async function upload(files: FileList | null) {
    if (!files?.length || uploading || sending) return;
    if (attachments.length + files.length > 8) {
      reportError("Attach up to 8 files per request.");
      return;
    }
    setUploading(true);
    const origin = navigationVersion.current;
    const scope = operationScope.current;
    try {
      for (const file of Array.from(files)) {
        if (file.size > 50 * 1024 * 1024)
          throw new Error(`${file.name} is larger than 50 MB.`);
        const data = new FormData();
        const extension = file.name.split(".").pop()?.toLowerCase();
        const mime =
          extension === "glb"
            ? "model/gltf-binary"
            : ["txt", "md", "csv"].includes(extension || "")
              ? "text/plain"
              : file.type;
        data.append("file", new File([file], file.name, { type: mime }));
        if (project) data.append("project_id", project.id);
        if (chatId) data.append("chat_id", chatId);
        const a = await request<Artifact>("/v1/uploads", {
          method: "POST",
          body: data,
        });
        if (scope !== operationScope.current) return;
        if (origin === navigationVersion.current)
          setAttachments((current) => [...current, a]);
      }
      await refresh();
    } catch (e) {
      reportError(errorText(e));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  async function uploadEntryImage(file: File): Promise<Artifact> {
    if (!project || !sessionReady)
      throw new Error("Wait for this component to open before uploading.");
    if (file.size > 50 * 1024 * 1024)
      throw new Error("Choose an image smaller than 50 MB.");
    const data = new FormData();
    data.append("file", file);
    data.append("project_id", project.id);
    if (chatId) data.append("chat_id", chatId);
    const artifact = await request<Artifact>("/v1/uploads", {
      method: "POST",
      body: data,
    });
    setArtifacts((items) => [
      artifact,
      ...items.filter((item) => item.id !== artifact.id),
    ]);
    return artifact;
  }
  function editProject(value: Project) {
    setEditor({
      type: "project",
      id: value.id,
      value: value.name,
      instructions: value.instructions,
    });
    setMenu(null);
  }
  function configureRunStorage(run: Run) {
    if (!run.project_id) {
      setAccountSection("storage");
      setAccountOpen(true);
      return;
    }
    const destination = projects.find((item) => item.id === run.project_id);
    if (destination) editProject(destination);
    else
      reportError(
        "This project is unavailable. Reopen the project to change its folder.",
      );
  }
  function chooseRunImage(run: Run) {
    if (run.chat_id !== chatId || sending || uploading || activeRun) return;
    setPrompt((current) => (current.trim() ? current : run.prompt));
    setCapability("auto");
    setIntentFeedback(null);
    if (
      run.project_id &&
      run.project_id === projectId &&
      artifacts.some(
        (item) =>
          item.project_id === projectId && item.mime_type.startsWith("image/"),
      )
    )
      setAssetPicker("image");
    else fileRef.current?.click();
  }
  async function projectFolderChanged(id: string) {
    const destination = projects.find((item) => item.id === id);
    if (
      (destination?.storage_mode || preferences?.storage_mode) === "unselected"
    ) {
      const saved = await patch<Project>(`/v1/projects/${id}`, {
        storage_mode: "local",
      });
      setProjects((items) =>
        items.map((item) => (item.id === saved.id ? saved : item)),
      );
    }
    localFiles.retry();
  }
  function resolveImageIssue(action: ImageRecoveryAction) {
    if (action === "project-settings" && project) editProject(project);
    else if (action === "recover-request" && operationsRef.current[0])
      void recoverOperation(operationsRef.current[0]);
    else if (action === "current-request" && activeRun)
      setDetailsRun(activeRun);
    else if (action === "component-session")
      setSessionRevision((value) => value + 1);
  }
  async function generateEntryImage(
    text: string,
    target: EntryImageTarget,
  ): Promise<Run> {
    if (!project || !sessionReady || !chatId)
      throw new EntryImageActionError(
        "The component chat is not connected.",
        "component-session",
      );
    if (submissionRef.current || activeRun)
      throw new EntryImageActionError(
        "A request is already running.",
        "current-request",
      );
    if (operationsRef.current.length)
      throw new EntryImageActionError(
        "The previous request needs confirmation.",
        "recover-request",
      );
    submissionRef.current = true;
    setSending(true);
    const scope = operationScope.current,
      id = chatId;
    try {
      const storage =
        effectivePreferences &&
        (await storageReadiness(scope, effectivePreferences, project.id));
      if (!storage?.ready)
        throw new EntryImageActionError(
          "Select a project folder to generate images.",
          "project-settings",
        );
      if (scope !== operationScope.current)
        throw new Error("Your account changed. Reopen this entry to continue.");
      const message = await post<Message>(`/v1/chats/${id}/messages`, {
        content: text,
        attachment_ids: [],
      });
      if (scope !== operationScope.current)
        throw new Error("Your account changed. Reopen this entry to continue.");
      if (selectedChatRef.current === id)
        setMessages((items) => [...items, message]);
      const key = crypto.randomUUID();
      const operation: PendingOperation = {
        key,
        scope,
        kind: "run",
        path: "/v1/runs",
        chatId: id,
        prompt: text,
        createdAt: new Date().toISOString(),
        body: {
          chat_id: id,
          message_id: message.id,
          capability: "text_to_image",
          attachment_ids: [],
          settings: {
            aspect_ratio: "1:1",
            quality: "standard",
            intelligence: "basic",
            web_search: false,
            entry_image: target,
            media_budget_usd: projectBudget,
          },
          budget_usd: projectBudget,
          idempotency_key: key,
        },
      };
      saveOperations([...operationsRef.current, operation]);
      try {
        return await executeOperation(operation);
      } catch (error) {
        if (operationsRef.current.some((item) => item.key === key))
          throw new EntryImageActionError(
            "Could not confirm image generation.",
            "recover-request",
          );
        throw error;
      }
    } finally {
      submissionRef.current = false;
      setSending(false);
    }
  }
  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (
      !prompt.trim() ||
      submissionRef.current ||
      activeRun ||
      speech.listening ||
      !sessionReady
    )
      return;
    speech.abortListening();
    if (operationsRef.current.length) {
      reportError(
        "Recover the previous request before submitting another. Its original settings have been saved.",
      );
      return;
    }
    submissionRef.current = true;
    setSending(true);
    setUnderstanding(true);
    setIntentFeedback(null);
    setError("");
    const text = prompt.trim();
    const origin = navigationVersion.current;
    const scope = operationScope.current;
    const stillHere = () =>
      origin === navigationVersion.current && scope === operationScope.current;
    try {
      const destinationProject = project;
      const decision = await post<IntentDecision>("/v1/intent", {
        project_id: destinationProject?.id,
        prompt: text,
        attachment_ids: attachments.map((item) => item.id),
        capability,
        intelligence,
        allow_web_search: webSearch,
      });
      if (!stillHere()) return;
      setUnderstanding(false);
      if (decision.capability !== "chat" && !ensureStorage()) return;
      if (!decision.available) {
        const descriptions: Record<string, string> = {
          image_to_video:
            "Video creation isn’t available yet. We can still help you shape the scene, script, and motion plan.",
          image_to_3d:
            "3D creation isn’t available yet. We can still help you develop an asset brief and a reference image.",
          text_to_image:
            "Image creation isn’t available right now. Your description is saved here.",
          chat: "We can’t complete this request right now. Your draft is saved here.",
        };
        setIntentFeedback({
          kind: "unavailable",
          capability: decision.capability,
          summary:
            descriptions[decision.capability] ||
            "This outcome isn’t available yet. Your draft is saved here.",
        });
        return;
      }
      if (decision.needs_image) {
        setIntentFeedback({
          kind: "image",
          capability: decision.capability,
          summary: "Add the image you’d like to use as a reference.",
        });
        return;
      }
      let id = chatId;
      if (!id) {
        const created = await post<Chat>("/v1/chats", {
          project_id: destinationProject?.id || null,
          title: text.slice(0, 60),
          context_mode: destinationProject?.context_mode || "chat",
        });
        id = created.id;
        if (!stillHere()) {
          await refresh();
          return;
        }
        selectedChatRef.current = id;
        setChatId(id);
        setChats((current) => [created, ...current]);
      }
      const message = await post<Message>(`/v1/chats/${id}/messages`, {
        content: text,
        attachment_ids: attachments.map((a) => a.id),
      });
      if (scope !== operationScope.current) return;
      if (stillHere()) setMessages((current) => [...current, message]);
      const key = crypto.randomUUID();
      const operation: PendingOperation = {
        key,
        scope,
        kind: "run",
        path: "/v1/runs",
        chatId: id,
        prompt: text,
        createdAt: new Date().toISOString(),
        body: {
          chat_id: id,
          message_id: message.id,
          capability,
          intent_id: decision.id,
          attachment_ids: attachments.map((a) => a.id),
          settings: {
            aspect_ratio: aspect,
            quality: "standard",
            intelligence,
            web_search: webSearch,
            media_budget_usd: Number(budget),
          },
          budget_usd:
            decision.capability === "chat" ? projectBudget : Number(budget),
          idempotency_key: key,
        },
      };
      saveOperations([...operationsRef.current, operation]);
      const submitted = await executeOperation(operation);
      experienceNavigation.current.set(submitted.id, origin);
      if (operation.scope !== operationScope.current) return;
      if (!stillHere()) {
        await refresh();
        return;
      }
      setPrompt((current) => (current.trim() === text ? "" : current));
      setAttachments((current) =>
        JSON.stringify(current.map((a) => a.id)) ===
        JSON.stringify(operation.body.attachment_ids)
          ? []
          : current,
      );
      if (!view.startsWith("builder:")) setView("chat");
      else setProjectChatExpanded(true);
      setMobileTab("chat");
      await refresh();
      await loadMessages(id);
    } catch (e) {
      reportError(errorText(e));
    } finally {
      submissionRef.current = false;
      setSending(false);
      setUnderstanding(false);
    }
  }
  async function executeOperation(operation: PendingOperation): Promise<Run> {
    if (operationFlights.current.has(operation.key))
      throw new Error("This request is already being confirmed.");
    operationFlights.current.add(operation.key);
    setBusyOperationKeys((current) => [...current, operation.key]);
    try {
      const run = await post<Run>(operation.path, operation.body);
      removeOperation(operation);
      if (operation.scope === operationScope.current)
        setRuns((current) => [
          run,
          ...current.filter((item) => item.id !== run.id),
        ]);
      return run;
    } catch (error) {
      if (error instanceof ApiError && error.definitive)
        removeOperation(operation);
      throw error;
    } finally {
      operationFlights.current.delete(operation.key);
      setBusyOperationKeys((current) =>
        current.filter((key) => key !== operation.key),
      );
    }
  }
  async function recoverOperation(operation: PendingOperation) {
    if (operationFlights.current.has(operation.key)) return;
    setError("");
    try {
      const run = await executeOperation(operation);
      if (operation.scope !== operationScope.current) return;
      experienceNavigation.current.set(run.id, navigationVersion.current);
      selectedChatRef.current = run.chat_id;
      setChatId(run.chat_id);
      selectedProjectRef.current = run.project_id || "";
      setProjectId(run.project_id || "");
      const session =
        chats.find((item) => item.id === run.chat_id)?.component_id ||
        (typeof run.settings.component_session === "string"
          ? run.settings.component_session
          : "");
      if (!session && operation.kind === "refinement")
        setSessionRevision((value) => value + 1);
      setView(
        session
          ? `builder:${session}`
          : operation.kind === "refinement"
            ? "builder:tasks"
            : "chat",
      );
      setMobileTab("chat");
      setPrompt((current) =>
        current.trim() === operation.prompt ? "" : current,
      );
      await refresh();
      await loadMessages(run.chat_id);
      notify("Request recovered. The original request was reused.");
    } catch (error) {
      reportError(errorText(error));
    }
  }
  async function cancel(run: Run) {
    try {
      await post(`/v1/runs/${run.id}/cancel`);
      await refresh();
      notify("Cancellation requested. Completed outputs are kept.");
    } catch (e) {
      reportError(errorText(e));
    }
  }
  async function retry(run: Run, reviewIntelligence?: "super") {
    const existing = operationsRef.current.find(
      (item) => item.kind === "retry" && item.retryRunId === run.id,
    );
    if (existing) {
      await recoverOperation(existing);
      return;
    }
    if ((blockedRunRetries.has(runErrorCode(run)) || ((run.settings.task_plan || run.workflow_id === "asset.production.v1") && ["response_incomplete", "model_refusal"].includes(runErrorCode(run)))) && !(reviewIntelligence === "super" && canUpgradeProductionReview(run))) {
      setDetailsRun(run);
      return;
    }
    if (operationsRef.current.length) {
      reportError(
        "Recover the previous request before starting another retry.",
      );
      return;
    }
    const key = crypto.randomUUID();
    const operation: PendingOperation = {
      key,
      scope: operationScope.current,
      kind: "retry",
      path: `/v1/runs/${run.id}/retry`,
      chatId: run.chat_id,
      prompt: run.prompt,
      retryRunId: run.id,
      createdAt: new Date().toISOString(),
      body: {
        idempotency_key: key,
        ...(reviewIntelligence ? { intelligence: reviewIntelligence } : {}),
        budget_usd: run.settings?.project_experience
          ? projectBudget
          : Number(budget),
      },
    };
    try {
      const origin = navigationVersion.current;
      saveOperations([...operationsRef.current, operation]);
      const retried = await executeOperation(operation);
      experienceNavigation.current.set(retried.id, origin);
      if (operation.scope !== operationScope.current) return;
      await refresh();
      notify("A new attempt has been queued");
    } catch (e) {
      reportError(errorText(e));
    }
  }
  async function favorite(a: Artifact) {
    try {
      await patch(`/v1/artifacts/${a.id}`, { favorite: !a.metadata?.favorite });
      await refresh();
    } catch (e) {
      reportError(errorText(e));
    }
  }
  async function deleteProjectAsset(a: Artifact) {
    await request(`/v1/artifacts/${encodeURIComponent(a.id)}`, { method: "DELETE" });
    setArtifacts((items) => items.filter((item) => item.id !== a.id));
    setAttachments((items) => items.filter((item) => item.id !== a.id));
    for (const [key, draft] of sessionDrafts.current) {
      sessionDrafts.current.set(key, { ...draft, attachments: draft.attachments.filter((item) => item.id !== a.id) });
    }
    setSelectedArtifact((item) => item?.id === a.id ? null : item);
  }

  function selectArtifact(a: Artifact) {
    setSelectedArtifact(a);
    setOutputOpen(true);
    setOutputTab("preview");
    setMobileTab("output");
  }
  async function attachProjectAssets(selected: Artifact[]) {
    if (assetAttachFlight.current || uploading || sending)
      throw new Error("Wait for the current attachment to finish.");
    const additions = selected.filter(
      (item) => !attachments.some((existing) => existing.id === item.id),
    );
    if (additions.length + attachments.length > 8)
      throw new Error("Attach up to 8 files per message.");
    if (additions.some((item) => item.project_id !== projectId))
      throw new Error("Choose assets from this project.");
    const origin = navigationVersion.current,
      scope = operationScope.current;
    assetAttachFlight.current = true;
    setUploading(true);
    try {
      const references: Artifact[] = [];
      for (const item of additions) {
        let reference = item;
        if (item.available === false) {
          const blob = await authenticatedBlob(item.download_url);
          const data = new FormData();
          data.append(
            "file",
            new File([blob], item.name, { type: item.mime_type }),
          );
          data.append("project_id", projectId);
          if (chatId) data.append("chat_id", chatId);
          reference = await request<Artifact>("/v1/uploads", {
            method: "POST",
            body: data,
          });
        }
        references.push(reference);
      }
      if (
        origin !== navigationVersion.current ||
        scope !== operationScope.current
      )
        throw new Error(
          "The conversation changed. Add the assets to your current message.",
        );
      setAttachments((items) => [
        ...items,
        ...references.filter(
          (item) => !items.some((existing) => existing.id === item.id),
        ),
      ]);
      setArtifacts((items) => [
        ...references,
        ...items.filter(
          (item) => !references.some((reference) => reference.id === item.id),
        ),
      ]);
      setIntentFeedback(null);
      setMobileTab("chat");
      setTimeout(() => composerRef.current?.focus(), 0);
    } finally {
      assetAttachFlight.current = false;
      setUploading(false);
    }
  }
  async function reuseArtifact(a: Artifact, target: string) {
    try {
      let reference = a;
      if (a.available === false) {
        const blob = await authenticatedBlob(a.download_url);
        const data = new FormData();
        data.append("file", new File([blob], a.name, { type: a.mime_type }));
        if (projectId) data.append("project_id", projectId);
        if (chatId) data.append("chat_id", chatId);
        reference = await request<Artifact>("/v1/uploads", {
          method: "POST",
          body: data,
        });
        await refresh();
      }
      setAttachments([reference]);
      setCapability(target);
      setMobileTab("chat");
      setPrompt(
        target === "image_to_video"
          ? "Gently animate this image with a slow camera movement."
          : target === "image_to_3d"
            ? "Create a detailed 3D asset from this image."
            : "",
      );
      composerRef.current?.focus();
      notify("Image added as the source for your next request");
    } catch (error) {
      reportError(errorText(error));
    }
  }
  async function exportProject() {
    if (!project) return;
    try {
      const conversations = await Promise.all(
        chats
          .filter((item) => item.project_id === project.id)
          .map(async (item) => ({
            ...item,
            messages: await request<Message[]>(`/v1/chats/${item.id}/messages`),
          })),
      );
      downloadBlob(
        new Blob(
          [
            JSON.stringify(
              {
                format: "powwow-project-export",
                version: 1,
                exported_at: new Date().toISOString(),
                project,
                workspace: projectWorkspace?.workspace,
                chats: conversations,
                files: artifacts.filter(
                  (item) => item.project_id === project.id,
                ),
              },
              null,
              2,
            ),
          ],
          { type: "application/json" },
        ),
        `${project.name}.json`,
      );
    } catch (error) {
      reportError(errorText(error));
    }
  }
  function resizePanels(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    const bounds = event.currentTarget.parentElement!.getBoundingClientRect();
    const move = (e: PointerEvent) =>
      setOutputWidth(
        Math.max(
          32,
          Math.min(65, (100 * (bounds.right - e.clientX)) / bounds.width),
        ),
      );
    const done = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", done);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", done, { once: true });
  }
  const closeRunDetails = useCallback(() => setDetailsRun(null), []),
    closeAccount = useCallback(() => setAccountOpen(false), []),
    closeContext = useCallback(() => setContextOpen(false), []),
    closeEditor = useCallback(() => setEditor(null), []),
    closeMove = useCallback(() => setMoveChat(null), []);
  const filteredProjects = projects.filter(
    (p) =>
      (!collaboration.organizationId || p.organization_id === collaboration.organizationId || !p.organization_id) &&
      (Boolean(p.archived) === archived ||
        (archived && chats.some((c) => c.project_id === p.id && c.archived))) &&
      (!search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        chats.some(
          (c) =>
            c.project_id === p.id &&
            Boolean(c.archived) === archived &&
            c.title.toLowerCase().includes(search.toLowerCase()),
        )),
  );
  const filteredChats = chats.filter(
    (c) =>
      !c.component_id &&
      Boolean(c.archived) === archived &&
      (search
        ? c.title.toLowerCase().includes(search.toLowerCase())
        : c.project_id === projectId),
  );
  const composer = (
    <form
      className={`composer ${messages.length ? "composer-sticky" : ""}`}
      onSubmit={submit}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        upload(e.dataTransfer.files);
      }}
    >
      {attachments.length > 0 && (
        <div
          className="attachment-list composer-references"
          aria-label="Attached assets"
        >
          {attachments.map((a) => (
            <div className="attachment-chip" key={a.id}>
              <ArtifactThumb artifact={a} />
              <span>{a.name}</span>
              <button
                type="button"
                className="icon-button"
                aria-label={`Remove ${a.name}`}
                disabled={sending || uploading}
                onClick={() =>
                  setAttachments((current) =>
                    current.filter((item) => item.id !== a.id),
                  )
                }
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div
        className={`composer-inner ${!messages.length ? "composer-home" : ""}`}
      >
        {!messages.length && (
          <Sparkles className="composer-spark" size={21} aria-hidden="true" />
        )}
        <textarea
          ref={composerRef}
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            setIntentFeedback(null);
          }}
          readOnly={sending}
          placeholder="What should we work on?"
          aria-label="Describe your request"
          rows={messages.length ? 2 : 1}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <div className="composer-controls">
          <div className="composer-options">
            <PopoverMenu
              label="Add to your message"
              className="composer-add-menu"
              disabled={uploading || sending}
              trigger={
                uploading ? (
                  <LoaderCircle size={20} className="spin" />
                ) : (
                  <Plus size={21} />
                )
              }
              items={[
                {
                  id: "file",
                  label: "Add a file for reference",
                  icon: <Paperclip size={17} />,
                  onSelect: () => {
                    fileRef.current?.click();
                  },
                },
                ...(project
                  ? [
                      {
                        id: "assets",
                        label: "Project assets",
                        icon: <Layers size={17} />,
                        onSelect: () => setAssetPicker("all"),
                      },
                    ]
                  : []),
                {
                  id: "web",
                  label: "Allow web search",
                  icon: <Globe size={17} />,
                  checked: webSearch,
                  separator: true,
                  onSelect: () => setWebSearch((value) => !value),
                },
              ]}
            />
            <span className="composer-intelligence-menu" title="GPT-6 Astra · high reasoning · evaluation candidate">
              <Sparkles size={15} /> GPT-6 Astra
            </span>
          </div>
          <div className="composer-send-controls">
            <button
              type="button"
              className={`icon-button dictation-button ${speech.listening ? "selected" : ""}`}
              aria-label={
                speech.listening ? "Stop dictation" : "Dictate message"
              }
              aria-pressed={speech.listening}
              title={
                speech.recognitionSupported
                  ? speech.listening
                    ? "Stop dictation"
                    : "Dictate message"
                  : "Speech input is unavailable in this browser"
              }
              disabled={
                sending || Boolean(activeRun) || !speech.recognitionSupported
              }
              onClick={() => {
                if (speech.listening) speech.stopListening();
                else
                  speech.startListening(
                    preferences?.app_language || navigator.language || "en-US",
                    true,
                  );
              }}
            >
              {speech.listening ? <Square size={17} /> : <Mic size={19} />}
            </button>
            <button
              className="send-button"
              aria-label="Send request"
              title="Send request · Enter"
              disabled={
                !prompt.trim() ||
                speech.listening ||
                sending ||
                uploading ||
                Boolean(activeRun) ||
                pendingOperations.length > 0 ||
                !sessionReady
              }
            >
              {sending ? (
                <LoaderCircle size={19} className="spin" />
              ) : messages.length ? (
                <ArrowUp size={20} />
              ) : (
                <ArrowRight size={20} />
              )}
            </button>
          </div>
        </div>
      </div>
      {speech.listening && (
        <div className="dictation-status" role="status">
          Listening…
        </div>
      )}
      {speech.error && (
        <div className="project-storage-error" role="alert">
          {speech.error}
        </div>
      )}
      {understanding && (
        <div className="understanding-status" role="status">
          <LoaderCircle size={13} className="spin" />
          Understanding your request…
        </div>
      )}
      {intentFeedback && (
        <div className="intent-feedback" role="status">
          <p>{intentFeedback.summary}</p>
          <div>
            {intentFeedback.kind === "image" ? (
              <>
                <button
                  type="button"
                  className="button subtle"
                  onClick={() => fileRef.current?.click()}
                >
                  <Paperclip size={14} />
                  Add a reference image
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="button subtle"
                  onClick={() => {
                    setPrompt(
                      `Help me develop a written brief and a practical plan for this idea:\n\n${prompt}`,
                    );
                    setCapability("chat");
                    setWebSearch(true);
                    setIntentFeedback(null);
                    composerRef.current?.focus();
                  }}
                >
                  Help me plan it
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </form>
  );

  if (needsLogin) return <Login onError={reportError} error={error} />;
  if (!ready && loading)
    return (
      <div className="boot-screen">
        <Brand />
        <LoaderCircle className="spin" />
        <p>Opening your workspace…</p>
      </div>
    );
  if (!ready)
    return (
      <div className="boot-screen">
        <Brand />
        <div className="connection-card">
          <h1>We couldn’t open your workspace.</h1>
          <p>Powwow is unavailable right now.</p>
          <p className="muted">
            Your saved work will be here when the connection returns.
          </p>
          <button
            className="button primary"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={16} /> Reconnect
          </button>
        </div>
      </div>
    );

  return (
    <div
      className={`app-shell collaboration-shell ${selectedTask ? "task-conversation" : ""} ${sidebar ? "sidebar-open" : "sidebar-closed"} ${showOutput ? "with-output" : ""} ${view === "chat" && !messages.length && !activeRun ? "is-home" : ""} ${projectId || activeRun || sending ? "project-universe" : ""}`}
    >
      {sidebar && (
        <div className="sidebar-scrim" onClick={() => setSidebar(false)} />
      )}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-identity">
            <Brand />
          </div>
          <div className="sidebar-brand-actions">
            <button
              className="icon-button"
              aria-label="Search projects and conversations"
              title="Search · Ctrl K"
              onClick={() => {
                setSearchOpen(!searchOpen);
                if (searchOpen) setSearch("");
              }}
            >
              <Search size={16} />
            </button>
            <button
              className="icon-button"
              aria-label="Collapse sidebar"
              onClick={() => setSidebar(false)}
            >
              <PanelLeftClose size={17} />
            </button>
          </div>
        </div>
        {searchOpen && (
          <div className="sidebar-search">
            <Search size={14} />
            <input
              autoFocus
              placeholder="Search projects and chats"
              aria-label="Search projects and chats"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="icon-button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}
        <div className="sidebar-scroll">
          <OrganizationNav state={collaboration} view={view} selectedTask={selectedTask?.id} onNavigate={navigateCollaboration} onSwitch={switchOrganization} onTask={task => void selectTask(task)}/>
          <div className="nav-section-heading">
            <span>{archived ? "ARCHIVED PROJECTS" : "PROJECTS"}</span>
            <button
              className="icon-button"
              aria-label="Create project"
              aria-haspopup="dialog"
              aria-expanded={newProjectOpen}
              onClick={(event) => openNewProject(false, event.currentTarget)}
            >
              <Plus size={15} />
            </button>
          </div>
          <div className="project-list">
            {filteredProjects.map((p) => (
              <div className="project-tree" key={p.id}>
                <div
                  className={`project-row ${projectId === p.id ? "active" : ""}`}
                  key={p.id}
                >
                  <button
                    className="project-select"
                    onClick={() => selectProject(p.id)}
                  >
                    <Folder size={16} />
                    <span>{p.name}</span>
                    {projectId === p.id && <ChevronDown size={12} />}
                  </button>
                  <button
                    className="icon-button row-menu"
                    aria-label={`Options for ${p.name}`}
                    onClick={() => setMenu(menu === p.id ? null : p.id)}
                  >
                    <MoreHorizontal size={15} />
                  </button>
                  {menu === p.id && (
                    <div className="context-menu">
                      <button
                        onClick={() => {
                          editProject(p);
                        }}
                      >
                        Edit project
                      </button>
                      <button
                        onClick={() =>
                          archiveItem("projects", p.id, Boolean(p.archived))
                        }
                      >
                        {p.archived ? "Restore project" : "Archive project"}
                      </button>
                    </div>
                  )}
                </div>
                {(projectId === p.id || Boolean(search) || archived) && (
                  <div
                    className="project-tools"
                    aria-label={`${p.name} tools and chats`}
                  >
                    {sortBuilderComponents(
                      (projectId === p.id
                        ? projectComponents(projectWorkspace?.workspace)
                        : []
                      ).map((id) => ({
                        ...(builderCatalog.components.find(
                          (item) => item.id === id,
                        ) || { id, name: id, description: "", icon: id }),
                        priority:
                          preferences?.component_priorities[id] ??
                          builderCatalog.components.find(
                            (item) => item.id === id,
                          )?.priority,
                      })),
                    ).map(({ id }) => {
                      const Icon = builderIcon(id);
                      if (id === "language" && languageProfiles.length)
                        return (
                          <Fragment key={id}>
                            {languageProfiles.map((profile) => (
                              <button
                                key={profile.id}
                                className={
                                  view === `builder:language:${profile.id}`
                                    ? "active"
                                    : ""
                                }
                                aria-current={
                                  view === `builder:language:${profile.id}`
                                    ? "page"
                                    : undefined
                                }
                                aria-label={`Learn: ${languageName(profile.target_language)} — ${profile.learner_name}`}
                                title={`${profile.learner_name} · ${languageName(profile.target_language)}`}
                                onClick={() =>
                                  openProjectTool(`language:${profile.id}`)
                                }
                              >
                                <Icon size={15} />
                                <span className="language-project-label">
                                  Learn: {languageName(profile.target_language)}
                                  <small>{profile.learner_name}</small>
                                </span>
                              </button>
                            ))}
                            {!p.archived && (
                              <button
                                className="add-project-tool"
                                onClick={() => openProjectTool("language")}
                              >
                                <Plus size={14} />
                                Add learner / language
                              </button>
                            )}
                          </Fragment>
                        );
                      const name =
                        builderCatalog.components.find((item) => item.id === id)
                          ?.name ||
                        (id === "tasks"
                          ? "Task Board"
                          : id === "design"
                            ? "Project Blueprint"
                            : id);
                      return (
                        <button
                          key={id}
                          className={
                            view === `builder:${id}` ||
                            view.startsWith(`builder:${id}:`)
                              ? "active"
                              : ""
                          }
                          aria-current={
                            view === `builder:${id}` ||
                            view.startsWith(`builder:${id}:`)
                              ? "page"
                              : undefined
                          }
                          onClick={() => openProjectTool(id)}
                        >
                          <Icon size={15} />
                          <span>{name}</span>
                        </button>
                      );
                    })}
                    {!p.archived && projectId === p.id && (
                      <button
                        className="add-project-tool"
                        disabled={
                          !projectWorkspace || !builderCatalog.components.length
                        }
                        onClick={() => setComponentPicker(true)}
                      >
                        <Plus size={14} />
                        Add project tools
                      </button>
                    )}
                    <div className="project-chats">
                      {!p.archived && projectId === p.id && (
                        <button
                          className="project-chat-new"
                          aria-label="New conversation"
                          onClick={() => newChat()}
                        >
                          <Plus size={14} />
                          New project chat
                        </button>
                      )}
                      <div className="chat-list">
                        {filteredChats
                          .filter((c) => c.project_id === p.id)
                          .map((c) => (
                            <div
                              key={c.id}
                              className={`chat-row ${chatId === c.id && view === "chat" ? "active" : ""}`}
                            >
                              <button onClick={() => selectChat(c)}>
                                <MessageSquare size={14} />
                                <span>{c.title}</span>
                                {runs.some(
                                  (r) =>
                                    r.chat_id === c.id && running(r.status),
                                ) && <span className="live-dot" />}
                              </button>
                              <button
                                className="icon-button row-menu"
                                aria-label={`Options for ${c.title}`}
                                onClick={() =>
                                  setMenu(menu === c.id ? null : c.id)
                                }
                              >
                                <MoreHorizontal size={14} />
                              </button>
                              {menu === c.id && (
                                <div className="context-menu">
                                  <button
                                    onClick={() => {
                                      setEditor({
                                        type: "chat",
                                        id: c.id,
                                        value: c.title,
                                      });
                                      setMenu(null);
                                    }}
                                  >
                                    Rename conversation
                                  </button>
                                  <button
                                    onClick={() => {
                                      setMoveChat(c);
                                      setMenu(null);
                                    }}
                                  >
                                    Move to project
                                  </button>
                                  <button
                                    onClick={() =>
                                      archiveItem("chats", c.id, archived)
                                    }
                                  >
                                    {archived
                                      ? "Restore conversation"
                                      : "Archive conversation"}
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {!filteredProjects.length && (
            <p className="sidebar-empty">
              {archived ? "No archived projects." : "No matching projects."}
            </p>
          )}
          <div className="nav-section-heading regular-chats-heading">
            <span>{archived ? "ARCHIVED CHATS" : "CHATS"}</span>
            <button
              className="icon-button"
              aria-label="New chat"
              onClick={() => {
                setArchived(false);
                newChat(true);
              }}
            >
              <Plus size={15} />
            </button>
          </div>
          <div
            className="chat-list standalone-chat-list"
            aria-label="Chats outside projects"
          >
            {!archived && (
              <button
                className="standalone-new-chat"
                onClick={() => newChat(true)}
              >
                <PencilLine size={15} />
                New chat
              </button>
            )}
            {chats
              .filter(
                (c) =>
                  !c.project_id &&
                  Boolean(c.archived) === archived &&
                  (!search ||
                    c.title.toLowerCase().includes(search.toLowerCase())),
              )
              .map((c) => (
                <div
                  key={c.id}
                  className={`chat-row ${chatId === c.id && view === "chat" ? "active" : ""}`}
                >
                  <button onClick={() => selectChat(c)}>
                    <MessageSquare size={14} />
                    <span>{c.title}</span>
                    {runs.some(
                      (r) => r.chat_id === c.id && running(r.status),
                    ) && <span className="live-dot" />}
                  </button>
                  <PopoverMenu
                    label={`Options for ${c.title}`}
                    className="row-action-menu"
                    trigger={<MoreHorizontal size={15} />}
                    placement="below"
                    items={[
                      {
                        id: "rename",
                        label: "Rename chat",
                        onSelect: () =>
                          setEditor({ type: "chat", id: c.id, value: c.title }),
                      },
                      {
                        id: "move",
                        label: "Move to project",
                        onSelect: () => setMoveChat(c),
                      },
                      {
                        id: "archive",
                        label: archived ? "Restore chat" : "Archive chat",
                        onSelect: () => {
                          void archiveItem("chats", c.id, archived);
                        },
                      },
                    ]}
                  />
                </div>
              ))}
          </div>
        </div>
        <div className="sidebar-bottom">
          <button
            className={archived ? "selected" : ""}
            onClick={() => setArchived(!archived)}
          >
            <Archive size={16} />
            {archived ? "Back to workspace" : "Archive"}
          </button>
          <PopoverMenu
            label="Account menu"
            className="account-menu"
            trigger={
              <>
                <span className="avatar">
                  {userEmail[0]?.toUpperCase() || "Y"}
                </span>
                <span className="profile-identity">
                  <strong>{userEmail || "Your account"}</strong>
                  <small>
                    {preferences?.plan === "powwow" ? "Powwow" : "Free"}
                  </small>
                </span>
                <Settings2 size={17} />
              </>
            }
            items={[
              {
                id: "settings",
                label: "Settings",
                icon: <Settings2 size={17} />,
                onSelect: () => openAccount("general"),
              },
              {
                id: "storage",
                label: "Storage",
                icon: <HardDrive size={17} />,
                onSelect: () => openAccount("storage"),
              },
              {
                id: "membership",
                label: "Membership",
                icon: <CreditCard size={17} />,
                onSelect: () => openAccount("subscription"),
              },
              ...(project
                ? [
                    {
                      id: "export",
                      label: "Export project",
                      description: "Blueprint, chats, and a file list",
                      icon: <Download size={17} />,
                      onSelect: () => {
                        void exportProject();
                      },
                    },
                  ]
                : []),
              ...(!local
                ? [
                    {
                      id: "signout",
                      label: "Sign out",
                      icon: <LogOut size={17} />,
                      separator: true,
                      onSelect: () => {
                        void supabase?.auth.signOut();
                      },
                    },
                  ]
                : []),
            ]}
          />
        </div>
      </aside>
      <main className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            {!sidebar && (
              <button
                className="icon-button"
                aria-label="Open sidebar"
                onClick={() => setSidebar(true)}
              >
                <Menu size={20} />
              </button>
            )}
            <span className="breadcrumb-project">
              <Folder size={15} />
              {view.startsWith("collab:") && view !== "collab:board" ? collaboration.organization?.name || "Powwow" : project?.name || "Chats"}
            </span>
            <ChevronRight size={12} />
            <span className="breadcrumb-current">
              {view.startsWith("collab:") ? ({"collab:home":"My tasks","collab:organization":"Organization","collab:agents":"Agents","collab:board":"Task board","collab:code":"Code review"}[view] || "Workspace") : view.startsWith("builder:language")
                ? (() => {
                    const profile = languageProfiles.find(
                      (item) => view === `builder:language:${item.id}`,
                    );
                    return profile
                      ? `Learn: ${languageName(profile.target_language)}`
                      : "Language learning";
                  })()
                : view.startsWith("builder:")
                  ? builderCatalog.components.find(
                      (item) => item.id === view.split(":")[1],
                    )?.name || "Project tools"
                  : chat?.title || "New conversation"}
            </span>
          </div>
          <div className="header-actions">
            {project && !view.startsWith("collab:") && (
              <button
                className="button context-button"
                aria-label="Project folder"
                title="Project folder"
                onClick={() => setProjectFolderOpen(true)}
              >
                <Folder size={14} />
                <span>Project folder</span>
              </button>
            )}
            {project && !view.startsWith("collab:") && (
              <button
                className="button context-button"
                onClick={() => setContextOpen(true)}
              >
                <Link2 size={14} />
                <span>Context</span>
                {grants.filter((g) => !g.revoked_at).length > 0 && (
                  <span className="count">
                    {grants.filter((g) => !g.revoked_at).length}
                  </span>
                )}
              </button>
            )}
            {currentArtifact && view === "chat" && (
              <button
                className="icon-button"
                aria-label={outputOpen ? "Hide output" : "Show output"}
                onClick={() => {
                  setOutputOpen(!outputOpen);
                  setMobileTab("output");
                }}
              >
                <Layers size={17} />
              </button>
            )}
          </div>
        </header>
        {effectivePreferences?.storage_mode === "local" &&
          localFiles.problem && (
            <div
              className="local-storage-banner storage-action-error"
              role="alert"
            >
              <HardDrive size={16} />
              <span>{localFiles.problem}</span>
              {localFiles.problem && (
                <button onClick={localFiles.retry}>Retry save</button>
              )}
              <button
                onClick={() =>
                  project ? editProject(project) : openAccount("storage")
                }
              >
                Storage
              </button>
            </div>
          )}
        {pendingOperations.length > 0 && !sending && (
          <div className="recovery-banner" role="status">
            <div>
              <strong>A previous request needs confirmation</strong>
              <span>
                Its inputs and settings are saved. Recover it safely before
                starting another request.
              </span>
            </div>
            {pendingOperations.map((operation) => (
              <button
                className="button primary"
                key={operation.key}
                disabled={busyOperationKeys.includes(operation.key)}
                onClick={() => recoverOperation(operation)}
              >
                {busyOperationKeys.includes(operation.key) ? (
                  <LoaderCircle size={14} className="spin" />
                ) : (
                  <RefreshCw size={14} />
                )}
                Recover request
              </button>
            ))}
          </div>
        )}
        {offline && (
          <div className="offline-banner">
            <LoaderCircle size={14} /> Connection interrupted. Your jobs
            continue on the server.
            <button
              onClick={() => refresh().catch((e) => setOffline(errorText(e)))}
            >
              Reconnect
            </button>
          </div>
        )}
        <div
          hidden={view.startsWith("builder:") || view.startsWith("collab:")}
          className="mobile-tabs"
          role="tablist"
          aria-label="Workspace panels"
        >
          {["chat", "output", "details"].map((tab) => (
            <button
              role="tab"
              key={tab}
              aria-selected={mobileTab === tab}
              className={mobileTab === tab ? "active" : ""}
              onClick={() => {
                setMobileTab(tab);
                if (tab === "output") setOutputOpen(true);
              }}
            >
              {tab === "chat" ? (
                <MessageSquare size={15} />
              ) : tab === "output" ? (
                <Layers size={15} />
              ) : (
                <SlidersHorizontal size={15} />
              )}{" "}
              {pretty(tab)}
              {tab === "output" && activeArtifacts.length > 0 && (
                <span>{activeArtifacts.length}</span>
              )}
            </button>
          ))}
        </div>
        <div className="collab-code-host" hidden={view !== "collab:code"}>
          <Suspense fallback={<p className="collab-empty">Loading code review…</p>}><CodeReview key={authRevision}/></Suspense>
        </div>
        {view === "collab:code" ? null : view === "collab:task" && selectedTask && collaboration.organization ? (
          <section className="collab-page"><TaskContext task={selectedTask} organization={collaboration.organization} onChanged={setSelectedTask} onClose={() => navigateCollaboration("collab:board")}/><p className="collab-note" style={{marginTop:20}}>View only</p></section>
        ) : view === "collab:home" ? (
          <CollaborationHome state={collaboration} projects={projects.filter(item => item.organization_id === collaboration.organizationId)} onTask={task => void selectTask(task)} onProject={selectProject} onManage={() => navigateCollaboration("collab:organization")} onCreateProject={() => openNewProject()}/>
        ) : view === "collab:organization" ? (
          <OrganizationSettings key={`${authRevision}:${collaboration.organizationId}`} state={collaboration} onJoined={() => { void refresh().catch(error => reportError(errorText(error))); }}/>
        ) : view === "collab:agents" ? (
          <OrganizationAgents key={`${authRevision}:${collaboration.organizationId}`} organization={collaboration.organization}/>
        ) : (view === "collab:board" || view === "builder:tasks") && project?.organization_id && collaboration.organization ? (
          <SharedTaskBoard key={project.id} project={project} organization={collaboration.organization} onOpen={task => void selectTask(task)} onChange={collaboration.refresh}/>
        ) : view.startsWith("builder:") ? (
          <div
            className={`builder-workspace-surface ${arrivingProject === projectId ? "project-arriving" : ""} ${view.startsWith("builder:language") ? "project-language" : ""}`}
          >
            {projectWorkspace && (
              <ProjectTabs
                workspace={projectWorkspace.workspace}
                catalog={builderCatalog}
                view={view}
                onOpen={openProjectTool}
                onAdd={() => setComponentPicker(true)}
              />
            )}
            {arrivingProject === projectId && (
              <div className="project-arrival-art" aria-hidden="true">
                <CreativeShowcase />
              </div>
            )}
            <div className="project-component-content">
              {projectWorkspace?.workspace.initialized &&
                view === "builder:tasks" &&
                !project?.archived && (
                  <BuilderRefinement
                    key={`${projectId}:refinement`}
                    projectId={projectId}
                    envelope={projectWorkspace}
                    run={runs.find(
                      (item) =>
                        item.project_id === projectId &&
                        item.settings?.builder_refinement,
                    )}
                    budget={budget}
                    onStart={startPlanRefinement}
                    onCancel={cancel}
                    onApplied={(value) => {
                      setProjectWorkspace(value);
                      notify("Updated project design and tasks saved");
                    }}
                  />
                )}
              {!projectWorkspace ? (
                <div className="builder-loading">
                  {workspaceError ? (
                    <div>
                      <p role="alert">{workspaceError}</p>
                      <button
                        className="button"
                        onClick={() => setWorkspaceReload((value) => value + 1)}
                      >
                        Try again
                      </button>
                    </div>
                  ) : (
                    <span>
                      <LoaderCircle className="spin" size={18} /> Loading
                      project tools…
                    </span>
                  )}
                </div>
              ) : view === "builder:language" ||
                view.startsWith("builder:language:") ? (
                <Suspense
                  fallback={
                    <div className="builder-loading">
                      Loading language learning…
                    </div>
                  }
                >
                  {preferences &&
                  (view.startsWith("builder:language:") ||
                    profilesReadyFor === projectId) ? (
                    <LanguageLearning
                      key={`${projectId}:${view}`}
                      projectId={projectId}
                      projectName={project?.name || "Your project"}
                      profileId={
                        view.startsWith("builder:language:")
                          ? view.slice("builder:language:".length)
                          : undefined
                      }
                      onProfilesChanged={refreshLanguageProfiles}
                      budget={budget}
                      onError={reportError}
                      archived={Boolean(project?.archived)}
                      initialTargetLanguage={
                        languageProfiles.length
                          ? undefined
                          : projectWorkspace.workspace.answers.target_language
                      }
                      accountId={operationScope.current}
                      appLanguage={preferences?.app_language || "en"}
                      defaultLearnerName={userEmail.split("@")[0] || "Me"}
                      initialLevel={projectWorkspace.workspace.answers.level}
                    />
                  ) : (
                    <div className="builder-loading">
                      Loading language preferences…
                    </div>
                  )}
                </Suspense>
              ) : view === "builder:tasks" ? (
                <BuilderBoard
                  key={`${projectId}:board`}
                  workspace={projectWorkspace.workspace}
                  projectName={project?.name || "Your project"}
                  catalog={builderCatalog}
                  onSave={saveWorkspace}
                  onSetup={() =>
                    setBuilderSetup({
                      prompt: projectWorkspace.workspace.plan_prompt || "",
                      kind: projectWorkspace.workspace.kind || undefined,
                      explicit: true,
                    })
                  }
                  onOpen={openProjectTool}
                  onAsk={askFromBuilder}
                />
              ) : view === "builder:design" ? (
                <BuilderDesign
                  key={`${projectId}:design`}
                  workspace={projectWorkspace.workspace}
                  onSave={saveWorkspace}
                  onSetup={() =>
                    setBuilderSetup({
                      prompt: projectWorkspace.workspace.plan_prompt || "",
                      kind: projectWorkspace.workspace.kind || undefined,
                      explicit: true,
                    })
                  }
                  onAsk={askFromBuilder}
                />
              ) : (
                <BuilderEditors
                  key={`${projectId}:${view}`}
                  componentId={view.slice(8)}
                  onExport={() =>
                    void authenticatedBlob(
                      `/v1/projects/${projectId}/memory.md`,
                    )
                      .then((blob) => downloadBlob(blob, "project-memory.md"))
                      .catch((error) => reportError(errorText(error)))
                  }
                  workspace={projectWorkspace.workspace}
                  projectName={project?.name || "Your project"}
                  onUploadImage={uploadEntryImage}
                  onGenerateImage={generateEntryImage}
                  imageRuns={runs.filter(
                    (item) => item.project_id === projectId,
                  )}
                  onResolveImageIssue={resolveImageIssue}
                  imageStorageReady={localFiles.ready}
                  imageBudget={spendingLimitsEnabled ? projectBudget : null}
                  onSave={saveWorkspace}
                  onAsk={askFromBuilder}
                  onAttachAssets={attachProjectAssets}
                  onDeleteAsset={deleteProjectAsset}
                  artifacts={artifacts.filter(
                    (item) => item.project_id === projectId,
                  )}
                />
              )}
            </div>
            {!view.startsWith("builder:language") && (
              <div
                className="project-chat-dock"
                aria-label={`${componentChatName} chat`}
              >
                <div className="project-chat-handle">
                  <button
                    onClick={() => setProjectChatExpanded((value) => !value)}
                    aria-expanded={projectChatExpanded}
                  >
                    <MessageSquare size={14} />
                    {sessionReady && (activeRun || sending)
                      ? "Thinking…"
                      : `${componentChatName} chat`}
                    <ChevronDown size={14} />
                  </button>
                  {activeRun && (
                    <button onClick={() => cancel(activeRun)}>Stop</button>
                  )}
                </div>
                {sessionReady && projectChatExpanded && (
                  <div
                    className="project-chat-history"
                    role="log"
                    aria-label={`${componentChatName} conversation`}
                  >
                    {messages.map((message) => (
                      <article key={message.id}>
                        <strong>
                          {message.role === "user" ? "You" : "Powwow"}
                        </strong>
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                        <ProjectUpdateNotice
                          run={runs.find((run) => run.id === message.run_id)}
                          onOpen={openProjectTool}
                        />
                      </article>
                    ))}
                  </div>
                )}
                {sessionReady && lastRun?.error && !running(lastRun.status) && (
                  <div className="project-chat-failure">
                    <RunCard
                      run={lastRun}
                      artifacts={[]}
                      onCancel={() => cancel(lastRun)}
                      onRetry={(intelligence) => retry(lastRun, intelligence)}
                      onConfigureStorage={() => configureRunStorage(lastRun)}
                      onChooseImage={() => chooseRunImage(lastRun)}
                      onDetails={() => setDetailsRun(lastRun)}
                      recoveryDisabled={sending || uploading || !!activeRun}
                      retrying={false}
                      onArtifact={selectArtifact}
                    />
                  </div>
                )}
                {!sessionReady && (
                  <div
                    className="project-chat-session-status"
                    role={sessionError ? "alert" : "status"}
                  >
                    {sessionError || "Opening component chat…"}
                    {sessionError && (
                      <button
                        className="button subtle"
                        onClick={() => setSessionRevision((value) => value + 1)}
                      >
                        Try again
                      </button>
                    )}
                  </div>
                )}
                {composer}
              </div>
            )}
            {projectWorkspace?.workspace.kind && (
              <ExperienceTour
                key={`${operationScope.current}:${projectWorkspace.workspace.kind}`}
                kind={projectWorkspace.workspace.kind}
                accountId={operationScope.current}
                catalog={builderCatalog}
                workspace={projectWorkspace.workspace}
                intro={
                  experienceWelcome
                    ? String(experienceWelcome.settings.experience_intro)
                    : undefined
                }
                arriving={arrivingProject === projectId}
              />
            )}
          </div>
        ) : (
          <><div hidden={!selectedTask}>
            {selectedTask && collaboration.organization && <TaskContext key={selectedTask.id} task={selectedTask} organization={collaboration.organization} onChanged={task => { setSelectedTask(current => current?.id === task.id ? task : current); collaboration.refresh(); }} onClose={() => { setSelectedTask(null); navigateCollaboration("collab:board"); }}/>}
          </div><div
            className={`workspace-grid mobile-view-${mobileTab}`}
            style={{ "--output-width": `${outputWidth}%` } as CSSProperties}
          >
            <section
              className={`conversation-panel ${messages.length ? "has-messages" : "is-empty"}`}
              aria-label="Conversation"
            >
              {!messages.length && !activeRun ? (
                <div className="welcome">
                  {!selectedTask && <CreativeShowcase />}
                  <div className="welcome-heading">
                    <h1>
                      {selectedTask ? "Work on this task" : project
                        ? `What should we work on in ${project.name}?`
                        : "What should we work on?"}
                    </h1>
                  </div>
                  {composer}
                  {!selectedTask && <div
                    className="creative-prompts"
                    aria-label="Things you can create"
                  >
                    {promptIdeas.map((idea) => (
                      <button
                        key={idea.id}
                        type="button"
                        disabled={sending}
                        onClick={() => {
                          setPrompt(idea.prompt);
                          setCapability("auto");
                          setIntentFeedback(null);
                          composerRef.current?.focus();
                        }}
                      >
                        <idea.icon size={15} />
                        {idea.label}
                      </button>
                    ))}
                  </div>}
                </div>
              ) : (
                <>
                  <div className="message-scroll">
                    <div className="conversation-title">
                      <span className="page-eyebrow">
                        {capabilityNames[lastRun?.capability || "chat"] ||
                          "CONVERSATION"}
                      </span>
                      <h1>{chat?.title || "Your conversation"}</h1>
                    </div>
                    {messages.map((message) => (
                      <article
                        key={message.id}
                        className={`message message-${message.role}`}
                      >
                        <div className="message-avatar">
                          {message.role === "user" ? (
                            <span className="avatar small">
                              {userEmail[0]?.toUpperCase() || "Y"}
                            </span>
                          ) : (
                            <Brand small />
                          )}
                        </div>
                        <div className="message-body">
                          <div className="message-heading">
                            <strong>
                              {message.role === "user" ? "You" : "Powwow"}
                            </strong>
                            <time>
                              {new Date(message.created_at).toLocaleTimeString(
                                undefined,
                                { hour: "numeric", minute: "2-digit" },
                              )}
                            </time>
                          </div>
                          {Boolean(message.attachment_ids?.length) && (
                            <div className="message-attachments">
                              {message.attachment_ids?.map((id) => {
                                const a = artifacts.find((a) => a.id === id);
                                return a ? (
                                  <button
                                    key={id}
                                    onClick={() => selectArtifact(a)}
                                  >
                                    <ArtifactThumb artifact={a} />
                                    <span>{a.name}</span>
                                  </button>
                                ) : null;
                              })}
                            </div>
                          )}
                          <div className="markdown">
                            <ReactMarkdown
                              components={{
                                a: ({ children, href }) => (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {children}
                                  </a>
                                ),
                              }}
                            >
                              {message.content || message.text || ""}
                            </ReactMarkdown>
                          </div>
                          {message.role === "assistant" && (
                            <>
                              {runs.find((run) => run.id === message.run_id)
                                ?.model_provenance.truncated === true && (
                                <p className="length-limit-notice">
                                  Response reached its length limit. Ask Powwow
                                  to continue.
                                </p>
                              )}
                              <MessageSources
                                run={runs.find(
                                  (run) => run.id === message.run_id,
                                )}
                              />
                              <ProjectUpdateNotice
                                run={runs.find(
                                  (run) => run.id === message.run_id,
                                )}
                                onOpen={openProjectTool}
                              />
                              <button
                                className="copy-message icon-button"
                                aria-label="Copy response"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    message.content,
                                  );
                                  notify("Response copied");
                                }}
                              >
                                <Copy size={13} />
                              </button>
                              {runs.some(
                                (run) => run.id === message.run_id,
                              ) && (
                                <button
                                  className="copy-message icon-button"
                                  aria-label="About this response"
                                  onClick={() =>
                                    setDetailsRun(
                                      runs.find(
                                        (run) => run.id === message.run_id,
                                      ) || null,
                                    )
                                  }
                                >
                                  <Info size={13} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </article>
                    ))}
                    {streamingRun && (
                      <article
                        className="message message-assistant streaming-answer"
                        aria-busy={running(streamingRun.status)}
                      >
                        <div className="message-avatar">
                          <Brand small />
                        </div>
                        <div className="message-body">
                          <div className="message-heading">
                            <strong>Powwow</strong>
                            <span className="streaming-label">
                              {running(streamingRun.status)
                                ? "Writing your response…"
                                : streamingRun.status === "succeeded"
                                  ? "Finishing up…"
                                  : "Partial response"}
                            </span>
                          </div>
                          <div className="markdown">
                            <ReactMarkdown
                              components={{
                                a: ({ children, href }) => (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {children}
                                  </a>
                                ),
                              }}
                            >
                              {streamingRun.output_text}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </article>
                    )}
                    {(activeRun || sending) && (
                      <ProjectThinking
                        run={activeRun}
                        onDetails={
                          activeRun ? () => setDetailsRun(activeRun) : undefined
                        }
                        onStop={activeRun ? () => cancel(activeRun) : undefined}
                      />
                    )}
                    {chatRuns
                      .filter((run) => !running(run.status))
                      .map((run) => (
                        <RunCard
                          key={run.id}
                          run={run}
                          artifacts={artifacts.filter(
                            (a) => a.run_id === run.id || run.artifact_ids.includes(a.id),
                          )}
                          onCancel={() => cancel(run)}
                          onRetry={(intelligence) => retry(run, intelligence)}
                          onConfigureStorage={() => configureRunStorage(run)}
                          onChooseImage={() => chooseRunImage(run)}
                          onDetails={() => setDetailsRun(run)}
                          recoveryDisabled={sending || uploading || !!activeRun}
                          retrying={pendingOperations.some(
                            (operation) =>
                              operation.retryRunId === run.id &&
                              busyOperationKeys.includes(operation.key),
                          )}
                          onArtifact={selectArtifact}
                        />
                      ))}
                    <div ref={bottomRef} />
                  </div>
                  {composer}
                </>
              )}
            </section>
            {showOutput && (
              <div
                className="panel-divider"
                role="separator"
                aria-label="Resize conversation and output"
                aria-orientation="vertical"
                aria-valuenow={Math.round(outputWidth)}
                aria-valuemin={32}
                aria-valuemax={65}
                tabIndex={0}
                onPointerDown={resizePanels}
                onKeyDown={(e) => {
                  if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    setOutputWidth((v) => Math.min(65, v + 2));
                  }
                  if (e.key === "ArrowRight") {
                    e.preventDefault();
                    setOutputWidth((v) => Math.max(32, v - 2));
                  }
                }}
              />
            )}
            <aside
              className={`output-panel ${showOutput ? "visible" : ""}`}
              aria-label="Output workspace"
            >
              <div className="output-header">
                <div>
                  <Layers size={16} />
                  <strong>Your output</strong>
                  {currentArtifact && (
                    <span className="count">{activeArtifacts.length || 1}</span>
                  )}
                </div>
                <button
                  className="icon-button"
                  aria-label="Collapse output"
                  onClick={() => {
                    setOutputOpen(false);
                    setMobileTab("chat");
                  }}
                >
                  <X size={17} />
                </button>
              </div>
              {currentArtifact ? (
                <>
                  <div className="output-tabs">
                    <button
                      className={outputTab === "preview" ? "active" : ""}
                      onClick={() => setOutputTab("preview")}
                    >
                      Preview
                    </button>
                    <button
                      className={outputTab === "details" ? "active" : ""}
                      onClick={() => setOutputTab("details")}
                    >
                      Details
                    </button>
                    <button
                      className={outputTab === "history" ? "active" : ""}
                      onClick={() => setOutputTab("history")}
                    >
                      History <span>{activeArtifacts.length}</span>
                    </button>
                  </div>
                  {outputTab === "preview" ? (
                    <ArtifactView
                      artifact={currentArtifact}
                      onReuse={reuseArtifact}
                      onFavorite={() => favorite(currentArtifact)}
                      onError={reportError}
                    />
                  ) : outputTab === "details" ? (
                    <div className="output-details-scroll">
                      <h3>{currentArtifact.name}</h3>
                      <dl className="detail-list">
                        <div>
                          <dt>Format</dt>
                          <dd>{currentArtifact.mime_type}</dd>
                        </div>
                        <div>
                          <dt>File size</dt>
                          <dd>{bytes(currentArtifact.size_bytes)}</dd>
                        </div>
                        <div>
                          <dt>Created</dt>
                          <dd>
                            {new Date(
                              currentArtifact.created_at,
                            ).toLocaleString()}
                          </dd>
                        </div>
                      </dl>
                      {isDemo(currentArtifact) && (
                        <div className="info-box">
                          Demonstration asset. This was not generated by a live
                          model.
                        </div>
                      )}
                      <RunDetails
                        run={runs.find((r) => r.id === currentArtifact.run_id)}
                      />
                    </div>
                  ) : (
                    <div className="artifact-history">
                      {activeArtifacts.map((a) => (
                        <button
                          className={
                            a.id === currentArtifact.id ? "active" : ""
                          }
                          key={a.id}
                          onClick={() => {
                            setSelectedArtifact(a);
                            setOutputTab("preview");
                          }}
                        >
                          <ArtifactThumb artifact={a} />
                          <span>
                            <strong>{a.name}</strong>
                            <small>
                              {pretty(a.kind)} · {relativeTime(a.created_at)}
                            </small>
                          </span>
                          <ChevronRight size={16} />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="output-empty">
                  <Layers size={32} />
                  <h3>Your ideas take shape here.</h3>
                  <p>
                    Generated images, videos, and 3D models appear in this
                    workspace.
                  </p>
                </div>
              )}
            </aside>
            <aside className="mobile-details">
              <RunDetails run={lastRun} />
            </aside>
          </div></>
        )}
      </main>
      <input
        type="file"
        ref={fileRef}
        hidden
        multiple
        accept="image/png,image/jpeg,image/webp,video/mp4,.glb,.txt,.md,.pdf,.csv"
        onChange={(e) => upload(e.target.files)}
      />
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={14} />
          </button>
        </div>
      )}
      {error && (
        <div className="error-toast" role="alert">
          <CircleHelp size={19} />
          <span>{error}</span>
          <button
            className="icon-button"
            aria-label="Dismiss error"
            onClick={() => setError("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {builderSetup &&
        project &&
        (!builderSetup.projectId || builderSetup.projectId === project.id) &&
        builderCatalog.kinds.length > 0 && (
          <BuilderSetup
            key={project.id}
            projectId={project.id}
            projectName={project.name}
            catalog={builderCatalog}
            planningBudget={budget}
            appLanguage={preferences?.app_language || "en"}
            initialPrompt={builderSetup.prompt}
            initialKind={builderSetup.kind}
            explicit={builderSetup.explicit}
            existing={projectWorkspace || undefined}
            onComplete={completeBuilderSetup}
            onClose={() => setBuilderSetup(null)}
          />
        )}
      {componentPicker && projectWorkspace && (
        <ComponentPicker
          catalog={builderCatalog}
          workspace={projectWorkspace.workspace}
          onClose={() => setComponentPicker(false)}
          onSave={async (ids) => {
            await saveWorkspace({
              ...projectWorkspace.workspace,
              components: ids,
            });
            setComponentPicker(false);
            notify("Project tools updated");
          }}
        />
      )}
      {projectLinkOpen && (
        <Modal
          title="Add components to a project"
          onClose={() => setProjectLinkOpen(false)}
        >
          <div className="modal-body">
            <p className="muted">Choose a project for these components.</p>
            {projects
              .filter((p) => !p.archived)
              .map((p) => (
                <button
                  key={p.id}
                  className="move-destination"
                  onClick={() => {
                    selectProject(p.id);
                    setProjectLinkOpen(false);
                    setComponentPicker(true);
                  }}
                >
                  <Folder size={17} />
                  {p.name}
                  <ChevronRight size={15} />
                </button>
              ))}
            <button
              className="button primary"
              style={{ marginTop: 20 }}
              onClick={() => openNewProject(true)}
            >
              <Plus size={16} />
              Create project
            </button>
          </div>
        </Modal>
      )}
      {detailsRun && (
        <Modal title="About this response" onClose={closeRunDetails} wide>
          {mediaPlanSteps(detailsRun).length > 0 && (
            <section className="details-content">
              <h3>Planned steps</h3>
              <ol>
                {mediaPlanSteps(detailsRun).map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </section>
          )}
          <RunDetails run={detailsRun} />
        </Modal>
      )}
      {accountOpen && (
        <AccountSettings
          accountId={operationScope.current}
          initialSection={accountSection}
          onClose={closeAccount}
          requiredStorage={
            accountSection === "storage" &&
            preferences?.storage_mode === "unselected"
          }
          onPreferencesChanged={setPreferences}
        />
      )}
      {contextOpen && project && (
        <ContextPanel
          project={project}
          chat={chat}
          projects={projects}
          chats={chats}
          artifacts={artifacts}
          grants={grants}
          onRefresh={() => refresh().catch((e) => reportError(errorText(e)))}
          onError={reportError}
          onClose={closeContext}
        />
      )}
      {newProjectOpen && (
        <NewProjectDialog
          anchor={newProjectAnchor.current}
          accountId={operationScope.current}
          organizationId={collaboration.organizationId || undefined}
          onClose={() => setNewProjectOpen(false)}
          onUpgrade={() => setStorageUpgradeOpen(true)}
          onCreated={(created) => {
            setProjects((current) => [created, ...current]);
            selectProject(created.id);
            setNewProjectOpen(false);
            if (addComponentsAfterCreate.current) {
              setComponentPicker(true);
              addComponentsAfterCreate.current = false;
            } else setTimeout(() => composerRef.current?.focus(), 0);
          }}
        />
      )}
      {assetPicker && project && (
        <AssetPicker
          key={`${operationScope.current}:${projectId}:${componentSession}:${assetPicker}`}
          artifacts={artifacts.filter(
            (item) =>
              item.project_id === projectId &&
              (assetPicker !== "image" || item.mime_type.startsWith("image/")),
          )}
          attached={attachments}
          onAdd={async (selected) => {
            if (assetPicker === "image" && selected.length !== 1)
              throw new Error("Choose one source image.");
            await attachProjectAssets(selected);
          }}
          onClose={() => setAssetPicker(null)}
        />
      )}
      {projectFolderOpen && project && (
        <ProjectFolder
          key={`${operationScope.current}:${project.id}`}
          accountId={operationScope.current}
          projectId={project.id}
          projectName={project.name}
          onClose={() => setProjectFolderOpen(false)}
          onChanged={() => projectFolderChanged(project.id)}
        />
      )}
      {storageUpgradeOpen && (
        <StorageUpgrade
          accountId={operationScope.current}
          projectId={newProjectOpen ? undefined : project?.id}
          onClose={() => setStorageUpgradeOpen(false)}
          onUseLocal={
            newProjectOpen
              ? undefined
              : async () => {
                  if (project) {
                    const saved = await patch<Project>(
                      `/v1/projects/${project.id}`,
                      { storage_mode: "local" },
                    );
                    setProjects((current) =>
                      current.map((item) =>
                        item.id === saved.id ? saved : item,
                      ),
                    );
                  } else
                    setPreferences(
                      await saveAccountPreferences(operationScope.current, {
                        storage_mode: "local",
                      }),
                    );
                  localFiles.retry();
                }
          }
        />
      )}
      {editor && (
        <Modal
          title={
            editor.id
              ? `Edit ${editor.type === "project" ? "project" : "conversation"}`
              : "Create project"
          }
          onClose={closeEditor}
        >
          <form className="modal-body editor-form" onSubmit={saveEditor}>
            <label>
              {editor.type === "project"
                ? "Project name"
                : "Conversation title"}
              <input
                autoFocus
                required
                maxLength={120}
                placeholder={
                  editor.type === "project"
                    ? "e.g. Weekend game"
                    : "Name your conversation"
                }
                value={editor.value}
                onChange={(e) =>
                  setEditor({ ...editor, value: e.target.value })
                }
              />
            </label>
            {editor.type === "project" && (
              <label>
                Project instructions (optional)
                <textarea
                  rows={4}

                  value={editor.instructions || ""}
                  onChange={(e) =>
                    setEditor({ ...editor, instructions: e.target.value })
                  }
                />
              </label>
            )}
            {editor.type === "project" && editor.id && (
              <ProjectFolderControl
                key={`${operationScope.current}:${editor.id}`}
                accountId={operationScope.current}
                projectId={editor.id}
                onChanged={() => projectFolderChanged(editor.id!)}
              />
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="button subtle"
                onClick={closeEditor}
              >
                Cancel
              </button>
              <button
                className="button primary"
                disabled={!editor.value.trim()}
              >
                {editor.id ? "Save changes" : "Create project"}
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        </Modal>
      )}
      {moveChat && (
        <Modal title="Move conversation" onClose={closeMove}>
          <div className="modal-body">
            <p className="muted">
              Move “{moveChat.title}” to a project or keep it in Chats.
            </p>
            {moveChat.project_id && (
              <button
                className="move-destination"
                onClick={async () => {
                  try {
                    const moved = await patch<Chat>(
                      `/v1/chats/${moveChat.id}`,
                      { project_id: null },
                    );
                    selectChat(moved);
                    setMoveChat(null);
                    await refresh();
                    notify("Moved to Chats");
                  } catch (error) {
                    reportError(errorText(error));
                  }
                }}
              >
                <MessageSquare size={18} />
                Chats
                <ChevronRight size={16} />
              </button>
            )}
            {projects
              .filter((p) => !p.archived && p.id !== moveChat.project_id)
              .map((p) => (
                <button
                  key={p.id}
                  className="move-destination"
                  onClick={async () => {
                    try {
                      const moved = await patch<Chat>(
                        `/v1/chats/${moveChat.id}`,
                        {
                          project_id: p.id,
                        },
                      );
                      selectChat(moved);
                      setMoveChat(null);
                      await refresh();
                      notify("Conversation moved");
                    } catch (e) {
                      reportError(errorText(e));
                    }
                  }}
                >
                  <Folder size={18} />
                  {p.name}
                  <ChevronRight size={16} />
                </button>
              ))}
            {!moveChat.project_id &&
              projects.filter(
                (p) => !p.archived && p.id !== moveChat.project_id,
              ).length === 0 && (
                <p>Create another project first to move this conversation.</p>
              )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function MessageSources({ run }: { run?: Run }) {
  const sources =
    run?.context_snapshot.filter(
      (source) =>
        source.source_type === "web" && typeof source.url === "string",
    ) || [];
  if (!sources.length) return null;
  return (
    <div
      className="message-sources"
      aria-label="Sources retrieved for this answer"
    >
      <span>
        <Globe size={12} /> Sources retrieved
      </span>
      <div>
        {sources.map((source, index) => (
          <a
            key={String(source.url)}
            href={String(source.url)}
            target="_blank"
            rel="noreferrer"
          >
            <span>{index + 1}</span>
            {String(source.name || source.title || source.url)}
          </a>
        ))}
      </div>
    </div>
  );
}

function RunCard({
  run,
  artifacts,
  onCancel,
  onRetry,
  onConfigureStorage,
  onChooseImage,
  onDetails,
  recoveryDisabled,
  onArtifact,
  retrying,
}: {
  run: Run;
  artifacts: Artifact[];
  onCancel: () => void;
  onRetry: (intelligence?: "super") => void;
  onConfigureStorage: () => void;
  onChooseImage: () => void;
  onDetails: () => void;
  recoveryDisabled: boolean;
  onArtifact: (artifact: Artifact) => void;
  retrying: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const reviewModel = artifacts.find((artifact) => artifact.kind === "model3d" && !artifact.metadata?.auxiliary)
    || artifacts.find((artifact) => artifact.kind === "model3d" && artifact.metadata?.variant === "validated")
    || artifacts.find((artifact) => artifact.kind === "model3d");
  const visibleArtifacts = artifacts.filter((artifact) => !artifact.metadata?.auxiliary || (run.status === "failed" && artifact.id === reviewModel?.id));
  const plannedTasks = (run.settings?.task_plan as { tasks?: { id: string; output_name: string }[] } | undefined)?.tasks;
  const taskProgress = run.model_provenance?.tasks as Record<string, { status?: string }> | undefined;
  if (run.status === "succeeded" && !visibleArtifacts.length) return null;
  const Icon =
    capabilityIcons[run.capability as keyof typeof capabilityIcons] || Sparkles;
  const errorCode = runErrorCode(run);
  const storageError = ["storage_choice_required", "storage_quota"].includes(
    errorCode,
  );
  const sourceError = sourceRunErrors.has(errorCode);
  const canRetry = !blockedRunRetries.has(errorCode) && !((plannedTasks || run.workflow_id === "asset.production.v1") && ["response_incomplete", "model_refusal"].includes(errorCode));
  return (
    <section className={`run-card run-${run.status}`}>
      <div className="run-card-top">
        <div className="run-icon">
          <Icon size={19} />
        </div>
        <div className="run-summary">
          <strong>
            {plannedTasks?.length ? `${plannedTasks.length} asset task${plannedTasks.length === 1 ? "" : "s"}` : capabilityNames[run.capability] || "Creating your result"}
          </strong>
          <span>{run.prompt}</span>
        </div>
        <Status status={run.status} />
      </div>
      {running(run.status) && (
        <>
          <div className="run-stage">
            <span>
              {({ classify: "Planning", pending: "Planning", prepare_reference: "Preparing the reference", "optimized-reference": "Editing the reference", "isolated-reference": "Isolating the subject", "trellis-master": "Building the detailed mesh", inspect_mesh: "Inspecting the mesh", plan_finishing: "Planning Blender edits", finish_and_texture: "Finishing and texturing", review_export: "Checking the finished model" } as Record<string, string>)[run.stage || ""] || pretty(run.stage || run.status)}
            </span>
            <span>
              {run.progress !== null && run.progress !== undefined
                ? `${Math.round(run.progress <= 1 ? run.progress * 100 : run.progress)}%`
                : relativeTime(run.started_at || run.created_at)}
            </span>
          </div>
          <div
            className={`progress-track ${run.progress === null || run.progress === undefined ? "indeterminate" : ""}`}
          >
            <span
              style={{
                width:
                  run.progress != null
                    ? `${Math.min(100, run.progress <= 1 ? run.progress * 100 : run.progress)}%`
                    : "35%",
              }}
            />
          </div>
          <div className="run-bottom">
            <button
              className="button subtle compact"
              onClick={onCancel}
              disabled={run.status === "cancel_requested"}
            >
              <Square size={11} />
              {run.status === "cancel_requested" ? "Cancelling…" : "Cancel"}
            </button>
          </div>
        </>
      )}
      {Array.isArray(plannedTasks) && (
        <ul aria-label="Generation tasks" className="run-task-list">
          {plannedTasks.map((task) => (
            <li key={task.id}>
              <strong>{task.output_name}</strong>{" · "}
              {pretty(taskProgress?.[task.id]?.status || "pending")}
            </li>
          ))}
        </ul>
      )}
      {run.error && (
        <div className="run-error" role="alert">
          <p className="entry-image-error">
            {typeof run.error === "string" ? run.error : run.error.message}
          </p>
          {storageError && (
            <button className="button subtle" onClick={onConfigureStorage}>
              <Folder size={13} />{" "}
              {run.project_id ? "Edit project" : "Storage settings"}
            </button>
          )}
          {(sourceError || errorCode === "quality_review_failed") && (
            <button
              className="button subtle"
              disabled={recoveryDisabled}
              onClick={onChooseImage}
            >
              <Paperclip size={13} /> Choose image
            </button>
          )}
          {(uncertainRunErrors.has(errorCode) ||
            ["workflow_unavailable", "quality_review_failed", "invalid_finish_plan", "blender_finish_failed", "response_incomplete"].includes(errorCode)) && (
            <button className="button subtle" onClick={onDetails}>
              <Info size={13} />{" "}
              {errorCode === "workflow_unavailable"
                ? "View plan"
                : "View request"}
            </button>
          )}
          {canUpgradeProductionReview(run) && (
            <button className="button subtle" disabled={retrying} onClick={() => onRetry("super")}>
              <Sparkles size={13} /> Review with Super
            </button>
          )}
          {canRetry && run.status !== "cancelled" && (
            <button
              className="button subtle"
              disabled={retrying}
              onClick={() => onRetry()}
            >
              <RefreshCw size={13} /> {plannedTasks ? "Resume remaining tasks" : "Retry request"}
            </button>
          )}
        </div>
      )}
      {run.status === "cancelled" && (
        <div className="run-bottom">
          <span>This request was cancelled.</span>
          {canRetry && (
            <button
              className="button subtle compact"
              disabled={retrying}
              onClick={() => onRetry()}
            >
              <RefreshCw size={12} /> {plannedTasks ? "Resume remaining tasks" : "Try again"}
            </button>
          )}
        </div>
      )}
      {visibleArtifacts.length > 0 && (
        <div className="run-artifacts">
          {visibleArtifacts.map((a) => (
            <button key={a.id} onClick={() => onArtifact(a)}>
              <ArtifactThumb artifact={a} />
              <span>
                <strong>{a.name}</strong>
                <small>
                  {isDemo(a) ? "Demo asset · " : ""}
                  {pretty(a.kind)} · {bytes(a.size_bytes)}
                </small>
              </span>
              <ArrowRight size={16} />
            </button>
          ))}
        </div>
      )}
      <button
        className="run-details-button"
        onClick={() => setExpanded(!expanded)}
      >
        <ChevronDown size={12} className={expanded ? "rotate" : ""} />{" "}
        {expanded ? "Hide" : "About"} this result
      </button>
      {expanded && <RunDetails run={run} />}
    </section>
  );
}

function ArtifactView({
  artifact,
  onReuse,
  onFavorite,
  onError,
}: {
  artifact: Artifact;
  onReuse: (a: Artifact, target: string) => void;
  onFavorite: () => void;
  onError: (error: string) => void;
}) {
  const { url, error } = useMediaUrl(artifact.kind === "model3d" ? undefined : artifact.url || artifact.download_url),
    [zoom, setZoom] = useState(1);
  useEffect(() => setZoom(1), [artifact.id]);
  const kind =
    artifact.kind ||
    (artifact.mime_type.startsWith("image/")
      ? "image"
      : artifact.mime_type.startsWith("video/")
        ? "video"
        : "model3d");
  return (
    <div className="artifact-view">
      <div className="artifact-title">
        <h2 title={artifact.name}>{artifact.name}</h2>
        <button
          className={`icon-button ${artifact.metadata?.favorite ? "favorited" : ""}`}
          aria-label={
            artifact.metadata?.favorite
              ? "Remove favorite"
              : "Favorite artifact"
          }
          onClick={onFavorite}
        >
          <Star
            size={16}
            fill={artifact.metadata?.favorite ? "currentColor" : "none"}
          />
        </button>
      </div>
      {isDemo(artifact) && (
        <div className="demo-notice">Demo asset · simulated generation</div>
      )}
      <div className={`artifact-stage stage-${kind}`}>
        {error ? (
          <div className="preview-message">
            <CircleHelp />
            <p>{error}</p>
          </div>
        ) : !url && kind !== "model3d" ? (
          <div className="preview-message">
            <LoaderCircle className="spin" />
            Loading preview…
          </div>
        ) : kind === "image" ? (
          <div className="image-viewport">
            <img
              src={url}
              alt={artifact.name}
              style={{ transform: `scale(${zoom})` }}
            />
          </div>
        ) : kind === "video" ? (
          <video
            key={url}
            src={url}
            controls
            playsInline
            preload="metadata"
            poster={assetUrl(artifact.preview_url)}
          >
            Your browser cannot play this video. Download the MP4 below.
          </video>
        ) : kind === "model3d" ? (
          <Suspense
            fallback={
              <div className="preview-message">
                <LoaderCircle className="spin" />
                Loading 3D viewer…
              </div>
            }
          >
            <ModelPreview artifact={artifact} />
          </Suspense>
        ) : (
          <div className="preview-message">
            <Paperclip size={34} />
            <p>{artifact.name}</p>
            <span>This file is available to download.</span>
          </div>
        )}
      </div>
      {kind === "image" && (
        <div className="image-tools">
          <button
            className="icon-button"
            aria-label="Zoom out"
            disabled={zoom <= 0.5}
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
          >
            <ZoomOut size={15} />
          </button>
          <button
            className="zoom-level"
            onClick={() => setZoom(1)}
            title="Reset zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            className="icon-button"
            aria-label="Zoom in"
            disabled={zoom >= 3}
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
          >
            <ZoomIn size={15} />
          </button>
          <span>Original output</span>
        </div>
      )}
      <div className="artifact-actions">
        <DownloadButton artifact={artifact} onError={onError} />
        {kind === "image" && (
          <>
            <button
              className="button subtle"
              onClick={() => onReuse(artifact, "image_to_video")}
            >
              <Film size={14} /> Animate
            </button>
            <button
              className="button subtle"
              onClick={() => onReuse(artifact, "image_to_3d")}
            >
              <Box size={14} /> Make 3D
            </button>
          </>
        )}
      </div>
      <div className="artifact-caption">
        <Folder size={13} />
        <span>
          {artifact.storage_mode === "local" ? "Local storage" : "Saved file"}
          <span> · {bytes(artifact.size_bytes)}</span>
        </span>
      </div>
    </div>
  );
}

function Login({
  onError,
  error,
}: {
  onError: (message: string) => void;
  error: string;
}) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [signup, setSignup] = useState(false),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    onError("");
    try {
      const { data, error } = signup
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (signup && !data.session)
        setNotice("Check your email to confirm your account, then sign in.");
    } catch (e) {
      onError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <Brand variant="monochrome" />
      <div className="login-card">
        <span className="page-eyebrow">WELCOME TO YOUR CREATIVE WORKSPACE</span>
        <h1>{signup ? "A home for your ideas." : "Good to see you."}</h1>
        <p>One place to think, create, and make things happen.</p>
        <form onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              minLength={signup ? 8 : 1}
              autoComplete={signup ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="form-notice" role="status">
              {notice}
            </p>
          )}
          <button className="button primary" disabled={busy}>
            {busy ? (
              <LoaderCircle size={16} className="spin" />
            ) : signup ? (
              "Create account"
            ) : (
              "Sign in"
            )}
            <ArrowRight size={16} />
          </button>
        </form>
        <button
          className="text-button"
          onClick={() => {
            setSignup(!signup);
            onError("");
            setNotice("");
          }}
        >
          {signup
            ? "Already have an account? Sign in"
            : "New here? Create an account"}
        </button>
      </div>
    </main>
  );
}
