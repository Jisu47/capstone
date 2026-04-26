"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell, LoadingState, SectionCard } from "@/components/mobile-shell";
import { usePrototype } from "@/components/prototype-provider";
import { formatExamDate, getDaysLeft } from "@/lib/mock-data";

function sortGroupsByExamDate(groups: ReturnType<typeof usePrototype>["groups"]) {
  return [...groups].sort((left, right) => {
    return getDaysLeft(left.examDate) - getDaysLeft(right.examDate);
  });
}

export function StudyEntryScreen() {
  const { groups, isAuthReady, isLoading, sessionName, signOut } = usePrototype();
  const router = useRouter();
  const sortedGroups = sortGroupsByExamDate(groups);

  if (!isAuthReady) {
    return (
      <AppShell requireAuth={false} showNavigation={false} title="메인 화면">
        <LoadingState message="로그인 상태를 준비하고 있어요." />
      </AppShell>
    );
  }

  if (!sessionName) {
    return (
      <AppShell
        requireAuth={false}
        showNavigation={false}
        title="메인 화면"
        subtitle="혼자 공부하던 흐름을 팀 스터디 루틴으로 가볍게 이어보세요."
      >
        <SectionCard title="로그인">
          <div className="rounded-[18px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_12px_30px_rgba(121,184,149,0.08)]">
            <p className="font-[family:var(--font-study-display)] text-[24px] leading-none tracking-[-0.05em] text-slate-950">
              로그인 후
              <br />
              스터디를 이어가세요
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
              팀 일정, 계획, 자료 흐름을 한 화면에서 확인할 수 있도록 로그인 화면으로
              안내해드릴게요.
            </p>

            <Link
              href="/login"
              className="mt-5 inline-flex w-full items-center justify-center rounded-[16px] bg-[var(--brand)] px-4 py-3.5 text-sm font-semibold text-white transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
            >
              로그인 시작하기
            </Link>
          </div>
        </SectionCard>
      </AppShell>
    );
  }

  return (
    <AppShell requireAuth={false} showNavigation={false} title="메인 화면">
      <SectionCard
        title={`${sessionName}님`}
        action={
          <button
            type="button"
            onClick={signOut}
            className="text-sm font-semibold text-[var(--brand)]"
          >
            로그아웃
          </button>
        }
      >
        <p className="text-sm text-[var(--ink-soft)]">
          들어갈 스터디 그룹을 선택해 주세요.
        </p>
      </SectionCard>

      <SectionCard
        title="내 스터디 그룹"
        action={
          <Link href="/create" className="text-sm font-semibold text-[var(--brand)]">
            새 그룹
          </Link>
        }
      >
        {isLoading && groups.length === 0 ? (
          <p className="text-sm leading-6 text-[var(--ink-soft)]">
            그룹 목록을 불러오는 중입니다.
          </p>
        ) : null}

        {!isLoading && groups.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm leading-6 text-[var(--ink-soft)]">
              아직 참여 중인 스터디 그룹이 없습니다.
            </p>
            <Link
              href="/create"
              className="inline-flex rounded-[14px] bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white"
            >
              첫 그룹 만들기
            </Link>
          </div>
        ) : null}

        {sortedGroups.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => {
              router.push(`/group/${group.id}`);
            }}
            className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-slate-300"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {group.subject}
                </p>
                <p className="mt-1 text-base font-semibold text-slate-950">
                  {group.name}
                </p>
              </div>
              <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
                {getDaysLeft(group.examDate) === 0
                  ? "D-day"
                  : `D-${getDaysLeft(group.examDate)}`}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>시험 {formatExamDate(group.examDate)}</span>
              <span>{group.members.length}명</span>
            </div>
          </button>
        ))}
      </SectionCard>
    </AppShell>
  );
}
