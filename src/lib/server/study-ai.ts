import "server-only";

import type { ResponseInput } from "openai/resources/responses/responses";
import { AiRequestError, requestOpenAI } from "@/lib/server/openai";
import type {
  AiChatGroupContext,
  AiChatHistoryEntry,
  AiChatRequest,
  AiChatScope,
} from "@/lib/ai-chat";
import {
  normalizePlanAgentDraftPayload,
  planAgentDraftMarker,
  type PlanAgentDraft,
  type PlanReferenceAnalysisResult,
} from "@/lib/plan-flow";

export type AiAnswerResult = {
  text: string;
  finishReason: string | null;
  finishMessage: string | null;
  isComplete: boolean;
  model: string;
  planAgentDraft: PlanAgentDraft | null;
};

export type PlanReferenceAnalysisRequest = {
  subject: string;
  fileName: string;
  mimeType: string;
  imageDataUrl: string;
};

const planAgentMaxOutputTokens = 1536;
const materialsMaxOutputTokens = 384;
const maxPlanAgentContinuationTurns = 2;
const planReferenceAnalysisMaxOutputTokens = 2048;
const materialsHistoryLimit = 8;
const planAgentHistoryLimit = 4;
const materialsContextMaterialLimit = 5;
const planContextUploadLimit = 2;
const planContextDetailedUnitLimit = 6;
const planContextOutlineUnitLimit = 10;
const planContextRoadmapLimit = 4;
const planContextWeeklyPlanLimit = 4;
const maxContextLineLength = 88;

function trimHistory(scope: AiChatScope, history: AiChatHistoryEntry[]): ResponseInput {
  const historyLimit = scope === "materials" ? materialsHistoryLimit : planAgentHistoryLimit;

  return history
    .slice(-historyLimit)
    .filter((entry) => entry.text.trim().length > 0)
    .map((entry) => ({
      role: entry.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: entry.text.trim(),
    }));
}

function buildChatInput(
  scope: AiChatScope,
  group: AiChatGroupContext,
  history: AiChatHistoryEntry[],
  question: string,
): ResponseInput {
  return [
    {
      role: "user",
      content: buildGroupContext(scope, group, question),
    },
    ...trimHistory(scope, history),
    {
      role: "user",
      content: question.trim(),
    },
  ];
}

