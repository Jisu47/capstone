import type {
  AiChatGroupContext,
  AiChatHistoryEntry,
  AiChatRequest,
  AiChatScope,
} from "@/lib/ai-chat";

type GeminiPart = {
  text?: string;
};

type GeminiCandidate = {
  content?: {
    parts?: GeminiPart[];
  };
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
  promptFeedback?: {
    blockReason?: string;
  };
  error?: {
    message?: string;
  };
};

const defaultGeminiModel = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

function trimHistory(history: AiChatHistoryEntry[]) {
  return history
    .slice(-8)
    .filter((entry) => entry.text.trim().length > 0)
    .map((entry) => ({
      role: entry.role === "assistant" ? "model" : "user",
      parts: [{ text: entry.text.trim() }],
    }));
}

function buildGroupContext(scope: AiChatScope, group: AiChatGroupContext) {
  const header = [
    `Group: ${group.name}`,
    `Subject: ${group.subject}`,
    `Weekly goal: ${group.weeklyGoal}`,
    `Overall goal: ${group.overallGoal}`,
    `Recent update: ${group.recentUpdate}`,
    `Group description: ${group.description}`,
  ];

  if (scope === "materials") {
    const materials =
      group.materials.length > 0
        ? group.materials
            .slice(0, 6)
            .map(
              (material, index) =>
                `${index + 1}. ${material.title} (${material.locationHint}) - ${material.summary}`,
            )
            .join("\n")
        : "No shared materials are available.";

    const planPreview =
      group.plan.length > 0
        ? group.plan
            .slice(0, 5)
            .map(
              (item) =>
                `${item.day}: ${item.title} / ${item.detail} / ${item.duration}`,
            )
            .join("\n")
        : "No weekly plan is available.";

    return `${header.join("\n")}\n\nShared materials:\n${materials}\n\nCurrent weekly plan:\n${planPreview}`;
  }

  const roadmap =
    group.roadmap.length > 0
      ? group.roadmap
          .slice(0, 8)
          .map(
            (item) =>
              `${item.weekNumber}. ${item.title} - ${item.summary}`,
          )
          .join("\n")
      : "No roadmap has been generated yet.";

  const weeklyPlan =
    group.plan.length > 0
      ? group.plan
          .slice(0, 7)
          .map(
            (item) =>
              `${item.day}: ${item.title} / ${item.detail} / ${item.duration}`,
          )
          .join("\n")
      : "No weekly plan is available.";

  return [
    ...header,
    `Review days: ${group.reviewDays.join(", ") || "Not set"}`,
    `Current user review interval: ${group.reviewIntervalLabel}`,
    "",
    "Roadmap:",
    roadmap,
    "",
    "Weekly plan:",
    weeklyPlan,
  ].join("\n");
}

function buildSystemInstruction(scope: AiChatScope) {
  if (scope === "materials") {
    return [
      "You are Study Flow's study materials assistant.",
      "Answer in Korean.",
      "Use the provided group context and material summaries first.",
      "Be concrete and helpful, but do not invent pages, files, or evidence that are not in the context.",
      "If the context is insufficient, say what is missing and suggest the next useful study step.",
      "Keep the answer concise enough for a mobile chat UI.",
    ].join(" ");
  }

  return [
    "You are Study Flow's planning agent assistant.",
    "Answer in Korean.",
    "Use the provided roadmap, weekly plan, and review settings to suggest realistic study planning guidance.",
    "Do not claim that changes were already applied.",
    "When appropriate, mention how review days and review intervals affect the plan.",
    "Keep the answer concise enough for a mobile chat UI.",
  ].join(" ");
}

function extractText(response: GeminiResponse) {
  const text = response.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  if (text) {
    return text;
  }

  if (response.promptFeedback?.blockReason) {
    throw new Error(
      `Gemini blocked the prompt: ${response.promptFeedback.blockReason}.`,
    );
  }

  throw new Error("Gemini API returned an empty response.");
}

function extractApiError(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const maybePayload = payload as GeminiResponse;
  return maybePayload.error?.message ?? null;
}

export function getGeminiModel() {
  return defaultGeminiModel;
}

export async function generateGeminiAnswer({
  scope,
  question,
  history,
  group,
}: AiChatRequest) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Gemini API key is missing. Set GEMINI_API_KEY in .env.local.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${defaultGeminiModel}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: buildSystemInstruction(scope) }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: buildGroupContext(scope, group) }],
          },
          ...trimHistory(history),
          {
            role: "user",
            parts: [{ text: question.trim() }],
          },
        ],
        generationConfig: {
          temperature: scope === "materials" ? 0.45 : 0.65,
          topP: 0.95,
          maxOutputTokens: scope === "materials" ? 384 : 512,
          responseMimeType: "text/plain",
        },
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    let detail = response.statusText;

    try {
      const payload = (await response.json()) as unknown;
      detail = extractApiError(payload) ?? detail;
    } catch {
      detail = await response.text();
    }

    throw new Error(`Gemini API request failed (${response.status}): ${detail}`);
  }

  const payload = (await response.json()) as GeminiResponse;
  return extractText(payload);
}
