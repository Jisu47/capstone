"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type BottomTabId = "home" | "study" | "plan" | "materials";

type BottomTab = {
  id: BottomTabId;
  label: string;
  enabled: boolean;
  href: string;
};

function getTabs(navReady: boolean, navGroupId?: string | null): BottomTab[] {
  const hasActiveGroup = navReady && Boolean(navGroupId);

  return [
    {
      id: "home",
      label: "홈",
      enabled: hasActiveGroup,
      href: hasActiveGroup ? `/group/${navGroupId}` : "/",
    },
    {
      id: "study",
      label: "스터디",
      enabled: hasActiveGroup,
      href: hasActiveGroup ? `/group/${navGroupId}/study` : "/",
    },
    {
      id: "plan",
      label: "계획",
      enabled: hasActiveGroup,
      href: hasActiveGroup ? `/group/${navGroupId}/plan` : "/",
    },
    {
      id: "materials",
      label: "자료",
      enabled: hasActiveGroup,
      href: hasActiveGroup ? `/group/${navGroupId}/materials` : "/",
    },
  ];
}

function isActiveTab(pathname: string, tab: BottomTab) {
  if (!tab.enabled) {
    return false;
  }

  switch (tab.id) {
    case "home":
      return /^\/group\/[^/]+$/.test(pathname);
    case "study":
      return /^\/group\/[^/]+\/study(?:\/.*)?$/.test(pathname);
    case "plan":
      return /^\/group\/[^/]+\/plan(?:\/.*)?$/.test(pathname);
    case "materials":
      return /^\/group\/[^/]+\/materials(?:\/.*)?$/.test(pathname);
    default:
      return false;
  }
}

export function BottomNavigation({
  navReady = false,
  navGroupId,
}: Readonly<{
  navReady?: boolean;
  navGroupId?: string | null;
}>) {
  const pathname = usePathname();
  const tabs = getTabs(navReady, navGroupId);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 md:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[430px]">
        <div className="rounded-[16px] border border-white/80 bg-[linear-gradient(180deg,rgba(248,251,255,0.82),rgba(245,249,255,0.98))] p-2 shadow-[0_-18px_40px_rgba(17,50,99,0.08)] backdrop-blur-xl">
          <div className="grid grid-cols-4 gap-2 rounded-[14px] border border-white/70 bg-white/72 p-2 shadow-[0_18px_36px_rgba(28,64,120,0.08)]">
            {tabs.map((tab) => {
              const active = isActiveTab(pathname, tab);
              const className = `rounded-[12px] px-2 py-2 text-center text-[11px] font-semibold transition ${
                active
                  ? "bg-[linear-gradient(135deg,#2f6ee5,#5a8fff)] text-white shadow-[0_12px_28px_rgba(47,110,229,0.28)]"
                  : tab.enabled
                    ? "bg-transparent text-slate-600 hover:bg-white/85"
                    : "pointer-events-none cursor-not-allowed select-none bg-slate-100/80 text-slate-400"
              }`;

              return (
                <Link
                  key={tab.id}
                  aria-current={active ? "page" : undefined}
                  aria-disabled={tab.enabled ? undefined : true}
                  className={className}
                  href={tab.enabled ? tab.href : pathname}
                  onClick={(event) => {
                    if (!tab.enabled) {
                      event.preventDefault();
                    }
                  }}
                  prefetch={tab.enabled ? null : false}
                  tabIndex={tab.enabled ? undefined : -1}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
