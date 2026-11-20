import { aiErrorResponse } from "@/lib/server/openai";
import type { NextRequest } from "next/server";
import { analyzePlanReferenceImage } from "@/lib/server/study-ai";

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
    return aiErrorResponse(error, "진도표 이미지를 분석하는 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.");
  }
}
