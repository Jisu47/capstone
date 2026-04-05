"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
        <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-slate-900">{title}</h2>
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
      title="모임 정보를 아직 불러오지 못했어요"
      action={
        <Link href="/" className="text-sm font-semibold text-[var(--brand)]">
          홈으로
        </Link>
      }
    >
      <p className="text-sm leading-6 text-[var(--ink-soft)]">
        새로 만든 모임이 아직 동기화되지 않았거나 접근 가능한 모임이 없습니다. 홈으로 이동해
        다시 확인해주세요.
      </p>
    </SectionCard>
  );
}

export function AppShell({
  title,
  subtitle,
  groupId,
  children,
}: Readonly<{
  title: string;
  subtitle: string;
  groupId?: string;
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const { groups, error, isLoading, isMutating } = usePrototype();
  const featuredGroupId = groupId ?? groups[0]?.id;
  const studyHref = featuredGroupId ? `/group/${featuredGroupId}` : "/";
  const planHref = featuredGroupId ? `/group/${featuredGroupId}/plan` : "/";
  const materialsHref = featuredGroupId ? `/group/${featuredGroupId}/materials` : "/";

  const tabs = [
    { label: "홈", href: "/" },
    { label: "스터디", href: studyHref },
    { label: "계획", href: planHref },
    { label: "자료", href: materialsHref },
  ];

  return (
    <div className="min-h-screen bg-transparent px-3 py-4 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[430px] flex-col overflow-hidden rounded-[34px] border border-white/70 bg-[rgba(245,249,255,0.86)] shadow-[0_30px_100px_rgba(17,50,99,0.14)] backdrop-blur-xl">
        <header className="sticky top-0 z-20 border-b border-white/80 bg-[rgba(245,249,255,0.92)] px-5 py-4 backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-700"
            >
              STUDY FLOW
            </Link>
            <div className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-[11px] font-semibold text-[var(--brand)]">
              Mobile Prototype
            </div>
          </div>

          <div className="space-y-1">
            <p className="font-[family:var(--font-study-display)] text-[27px] leading-none tracking-[-0.05em] text-slate-950">
              {title}
            </p>
            <p className="text-sm leading-5 text-[var(--ink-soft)]">{subtitle}</p>
          </div>

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

        <main className="flex-1 space-y-4 overflow-y-auto px-4 pb-28 pt-4">{children}</main>

        <nav className="sticky bottom-0 z-20 border-t border-white/80 bg-[rgba(248,251,255,0.94)] px-3 py-3 backdrop-blur-xl">
          <div className="grid grid-cols-4 gap-2">
            {tabs.map((tab) => {
              const active =
                tab.href === "/"
                  ? pathname === tab.href
                  : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`rounded-2xl px-2 py-2 text-center text-[11px] font-semibold transition ${
                    active
                      ? "bg-[var(--brand)] text-white shadow-[0_10px_24px_rgba(47,110,229,0.26)]"
                      : "bg-white/75 text-slate-600"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
