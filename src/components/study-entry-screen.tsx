"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="relative flex h-44 w-44 items-center justify-center rounded-[30px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] shadow-[0_32px_80px_rgba(13,9,34,0.42)] backdrop-blur-md">
      <div className="absolute inset-4 rounded-[24px] bg-[radial-gradient(circle_at_top,rgba(174,155,255,0.28),transparent_48%),linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
      <div className="absolute right-7 top-7 h-3.5 w-3.5 rounded-full bg-emerald-300/80 shadow-[0_0_18px_rgba(134,239,172,0.8)]" />

      {!imageFailed ? (
        <Image
          src="/logo-study.png"
          alt="Study logo"
          width={124}
          height={124}
          className="relative z-10 h-31 w-31 object-contain drop-shadow-[0_10px_24px_rgba(9,7,24,0.34)]"
          onError={() => setImageFailed(true)}
          priority
        />
      ) : (
        <svg
          aria-hidden="true"
          className="relative z-10 h-28 w-28 drop-shadow-[0_10px_24px_rgba(9,7,24,0.34)]"
          fill="none"
          viewBox="0 0 120 120"
        >
          <defs>
            <linearGradient id="study-flow-logo-gradient" x1="16" x2="104" y1="20" y2="96">
              <stop stopColor="#D6CCFF" />
              <stop offset="0.5" stopColor="#B8C8FF" />
              <stop offset="1" stopColor="#A8F3CE" />
            </linearGradient>
          </defs>

          <path
            d="M23 31.5v50.8c0 3 2.4 5.5 5.5 5.5h63.8c3 0 5.5-2.4 5.5-5.5V40.4"
            stroke="url(#study-flow-logo-gradient)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="5.2"
          />
          <path
            d="M23 32.4c9.8 0 18.8 4.8 24.4 12.9l5 7.2 5.2-7.2c5.8-8.1 14.8-12.9 24.6-12.9"
            stroke="url(#study-flow-logo-gradient)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="5.2"
          />
          <path
            d="M34 75.5l16.3-18.6c1.5-1.7 4.2-1.8 5.8-.1l9.3 9.7c1.7 1.8 4.5 1.6 6-.3L91 42.8"
            stroke="url(#study-flow-logo-gradient)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="6.4"
          />
          <path
            d="M83.5 41.6 95 40l-1.6 11.7"
            stroke="url(#study-flow-logo-gradient)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="6.4"
          />
        </svg>
      )}
    </div>
  );
}

function SplashScreen() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-[#2a2258] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(138,121,217,0.28),_transparent_35%),radial-gradient(circle_at_bottom,_rgba(86,214,175,0.10),_transparent_30%)]" />

      <div className="relative mx-auto flex w-full max-w-[430px] flex-1 flex-col px-6 pb-10 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
        <div className="flex items-center justify-between text-sm text-white/80">
          <span className="font-semibold tracking-[0.24em] text-white/70">
            STUDY FLOW
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          <SplashLogoMark />

          <div className="mt-8 text-center">
            <p className="font-[family:var(--font-study-display)] text-[56px] leading-none tracking-[0.06em] text-white">
              STUDY
            </p>
            <p className="mt-3 text-sm tracking-[0.28em] text-white/58">
              SMART FLOW FOR YOUR TEAM
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-full bg-[#2c6f46] px-6 py-4 text-base font-semibold text-white shadow-[0_20px_40px_rgba(17,55,34,0.36)] transition hover:bg-[#347d50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2a2258]"
          >
            로그인 시작하기
          </Link>

          <div className="flex items-center justify-center gap-3 text-sm text-white/72">
            <Link href="/signup" className="transition hover:text-white">
              계정 만들기
            </Link>
            <span className="text-white/35">|</span>
            <span>아이디/비밀번호 찾기</span>
          </div>
        </div>
      </div>
    </main>
  );
}

export function StudyEntryScreen() {
  const { groups, isLoading } = usePrototype();
  const { isAuthReady, sessionName, signOut } = useAuth();
  const router = useRouter();
  const sortedGroups = sortGroupsByExamDate(groups);

  if (!isAuthReady || !sessionName) {
    return <SplashScreen />;
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
          이어갈 스터디 그룹을 선택해 주세요.
        </p>
      </SectionCard>

      <SectionCard
        title="내 스터디 그룹"
        action={
          <Link href="/create" className="text-sm font-semibold text-[var(--brand)]">
            그룹 만들기
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
