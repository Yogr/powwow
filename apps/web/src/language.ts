import type { Run } from "./api";

export type LearningLanguage = {
  code: string;
  name: string;
  native_name: string;
  locale: string;
};
export type LanguageCatalog = {
  languages: LearningLanguage[];
  levels: { id: string; name: string; description: string }[];
  intelligence?: {
    qualification: string;
    qualification_note: string;
    setup_required: boolean;
    tiers: { id: IntelligenceTier; name: string; description: string; model: string; enabled: boolean; max_cost_usd: number }[];
    limits: { daily_budget_usd: number; daily_turns: number };
  };
};
export type IntelligenceTier = "basic" | "smarter" | "advanced";
export type LanguageProfile = {
  id: string;
  project_id: string;
  learner_name: string;
  target_language: string;
  native_language: string;
  level: string;
  timezone: string;
  created_at: string;
  start_date?: string;
  updated_at?: string;
};
export type LanguageDay = {
  id: string;
  profile_id: string;
  date: string;
  day_number: number;
  chat_id: string;
};
export type LanguageSegment = { text: string; translation: string };
export type LanguageReply = {
  text: string;
  translation: string;
  segments: LanguageSegment[];
  explanation?: string | null;
  correction?: {
    original: string;
    corrected: string;
    explanation: string;
  } | null;
  show_translation_tip: boolean;
  suggested_replies: { text: string; translation: string }[];
  vocabulary: { text: string; translation: string; note?: string }[];
  topic?: string | null;
};
export type LanguageTurn = {
  id: string;
  role: "user" | "assistant";
  text: string;
  reply?: LanguageReply | null;
  run_id?: string | null;
  created_at: string;
};
export type LanguageDays = {
  profile: LanguageProfile;
  days: LanguageDay[];
  current_day_id: string | null;
};
export type LanguageDayDetail = {
  day: LanguageDay;
  turns: LanguageTurn[];
  active_run?: Run | null;
  last_run?: Run | null;
};
export type LanguagePhrase = {
  id: string;
  profile_id: string;
  text: string;
  translation: string;
  note: string;
  source_turn_id?: string | null;
  due_at: string;
  review_count: number;
  interval_days: number;
  created_at: string;
  last_reviewed_at?: string | null;
  updated_at?: string;
};
