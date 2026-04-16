"use client";

import {
  AppShell,
  LoadingState,
  MissingGroupState,
} from "@/components/mobile-shell";
import { GroupPageHeader } from "@/components/group-page-header";
import { usePrototype } from "@/components/prototype-provider";
import { StudyHub } from "@/components/study-hub";
import { formatExamDate, type StudyGroup } from "@/lib/mock-data";

function getGroupById(groups: StudyGroup[], groupId: string) {
  return groups.find((group) => group.id === groupId);
}

export function StudyOverviewScreen({ groupId }: Readonly<{ groupId: string }>) {
  const { groups, isLoading } = usePrototype();
  const group = getGroupById(groups, groupId);

  if (isLoading && !group) {
    return (
      <AppShell
        groupId={groupId}
        title="그룹 불러오는 중"
        subtitle="최신 스터디그룹 정보를 불러오고 있어요."
      >
        <LoadingState message="그룹 정보를 불러오는 중입니다." />
      </AppShell>
    );
  }

  if (!group) {
    return (
      <AppShell
        groupId={groupId}
        title="그룹을 찾을 수 없어요"
        subtitle="목록에서 다시 선택하거나 새로 만든 그룹이 아직 동기화되지 않았는지 확인해 주세요."
      >
        <MissingGroupState />
      </AppShell>
    );
  }

  return (
    <AppShell
      groupId={groupId}
      title="스터디"
      subtitle={`${group.subject} · 시험 ${formatExamDate(group.examDate)} · 그룹 정보와 진행 현황`}
      headerContent={<GroupPageHeader groupId={group.id} groupName={group.name} />}
    >
      <StudyHub group={group} />
    </AppShell>
  );
}
