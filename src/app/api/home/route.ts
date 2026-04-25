import { NextResponse } from "next/server";
import { getHomeDashboard } from "@/lib/server/prototype-store";
import { jsonError } from "@/lib/server/route-utils";

export const runtime = "nodejs";

export async function GET() {
  try {
    const response = await getHomeDashboard();
    return NextResponse.json(response);
  } catch (error) {
    return jsonError(error, 500);
  }
}
