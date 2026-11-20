import "server-only";

import OpenAI from "openai";
import type { ResponseCreateParamsNonStreaming } from "openai/resources/responses/responses";

// One model configuration for chat, vision and the retained prototype endpoint.
export function getOpenAIModel() {
  return process.env.OPENAI_MODEL?.trim() || "gpt-5.4-mini";
}

export class AiRequestError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "AiRequestError";
  }
}

export async function requestOpenAI(
  request: Omit<ResponseCreateParamsNonStreaming, "model" | "store" | "stream">,
) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new AiRequestError(503, "AI 서비스 설정이 준비되지 않았어요. 관리자에게 문의해 주세요.");
  }

  try {
    const client = new OpenAI({ apiKey, maxRetries: 0, timeout: 45_000 });
    const model = getOpenAIModel();
    const response = await client.responses.create({
      ...request,
      // GPT-5.4 supports none: preserve the existing short visible-output budgets.
      ...(model.startsWith("gpt-5.4") ? { reasoning: { effort: "none" as const } } : {}),
      model,
      store: false,
      stream: false,
    });

    if (response.output.some((item) =>
      item.type === "message" && item.content.some((part) => part.type === "refusal"),
    )) {
      throw new AiRequestError(422, "이 요청에 대한 AI 응답을 제공하기 어려워요. 내용을 바꿔 다시 시도해 주세요.");
    }
    if (response.status !== "completed" && response.status !== "incomplete") {
      throw new AiRequestError(502, "AI 응답을 준비하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
    if (!response.output_text?.trim()) {
      throw new AiRequestError(502, "AI 응답이 비어 있어요. 잠시 후 다시 시도해 주세요.");
    }
    return response;
  } catch (error) {
    if (error instanceof AiRequestError) throw error;
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        throw new AiRequestError(429, "현재 AI 요청 한도에 도달했어요. 잠시 후 다시 시도해 주세요.");
      }
      if (error.status === 401 || error.status === 403) {
        throw new AiRequestError(503, "AI 서비스 인증 설정을 확인해야 해요. 관리자에게 문의해 주세요.");
      }
    }
    // Never forward SDK messages, upstream bodies or credentials to the browser.
    throw new AiRequestError(502, "AI 서비스에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.");
  }
}

export function aiErrorResponse(error: unknown, fallback: string) {
  if (error instanceof AiRequestError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof SyntaxError) {
    return Response.json({ error: "요청 형식이 올바르지 않아요." }, { status: 400 });
  }
  return Response.json({ error: fallback }, { status: 500 });
}
