"use client";

import { AppShell, LoadingState, MissingGroupState } from "@/components/mobile-shell";
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
      <AppShell title="Loading group..." subtitle="Waiting for the latest group snapshot from Supabase.">
        <LoadingState message="Loading group snapshot..." />
      </AppShell>
    );
  }

  if (!group) {
    return (
      <AppShell title="모임을 찾을 수 없어요" subtitle="데이터가 아직 동기화되지 않았다면 잠시 후 다시 열어주세요.">
        <MissingGroupState />
      </AppShell>
    );
  }

  return (
    <AppShell
      groupId={groupId}
      title="스터디"
      subtitle={`${group.subject} · ${formatExamDate(group.examDate)} · 계획과 연결되는 운영 정보`}
    >
      <StudyHub group={group} groups={groups} />
    </AppShell>
  );
}
