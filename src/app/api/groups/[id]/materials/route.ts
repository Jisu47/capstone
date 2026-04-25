import { NextResponse } from "next/server";
import { getMaterials, uploadMaterial } from "@/lib/server/prototype-store";
import { jsonError } from "@/lib/server/route-utils";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const response = await getMaterials(id);
    return NextResponse.json(response);
  } catch (error) {
    return jsonError(error, 400);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError(new Error("업로드할 파일을 선택해 주세요."));
    }

    const response = await uploadMaterial(id, file);
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return jsonError(error, 400);
  }
}
