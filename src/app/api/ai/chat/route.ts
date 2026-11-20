import { aiErrorResponse } from "@/lib/server/openai";
import type { NextRequest } from "next/server";
import type { AiChatRequest, AiChatResponse } from "@/lib/ai-chat";
import { generateAiAnswer } from "@/lib/server/study-ai";

export const runtime = "nodejs";

function isValidRequest(body: unknown): body is AiChatRequest {
  if (!body || typeof body !== "object") {
    return false;
  }

  const request = body as Partial<AiChatRequest>;
  return (
    (request.scope === "materials" || request.scope === "plan-agent") &&
    typeof request.question === "string" && request.question.trim().length > 0 &&
    Array.isArray(request.history) &&
    request.history.every((entry) => entry &&
      (entry.role === "user" || entry.role === "assistant") && typeof entry.text === "string") &&
    Boolean(request.group) &&
    typeof request.group?.id === "string" &&
    typeof request.group?.name === "string" &&
    typeof request.group?.subject === "string" &&
    ["weeklyGoal", "overallGoal", "description", "recentUpdate"].every(
      (key) => typeof (request.group as unknown as Record<string, unknown>)[key] === "string",
    ) &&
    ["materials", "plan", "roadmap", "planReferenceUploads", "planReferenceUnits"].every(
      (key) => Array.isArray((request.group as unknown as Record<string, unknown>)[key]),
    )
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;

    if (!isValidRequest(body)) {
      return Response.json({ error: "Invalid AI chat request." }, { status: 400 });
    }

    const answer = await generateAiAnswer(body);
    const response: AiChatResponse = {
      text: answer.text,
      model: answer.model,
      finishReason: answer.finishReason,
      finishMessage: answer.finishMessage,
      isComplete: answer.isComplete,
      planAgentDraft: answer.planAgentDraft,
    };

    return Response.json(response);
  } catch (error) {
    return aiErrorResponse(error, "AI 응답을 준비하는 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.");
  }
}
