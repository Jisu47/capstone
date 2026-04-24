"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell, LoadingState, SectionCard } from "@/components/mobile-shell";
import { usePrototype } from "@/components/prototype-provider";
import { formatExamDate, getDaysLeft } from "@/lib/mock-data";

function sortGroupsByExamDate(groups: ReturnType<typeof usePrototype>["groups"]) {
  return [...groups].sort((left, right) => {
    return getDaysLeft(left.examDate) - getDaysLeft(right.examDate);
  });
}

export function StudyEntryScreen() {
  const { groups, isAuthReady, isLoading, sessionName, signIn, signOut } = usePrototype();
  const router = useRouter();
  const [nameInput, setNameInput] = useState("");
  const sortedGroups = sortGroupsByExamDate(groups);

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = nameInput.trim();

    if (!trimmedName) {
      return;
    }

    signIn(trimmedName);
    setNameInput("");
  }

  if (!isAuthReady) {
    return (
      <AppShell requireAuth={false} showNavigation={false} title="메인화면">
        <LoadingState message="세션을 준비하는 중입니다." />
      </AppShell>
    );
  }

  if (!sessionName) {
    return (
      <AppShell requireAuth={false} showNavigation={false} title="메인화면">
        <SectionCard title="로그인">
          <form className="space-y-3" onSubmit={handleLogin}>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">이름</span>
              <input
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                placeholder="이름을 입력해 주세요"
                className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-[14px] bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white"
            >
              로그인하고 그룹 보기
            </button>
          </form>
        </SectionCard>
      </AppShell>
    );
  }

  return (
    <AppShell requireAuth={false} showNavigation={false} title="메인화면">
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
        <p className="text-sm text-[var(--ink-soft)]">들어갈 스터디 그룹을 선택해 주세요.</p>
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
              아직 참여 중인 그룹이 없습니다.
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
