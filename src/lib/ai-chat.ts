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
  reviewDays: string[];
  reviewIntervalLabel: string;
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
};

export type AiChatResponse = {
  text: string;
  model: string;
};
