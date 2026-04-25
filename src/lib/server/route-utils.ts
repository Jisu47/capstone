import { NextResponse } from "next/server";

export function jsonError(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
  return NextResponse.json({ error: message }, { status });
}
