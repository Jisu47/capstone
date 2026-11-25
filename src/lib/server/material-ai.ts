import "server-only";

import path from "node:path";
import { AiRequestError } from "@/lib/server/openai";
import { studyMaterialsBucket } from "@/lib/server/material-upload";
import { getSupabaseAdminClient, getSupabaseServerClient, getSupabaseUserServerClient } from "@/lib/supabase/server";

const maxTextLength = 30000;

export async function readSelectedMaterial(request: Request, groupId: string, materialId?: string) {
  if (!materialId || typeof materialId !== "string") throw new AiRequestError(400, "질문할 자료를 선택해 주세요.");
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw new AiRequestError(401, "다시 로그인해 주세요.");
  const { data: { user }, error: authError } = await getSupabaseServerClient().auth.getUser(token);
  if (authError || !user) throw new AiRequestError(401, "로그인 정보를 확인하지 못했어요. 다시 로그인해 주세요.");
  const client = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ? getSupabaseAdminClient() : getSupabaseUserServerClient(token);
  const membership = await client.from("group_members").select("member_id").eq("group_id", groupId).eq("member_id", user.id).maybeSingle();
  if (membership.error) throw new AiRequestError(500, "그룹 멤버십을 확인하지 못했어요.");
  if (!membership.data) throw new AiRequestError(403, "이 그룹의 멤버만 자료를 사용할 수 있어요.");
  const result = await client.from("materials").select("title, storage_path, mime_type").eq("group_id", groupId).eq("id", materialId).maybeSingle();
  if (result.error || !result.data?.storage_path) throw new AiRequestError(404, "선택한 자료의 원본을 찾을 수 없어요. 다시 업로드해 주세요.");
  const { title, storage_path: storagePath, mime_type: mimeType } = result.data;
  const extension = path.extname(title).toLowerCase();
  const isPdf = extension === ".pdf" || mimeType === "application/pdf";
  if (!isPdf && ![".txt", ".md", ".markdown", ".csv", ".json"].includes(extension) && !mimeType?.startsWith("text/")) {
    throw new AiRequestError(400, "이 파일 형식은 자료 AI에서 읽을 수 없어요. PDF, TXT 또는 MD 파일을 선택해 주세요.");
  }
  const download = await client.storage.from(studyMaterialsBucket).download(storagePath);
  if (download.error || !download.data) throw new AiRequestError(404, "선택한 자료의 원본을 가져오지 못했어요. 다시 업로드해 주세요.");
  if (download.data.size > 50 * 1024 * 1024) throw new AiRequestError(413, "자료 파일이 너무 커서 읽을 수 없어요.");
  let text = "";
  let truncated = false;
  try {
    if (isPdf) {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(await download.data.arrayBuffer()), useSystemFonts: true }).promise;
      try {
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
          const page = await pdf.getPage(pageNumber);
          const content = await page.getTextContent();
          text += content.items.map((item) => "str" in item ? item.str : "").join(" ") + "\n";
          if (text.length > maxTextLength) { truncated = true; break; }
        }
      } finally { await pdf.destroy(); }
    } else {
      text = await download.data.text();
      truncated = text.length > maxTextLength;
    }
  } catch {
    throw new AiRequestError(422, "자료의 본문을 읽지 못했어요. 파일이 손상되었거나 암호로 보호되어 있는지 확인해 주세요.");
  }
  text = text.replace(/\u0000/g, "").trim();
  if (!text) throw new AiRequestError(422, isPdf ? "PDF에서 텍스트를 추출하지 못했어요. 이미지로 된 PDF는 지원하지 않아요." : "자료에서 읽을 수 있는 본문이 없어요.");
  return { fileName: title, text: text.slice(0, maxTextLength), truncated };
}
