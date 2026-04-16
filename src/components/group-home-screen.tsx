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
  getCompletedCount,
  getDaysLeft,
  getGroupProgress,
  getMemberProgress,
  type StudyGroup,
} from "@/lib/mock-data";

const memberAccents = [
  {
    badge: "bg-amber-100 text-amber-700",
    bar: "bg-[linear-gradient(90deg,#f59e0b,#fbbf24)]",
  },
  {
    badge: "bg-sky-100 text-sky-700",
    bar: "bg-[linear-gradient(90deg,#3b82f6,#60a5fa)]",
  },
  {
    badge: "bg-rose-100 text-rose-700",
    bar: "bg-[linear-gradient(90deg,#f43f5e,#fb7185)]",
  },
  {
    badge: "bg-lime-100 text-lime-700",
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
    <div className="h-3 overflow-hidden rounded-full border border-slate-200 bg-white">
      <div
        className={`h-full rounded-full transition-all ${className}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function InfoPill({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="rounded-[22px] border border-white/70 bg-white/72 px-3 py-3 backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function DetailCard({
  eyebrow,
  title,
  body,
}: Readonly<{
  eyebrow: string;
  title: string;
  body: string;
}>) {
  return (
    <section className="rounded-[28px] border border-[var(--line)] bg-white/82 p-4 shadow-[0_18px_40px_rgba(28,64,120,0.08)] backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {eyebrow}
      </p>
      <p className="mt-3 text-base font-semibold tracking-[-0.03em] text-slate-900">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </section>
  );
}

function formatOptionalDate(value: string | null) {
  return value ? formatExamDate(value) : "미정";
}

export function GroupHomeScreen({ groupId }: Readonly<{ groupId: string }>) {
  const { groups, isLoading } = usePrototype();
  const group = getGroupById(groups, groupId);

  if (isLoading && !group) {
    return (
      <AppShell
        groupId={groupId}
        title="홈"
        subtitle="그룹 정보를 불러오는 중입니다."
      >
        <LoadingState message="그룹 홈 화면을 준비하고 있습니다." />
      </AppShell>
    );
  }

  if (!group) {
    return (
      <AppShell
        groupId={groupId}
        title="홈"
        subtitle="선택한 그룹을 찾을 수 없습니다."
      >
        <MissingGroupState />
      </AppShell>
    );
  }

  const leader = group.members.find((member) => member.role === "팀장") ?? group.members[0];
  const daysLeft = getDaysLeft(group.examDate);
  const groupProgress = getGroupProgress(group);
  const totalSlots = group.plan.length * group.members.length;
  const completedSlots = group.plan.reduce((count, item) => {
    return count + Object.values(item.memberStatus).filter(Boolean).length;
  }, 0);

  return (
    <AppShell
      groupId={groupId}
      title="홈"
      subtitle={`${group.subject} · ${formatExamDate(group.examDate)}`}
      headerContent={<GroupPageHeader groupId={group.id} groupName={group.name} />}
    >
      <div className="space-y-4">
        <section className="relative overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(224,236,255,0.88))] p-5 shadow-[0_24px_60px_rgba(28,64,120,0.12)]">
          <div className="absolute right-[-36px] top-[-46px] h-36 w-36 rounded-full bg-[rgba(47,110,229,0.12)] blur-2xl" />
          <div className="absolute bottom-[-42px] left-[-26px] h-28 w-28 rounded-full bg-[rgba(245,158,11,0.1)] blur-2xl" />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <span className="inline-flex rounded-full border border-white/80 bg-white/78 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                {group.subject}
              </span>

              <div className="rounded-[24px] border border-white/80 bg-white/82 px-4 py-3 text-right shadow-[0_12px_28px_rgba(28,64,120,0.08)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Exam
                </p>
                <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                  {daysLeft === 0 ? "D-day" : `D-${daysLeft}`}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <h1 className="text-[26px] font-semibold tracking-[-0.05em] text-slate-950">
                {group.name}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {group.overallGoal}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <InfoPill label="팀장" value={leader?.name ?? "미정"} />
              <InfoPill label="팀원" value={`${group.members.length}명`} />
              <InfoPill label="시험일" value={formatExamDate(group.examDate)} />
            </div>

            <div className="mt-4 rounded-[24px] border border-white/75 bg-slate-950/5 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                이번 주 포커스
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{group.weeklyGoal}</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <DetailCard eyebrow="Group" title="모임 개요" body={group.description} />
          <DetailCard
            eyebrow="Schedule"
            title={group.recentUpdate}
            body={`발표 ${formatOptionalDate(group.presentationDate)} · 마감 ${formatOptionalDate(group.deadlineDate)}`}
          />
        </div>

        <section className="rounded-[30px] border border-[var(--line)] bg-white/84 p-5 shadow-[0_20px_48px_rgba(28,64,120,0.08)] backdrop-blur">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                TODAY
              </p>
              <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-slate-950">
                그룹 진행률
              </p>
            </div>
            <div className="text-right">
              <p className="text-[24px] font-semibold tracking-[-0.05em] text-slate-950">
                {groupProgress}%
              </p>
              <p className="text-xs text-slate-500">
                {completedSlots}/{totalSlots} 슬롯 완료
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-full border border-slate-200 bg-white px-2 py-2">
            <ProgressTrack
              value={groupProgress}
              className="bg-[linear-gradient(90deg,#2f6ee5,#73a3ff)]"
            />
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            손에 잡히는 할 일을 꾸준히 공개할수록 팀 진행률이 더 또렷하게 보입니다.
          </p>
        </section>

        <section className="space-y-3">
          <div>
            <p className="text-[18px] font-semibold tracking-[-0.03em] text-slate-900">
              팀 진행 현황
            </p>
            <p className="text-sm text-slate-500">
              누가 어떤 파트를 맡고 있는지 한눈에 볼 수 있어요.
            </p>
          </div>

          <div className="space-y-3">
            {group.members.map((member, index) => {
              const progress = getMemberProgress(group, member.id);
              const accent = memberAccents[index % memberAccents.length];
              const completedCount = getCompletedCount(group, member.id);

              return (
                <article
                  key={member.id}
                  className="rounded-[28px] border border-[var(--line)] bg-white/82 p-4 shadow-[0_16px_36px_rgba(28,64,120,0.08)] backdrop-blur"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold ${accent.badge}`}
                    >
                      {member.name.slice(0, 1)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-slate-900">
                            {member.name}
                          </p>
                          <p className="truncate text-sm text-slate-500">
                            {member.role} · {member.focus}
                          </p>
                        </div>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {progress}%
                        </span>
                      </div>

                      <div className="mt-3">
                        <ProgressTrack value={progress} className={accent.bar} />
                      </div>

                      <p className="mt-2 text-xs text-slate-500">
                        {completedCount}/{group.plan.length}개 완료
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
