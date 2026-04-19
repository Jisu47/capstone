import type { NextRequest } from "next/server";
import type { AiChatRequest, AiChatResponse } from "@/lib/ai-chat";
import { generateGeminiAnswer, getGeminiModel } from "@/lib/gemini";

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
    const message =
      error instanceof Error ? error.message : "Failed to generate Gemini response.";

    return Response.json({ error: message }, { status: 500 });
  }
}
