import type { SourceCard } from "@/lib/mock-data";
import type { PlanAgentDraft } from "@/lib/plan-flow";

export type AiChatScope = "materials" | "plan-agent";

export type AiChatHistoryEntry = {
  role: "user" | "assistant";
  text: string;
};

export type AiChatGroupContext = {
  id: string;
  name: string;
  subject: string;
  weeklyGoal: string;
  overallGoal: string;
  description: string;
  recentUpdate: string;
  planReferenceUploads: Array<{
    fileName: string;
    summary: string;
  }>;
  planReferenceUnits: Array<{
    sequence: number;
    label: string;
    detail: string;
  }>;
  materials: Array<{
    title: string;
    summary: string;
    locationHint: string;
  }>;
  plan: Array<{
    day: string;
    title: string;
    detail: string;
    duration: string;
    referenceUnitSequence?: number | null;
  }>;
  roadmap: Array<{
    weekNumber: number;
    title: string;
    summary: string;
  }>;
};

export type AiChatRequest = {
  scope: AiChatScope;
  question: string;
  history: AiChatHistoryEntry[];
  group: AiChatGroupContext;
  materialId?: string | null;
};

export type AiChatResponse = {
  text: string;
  model: string;
  usedMaterial?: boolean;
  sources?: SourceCard[];
  finishReason?: string | null;
  finishMessage?: string | null;
  isComplete?: boolean;
  planAgentDraft?: PlanAgentDraft | null;
};
