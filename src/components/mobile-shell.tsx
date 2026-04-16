"use client";

import Link from "next/link";
import { BottomNavigation } from "@/components/bottom-navigation";
import { usePrototype } from "@/components/prototype-provider";

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
      <div className="min-h-dvh bg-transparent px-3 py-4 text-slate-900">
        <div className="relative mx-auto flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] max-w-[430px] flex-col overflow-hidden rounded-[34px] border border-white/70 bg-[rgba(245,249,255,0.86)] shadow-[0_30px_100px_rgba(17,50,99,0.14)] backdrop-blur-xl">
          <header className="sticky top-0 z-20 border-b border-white/80 bg-[rgba(245,249,255,0.92)] px-5 py-4 backdrop-blur-xl">
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
          </header>

          <main className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-10 pt-4">
            <LoadingState message="로그인 상태를 확인하는 중입니다." />
          </main>
        </div>
      </div>
    );
  }

  if (requireAuth && !sessionName) {
    return (
      <div className="min-h-dvh bg-transparent px-3 py-4 text-slate-900">
        <div className="relative mx-auto flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] max-w-[430px] flex-col overflow-hidden rounded-[34px] border border-white/70 bg-[rgba(245,249,255,0.86)] shadow-[0_30px_100px_rgba(17,50,99,0.14)] backdrop-blur-xl">
          <header className="sticky top-0 z-20 border-b border-white/80 bg-[rgba(245,249,255,0.92)] px-5 py-4 backdrop-blur-xl">
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
          </header>

          <main className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-10 pt-4">
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
    <div className="min-h-dvh bg-transparent px-3 py-4 text-slate-900">
      <div className="relative mx-auto flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] max-w-[430px] flex-col overflow-hidden rounded-[34px] border border-white/70 bg-[rgba(245,249,255,0.86)] shadow-[0_30px_100px_rgba(17,50,99,0.14)] backdrop-blur-xl">
        <header className="sticky top-0 z-20 border-b border-white/80 bg-[rgba(245,249,255,0.92)] px-5 py-4 backdrop-blur-xl">
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
            <div className="mt-3 rounded-2xl bg-white/80 px-3 py-2 text-[11px] font-medium text-slate-600">
              {isLoading ? "Syncing Supabase data..." : "Saving changes..."}
            </div>
          ) : null}

          {error ? (
            <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          ) : null}
        </header>

        <main className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-32 pt-4">
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