function compactContextText(value: string, maxLength = maxContextLineLength) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(1, maxLength - 1)).trimEnd()}…`;
}

function appendOmittedNotice(lines: string[], omittedCount: number, noun: string) {
  if (omittedCount > 0) {
    lines.push(`... and ${omittedCount} more ${noun}.`);
  }
}

function detectPlanAgentFocus(question: string) {
  const normalized = question.replace(/\s+/g, "").toLowerCase();

  if (/전체계획|로드맵|주차별|진도표기준|전체정리/.test(normalized)) {
    return "roadmap" as const;
  }

  if (/이번주|주간|이번주계획|이번주할일/.test(normalized)) {
    return "weekly" as const;
  }

  return "general" as const;
}

function extractRequestedWeekNumber(question: string) {
  const matched = question.match(/(\d+)\s*주차/i);

  if (!matched) {
    return null;
  }

  const parsed = Number.parseInt(matched[1] ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function extractUnitWeekNumber(unit: AiChatGroupContext["planReferenceUnits"][number]) {
  const matched = `${unit.label} ${unit.detail}`.match(/(\d+)\s*주차/i);

  if (!matched) {
    return null;
  }

  const parsed = Number.parseInt(matched[1] ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function buildPlanReferenceUnitSearchText(
  unit: AiChatGroupContext["planReferenceUnits"][number],
) {
  return `${unit.label} ${unit.detail}`.replace(/\s+/g, " ").trim().toLowerCase();
}

function buildFocusedUnitOrder(
  units: AiChatGroupContext["planReferenceUnits"],
  requestedWeekNumber: number,
) {
  const sortedUnits = [...units].sort((left, right) => left.sequence - right.sequence);
  const explicitWeekPattern = new RegExp(`${requestedWeekNumber}\\s*주차`, "i");
  const explicitMatches = sortedUnits.filter((unit) => {
    const weekNumber = extractUnitWeekNumber(unit);

    if (weekNumber === requestedWeekNumber) {
      return true;
    }

    return explicitWeekPattern.test(buildPlanReferenceUnitSearchText(unit));
  });

  if (explicitMatches.length > 0) {
    const focusedSequences = new Set(explicitMatches.map((unit) => unit.sequence));
    const focusedIndexes = sortedUnits
      .map((unit, index) => (focusedSequences.has(unit.sequence) ? index : -1))
      .filter((index) => index >= 0);
    const orderedIndexes = [...focusedIndexes];
    let radius = 1;

    while (orderedIndexes.length < sortedUnits.length) {
      let added = false;

      for (const focusIndex of focusedIndexes) {
        const previousIndex = focusIndex - radius;
        const nextIndex = focusIndex + radius;

        if (previousIndex >= 0 && !orderedIndexes.includes(previousIndex)) {
          orderedIndexes.push(previousIndex);
          added = true;
        }

        if (nextIndex < sortedUnits.length && !orderedIndexes.includes(nextIndex)) {
          orderedIndexes.push(nextIndex);
          added = true;
        }
      }

      if (!added) {
        break;
      }

      radius += 1;
    }

    return orderedIndexes.map((index) => sortedUnits[index]);
  }

  if (requestedWeekNumber <= sortedUnits.length) {
    const focusIndex = requestedWeekNumber - 1;
    const orderedIndexes = [focusIndex];
    let radius = 1;

    while (orderedIndexes.length < sortedUnits.length) {
      let added = false;
      const previousIndex = focusIndex - radius;
      const nextIndex = focusIndex + radius;

      if (previousIndex >= 0 && !orderedIndexes.includes(previousIndex)) {
        orderedIndexes.push(previousIndex);
        added = true;
      }

      if (nextIndex < sortedUnits.length && !orderedIndexes.includes(nextIndex)) {
        orderedIndexes.push(nextIndex);
        added = true;
      }

      if (!added) {
        break;
      }

      radius += 1;
    }

    return orderedIndexes.map((index) => sortedUnits[index]);
  }

  return sortedUnits;
}

function buildPlanReferenceUnitLines(
  units: AiChatGroupContext["planReferenceUnits"],
  question: string,
  detailedLimit: number,
  outlineLimit: number,
) {
  if (units.length === 0) {
    return {
      requestedWeekNumber: extractRequestedWeekNumber(question),
      lines: ["No extracted timetable units are available."],
    };
  }

  const requestedWeekNumber = extractRequestedWeekNumber(question);
  const prioritizedUnits =
    requestedWeekNumber === null
      ? [...units].sort((left, right) => left.sequence - right.sequence)
      : buildFocusedUnitOrder(units, requestedWeekNumber);
  const detailedUnits = prioritizedUnits.slice(0, detailedLimit).map(
    (unit) =>
      `${unit.sequence}. ${compactContextText(unit.label, 40)} - ${compactContextText(unit.detail, 64)}`,
  );
  const outlineUnits = prioritizedUnits
    .slice(detailedLimit, detailedLimit + outlineLimit)
    .map((unit) => `${unit.sequence}. ${compactContextText(unit.label, 52)}`);
  const omittedCount = Math.max(0, prioritizedUnits.length - detailedLimit - outlineLimit);
  const lines = [...detailedUnits];

  if (requestedWeekNumber !== null) {
    lines.unshift(`Week-specific focus: prioritize ${requestedWeekNumber}주차-related units first.`);
  }

  if (outlineUnits.length > 0) {
    lines.push("Additional unit labels:");
    lines.push(...outlineUnits);
  }

  appendOmittedNotice(lines, omittedCount, "timetable units");
  return {
    requestedWeekNumber,
    lines,
  };
}

function buildRoadmapLines(roadmap: AiChatGroupContext["roadmap"], limit: number) {
  if (roadmap.length === 0) {
    return ["No roadmap has been generated yet."];
  }

  const lines = roadmap.slice(0, limit).map(
    (item) =>
      `${item.weekNumber}. ${compactContextText(item.title, 42)} - ${compactContextText(item.summary, 68)}`,
  );
  appendOmittedNotice(lines, Math.max(0, roadmap.length - limit), "roadmap items");
  return lines;
}

function buildWeeklyPlanLines(plan: AiChatGroupContext["plan"], limit: number) {
  if (plan.length === 0) {
    return ["No weekly plan is available."];
  }

  const lines = plan.slice(0, limit).map(
    (item) =>
      `${item.day}: ${compactContextText(item.title, 36)} / ${compactContextText(item.detail, 54)} / ${item.duration}`,
  );
  appendOmittedNotice(lines, Math.max(0, plan.length - limit), "weekly plan items");
  return lines;
}

function buildGroupContext(
  scope: AiChatScope,
  group: AiChatGroupContext,
  question: string,
) {
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
            .slice(0, materialsContextMaterialLimit)
            .map(
              (material, index) =>
                `${index + 1}. ${compactContextText(material.title, 38)} (${material.locationHint}) - ${compactContextText(material.summary, 68)}`,
            )
            .join("\n")
        : "No shared materials are available.";

    const planPreview =
      group.plan.length > 0
        ? group.plan
            .slice(0, 5)
            .map(
              (item) =>
                `${item.day}: ${compactContextText(item.title, 32)} / ${compactContextText(item.detail, 46)} / ${item.duration}`,
            )
            .join("\n")
        : "No weekly plan is available.";

    return `${header.join("\n")}\n\nShared materials:\n${materials}\n\nCurrent weekly plan:\n${planPreview}`;
  }

  const focus = detectPlanAgentFocus(question);
  const unitDetailedLimit =
    focus === "roadmap" ? planContextDetailedUnitLimit + 2 : planContextDetailedUnitLimit;
  const unitOutlineLimit =
    focus === "roadmap" ? planContextOutlineUnitLimit + 2 : planContextOutlineUnitLimit;
  const roadmapLimit =
    focus === "roadmap" ? planContextRoadmapLimit + 2 : planContextRoadmapLimit;
  const weeklyPlanLimit =
    focus === "weekly" ? planContextWeeklyPlanLimit + 2 : planContextWeeklyPlanLimit;

  const planReferenceUploads =
    group.planReferenceUploads.length > 0
      ? group.planReferenceUploads
          .slice(0, planContextUploadLimit)
          .map(
            (upload, index) =>
              `${index + 1}. ${compactContextText(upload.fileName, 38)} - ${compactContextText(upload.summary, 68)}`,
          )
      : ["No plan reference uploads are available."];
  const planReferenceUnitContext = buildPlanReferenceUnitLines(
    group.planReferenceUnits,
    question,
    unitDetailedLimit,
    unitOutlineLimit,
  );
  const roadmap = buildRoadmapLines(group.roadmap, roadmapLimit);
  const weeklyPlan = buildWeeklyPlanLines(group.plan, weeklyPlanLimit);

  return [
    ...header,
    "",
    `Planning focus: ${focus}`,
    ...(planReferenceUnitContext.requestedWeekNumber !== null
      ? ["Requested week: " + `${planReferenceUnitContext.requestedWeekNumber}주차`, ""]
      : []),
    "",
    "Plan reference uploads:",
    ...planReferenceUploads,
    "",
    "Extracted timetable units:",
    ...planReferenceUnitContext.lines,
    "",
    "Roadmap:",
    ...roadmap,
    "",
    "Weekly plan:",
    ...weeklyPlan,
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
    "If the user asks about a specific week, prioritize the extracted unit labels and details that match that week before using earlier weeks.",
    "The provided context may be compacted or partially truncated for speed, so prioritize the most relevant details and briefly say what extra information would help if needed.",
    "Do not claim that changes were already applied.",
    "Treat review management as a personal setting outside this shared planning conversation.",
    "After the visible Korean answer, append a new line with the exact marker <<PLAN_AGENT_DRAFT>> and then output one JSON object only.",
    'The JSON object must include: {"scope":"weekly-plan","weeklyGoal":"...","recentUpdate":"...","weeklyPlan":[{"day":"월","title":"...","detail":"...","duration":"60분"}]}.',
    "Use the seven weekdays 월, 화, 수, 목, 금, 토, 일 in the weeklyPlan array, and keep the plan structured as one week from Monday through Sunday.",
    "Do not wrap the JSON in markdown code fences and do not mention the marker or JSON in the visible answer.",
    "Keep the answer concise enough for a mobile chat UI.",
  ].join(" ");
}

function buildPlanReferenceAnalysisInstruction() {
  return [
    "You analyze uploaded study timetable and syllabus images.",
    "Preserve the source language from the image when possible.",
    "Focus on visible study topics, objectives, and content.",
    "Ignore teaching method, evaluation activity, empty cells, and decorative text.",
    "Return plain text only.",
  ].join(" ");
}

function buildPlanReferenceAnalysisPrompt(subject: string, fileName: string) {
  return [
    `Subject: ${subject || "Unknown subject"}`,
    `File name: ${fileName || "plan-reference-image"}`,
    "Task:",
    "1. Read the uploaded timetable or syllabus image in order.",
    "2. Read the full image from top to bottom and left to right, and do not stop after the first detected row or first week.",
    "3. Extract every visible ordered learning unit that you can identify.",
    "4. If the image is organized by week, keep one unit per visible week row and preserve the week label in the unit label.",
    "5. For each unit, write a short label and a detail that merges the visible topic, goal, and content.",
    "6. Omit teaching method and evaluation text even if they appear in the image.",
    "7. Use this exact output format:",
    "SUMMARY: one sentence summary",
    "UNIT: label || detail",
    "UNIT: label || detail",
    "8. Output as many UNIT lines as there are visible rows or weeks.",
    "9. Do not output JSON, markdown fences, numbering, or extra commentary.",
  ].join("\n");
}

function parseDataUrl(dataUrl: string) {
  const matched = dataUrl.match(/^data:([^;]+);base64,(.+)$/);

  if (!matched) {
    throw new AiRequestError(400, "진도표 이미지 형식을 읽지 못했어요. 다시 업로드해 주세요.");
  }

  const [, mimeType, base64Data] = matched;
  return {
    mimeType,
    base64Data,
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

function parsePlanReferenceAnalysisText(value: string, fileName: string) {
  const normalized = stripJsonCodeFence(value);

  try {
    return sanitizePlanReferenceAnalysis(JSON.parse(normalized) as unknown, fileName);
  } catch {
    // Fall back to the plain-text extraction format below.
  }

  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  let summary = "";
  const units: Array<{ label: string; detail: string }> = [];

  for (const line of lines) {
    if (/^summary\s*:/i.test(line)) {
      summary = normalizeAnalysisText(line.replace(/^summary\s*:/i, ""));
      continue;
    }

    if (!/^unit\s*:/i.test(line)) {
      continue;
    }

    const unitText = line.replace(/^unit\s*:/i, "").trim();
    const splitByDoublePipe = unitText.split(/\s*\|\|\s*/);

    if (splitByDoublePipe.length >= 2) {
      const [labelPart, ...detailParts] = splitByDoublePipe;
      const label = normalizeAnalysisText(labelPart);
      const detail = normalizeAnalysisText(detailParts.join(" || "));

      if (label) {
        units.push({
          label,
          detail: detail || `${fileName} 기준 ${label} 범위를 학습합니다.`,
        });
      }

      continue;
    }

    const splitBySinglePipe = unitText.split(/\s*\|\s*/);

    if (splitBySinglePipe.length >= 2) {
      const [labelPart, ...detailParts] = splitBySinglePipe;
      const label = normalizeAnalysisText(labelPart);
      const detail = normalizeAnalysisText(detailParts.join(" | "));

      if (label) {
        units.push({
          label,
          detail: detail || `${fileName} 기준 ${label} 범위를 학습합니다.`,
        });
      }

      continue;
    }

    const splitByDash = unitText.split(/\s+-\s+/);

    if (splitByDash.length >= 2) {
      const [labelPart, ...detailParts] = splitByDash;
      const label = normalizeAnalysisText(labelPart);
      const detail = normalizeAnalysisText(detailParts.join(" - "));

      if (label) {
        units.push({
          label,
          detail: detail || `${fileName} 기준 ${label} 범위를 학습합니다.`,
        });
      }
    }
  }

  return sanitizePlanReferenceAnalysis(
    {
      summary,
      units,
    },
    fileName,
  );
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

function extractPlanAgentDraftFromAnswer(text: string) {
  const marker = `\n${planAgentDraftMarker}\n`;
  const markerIndex = text.lastIndexOf(marker);

  if (markerIndex < 0) {
    return {
      visibleText: text.trim(),
      draft: null as PlanAgentDraft | null,
    };
  }

  const visibleText = text.slice(0, markerIndex).trim();
  const payloadText = stripJsonCodeFence(text.slice(markerIndex + marker.length).trim());

  try {
    return {
      visibleText,
      draft: normalizePlanAgentDraftPayload(JSON.parse(payloadText)),
    };
  } catch {
    return {
      visibleText,
      draft: null as PlanAgentDraft | null,
    };
  }
}

function buildContinuationPrompt() {
  return [
    "방금 답변이 길어서 중간에 끊겼습니다.",
    "직전 문장 다음부터 바로 이어서 작성해 주세요.",
    "이미 작성한 내용은 반복하지 말고 남은 답변만 계속 작성해 주세요.",
  ].join(" ");
}

export async function generateAiAnswer({ scope, question, history, group }: AiChatRequest): Promise<AiAnswerResult> {
  let input = buildChatInput(scope, group, history, question);
  let combinedText = "";
  let result: AiAnswerResult | null = null;
  const maxContinuationTurns = scope === "plan-agent" ? maxPlanAgentContinuationTurns : 0;

  for (let turn = 0; turn <= maxContinuationTurns; turn += 1) {
    const response = await requestOpenAI({
      instructions: buildSystemInstruction(scope),
      input,
      temperature: scope === "materials" ? 0.45 : 0.65,
      max_output_tokens: scope === "materials" ? materialsMaxOutputTokens : planAgentMaxOutputTokens,
    });
    // Keep raw text until all continuations are merged: a token boundary can split the draft JSON.
    const text = response.output_text;
    const separator = combinedText.includes(planAgentDraftMarker) ? "" : "\n";
    combinedText = combinedText ? `${combinedText}${separator}${text}` : text;
    const truncated = response.status === "incomplete" && response.incomplete_details?.reason === "max_output_tokens";
    result = {
      text: combinedText,
      finishReason: truncated ? "MAX_TOKENS" : response.status === "completed" ? "STOP" : "INCOMPLETE",
      finishMessage: null,
      isComplete: response.status === "completed",
      model: response.model,
      planAgentDraft: null,
    };
    if (!truncated || scope !== "plan-agent") break;
    input = [...input, { role: "assistant", content: text }, { role: "user", content: buildContinuationPrompt() }];
  }

  if (!result) throw new AiRequestError(502, "AI 응답을 준비하지 못했어요.");
  const parsed = scope === "plan-agent"
    ? extractPlanAgentDraftFromAnswer(combinedText)
    : { visibleText: combinedText, draft: null };
  if (!parsed.visibleText || (result.isComplete && combinedText.includes(planAgentDraftMarker) && !parsed.draft)) {
    throw new AiRequestError(502, "계획 초안 응답 형식을 읽지 못했어요. 다시 시도해 주세요.");
  }
  // An incomplete draft must never become an applicable plan.
  return { ...result, text: parsed.visibleText, planAgentDraft: result.isComplete ? parsed.draft : null };
}

export async function analyzePlanReferenceImage(request: PlanReferenceAnalysisRequest) {
  const parsed = parseDataUrl(request.imageDataUrl);
  const mimeType = request.mimeType.trim() || parsed.mimeType;
  if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(mimeType) || mimeType !== parsed.mimeType) {
    throw new AiRequestError(400, "진도표 분석은 PNG, JPEG, WEBP, GIF 이미지 파일을 지원해요.");
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(parsed.base64Data)) {
    throw new AiRequestError(400, "진도표 이미지 형식을 읽지 못했어요. 다시 업로드해 주세요.");
  }
  const response = await requestOpenAI({
    instructions: buildPlanReferenceAnalysisInstruction(),
    input: [{ role: "user", content: [
      { type: "input_text", text: buildPlanReferenceAnalysisPrompt(request.subject, request.fileName) },
      { type: "input_image", image_url: request.imageDataUrl, detail: "high" },
    ] }],
    temperature: 0.1,
    max_output_tokens: planReferenceAnalysisMaxOutputTokens,
  });
  if (response.status !== "completed") {
    throw new AiRequestError(502, "진도표 이미지 분석이 완료되지 않았어요. 다시 시도해 주세요.");
  }
  try {
    return parsePlanReferenceAnalysisText(response.output_text, request.fileName);
  } catch {
    throw new AiRequestError(502, "진도표에서 읽을 수 있는 계획 단위를 찾지 못했어요. 더 선명한 이미지로 다시 업로드해 주세요.");
  }
}
