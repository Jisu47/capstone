import { NextResponse } from "next/server";
import { askQuestion } from "@/lib/server/prototype-store";
import { jsonError } from "@/lib/server/route-utils";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const payload = await request.json();
    const response = await askQuestion(id, payload);
    return NextResponse.json(response);
  } catch (error) {
    return jsonError(error, 400);
  }
}
