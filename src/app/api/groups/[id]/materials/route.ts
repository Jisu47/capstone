import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getMaterials } from "@/lib/server/prototype-store";
import {
  buildMaterialStoragePath,
  extractMaterialSummary,
  inferMaterialFormat,
  inferMaterialMimeType,
  isSupportedMaterialUpload,
  studyMaterialsBucket,
  supportedMaterialUploadMimeTypes,
} from "@/lib/server/material-upload";
import { jsonError } from "@/lib/server/route-utils";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type MembershipRow = {
  member_id: string;
  member_role?: "leader" | "member" | null;
};

type MaterialRecordRow = {
  id: string;
  title: string;
  uploaded_by_member_id: string;
  storage_path?: string | null;
};

function getAccessToken(request: Request) {
  const authorization = request.headers.get("authorization")?.trim();

  if (!authorization?.toLowerCase().startsWith("bearer ")) {
    throw new Error("인증 정보가 없어 자료 업로드를 진행할 수 없어요.");
  }

  const accessToken = authorization.slice("bearer ".length).trim();

  if (!accessToken) {
    throw new Error("인증 토큰이 비어 있어요.");
  }

  return accessToken;
}

async function ensureStudyMaterialsBucket(adminClient: ReturnType<typeof getSupabaseAdminClient>) {
  const bucketResponse = await adminClient.storage.getBucket(studyMaterialsBucket);

  if (bucketResponse.data) {
    return;
  }

  const createResponse = await adminClient.storage.createBucket(studyMaterialsBucket, {
    public: false,
    fileSizeLimit: 50 * 1024 * 1024,
    allowedMimeTypes: supportedMaterialUploadMimeTypes,
  });

  if (
    createResponse.error &&
    !createResponse.error.message.toLowerCase().includes("already exists")
  ) {
    throw new Error(
      `자료 저장 버킷을 준비하지 못했어요: ${createResponse.error.message}`,
    );
  }
}

function shouldRetryLegacyMaterialInsert(message: string) {
  return /storage_path|mime_type/i.test(message);
}

async function saveMaterialMetadata(
  databaseClient: SupabaseClient,
  row: {
    id: string;
    group_id: string;
    title: string;
    summary: string;
    uploaded_by_member_id: string;
    uploaded_at: string;
    format: string;
    location_hint: string;
    storage_path: string;
    mime_type: string;
  },
) {
  const insertResponse = await databaseClient.from("materials").insert(row);

  if (!insertResponse.error) {
    return;
  }

  if (!shouldRetryLegacyMaterialInsert(insertResponse.error.message)) {
    throw new Error(`자료 메타데이터를 저장하지 못했어요: ${insertResponse.error.message}`);
  }

  const legacyRow = {
    id: row.id,
    group_id: row.group_id,
    title: row.title,
    summary: row.summary,
    uploaded_by_member_id: row.uploaded_by_member_id,
    uploaded_at: row.uploaded_at,
    format: row.format,
    location_hint: row.location_hint,
  };
  const legacyInsertResponse = await databaseClient.from("materials").insert(legacyRow);

  if (legacyInsertResponse.error) {
    throw new Error(
      `자료 메타데이터를 저장하지 못했어요: ${legacyInsertResponse.error.message}`,
    );
  }
}

async function cleanupFailedUpload(
  databaseClient: SupabaseClient,
  materialId: string,
  storagePath: string,
) {
  await Promise.allSettled([
    databaseClient.from("materials").delete().eq("id", materialId),
    databaseClient.storage.from(studyMaterialsBucket).remove([storagePath]),
  ]);
}

async function getVerifiedUser(request: Request) {
  const accessToken = getAccessToken(request);
  const serverClient = getSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await serverClient.auth.getUser(accessToken);

  if (authError || !user) {
    throw new Error("?꾩옱 濡쒓렇?명븳 ?ъ슜?먮? ?뺤씤?섏? 紐삵뻽?댁슂. ?ㅼ떆 濡쒓렇?명빐 二쇱꽭??");
  }

  return user;
}

