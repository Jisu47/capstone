"use client";

import { AppShell, LoadingState, MissingGroupState } from "@/components/mobile-shell";
import { GroupPageHeader } from "@/components/group-page-header";
import { usePrototype } from "@/components/prototype-provider";
import {
  formatExamDate,
  getDaysLeft,
  getGroupProgress,
  getMemberProgress,
  type StudyGroup,
} from "@/lib/mock-data";

const memberAccents = [
  {
    segment: "bg-amber-400",
    bar: "bg-[linear-gradient(90deg,#f59e0b,#fbbf24)]",
  },
  {
    segment: "bg-sky-400",
    bar: "bg-[linear-gradient(90deg,#3b82f6,#60a5fa)]",
  },
  {
    segment: "bg-rose-500",
    bar: "bg-[linear-gradient(90deg,#f43f5e,#fb7185)]",
  },
  {
    segment: "bg-lime-500",
    bar: "bg-[linear-gradient(90deg,#65a30d,#84cc16)]",
  },
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
    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full transition-all ${className}`} style={{ width: `${value}%` }} />
    </div>
  );
}

function SegmentedProgressTrack({
  segments,
}: Readonly<{
  segments: Array<{
    id: string;
    width: number;
    className: string;
  }>;
}>) {
  const filledWidth = segments.reduce((sum, segment) => sum + segment.width, 0);

  return (
    <div className="overflow-hidden rounded-full border border-slate-200 bg-white">
      <div className="flex h-3.5 w-full">
        {segments.map((segment) => (
          <div
            key={segment.id}
            className={segment.className}
            style={{ width: `${segment.width}%` }}
          />
        ))}
        <div className="bg-slate-100" style={{ width: `${Math.max(0, 100 - filledWidth)}%` }} />
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="rounded-[14px] border border-slate-200 bg-white px-3 py-3 shadow-[0_4px_10px_rgba(15,23,42,0.03)]">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function getSummaryText(group: StudyGroup) {
  const description = group.description.trim();
  if (description) {
    return description;
  }

  return group.overallGoal.trim();
}

export function GroupHomeScreen({ groupId }: Readonly<{ groupId: string }>) {
  const { groups, isLoading } = usePrototype();
  const group = getGroupById(groups, groupId);

  if (isLoading && !group) {
    return (
      <AppShell groupId={groupId} title="홈">
        <LoadingState message="그룹 정보를 불러오는 중입니다." />
      </AppShell>
    );
  }

  if (!group) {
    return (
      <AppShell groupId={groupId} title="홈">
        <MissingGroupState />
      </AppShell>
    );
  }

  const leader = group.members.find((member) => member.role === "팀장") ?? group.members[0];
  const daysLeft = getDaysLeft(group.examDate);
  const groupProgress = getGroupProgress(group);
  const summaryText = getSummaryText(group);
  const totalSlots = group.plan.length * group.members.length;
  const completedSlots = group.plan.reduce((count, item) => {
    return count + Object.values(item.memberStatus).filter(Boolean).length;
  }, 0);
  const memberProgresses = group.members.map((member, index) => ({
    member,
    progress: getMemberProgress(group, member.id),
    accent: memberAccents[index % memberAccents.length],
  }));
  const memberProgressTotal = memberProgresses.reduce((sum, item) => sum + item.progress, 0);
  const segmentedProgress = memberProgresses
    .filter((item) => item.progress > 0 && memberProgressTotal > 0)
    .map((item) => ({
      id: item.member.id,
      width: (item.progress / memberProgressTotal) * groupProgress,
      className: item.accent.segment,
    }));

  return (
    <AppShell
      groupId={groupId}
      title="홈"
      headerContent={<GroupPageHeader groupId={group.id} groupName={group.name} />}
    >
      <div className="space-y-4">
        <section className="rounded-[18px] border border-slate-200 bg-white px-4 py-5 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {group.subject}
          </p>
          <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.04em] text-slate-950">
            {group.name}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{summaryText}</p>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <SummaryItem label="팀장" value={leader?.name ?? "미정"} />
            <SummaryItem label="팀원" value={`${group.members.length}명`} />
            <SummaryItem label="시험일" value={formatExamDate(group.examDate)} />
            <SummaryItem
              label="시험까지"
              value={daysLeft === 0 ? "D-day" : `D-${daysLeft}`}
            />
          </div>
        </section>

        <section className="space-y-2 px-1">
          <div className="flex items-end justify-between gap-3">
            <p className="text-[18px] font-semibold tracking-[-0.03em] text-slate-900">
              오늘의 진행도
            </p>
            <p className="text-[24px] font-semibold tracking-[-0.05em] text-slate-950">
              {groupProgress}%
            </p>
          </div>

          <SegmentedProgressTrack segments={segmentedProgress} />

          <p className="text-xs text-slate-500">
            총 {completedSlots}/{totalSlots}개 체크 완료
          </p>
        </section>

        <section className="rounded-[18px] border border-slate-200 bg-white px-4 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold text-slate-900">팀원별 진행 현황</h2>
            <span className="text-xs text-slate-500">{group.members.length}명</span>
          </div>

          <div className="space-y-4">
            {memberProgresses.map(({ member, progress, accent }) => (
              <div key={member.id} className="grid grid-cols-[64px_1fr_auto] items-center gap-3">
                <p className="truncate text-sm font-medium text-slate-900">{member.name}</p>
                <ProgressTrack value={progress} className={accent.bar} />
                <span className="text-xs font-semibold text-slate-500">{progress}%</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
