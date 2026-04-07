"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type BottomTab = {
  id: "home" | "study" | "plan" | "materials";
  label: string;
  href?: string;
};

function getTabs(groupId?: string): BottomTab[] {
  return [
    { id: "home", label: "홈", href: "/" },
    { id: "study", label: "스터디", href: groupId ? `/group/${groupId}` : undefined },
    { id: "plan", label: "계획", href: groupId ? `/group/${groupId}/plan` : undefined },
    {
      id: "materials",
      label: "자료",
      href: groupId ? `/group/${groupId}/materials` : undefined,
    },
  ];
}

function isActiveTab(pathname: string, href?: string) {
  if (!href) {
    return false;
  }

  return href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNavigation({ groupId }: Readonly<{ groupId?: string }>) {
  const pathname = usePathname();
  const tabs = getTabs(groupId);

  return (
    <nav className="sticky bottom-0 z-20 border-t border-white/80 bg-[rgba(248,251,255,0.94)] px-3 py-3 backdrop-blur-xl">
      <div className="grid grid-cols-4 gap-2">
        {tabs.map((tab) => {
          const active = isActiveTab(pathname, tab.href);
          const className = `rounded-2xl px-2 py-2 text-center text-[11px] font-semibold transition ${
            active
              ? "bg-[var(--brand)] text-white shadow-[0_10px_24px_rgba(47,110,229,0.26)]"
              : tab.href
                ? "bg-white/75 text-slate-600 hover:bg-white"
                : "cursor-not-allowed bg-slate-100/90 text-slate-400"
          }`;

          if (!tab.href) {
            return (
              <span key={tab.id} aria-disabled="true" className={className}>
                {tab.label}
              </span>
            );
          }

          return (
            <Link key={tab.id} href={tab.href} className={className}>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
