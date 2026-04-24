"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { usePrototype } from "@/components/prototype-provider";

type GroupPageHeaderProps = {
  groupId: string;
  groupName: string;
};

function CircleButton({
  asLink = false,
  href,
  children,
}: Readonly<{
  asLink?: boolean;
  href?: string;
  children: React.ReactNode;
}>) {
  const className =
    "flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50";

  if (asLink && href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return <div className={className}>{children}</div>;
}

function resolveGroupHref(pathname: string, nextGroupId: string) {
  if (/^\/group\/[^/]+\/plan\/agent(?:\/.*)?$/.test(pathname)) {
    return `/group/${nextGroupId}/plan/agent`;
  }

  if (/^\/group\/[^/]+\/plan(?:\/.*)?$/.test(pathname)) {
    return `/group/${nextGroupId}/plan`;
  }

  if (/^\/group\/[^/]+\/materials(?:\/.*)?$/.test(pathname)) {
    return `/group/${nextGroupId}/materials`;
  }

  if (/^\/group\/[^/]+\/progress(?:\/.*)?$/.test(pathname)) {
    return `/group/${nextGroupId}/progress`;
  }

  if (/^\/group\/[^/]+\/study(?:\/.*)?$/.test(pathname)) {
    return `/group/${nextGroupId}/study`;
  }

  return `/group/${nextGroupId}`;
}

export function GroupPageHeader({
  groupId,
  groupName,
}: Readonly<GroupPageHeaderProps>) {
  const pathname = usePathname();
  const { groups } = usePrototype();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <div className="flex items-center justify-between gap-3">
        <CircleButton asLink href="/">
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M15 6L9 12L15 18"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        </CircleButton>

        <div className="flex min-w-0 flex-1 items-center justify-center">
          <button
            type="button"
            aria-expanded={isOpen}
            aria-haspopup="menu"
            onClick={() => setIsOpen((previous) => !previous)}
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
          >
            <span className="truncate">{groupName}</span>
            <svg
              aria-hidden="true"
              className={`h-3.5 w-3.5 shrink-0 transition ${isOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                d="M7 10L12 15L17 10"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </button>
        </div>

        <CircleButton>
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 12C14.4853 12 16.5 9.98528 16.5 7.5C16.5 5.01472 14.4853 3 12 3C9.51472 3 7.5 5.01472 7.5 7.5C7.5 9.98528 9.51472 12 12 12Z"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M4.5 21C4.5 17.4101 7.85786 14.5 12 14.5C16.1421 14.5 19.5 17.4101 19.5 21"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.8"
            />
          </svg>
        </CircleButton>
      </div>

      {isOpen ? (
        <div className="absolute left-1/2 top-[calc(100%+12px)] z-40 w-[220px] -translate-x-1/2 rounded-[24px] border border-slate-200 bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
          <div className="space-y-1">
            {groups.map((group) => {
              const active = group.id === groupId;

              return (
                <Link
                  key={group.id}
                  href={resolveGroupHref(pathname, group.id)}
                  className={`flex items-center justify-between rounded-[18px] px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate">{group.name}</span>
                  {active ? (
                    <span className="text-xs font-semibold">현재</span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
