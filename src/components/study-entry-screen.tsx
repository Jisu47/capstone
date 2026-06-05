"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { AppShell, SectionCard } from "@/components/mobile-shell";
import { usePrototype } from "@/components/prototype-provider";
import { formatExamDate, getDaysLeft } from "@/lib/mock-data";

function sortGroupsByExamDate(groups: ReturnType<typeof usePrototype>["groups"]) {
  return [...groups].sort((left, right) => {
    return getDaysLeft(left.examDate) - getDaysLeft(right.examDate);
  });
}

function SplashLogoMark() {
  return (
    <div className="relative flex h-44 w-44 items-center justify-center rounded-[30px] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,250,246,0.92))] shadow-[0_28px_60px_rgba(121,184,149,0.16)] backdrop-blur-md">
      <div className="absolute inset-4 rounded-[24px] bg-[radial-gradient(circle_at_top,rgba(121,184,149,0.16),transparent_52%),linear-gradient(160deg,rgba(255,255,255,0.78),rgba(248,252,249,0.44))]" />
      <div className="absolute right-7 top-7 h-3.5 w-3.5 rounded-full bg-[var(--brand)] shadow-[0_0_18px_rgba(121,184,149,0.42)]" />
      <Image
        src="/logo-study.png"
        alt="Study logo"
        width={133}
        height={132}
        className="relative z-10 h-32 w-32 object-contain drop-shadow-[0_10px_24px_rgba(121,184,149,0.14)]"
        priority
      />
    </div>
  );
}

function SplashScreen() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-[var(--background)] text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(121,184,149,0.18),_transparent_32%),radial-gradient(circle_at_bottom,_rgba(230,243,235,0.72),_transparent_34%)]" />

      <div className="relative mx-auto flex w-full max-w-[430px] flex-1 flex-col px-6 pb-10 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span className="font-semibold tracking-[0.24em] text-slate-600">
            STUDY FLOW
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          <SplashLogoMark />

          <div className="mt-8 text-center">
            <p className="font-[family:var(--font-study-display)] text-[56px] leading-none tracking-[0.06em] text-slate-950">
              STUDY
            </p>
            <p className="mt-3 text-sm tracking-[0.18em] text-slate-500">
              필요한 스터디 흐름을 바로 시작해 보세요.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-full bg-[var(--brand)] px-6 py-4 text-base font-semibold text-white shadow-[0_18px_36px_rgba(121,184,149,0.26)] transition hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
          >
            로그인 시작하기
          </Link>

          <div className="flex items-center justify-center gap-3 text-sm text-slate-500">
            <Link href="/signup" className="font-medium text-[var(--brand)] transition hover:brightness-90">
              계정 만들기
            </Link>
            <span className="text-slate-300">|</span>
            <span>아이디/비밀번호 찾기</span>
          </div>
        </div>
      </div>
    </main>
  );
}

function AuthenticatedHome() {
  const { groups, isLoading } = usePrototype();
  const { sessionName, signOut } = useAuth();
  const router = useRouter();
  const sortedGroups = sortGroupsByExamDate(groups);

  return (
    <AppShell requireAuth={false} showNavigation={false} title="그룹 선택">
      <SectionCard
        title={`${sessionName ?? "사용자"}님`}
        action={
          <button
            type="button"
            onClick={() => {
              void signOut();
            }}
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
          <div className="flex items-center gap-3">
            <Link href="/group-setup" className="text-sm font-semibold text-slate-600">
              그룹 참여
            </Link>
            <Link href="/create" className="text-sm font-semibold text-[var(--brand)]">
              그룹 만들기
            </Link>
          </div>
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
            <div className="flex flex-wrap gap-3">
              <Link
                href="/create"
                className="inline-flex rounded-[14px] bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white"
              >
                첫 그룹 만들기
              </Link>
              <Link
                href="/group-setup"
                className="inline-flex rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
              >
                참여 코드 입력
              </Link>
            </div>
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

export function StudyEntryScreen() {
  const { isAuthReady, sessionName } = useAuth();

  if (!isAuthReady || !sessionName) {
    return <SplashScreen />;
  }

  return <AuthenticatedHome />;
}
