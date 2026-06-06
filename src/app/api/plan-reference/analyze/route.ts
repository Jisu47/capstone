import type { NextRequest } from "next/server";
import {
  analyzePlanReferenceImage,
  GeminiRequestError,
} from "@/lib/gemini";

export const runtime = "nodejs";

type PlanReferenceAnalyzeRequest = {
  subject: string;
  fileName: string;
  mimeType: string;
  imageDataUrl: string;
};

function isValidRequest(body: unknown): body is PlanReferenceAnalyzeRequest {
  if (!body || typeof body !== "object") {
    return false;
  }

  const request = body as Partial<PlanReferenceAnalyzeRequest>;

  return (
    typeof request.subject === "string" &&
    typeof request.fileName === "string" &&
    typeof request.mimeType === "string" &&
    typeof request.imageDataUrl === "string"
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;

    if (!isValidRequest(body)) {
      return Response.json(
        { error: "Invalid plan reference analysis request." },
        { status: 400 },
      );
    }

    const analysis = await analyzePlanReferenceImage(body);
    return Response.json(analysis);
  } catch (error) {
    if (error instanceof GeminiRequestError) {
      if (error.status === 503 || error.status === 429) {
        return Response.json(
          {
            error:
              "현재 진도표 분석 요청이 많아 응답이 잠시 지연되고 있어요. 잠시 후 다시 시도해 주세요.",
          },
          { status: error.status },
        );
      }

      if (error.status >= 500) {
        return Response.json(
          {
            error:
              "진도표 이미지를 분석하는 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.",
          },
          { status: error.status },
        );
      }

      return Response.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error
        ? error.message
        : "Failed to analyze the uploaded plan reference image.";

    return Response.json({ error: message }, { status: 500 });
  }
}
