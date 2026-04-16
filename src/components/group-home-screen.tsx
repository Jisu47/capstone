"use client";

import {
  AppShell,
  LoadingState,
  MissingGroupState,
} from "@/components/mobile-shell";
import { GroupPageHeader } from "@/components/group-page-header";
import { usePrototype } from "@/components/prototype-provider";
import {
  formatExamDate,
  getDaysLeft,
  getGroupProgress,
  getMemberProgress,
  type StudyGroup,
} from "@/lib/mock-data";

const memberBarColors = [
  "bg-amber-400",
  "bg-blue-400",
  "bg-rose-500",
  "bg-lime-400",
];

function getGroupById(groups: StudyGroup[], groupId: string) {
  return groups.find((group) => group.id === groupId);
}

function ProgressTrack({
  value,
  className,
}: Readonly<{
  value: number;
  className: string;
}>) {
  return (
    <div className="h-3 overflow-hidden rounded-full border border-slate-300 bg-white">
      <div
        className={`h-full rounded-full transition-all ${className}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function GroupHomeScreen({ groupId }: Readonly<{ groupId: string }>) {
  const { groups, isLoading } = usePrototype();
  const group = getGroupById(groups, groupId);

  if (isLoading && !group) {
    return (
      <AppShell
        groupId={groupId}
        title="홈"
        subtitle="그룹 홈을 불러오는 중입니다."
      >
        <LoadingState message="그룹 홈 정보를 불러오는 중입니다." />
      </AppShell>
    );
  }

  if (!group) {
    return (
      <AppShell
        groupId={groupId}
        title="홈"
        subtitle="선택한 그룹을 찾을 수 없어요."
      >
        <MissingGroupState />
      </AppShell>
    );
  }

  const leader = group.members.find((member) => member.role === "팀장") ?? group.members[0];
  const daysLeft = getDaysLeft(group.examDate);
  const groupProgress = getGroupProgress(group);

  return (
    <AppShell
      groupId={groupId}
      title="홈"
      subtitle={`${group.name} 홈`}
      headerContent={<GroupPageHeader groupName={group.name} />}
    >
      <div className="space-y-4">
        <section className="rounded-[28px] border border-slate-300 bg-white/80 px-5 py-6 text-center shadow-[0_18px_60px_rgba(28,64,120,0.08)]">
          <p className="text-lg font-semibold text-slate-900">{group.name}</p>
          <div className="mt-3 space-y-1 text-sm leading-6 text-slate-700">
            <p>팀장 {leader?.name ?? "미정"}</p>
            <p>팀원 {group.members.length}명</p>
            <p>시험일 {formatExamDate(group.examDate)}</p>
            <p>{daysLeft === 0 ? "D-day" : `D-${daysLeft}`}</p>
            <p>{group.description}</p>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <p className="text-[17px] font-semibold uppercase tracking-[-0.03em] text-slate-700">
              TODAY
            </p>
            <p className="text-[17px] font-semibold text-slate-700">{groupProgress}%</p>
          </div>

          <div className="rounded-full border border-slate-300 bg-white px-2 py-2">
            <ProgressTrack value={groupProgress} className="bg-sky-500" />
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-300 bg-white/80 p-4 shadow-[0_18px_60px_rgba(28,64,120,0.08)]">
          <div className="space-y-4">
            {group.members.map((member, index) => {
              const progress = getMemberProgress(group, member.id);
              const barColor = memberBarColors[index % memberBarColors.length];

              return (
                <div
                  key={member.id}
                  className="grid grid-cols-[72px_1fr] items-center gap-3"
                >
                  <div className="text-sm text-slate-700">{member.name}</div>
                  <ProgressTrack value={progress} className={barColor} />
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
