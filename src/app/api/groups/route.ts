import { NextResponse } from "next/server";
import { createGroupRecord, getGroupsResponse } from "@/lib/server/prototype-store";
import { jsonError } from "@/lib/server/route-utils";

export const runtime = "nodejs";

export async function GET() {
  try {
    const response = await getGroupsResponse();
    return NextResponse.json(response);
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const group = await createGroupRecord(payload);
    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    return jsonError(error, 400);
  }
}
