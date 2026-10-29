import {
  BookOpen,
  Clapperboard,
  Gamepad2,
  Globe,
  Smartphone,
  Mic2,
  Music2,
  GraduationCap,
  Palette,
  Search,
  Sparkles,
  LayoutGrid,
  ListTodo,
  FileText,
  Users,
  Route,
  Images,
  Library,
  Clock3,
  Map,
  AudioLines,
  Image,
  Layers,
  PanelsTopLeft,
  Rocket,
  Languages,
} from "lucide-react";

export type BuilderTask = {
  id: string;
  title: string;
  description: string;
  status: "todo" | "doing" | "blocked" | "done";
  phase: string;
  acceptance: string[];
  depends_on: string[];
  component: string;
};
export type BuilderRecord = {
  id: string;
  title: string;
  fields: Record<string, string>;
};
export type BuilderWorkspace = {
  kind: string | null;
  initialized: boolean;
  brief: string;
  answers: Record<string, string>;
  assumptions: string[];
  components: string[];
  tasks: BuilderTask[];
  records: Record<string, BuilderRecord[]>;
  detail_categories?: { id: string; name: string }[];
  design: string;
  plan_prompt: string;
};
export type WorkspaceEnvelope = {
  version: number;
  workspace: BuilderWorkspace;
};
export type BuilderQuestion = {
  id: string;
  title: string;
  description: string;
  options: { id: string; label: string; description: string; icon?: string }[];
  recommended: string;
};
export type BuilderKind = {
  id: string;
  name: string;
  description: string;
  icon: string;
  components: string[];
  recommended_components?: string[];
  questions: BuilderQuestion[];
};
export type BuilderComponent = {
  id: string;
  name: string;
  description: string;
  icon: string;
  priority?: number;
};

/** Foundation tools stay first; other tools follow their catalog priority. */
export function sortBuilderComponents(
  components: BuilderComponent[],
): BuilderComponent[] {
  const priority = (component: BuilderComponent) =>
    component.id === "design"
      ? 1
      : component.id === "tasks"
        ? 2
        : Math.max(3, component.priority ?? 100);
  return [...components].sort(
    (left, right) => priority(left) - priority(right),
  );
}

export const builderComponentName = (component: BuilderComponent) =>
  component.id === "design" ? "Blueprint" : component.name;
export type BuilderCatalog = {
  kinds: BuilderKind[];
  components: BuilderComponent[];
};
export type PlanPreview = {
  eligible: boolean;
  reason?: string;
  kind: string;
  answers: Record<string, string>;
};

const icons: Record<string, typeof Sparkles> = {
  game: Gamepad2,
  movie: Clapperboard,
  book: BookOpen,
  comic: Images,
  website: Globe,
  app: Smartphone,
  podcast: Mic2,
  music: Music2,
  course: GraduationCap,
  language: Languages,
  memory: BookOpen,
  details: BookOpen,
  languages: Languages,
  brand: Palette,
  research: Search,
  other: Sparkles,
  tasks: ListTodo,
  design: FileText,
  characters: Users,
  plot: Route,
  storyboard: Clapperboard,
  manuscript: Library,
  timeline: Clock3,
  "game-design": Gamepad2,
  world: Map,
  audio: AudioLines,
  moodboard: Image,
  assets: Layers,
  pages: PanelsTopLeft,
  lessons: GraduationCap,
  release: Rocket,
};
export const builderIcon = (id: string) => icons[id] || LayoutGrid;

export function builderViewId(id: string): string {
  return [
    "memory",
    "characters",
    "plot",
    "timeline",
    "game-design",
    "world",
    "audio",
    "moodboard",
    "pages",
    "lessons",
    "research",
    "release",
  ].includes(id) || id.startsWith("detail-")
    ? `details:${id}`
    : id;
}

export function requestedBuilderComponent(prompt: string): string | undefined {
  const request = prompt
    .trim()
    .match(
      /^(?:(?:please|can you|could you)\s+)?(?:add|attach|enable|open)\s+(?:(?:a|an|the)\s+)?(.+?)(?:\s+(?:tool|editor|component|panel))?(?:\s+(?:to|for|in)\s+(?:(?:this|my|the)\s+)?project)?[.!?]?$/i,
    );
  if (!request) return undefined;
  const name = request[1].toLowerCase().replace(/[.!?]$/, "");
  const aliases: Record<string, string> = {
    "task board": "tasks",
    "project details": "details",
    "scrum board": "tasks",
    "project design": "design",
    blueprint: "design",
    "project blueprint": "design",
    storyboard: "storyboard",
    characters: "characters",
    "character sheets": "characters",
    "character sheet": "characters",
    plot: "plot",
    "story & plot": "plot",
    book: "manuscript",
    "book editor": "manuscript",
    chapters: "manuscript",
    manuscript: "manuscript",
    timeline: "timeline",
    "game design": "game-design",
    "world builder": "world",
    world: "world",
    audio: "audio",
    moodboard: "moodboard",
    "asset library": "assets",
    assets: "assets",
    pages: "pages",
    screens: "pages",
    lessons: "lessons",
    language: "language",
    "language learning": "language",
    "language buddy": "language",
    "learn language": "language",
    research: "research",
    "release checklist": "release",
  };
  return aliases[name];
}

/** Conservative UI hints; the server preview is authoritative for prompt extraction. */
export function inferBuilderAnswers(
  prompt: string,
  kind: BuilderKind | undefined,
): Record<string, string> {
  if (!kind) return {};
  const text = prompt.toLowerCase();
  const answer: Record<string, string> = {};
  for (const question of kind.questions) {
    const matched = question.options.filter((option) => {
      const terms = [option.id.replace(/_/g, " "), option.label.toLowerCase()];
      return terms.some(
        (term) =>
          term.length > 1 &&
          ![
            "auto",
            "other",
            "short",
            "long",
            "free",
            "new",
            "choose for me",
          ].includes(term) &&
          new RegExp(
            `\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
            "i",
          ).test(text),
      );
    });
    if (matched.length === 1) answer[question.id] = matched[0].id;
  }
  return answer;
}

export function downloadText(name: string, text: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/markdown;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
