"use client";

import Link from "next/link";
import { BottomNavigation } from "@/components/bottom-navigation";
import { usePrototype } from "@/components/prototype-provider";

const shellRootClass = "flex min-h-dvh flex-col bg-transparent text-slate-900";
const shellFrameClass = "mx-auto flex min-h-0 w-full max-w-[430px] flex-1 flex-col";
const shellHeaderClass = "sticky top-0 z-30 px-4 pt-4 md:px-6 lg:px-8";
const shellHeaderInnerClass =
  "mx-auto flex w-full max-w-[430px] flex-col gap-3 rounded-[28px] border border-white/80 bg-[linear-gradient(180deg,rgba(248,251,255,0.82),rgba(245,249,255,0.98))] px-4 pb-4 pt-4 shadow-[0_18px_40px_rgba(17,50,99,0.08)] backdrop-blur-xl";
const shellMainClass =
  "flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-32 pt-4 md:px-6 md:pt-5 lg:px-8";
const shellMainWithoutNavClass =
  "flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-10 pt-4 md:px-6 md:pt-5 lg:px-8";

export function SectionCard({
  title,
  action,
  children,
}: Readonly<{
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}>) {
  return (
    <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_18px_60px_rgba(28,64,120,0.08)] backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-slate-900">
          {title}
        </h2>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function LoadingState({
  message = "Loading data from Supabase...",
}: Readonly<{
  message?: string;
}>) {
  return (
    <SectionCard title="Loading">
      <p className="text-sm leading-6 text-[var(--ink-soft)]">{message}</p>
    </SectionCard>
  );
}

export function MissingGroupState() {
  return (
    <SectionCard
      title="그룹 정보를 아직 불러오지 못했어요"
      action={
        <Link href="/" className="text-sm font-semibold text-[var(--brand)]">
          그룹 선택
        </Link>
      }
    >
      <p className="text-sm leading-6 text-[var(--ink-soft)]">
        새로 만든 그룹이 아직 동기화되지 않았거나 접근 가능한 그룹이 없습니다. 스터디
        목록으로 돌아가서 다시 선택해 주세요.
      </p>
    </SectionCard>
  );
}

export function AppShell({
  title,
  subtitle,
  groupId,
  navGroupId,
  navReady,
  requireAuth = true,
  showNavigation = true,
  headerContent,
  children,
}: Readonly<{
  title: string;
  subtitle: string;
  groupId?: string;
  navGroupId?: string | null;
  navReady?: boolean;
  requireAuth?: boolean;
  showNavigation?: boolean;
  headerContent?: React.ReactNode;
  children: React.ReactNode;
}>) {
  const { groups, error, isAuthReady, isLoading, isMutating, sessionName } = usePrototype();
  const resolvedNavGroupId =
    navGroupId === undefined ? (groupId ?? groups[0]?.id ?? null) : navGroupId;
  const resolvedNavReady = navReady ?? (groupId ? true : !isLoading);
  const shouldShowNavigation =
    showNavigation && (!requireAuth || (isAuthReady && Boolean(sessionName)));

  if (requireAuth && !isAuthReady) {
    return (
      <div className={shellRootClass}>
        <header className={shellHeaderClass}>
            <div className={shellHeaderInnerClass}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <Link
                  href="/"
                  className="inline-flex rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-700"
                >
                  STUDY FLOW
                </Link>
              </div>

              <div className="space-y-1">
                <p className="font-[family:var(--font-study-display)] text-[27px] leading-none tracking-[-0.05em] text-slate-950">
                  {title}
                </p>
                <p className="text-sm leading-5 text-[var(--ink-soft)]">{subtitle}</p>
              </div>
            </div>
          </header>

        <div className={shellFrameClass}>
          <main className={shellMainWithoutNavClass}>
            <LoadingState message="로그인 상태를 확인하는 중입니다." />
          </main>
        </div>
      </div>
    );
  }

  if (requireAuth && !sessionName) {
    return (
      <div className={shellRootClass}>
        <header className={shellHeaderClass}>
            <div className={shellHeaderInnerClass}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <Link
                  href="/"
                  className="inline-flex rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-700"
                >
                  STUDY FLOW
                </Link>
              </div>

              <div className="space-y-1">
                <p className="font-[family:var(--font-study-display)] text-[27px] leading-none tracking-[-0.05em] text-slate-950">
                  {title}
                </p>
                <p className="text-sm leading-5 text-[var(--ink-soft)]">{subtitle}</p>
              </div>
            </div>
          </header>

        <div className={shellFrameClass}>
          <main className={shellMainWithoutNavClass}>
            <SectionCard
              title="로그인이 필요해요"
              action={
                <Link href="/" className="text-sm font-semibold text-[var(--brand)]">
                  로그인으로
                </Link>
              }
            >
              <p className="text-sm leading-6 text-[var(--ink-soft)]">
                먼저 로그인하고 스터디그룹을 선택한 뒤에 그룹별 홈과 스터디, 계획,
                자료 화면으로 이동할 수 있어요.
              </p>
            </SectionCard>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={shellRootClass}>
      <header className={shellHeaderClass}>
          <div className={shellHeaderInnerClass}>
            {headerContent ? (
              headerContent
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <Link
                    href="/"
                    className="inline-flex rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-700"
                  >
                    STUDY FLOW
                  </Link>
                </div>

                <div className="space-y-1">
                  <p className="font-[family:var(--font-study-display)] text-[27px] leading-none tracking-[-0.05em] text-slate-950">
                    {title}
                  </p>
                  <p className="text-sm leading-5 text-[var(--ink-soft)]">{subtitle}</p>
                </div>
              </>
            )}

            {isLoading || isMutating ? (
              <div className="rounded-2xl bg-white/80 px-3 py-2 text-[11px] font-medium text-slate-600">
                {isLoading ? "Syncing Supabase data..." : "Saving changes..."}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {error}
              </div>
            ) : null}
          </div>
        </header>

      <div className={shellFrameClass}>
        <main className={shouldShowNavigation ? shellMainClass : shellMainWithoutNavClass}>
          {children}
        </main>

        {shouldShowNavigation ? (
          <BottomNavigation
            navReady={resolvedNavReady}
            navGroupId={resolvedNavGroupId}
          />
        ) : null}
      </div>
    </div>
  );
}
