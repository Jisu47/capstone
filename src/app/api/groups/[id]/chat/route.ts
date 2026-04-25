import { NextResponse } from "next/server";
import { getChat } from "@/lib/server/prototype-store";
import { jsonError } from "@/lib/server/route-utils";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const response = await getChat(id);
    return NextResponse.json(response);
  } catch (error) {
    return jsonError(error, 400);
  }
}
