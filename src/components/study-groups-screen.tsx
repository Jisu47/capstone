"use client";

import Link from "next/link";
import {
  AppShell,
  LoadingState,
  SectionCard,
} from "@/components/mobile-shell";
import { usePrototype } from "@/components/prototype-provider";
import {
  currentUserId,
  formatExamDate,
  getDaysLeft,
  getGroupProgress,
  type StudyGroup,
} from "@/lib/mock-data";

function getRelativeExamText(dateString: string) {
  const daysLeft = getDaysLeft(dateString);
  return daysLeft === 0 ? "D-day" : `D-${daysLeft}`;
}

function getRemainingTaskCount(group: StudyGroup) {
  return group.plan.filter((item) => !item.memberStatus[currentUserId]).length;
}

function sortGroupsByExam(groups: StudyGroup[]) {
  return [...groups].sort((left, right) => {
    return getDaysLeft(left.examDate) - getDaysLeft(right.examDate);
  });
}

function StudyGroupCard({
  group,
  highlighted,
}: Readonly<{
  group: StudyGroup;
  highlighted: boolean;
}>) {
  const remainingTasks = getRemainingTaskCount(group);
  const progress = getGroupProgress(group);

  return (
    <Link
      href={`/group/${group.id}`}
      className="block rounded-[26px] border border-white/70 bg-white/80 p-4 transition hover:bg-white"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                highlighted
                  ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {highlighted ? "현재 그룹" : group.subject}
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              시험 {formatExamDate(group.examDate)}
            </span>
          </div>
          <h2 className="mt-3 text-base font-semibold tracking-[-0.03em] text-slate-950">
            {group.name}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
            {group.subject} 준비 흐름과 팀 진행 현황을 확인할 수 있어요.
          </p>
        </div>

        <span className="rounded-full bg-[var(--brand)] px-3 py-1 text-xs font-semibold text-white">
          {getRelativeExamText(group.examDate)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-[11px] font-medium text-slate-500">멤버</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {group.members.length}명
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-[11px] font-medium text-slate-500">전체 진행률</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{progress}%</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-[11px] font-medium text-slate-500">내 남은 체크</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {remainingTasks}개
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-[11px] font-medium text-slate-500">최근 업데이트</p>
          <p className="mt-1 text-xs leading-5 text-slate-900">
            {group.recentUpdate}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs font-medium text-slate-500">
        <span>선택하면 해당 그룹 정보 화면으로 이어져요.</span>
        <span className="text-[var(--brand)]">그룹 보기</span>
      </div>
    </Link>
  );
}

export function StudyGroupsScreen() {
  const { groups, isLoading } = usePrototype();
  const sortedGroups = sortGroupsByExam(groups);
  const currentGroup = sortedGroups[0] ?? null;

  return (
    <AppShell
      navGroupId={null}
      navReady={!isLoading}
      title="스터디"
      subtitle="현재 내 스터디그룹을 카드로 보고, 새 그룹을 만들거나 원하는 그룹을 선택할 수 있어요."
    >
      <section className="overflow-hidden rounded-[32px] bg-[linear-gradient(145deg,#fdfefe_0%,#eef4ff_48%,#d8e6ff_100%)] p-5 shadow-[0_20px_80px_rgba(17,50,99,0.12)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
                Study Hub
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-slate-600">
                {isLoading ? "불러오는 중" : `${sortedGroups.length}개 그룹`}
              </span>
            </div>
            <h1 className="mt-3 text-[26px] font-semibold tracking-[-0.05em] text-slate-950">
              그룹을 선택해 상세 정보를 확인하세요
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
              스터디 탭에서는 선택 화면만 먼저 보여주고, 그룹을 고른 뒤에 해당 그룹의
              정보 화면으로 이동합니다.
            </p>
          </div>

          <Link
            href="/create"
            className="inline-flex shrink-0 rounded-2xl border border-white/80 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm"
          >
            새 그룹 만들기
          </Link>
        </div>

        {currentGroup && !isLoading ? (
          <div className="mt-4 rounded-[24px] border border-white/70 bg-white/82 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              지금 가장 먼저 볼 그룹
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {currentGroup.name}
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">
                  {currentGroup.subject} · 시험 {formatExamDate(currentGroup.examDate)}
                </p>
              </div>
              <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
                {getRelativeExamText(currentGroup.examDate)}
              </span>
            </div>
          </div>
        ) : null}
      </section>

      {isLoading && groups.length === 0 ? (
        <LoadingState message="현재 참여 중인 스터디그룹을 불러오는 중입니다." />
      ) : null}

      {!isLoading && groups.length === 0 ? (
        <SectionCard title="현재 내 스터디그룹">
          <p className="text-sm leading-6 text-[var(--ink-soft)]">
            아직 참여 중인 그룹이 없어요. 새 그룹을 만들면 이 화면에서 카드로 바로 선택할 수 있습니다.
          </p>
          <Link
            href="/create"
            className="inline-flex rounded-2xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(47,110,229,0.24)]"
          >
            첫 그룹 만들기
          </Link>
        </SectionCard>
      ) : null}

      {groups.length > 0 ? (
        <SectionCard
          title="현재 내 스터디그룹"
          action={
            <Link href="/create" className="text-sm font-semibold text-[var(--brand)]">
              새 그룹
            </Link>
          }
        >
          {sortedGroups.map((group, index) => (
            <StudyGroupCard
              key={group.id}
              group={group}
              highlighted={index === 0}
            />
          ))}
        </SectionCard>
      ) : null}
    </AppShell>
  );
}
