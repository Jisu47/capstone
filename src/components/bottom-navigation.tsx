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
    { id: "home", label: "홈", enabled: true, href: "/" },
    { id: "study", label: "스터디", enabled: true, href: "/study" },
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
      return pathname === "/";
    case "study":
      return pathname === "/study" || /^\/group\/[^/]+$/.test(pathname);
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
    <nav className="sticky bottom-0 z-20 border-t border-white/80 bg-[rgba(248,251,255,0.94)] px-3 py-3 backdrop-blur-xl">
      <div className="grid grid-cols-4 gap-2">
        {tabs.map((tab) => {
          const active = isActiveTab(pathname, tab);
          const className = `rounded-2xl px-2 py-2 text-center text-[11px] font-semibold transition ${
            active
              ? "bg-[var(--brand)] text-white shadow-[0_10px_24px_rgba(47,110,229,0.26)]"
              : tab.enabled
                ? "bg-white/75 text-slate-600 hover:bg-white"
                : "pointer-events-none cursor-not-allowed select-none bg-slate-100/90 text-slate-400"
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
    </nav>
  );
}