async function getGroupMembership(
  databaseClient: SupabaseClient,
  groupId: string,
  userId: string,
) {
  const membershipResponse = await databaseClient
    .from("group_members")
    .select("member_id, member_role")
    .eq("group_id", groupId)
    .eq("member_id", userId)
    .maybeSingle();

  if (membershipResponse.error) {
    throw new Error(
      `洹몃９ 硫ㅻ쾭??쓣 ?뺤씤?섏? 紐삵뻽?댁슂: ${membershipResponse.error.message}`,
    );
  }

  return (membershipResponse.data ?? null) as MembershipRow | null;
}

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
      return jsonError(new Error("업로드할 파일을 선택해 주세요."), 400);
    }

    if (!isSupportedMaterialUpload(file.name, file.type)) {
      return jsonError(
        new Error("현재는 PDF, TXT, MD, CSV, JSON 같은 텍스트 기반 자료만 업로드할 수 있어요."),
        400,
      );
    }

    let accessToken = "";

    try {
      accessToken = getAccessToken(request);
    } catch (error) {
      return jsonError(error, 401);
    }

    const serverClient = getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await serverClient.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json(
        { error: "현재 로그인한 사용자를 확인하지 못했어요. 다시 로그인해 주세요." },
        { status: 401 },
      );
    }

    const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
    const adminClient = hasServiceRoleKey ? getSupabaseAdminClient() : null;
    const databaseClient = adminClient ?? getSupabaseServerClient();
    const membershipResponse = await databaseClient
      .from("group_members")
      .select("member_id")
      .eq("group_id", id)
      .eq("member_id", user.id)
      .maybeSingle();

    if (membershipResponse.error) {
      throw new Error(
        `그룹 멤버십을 확인하지 못했어요: ${membershipResponse.error.message}`,
      );
    }

    if (!membershipResponse.data) {
      return NextResponse.json(
        { error: "이 스터디 모임의 멤버만 자료를 업로드할 수 있어요." },
        { status: 403 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const resolvedMimeType = inferMaterialMimeType(file.name, file.type);
    const format = inferMaterialFormat(file.name);
    const uploadedAt = new Date().toISOString();
    const materialId = `mat-${randomUUID()}`;
    let storagePath = "";

    if (adminClient) {
      await ensureStudyMaterialsBucket(adminClient);
      storagePath = buildMaterialStoragePath(id, user.id, file.name);

      const uploadResponse = await adminClient.storage
        .from(studyMaterialsBucket)
        .upload(storagePath, buffer, {
          contentType: resolvedMimeType,
          upsert: false,
        });

      if (uploadResponse.error) {
        throw new Error(`자료 파일을 저장하지 못했어요: ${uploadResponse.error.message}`);
      }
    }

    const { summary, locationHint } = await extractMaterialSummary(
      file.name,
      resolvedMimeType,
      buffer,
    );

    try {
      await saveMaterialMetadata(databaseClient, {
        id: materialId,
        group_id: id,
        title: file.name,
        summary,
        uploaded_by_member_id: user.id,
        uploaded_at: uploadedAt,
        format,
        location_hint: locationHint,
        storage_path: storagePath,
        mime_type: resolvedMimeType,
      });

      const groupUpdateResponse = await databaseClient
        .from("study_groups")
        .update({
          recent_update: `${file.name} 자료가 업로드되었습니다.`,
        })
        .eq("id", id);

      if (groupUpdateResponse.error) {
        throw new Error(
          `그룹 최근 활동을 갱신하지 못했어요: ${groupUpdateResponse.error.message}`,
        );
      }
    } catch (error) {
      if (storagePath && adminClient) {
        await cleanupFailedUpload(adminClient, materialId, storagePath);
      }
      throw error;
    }

    return NextResponse.json(
      {
        id: materialId,
        groupId: id,
        title: file.name,
        summary,
        uploadedBy: user.email?.trim() || user.id,
        uploadedAt,
        format,
        locationHint,
        processingStatus: "ready",
        storagePath,
        mimeType: resolvedMimeType,
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const materialId = new URL(request.url).searchParams.get("materialId")?.trim();

    if (!materialId) {
      return jsonError(new Error("???쒗븷 ?먮즺瑜??좏깮??二쇱꽭??"), 400);
    }

    let user: Awaited<ReturnType<typeof getVerifiedUser>>;

    try {
      user = await getVerifiedUser(request);
    } catch (error) {
      return jsonError(error, 401);
    }

    const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
    const adminClient = hasServiceRoleKey ? getSupabaseAdminClient() : null;
    const databaseClient = adminClient ?? getSupabaseServerClient();
    const membership = await getGroupMembership(databaseClient, id, user.id);

    if (!membership) {
      return NextResponse.json(
        { error: "???ㅽ꽣??紐⑥엫??硫ㅻ쾭留??먮즺瑜???젣?????놁뼱??" },
        { status: 403 },
      );
    }

    const materialResponse = await databaseClient
      .from("materials")
      .select("*")
      .eq("group_id", id)
      .eq("id", materialId)
      .maybeSingle();

    if (materialResponse.error) {
      throw new Error(`?먮즺 ?뺣낫瑜?遺덈윭?ㅼ? 紐삵뻽?댁슂: ${materialResponse.error.message}`);
    }

    const material = (materialResponse.data ?? null) as MaterialRecordRow | null;

    if (!material) {
      return NextResponse.json({ error: "?먮즺瑜?李얠? 紐삵뻽?댁슂." }, { status: 404 });
    }

    const canDelete =
      membership.member_role === "leader" || material.uploaded_by_member_id === user.id;

    if (!canDelete) {
      return NextResponse.json(
        { error: "?낅줈?쒗븳 ?ъ슜?먮굹 ???μ옣留??먮즺瑜???젣?????놁뼱??" },
        { status: 403 },
      );
    }

    const deleteResponse = await databaseClient
      .from("materials")
      .delete()
      .eq("group_id", id)
      .eq("id", materialId);

    if (deleteResponse.error) {
      throw new Error(`?먮즺瑜???젣?섏? 紐삵뻽?댁슂: ${deleteResponse.error.message}`);
    }

    if (material.storage_path && adminClient) {
      const removeResponse = await adminClient.storage
        .from(studyMaterialsBucket)
        .remove([material.storage_path]);

      if (removeResponse.error) {
        console.error("Failed to remove material from storage", removeResponse.error);
      }
    }

    const groupUpdateResponse = await databaseClient
      .from("study_groups")
      .update({
        recent_update: `${material.title} ?먮즺瑜???젣?섏뿀?듬땲??`,
      })
      .eq("id", id);

    if (groupUpdateResponse.error) {
      throw new Error(
        `洹몃９ 理쒓렐 ?쒕룞??媛깆떊?섏? 紐삵뻽?댁슂: ${groupUpdateResponse.error.message}`,
      );
    }

    return NextResponse.json({ ok: true, materialId });
  } catch (error) {
    return jsonError(error, 500);
  }
}
