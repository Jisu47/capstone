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
    <nav className="fixed inset-x-0 bottom-0 z-40 px-4 md:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[430px]">
        <div className="rounded-t-[14px] rounded-b-none border border-slate-200 bg-white px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-8px_20px_rgba(15,23,42,0.04)]">
          <div className="grid grid-cols-4 gap-2 rounded-[12px] border border-slate-200 bg-white p-2">
            {tabs.map((tab) => {
              const active = isActiveTab(pathname, tab);
              const className = `rounded-[12px] px-2 py-2 text-center text-[11px] font-semibold transition ${
                active
                  ? "bg-[var(--brand)] text-white"
                  : tab.enabled
                    ? "bg-transparent text-slate-600 hover:bg-white"
                    : "pointer-events-none cursor-not-allowed select-none bg-white text-slate-400"
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
