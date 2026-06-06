"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type BottomTabId = "home" | "study" | "plan" | "materials";

type BottomTab = {
  id: BottomTabId;
  label: string;
  enabled: boolean;
  href: string;
  icon: ReactNode;
};

const navigationBorderColor = "rgba(76,175,122,0.16)";

function HomeIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M4.5 10.5 12 4l7.5 6.5v8.25A1.25 1.25 0 0 1 18.25 20H15v-5.25h-6V20H5.75A1.25 1.25 0 0 1 4.5 18.75V10.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function StudyIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M7.75 5.25h8.5A1.75 1.75 0 0 1 18 7v10.5a1.25 1.25 0 0 1-1.25 1.25h-9A2.75 2.75 0 0 1 5 16V8A2.75 2.75 0 0 1 7.75 5.25Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M7.5 8.25h7M7.5 11.5h7M7.5 14.75h4.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function PlanIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M7 4.75v2.5M17 4.75v2.5M5.5 8.25h13M6.75 6.25h10.5A1.75 1.75 0 0 1 19 8v9.25A1.75 1.75 0 0 1 17.25 19H6.75A1.75 1.75 0 0 1 5 17.25V8A1.75 1.75 0 0 1 6.75 6.25Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function MaterialIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M3.75 8.5A1.75 1.75 0 0 1 5.5 6.75h4.12l1.45 1.75h7.43A1.75 1.75 0 0 1 20.25 10v7.25A1.75 1.75 0 0 1 18.5 19H5.5a1.75 1.75 0 0 1-1.75-1.75V8.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function getTabs(navReady: boolean, navGroupId?: string | null): BottomTab[] {
  const hasActiveGroup = navReady && Boolean(navGroupId);

  return [
    {
      id: "home",
      label: "홈",
      enabled: hasActiveGroup,
      href: hasActiveGroup ? `/group/${navGroupId}` : "/",
      icon: <HomeIcon />,
    },
    {
      id: "study",
      label: "스터디",
      enabled: hasActiveGroup,
      href: hasActiveGroup ? `/group/${navGroupId}/study` : "/",
      icon: <StudyIcon />,
    },
    {
      id: "plan",
      label: "계획",
      enabled: hasActiveGroup,
      href: hasActiveGroup ? `/group/${navGroupId}/plan` : "/",
      icon: <PlanIcon />,
    },
    {
      id: "materials",
      label: "자료",
      enabled: hasActiveGroup,
      href: hasActiveGroup ? `/group/${navGroupId}/materials` : "/",
      icon: <MaterialIcon />,
    },
  ];
}

function isActiveTab(pathname: string, tab: BottomTab) {
  if (tab.id === "home" && pathname === "/mypage") {
    return true;
  }

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
    <nav className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0.9rem)] z-40 px-4 md:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[430px]">
        <div
          className="pointer-events-auto rounded-[28px] border bg-white/95 p-2 shadow-[0_20px_46px_rgba(15,23,42,0.14)] backdrop-blur"
          style={{ borderColor: navigationBorderColor }}
        >
          <div className="grid grid-cols-4 gap-2">
            {tabs.map((tab) => {
              const active = isActiveTab(pathname, tab);
              const className = `rounded-[22px] px-2 py-2 text-center transition ${
                active
                  ? "bg-[#4CAF7A] text-white shadow-[0_12px_24px_rgba(76,175,122,0.24)]"
                  : tab.enabled
                    ? "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    : "pointer-events-none cursor-not-allowed select-none text-slate-300"
              }`;

              return (
                <Link
                  key={tab.id}
                  href={tab.enabled ? tab.href : pathname}
                  aria-current={active ? "page" : undefined}
                  aria-disabled={tab.enabled ? undefined : true}
                  className={className}
                  onClick={(event) => {
                    if (!tab.enabled) {
                      event.preventDefault();
                    }
                  }}
                  prefetch={tab.enabled ? null : false}
                  tabIndex={tab.enabled ? undefined : -1}
                >
                  <span className="mx-auto flex h-5 w-5 items-center justify-center">
                    {tab.icon}
                  </span>
                  <span className="mt-1 block text-[11px] font-semibold">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
