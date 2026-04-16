"use client";

type GroupPageHeaderProps = {
  groupName: string;
};

function CircleIcon({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm">
      {children}
    </div>
  );
}

export function GroupPageHeader({ groupName }: Readonly<GroupPageHeaderProps>) {
  return (
    <div className="flex items-center justify-between gap-3">
      <CircleIcon>
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
      </CircleIcon>

      <div className="flex min-w-0 flex-1 items-center justify-center">
        <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-800 shadow-sm">
          <span className="truncate">{groupName}</span>
          <svg
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0"
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
        </div>
      </div>

      <CircleIcon>
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
      </CircleIcon>
    </div>
  );
}
