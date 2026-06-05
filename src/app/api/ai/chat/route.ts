import type { NextRequest } from "next/server";
import type { AiChatRequest, AiChatResponse } from "@/lib/ai-chat";
import {
  GeminiRequestError,
  generateGeminiAnswer,
  getGeminiModel,
} from "@/lib/gemini";

export const runtime = "nodejs";

function isValidRequest(body: unknown): body is AiChatRequest {
  if (!body || typeof body !== "object") {
    return false;
  }

  const request = body as Partial<AiChatRequest>;
  return (
    (request.scope === "materials" || request.scope === "plan-agent") &&
    typeof request.question === "string" &&
    Array.isArray(request.history) &&
    Boolean(request.group) &&
    typeof request.group?.id === "string" &&
    typeof request.group?.name === "string" &&
    typeof request.group?.subject === "string"
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;

    if (!isValidRequest(body)) {
      return Response.json({ error: "Invalid AI chat request." }, { status: 400 });
    }

    const text = await generateGeminiAnswer(body);
    const response: AiChatResponse = {
      text,
      model: getGeminiModel(),
    };

    return Response.json(response);
  } catch (error) {
    if (error instanceof GeminiRequestError) {
      if (error.status === 503 || error.status === 429) {
        return Response.json(
          {
            error:
              "현재 AI 응답 요청이 많아 답변이 잠시 지연되고 있어요. 잠시 후 다시 시도해 주세요.",
          },
          { status: error.status },
        );
      }

      if (error.status >= 500) {
        return Response.json(
          {
            error:
              "AI 응답을 준비하는 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.",
          },
          { status: error.status },
        );
      }

      return Response.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Failed to generate Gemini response.";

    return Response.json({ error: message }, { status: 500 });
  }
}
