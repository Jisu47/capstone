import type { StudyGroup } from "@/lib/mock-data";

function normalizeCode(value: string) {
  return value.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

export function createGroupJoinCode(groupId: string) {
  return `SF-${normalizeCode(groupId)}`;
}

export function findGroupByJoinCode(groups: StudyGroup[], code: string) {
  const normalizedCode = normalizeCode(code);

  return groups.find((group) => {
    return (
      normalizeCode(group.id) === normalizedCode ||
      normalizeCode(createGroupJoinCode(group.id)) === normalizedCode
    );
  });
}
