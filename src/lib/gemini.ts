import type {
  AiChatGroupContext,
  AiChatHistoryEntry,
  AiChatRequest,
  AiChatScope,
} from "@/lib/ai-chat";
import type { PlanReferenceAnalysisResult } from "@/lib/plan-flow";

type GeminiTextPart = {
  text: string;
};

type GeminiInlineDataPart = {
  inline_data: {
    mime_type: string;
    data: string;
  };
};

type GeminiMessagePart = GeminiTextPart | GeminiInlineDataPart;

type GeminiContent = {
  role: "user" | "model";
  parts: GeminiMessagePart[];
};

type GeminiCandidate = {
  content?: {
    parts?: Array<{
      text?: string;
    }>;
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

export type PlanReferenceAnalysisRequest = {
  subject: string;
  fileName: string;
  mimeType: string;
  imageDataUrl: string;
};

const defaultGeminiModel = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
const retriableStatusCodes = new Set([429, 500, 502, 503, 504]);
const maxGeminiAttempts = 3;
const planAgentMaxOutputTokens = 1536;
const materialsMaxOutputTokens = 384;
const maxPlanAgentContinuationTurns = 2;
const planReferenceAnalysisMaxOutputTokens = 2048;

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

  const planReferenceUploads =
    group.planReferenceUploads.length > 0
      ? group.planReferenceUploads
          .slice(0, 4)
          .map((upload, index) => `${index + 1}. ${upload.fileName} - ${upload.summary}`)
          .join("\n")
      : "No plan reference uploads are available.";

  const planReferenceUnits =
    group.planReferenceUnits.length > 0
      ? group.planReferenceUnits
          .slice(0, 24)
          .map((unit) => `${unit.sequence}. ${unit.label} - ${unit.detail}`)
          .join("\n")
      : "No extracted timetable units are available.";

  return [
    ...header,
    "",
    "Plan reference uploads:",
    planReferenceUploads,
    "",
    "Extracted timetable units:",
    planReferenceUnits,
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
    "Use the provided extracted timetable units, roadmap, weekly plan, and group goals to suggest realistic study planning guidance.",
    "Do not claim that changes were already applied.",
    "Treat review management as a personal setting outside this shared planning conversation.",
    "Keep the answer concise enough for a mobile chat UI.",
  ].join(" ");
}

function buildPlanReferenceAnalysisInstruction() {
  return [
    "You analyze uploaded study timetable and syllabus images.",
    "Return only JSON that matches the requested schema.",
    "Preserve the source language from the image when possible.",
    "Focus on visible study topics, objectives, and content.",
    "Ignore teaching method, evaluation activity, empty cells, and decorative text.",
  ].join(" ");
}

function buildPlanReferenceAnalysisPrompt(subject: string, fileName: string) {
  return [
    `Subject: ${subject || "Unknown subject"}`,
    `File name: ${fileName || "plan-reference-image"}`,
    "Task:",
    "1. Read the uploaded timetable or syllabus image in order.",
    "2. Extract ordered learning units.",
    "3. If the image is organized by week, keep one unit per week row.",
    "4. For each unit, write a short label and a detail that merges the visible topic, goal, and content.",
    "5. Omit teaching method and evaluation text even if they appear in the image.",
    "6. Return a one-sentence summary plus the ordered units.",
  ].join("\n");
}

function parseDataUrl(dataUrl: string) {
  const matched = dataUrl.match(/^data:([^;]+);base64,(.+)$/);

  if (!matched) {
    throw new Error("진도표 이미지 형식을 읽지 못했어요. 다시 업로드해 주세요.");
  }

  const [, mimeType, base64Data] = matched;
  return {
    mimeType,
    base64Data,
  };
}

function buildPlanReferenceResponseSchema() {
  return {
    type: "OBJECT",
    required: ["summary", "units"],
    properties: {
      summary: {
        type: "STRING",
      },
      units: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          required: ["label", "detail"],
          properties: {
            label: {
              type: "STRING",
            },
            detail: {
              type: "STRING",
            },
          },
        },
      },
    },
  };
}

function stripJsonCodeFence(value: string) {
  return value
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function normalizeAnalysisText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
}

function sanitizePlanReferenceAnalysis(payload: unknown, fileName: string) {
  if (!payload || typeof payload !== "object") {
    throw new Error("진도표 분석 결과 형식이 올바르지 않아요.");
  }

  const maybeAnalysis = payload as {
    summary?: unknown;
    units?: unknown;
  };

  const units = Array.isArray(maybeAnalysis.units)
    ? maybeAnalysis.units
        .map((unit) => {
          if (!unit || typeof unit !== "object") {
            return null;
          }

          const maybeUnit = unit as {
            label?: unknown;
            detail?: unknown;
          };
          const label = normalizeAnalysisText(maybeUnit.label);
          const detail = normalizeAnalysisText(maybeUnit.detail);

          if (!label) {
            return null;
          }

          return {
            label,
            detail: detail || `${fileName} 기준 ${label} 범위를 학습합니다.`,
          };
        })
        .filter((unit): unit is { label: string; detail: string } => Boolean(unit))
    : [];

  if (units.length === 0) {
    throw new Error("진도표에서 읽을 수 있는 계획 단위를 찾지 못했어요. 더 선명한 이미지로 다시 업로드해 주세요.");
  }

  return {
    summary:
      normalizeAnalysisText(maybeAnalysis.summary) ||
      `${units[0]?.label}부터 ${units[units.length - 1]?.label}까지 ${units.length}개 단위를 추출했어요.`,
    units,
  } satisfies PlanReferenceAnalysisResult;
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

async function requestPlanReferenceAnalysis(
  apiKey: string,
  request: PlanReferenceAnalysisRequest,
) {
  const parsedDataUrl = parseDataUrl(request.imageDataUrl);
  const resolvedMimeType = request.mimeType.trim() || parsedDataUrl.mimeType;

  if (!resolvedMimeType.startsWith("image/")) {
    throw new Error("진도표 분석은 이미지 파일만 지원해요.");
  }

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
            parts: [{ text: buildPlanReferenceAnalysisInstruction() }],
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  inline_data: {
                    mime_type: resolvedMimeType,
                    data: parsedDataUrl.base64Data,
                  },
                },
                {
                  text: buildPlanReferenceAnalysisPrompt(
                    request.subject,
                    request.fileName,
                  ),
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topP: 0.8,
            maxOutputTokens: planReferenceAnalysisMaxOutputTokens,
            responseMimeType: "application/json",
            responseSchema: buildPlanReferenceResponseSchema(),
          },
        }),
        cache: "no-store",
      },
    );

    if (response.ok) {
      const payload = (await response.json()) as GeminiResponse;
      const answer = extractAnswerResult(payload);

      try {
        const parsed = JSON.parse(stripJsonCodeFence(answer.text)) as unknown;
        return sanitizePlanReferenceAnalysis(parsed, request.fileName);
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? error.message
            : "진도표 분석 결과를 해석하지 못했어요.",
        );
      }
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

export async function analyzePlanReferenceImage(
  request: PlanReferenceAnalysisRequest,
) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Gemini API key is missing. Set GEMINI_API_KEY in .env.local.");
  }

  return requestPlanReferenceAnalysis(apiKey, request);
}
