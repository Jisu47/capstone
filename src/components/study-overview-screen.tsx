"use client";

import { AppShell, LoadingState, MissingGroupState } from "@/components/mobile-shell";
import { GroupPageHeader } from "@/components/group-page-header";
import { usePrototype } from "@/components/prototype-provider";
import { StudyHub } from "@/components/study-hub";
import { type StudyGroup } from "@/lib/mock-data";

function getGroupById(groups: StudyGroup[], groupId: string) {
  return groups.find((group) => group.id === groupId);
}

export function StudyOverviewScreen({ groupId }: Readonly<{ groupId: string }>) {
  const { groups, isLoading } = usePrototype();
  const group = getGroupById(groups, groupId);

  if (isLoading && !group) {
    return (
      <AppShell groupId={groupId} title="스터디">
        <LoadingState message="스터디 화면을 준비하는 중입니다." />
      </AppShell>
    );
  }

  if (!group) {
    return (
      <AppShell groupId={groupId} title="스터디">
        <MissingGroupState />
      </AppShell>
    );
  }

  return (
    <AppShell
      groupId={groupId}
      title="스터디"
      headerContent={<GroupPageHeader groupId={group.id} groupName={group.name} />}
    >
      <StudyHub key={group.id} group={group} />
    </AppShell>
  );
}
