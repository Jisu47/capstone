import { NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/server/route-utils";

export const runtime = "nodejs";

function getAccessToken(request: Request) {
  const authorization = request.headers.get("authorization")?.trim();

  if (!authorization?.toLowerCase().startsWith("bearer ")) {
    throw new Error("인증 정보가 없어 회원 탈퇴를 진행할 수 없어요.");
  }

  const accessToken = authorization.slice("bearer ".length).trim();

  if (!accessToken) {
    throw new Error("인증 토큰이 비어 있어요.");
  }

  return accessToken;
}

export async function POST(request: Request) {
  try {
    const accessToken = getAccessToken(request);
    const serverClient = getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await serverClient.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json(
        { error: "현재 로그인 사용자를 확인하지 못했어요. 다시 로그인해 주세요." },
        { status: 401 },
      );
    }

    const adminClient = getSupabaseAdminClient();
    const leaderMemberships = await adminClient
      .from("group_members")
      .select("group_id")
      .eq("member_id", user.id)
      .eq("member_role", "leader");

    if (leaderMemberships.error) {
      throw new Error(`리더 멤버십을 확인하지 못했어요: ${leaderMemberships.error.message}`);
    }

    if ((leaderMemberships.data ?? []).length > 0) {
      return NextResponse.json(
        {
          error:
            "팀장으로 참여 중인 그룹이 있어 회원 탈퇴를 진행할 수 없어요. 먼저 권한을 위임하거나 그룹을 정리해 주세요.",
        },
        { status: 409 },
      );
    }

    const deleteProfile = await adminClient.from("profiles").delete().eq("id", user.id);

    if (deleteProfile.error) {
      throw new Error(`프로필 삭제에 실패했어요: ${deleteProfile.error.message}`);
    }

    const deleteAuthUser = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteAuthUser.error) {
      throw new Error(`Auth 계정 삭제에 실패했어요: ${deleteAuthUser.error.message}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, 500);
  }
}
