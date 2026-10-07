import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const metadataKey = "study_flow_hidden_group_ids";

function readHiddenGroupIds(metadata: Record<string, unknown>): string[] {
  const value = metadata[metadataKey];
  return Array.isArray(value)
    ? [...new Set(value.filter((id): id is string => typeof id === "string" && id.length > 0))]
    : [];
}

async function getCurrentUser(userId: string) {
  const { data, error } = await getSupabaseBrowserClient().auth.getUser();
  if (error) throw new Error("숨긴 그룹 설정을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
  if (!data.user || data.user.id !== userId) {
    throw new Error("로그인 상태가 바뀌었어요. 다시 로그인해 주세요.");
  }
  return data.user;
}

export async function loadHiddenGroupIds(userId: string) {
  return readHiddenGroupIds((await getCurrentUser(userId)).user_metadata);
}

export async function saveGroupHidden(userId: string, groupId: string, hidden: boolean) {
  if (!groupId.trim()) throw new Error("그룹을 선택해 주세요.");

  // Read the latest personal preference before merging this one change.
  const user = await getCurrentUser(userId);
  const previous = readHiddenGroupIds(user.user_metadata);
  const next = hidden
    ? [...new Set([...previous, groupId])]
    : previous.filter((id) => id !== groupId);
  const { data, error } = await getSupabaseBrowserClient().auth.updateUser({
    data: { [metadataKey]: next },
  });

  if (error || !data.user || data.user.id !== userId) {
    throw new Error("그룹 표시 설정을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
  }
  return readHiddenGroupIds(data.user.user_metadata);
}
