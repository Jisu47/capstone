import type { Member, StudyGroup } from "@/lib/mock-data";

export function getGroupMembership(group: StudyGroup, userId: string) {
  return group.members.find((member) => member.id === userId) ?? null;
}

export function isGroupMember(group: StudyGroup, userId: string) {
  return getGroupMembership(group, userId) !== null;
}

export function getMemberGroups(groups: StudyGroup[], userId: string) {
  return groups.filter((group) => isGroupMember(group, userId));
}

export function getMembershipRoleLabel(member: Member | null) {
  return member?.role ?? "미정";
}
