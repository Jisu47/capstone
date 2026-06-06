import type {
  AiChatGroupContext,
  AiChatHistoryEntry,
  AiChatRequest,
  AiChatScope,
} from "@/lib/ai-chat";

type GeminiPart = {
  text?: string;
};

type GeminiContent = {
  role: "user" | "model";
  parts: GeminiPart[];
};

type GeminiCandidate = {
  content?: {
    parts?: GeminiPart[];
  };
  finishReason?: string;
  finishMessage?: string;
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

export type GeminiAnswerResult = {
  text: string;
  finishReason: string | null;
  finishMessage: string | null;
  isComplete: boolean;
};

const defaultGeminiModel = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
const retriableStatusCodes = new Set([429, 500, 502, 503, 504]);
const maxGeminiAttempts = 3;
const planAgentMaxOutputTokens = 1536;
const materialsMaxOutputTokens = 384;
const maxPlanAgentContinuationTurns = 2;

export class GeminiRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "GeminiRequestError";
    this.status = status;
  }
}

function delay(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function getRetryDelayMilliseconds(attempt: number, retryAfterHeader: string | null) {
  const retryAfterSeconds = Number.parseInt(retryAfterHeader ?? "", 10);

  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return retryAfterSeconds * 1000;
  }

  return 800 * 2 ** Math.max(0, attempt - 1);
}

function trimHistory(history: AiChatHistoryEntry[]): GeminiContent[] {
  return history
    .slice(-8)
    .filter((entry) => entry.text.trim().length > 0)
    .map((entry) => ({
      role: entry.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: entry.text.trim() }],
    }));
}

function buildGeminiContents(
  scope: AiChatScope,
  group: AiChatGroupContext,
  history: AiChatHistoryEntry[],
  question: string,
): GeminiContent[] {
  return [
    {
      role: "user",
      parts: [{ text: buildGroupContext(scope, group) }],
    },
    ...trimHistory(history),
    {
      role: "user",
      parts: [{ text: question.trim() }],
    },
  ];
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
    "Use the provided roadmap, weekly plan, and review interval setting to suggest realistic study planning guidance.",
    "Do not claim that changes were already applied.",
    "When appropriate, mention how the review interval affects the plan.",
    "Keep the answer concise enough for a mobile chat UI.",
  ].join(" ");
}

function extractAnswerResult(response: GeminiResponse): GeminiAnswerResult {
  const primaryCandidate = response.candidates?.[0];
  const text = primaryCandidate?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (text) {
    const finishReason = primaryCandidate?.finishReason ?? null;
    const finishMessage = primaryCandidate?.finishMessage ?? null;

    return {
      text,
      finishReason,
      finishMessage,
      isComplete: finishReason === null || finishReason === "STOP",
    };
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

function getMaxOutputTokens(scope: AiChatScope) {
  return scope === "materials" ? materialsMaxOutputTokens : planAgentMaxOutputTokens;
}

function buildContinuationPrompt() {
  return [
    "방금 답변이 길어서 중간에 끊겼습니다.",
    "직전 문장 다음부터 바로 이어서 작성해 주세요.",
    "이미 작성한 내용은 반복하지 말고 남은 답변만 계속 작성해 주세요.",
  ].join(" ");
}

function mergeAnswerText(previous: string, next: string) {
  if (!previous) {
    return next;
  }

  if (!next) {
    return previous;
  }

  if (previous.endsWith("\n") || next.startsWith("\n")) {
    return `${previous}${next}`;
  }

  return `${previous}\n${next}`;
}

async function requestGeminiContent(
  apiKey: string,
  scope: AiChatScope,
  contents: GeminiContent[],
) {
  for (let attempt = 1; attempt <= maxGeminiAttempts; attempt += 1) {
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
          contents,
          generationConfig: {
            temperature: scope === "materials" ? 0.45 : 0.65,
            topP: 0.95,
            maxOutputTokens: getMaxOutputTokens(scope),
            responseMimeType: "text/plain",
          },
        }),
        cache: "no-store",
      },
    );

    if (response.ok) {
      const payload = (await response.json()) as GeminiResponse;
      return extractAnswerResult(payload);
    }

    let detail = response.statusText;

    try {
      const payload = (await response.json()) as unknown;
      detail = extractApiError(payload) ?? detail;
    } catch {
      detail = await response.text();
    }

    if (retriableStatusCodes.has(response.status) && attempt < maxGeminiAttempts) {
      await delay(
        getRetryDelayMilliseconds(attempt, response.headers.get("retry-after")),
      );
      continue;
    }

    throw new GeminiRequestError(
      response.status,
      `Gemini API request failed (${response.status}): ${detail}`,
    );
  }

  throw new GeminiRequestError(
    503,
    "Gemini API request failed (503): The service remained unavailable after retries.",
  );
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

  let contents = buildGeminiContents(scope, group, history, question);
  let combinedText = "";
  let lastResult: GeminiAnswerResult | null = null;
  const maxContinuationTurns = scope === "plan-agent" ? maxPlanAgentContinuationTurns : 0;

  for (let continuationTurn = 0; continuationTurn <= maxContinuationTurns; continuationTurn += 1) {
    const result = await requestGeminiContent(apiKey, scope, contents);
    const normalizedText = result.text.trim();

    combinedText = mergeAnswerText(combinedText, normalizedText);
    lastResult = result;

    if (scope !== "plan-agent" || result.finishReason !== "MAX_TOKENS") {
      break;
    }

    contents = [
      ...contents,
      {
        role: "model",
        parts: [{ text: normalizedText }],
      },
      {
        role: "user",
        parts: [{ text: buildContinuationPrompt() }],
      },
    ];
  }

  if (!lastResult) {
    throw new Error("Gemini API returned an empty response.");
  }

  return {
    ...lastResult,
    text: combinedText,
    isComplete: lastResult.finishReason === null || lastResult.finishReason === "STOP",
  };
}
