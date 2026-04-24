"use client";

import Link from "next/link";
import { BottomNavigation } from "@/components/bottom-navigation";
import { usePrototype } from "@/components/prototype-provider";

const shellRootClass = "flex min-h-dvh flex-col bg-transparent text-slate-900";
const shellFrameClass = "mx-auto flex min-h-0 w-full max-w-[430px] flex-1 flex-col";
const shellHeaderClass = "sticky top-0 z-30 px-4 md:px-6 lg:px-8";
const shellHeaderInnerClass =
  "mx-auto flex w-full max-w-[430px] flex-col gap-3 rounded-b-[14px] rounded-t-none border border-slate-200/80 bg-white/94 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.875rem)] shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur-md";
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
    <section className="rounded-[18px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
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
  message = "데이터를 불러오는 중입니다.",
}: Readonly<{
  message?: string;
}>) {
  return (
    <SectionCard title="불러오는 중">
      <p className="text-sm leading-6 text-[var(--ink-soft)]">{message}</p>
    </SectionCard>
  );
}

export function MissingGroupState() {
  return (
    <SectionCard
      title="그룹을 찾을 수 없어요"
      action={
        <Link href="/" className="text-sm font-semibold text-[var(--brand)]">
          그룹 선택
        </Link>
      }
    >
      <p className="text-sm leading-6 text-[var(--ink-soft)]">
        새로 만든 그룹이 아직 동기화되지 않았거나 접근할 수 없는 그룹입니다.
        메인화면에서 다시 선택해 주세요.
      </p>
    </SectionCard>
  );
}

function DefaultHeader({
  title,
  subtitle,
}: Readonly<{
  title: string;
  subtitle?: string;
}>) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex rounded-[999px] border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-700"
        >
          STUDY FLOW
        </Link>
      </div>

      <div className="space-y-1">
        <p className="font-[family:var(--font-study-display)] text-[25px] leading-none tracking-[-0.05em] text-slate-950">
          {title}
        </p>
        {subtitle ? (
          <p className="text-sm leading-5 text-[var(--ink-soft)]">{subtitle}</p>
        ) : null}
      </div>
    </>
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
  subtitle?: string;
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
            <DefaultHeader title={title} subtitle={subtitle} />
          </div>
        </header>

        <div className={shellFrameClass}>
          <main className={shellMainWithoutNavClass}>
            <LoadingState message="로그인 상태를 확인하고 있습니다." />
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
            <DefaultHeader title={title} subtitle={subtitle} />
          </div>
        </header>

        <div className={shellFrameClass}>
          <main className={shellMainWithoutNavClass}>
            <SectionCard
              title="로그인이 필요해요"
              action={
                <Link href="/" className="text-sm font-semibold text-[var(--brand)]">
                  메인화면
                </Link>
              }
            >
              <p className="text-sm leading-6 text-[var(--ink-soft)]">
                로그인 후 그룹을 선택하면 홈, 스터디, 계획, 자료 화면을 이어서 사용할 수
                있습니다.
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
            <DefaultHeader title={title} subtitle={subtitle} />
          )}

          {isLoading || isMutating ? (
            <div className="rounded-[12px] bg-slate-100 px-3 py-2 text-[11px] font-medium text-slate-600">
              {isLoading ? "동기화 중" : "저장 중"}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
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
