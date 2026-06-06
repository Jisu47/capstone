"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppShell, LoadingState, MissingGroupState } from "@/components/mobile-shell";
import { ProfileAvatar } from "@/components/profile-avatar";
import { usePrototype } from "@/components/prototype-provider";
import type { MemberWeaknessInsight } from "@/lib/material-analytics";
import {
  formatUploadDate,
  getMemberProgress,
  type ChatMessage,
  type Material,
  type StudyGroup,
} from "@/lib/mock-data";

type ActiveView = "list" | "chat-split" | "chat-full";

const materialBrandLine = "rgba(76,175,122,0.18)";
const materialBrandShadow = "0 18px 42px rgba(76,175,122,0.12)";

function getGroupById(groups: StudyGroup[], groupId: string) {
  return groups.find((group) => group.id === groupId);
}

function sortMaterials(group: StudyGroup) {
  return [...group.materials].sort((left, right) => {
    return new Date(right.uploadedAt).getTime() - new Date(left.uploadedAt).getTime();
  });
}

function stripFileExtension(title: string) {
  return title.replace(/\.[^.]+$/, "");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isLeaderRole(role: string) {
  const normalized = role.trim().toLowerCase();
  return normalized === "팀장" || normalized === "leader";
}

function formatReadTime(totalMinutes: number) {
  if (totalMinutes <= 0) {
    return "0시간";
  }

  if (totalMinutes < 60) {
    return `${totalMinutes}분`;
  }

  const hours = totalMinutes / 60;
  return Number.isInteger(hours) ? `${hours}시간` : `${hours.toFixed(1)}시간`;
}

function buildPlaceholderThread(selectedMaterialTitle: string | null): ChatMessage[] {
  const materialLabel = selectedMaterialTitle ?? "운영체제.pdf";

  return [
    {
      id: "materials-mock-user-1",
      role: "user",
      text: "프로세스 상태를 설명해줘",
      createdAt: "방금 전",
    },
    {
      id: "materials-mock-ai-1",
      role: "assistant",
      text: `${materialLabel} 기준으로 보면 프로세스 상태는 Running, Ready, Waiting으로 나뉘고, 스케줄러와 인터럽트에 따라 상태 전이가 일어납니다.`,
      createdAt: "방금 전",
      sources: [
        {
          id: "materials-mock-source-1",
          materialId: "materials-mock-source-1",
          title: materialLabel,
          locationHint: "3장 프로세스 관리",
          summary: "프로세스 상태와 상태 전이 다이어그램을 간단히 정리한 구간입니다.",
        },
      ],
    },
    {
      id: "materials-mock-user-2",
      role: "user",
      text: "데드락 조건 알려줘",
      createdAt: "방금 전",
    },
    {
      id: "materials-mock-ai-2",
      role: "assistant",
      text: "상호배제, 점유와 대기, 비선점, 순환 대기 네 가지 조건이 동시에 만족되면 데드락이 발생합니다.",
      createdAt: "방금 전",
    },
  ];
}

function buildWeakPointBars(
  group: StudyGroup,
  leaderInsight: MemberWeaknessInsight | null,
  materials: Material[],
) {
  const sourceCounts = group.chat.reduce<Record<string, number>>((counts, message) => {
    message.sources?.forEach((source) => {
      const key = source.materialId ?? source.title;
      counts[key] = (counts[key] ?? 0) + 1;
    });

    return counts;
  }, {});

  const hintTokens = [
    ...(leaderInsight?.keyTopics ?? []),
    leaderInsight?.longestStayLabel ?? "",
    leaderInsight?.frequentQuestionLabel ?? "",
  ]
    .map((value) => value.trim())
    .filter(Boolean);

  const rankedMaterials =
    materials.length > 0
      ? materials.slice(0, 3).map((material, index) => {
          const materialName = stripFileExtension(material.title);
          const locationName = material.locationHint.trim();
          const hintMatches = hintTokens.filter((hint) => {
            return (
              materialName.includes(hint) ||
              hint.includes(materialName) ||
              locationName.includes(hint) ||
              hint.includes(locationName)
            );
          }).length;

          const rawScore =
            26 +
            (sourceCounts[material.id] ?? 0) * 18 +
            hintMatches * 14 +
            (materials.length - index) * 4;

          return {
            id: material.id,
            label: materialName,
            rawScore,
          };
        })
      : [
          { id: "fallback-os", label: `${group.subject} 핵심`, rawScore: 82 },
          { id: "fallback-network", label: `${group.subject} 응용`, rawScore: 48 },
          { id: "fallback-ds", label: `${group.subject} 복습`, rawScore: 64 },
        ];

  const scores = rankedMaterials.map((candidate) => candidate.rawScore);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const fallbackPercents = [80, 30, 60];

  return rankedMaterials.map((candidate, index) => {
    const percent =
      maxScore === minScore
        ? fallbackPercents[index] ?? 46
        : 28 + Math.round(((candidate.rawScore - minScore) / (maxScore - minScore)) * 54);

    return {
      ...candidate,
      percent: clamp(percent, 18, 84),
    };
  });
}

function MaterialsHeader() {
  return (
    <div className="space-y-2 px-1 pb-1">
      <p className="font-[family:var(--font-study-display)] text-[30px] leading-none tracking-[-0.05em] text-slate-950">
        📚 자료
      </p>
      <p className="max-w-[24rem] text-sm leading-6 text-slate-500">
        팀원들과 자료를 공유하고 AI에게 질문해보세요.
      </p>
    </div>
  );
}

function SurfaceCard({
  title,
  action,
  children,
  className = "",
}: Readonly<{
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}>) {
  return (
    <section
      className={`rounded-[24px] border bg-white/95 p-5 ${className}`}
      style={{
        borderColor: materialBrandLine,
        boxShadow: materialBrandShadow,
      }}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-[18px] font-semibold tracking-[-0.03em] text-slate-950">{title}</div>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function FileIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24">
      <path
        d="M7 3.75h6.75L19.5 9.5v10.75A1.75 1.75 0 0 1 17.75 22H7a1.75 1.75 0 0 1-1.75-1.75V5.5A1.75 1.75 0 0 1 7 3.75Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M13.5 3.75V8A1.5 1.5 0 0 0 15 9.5h4.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M4.75 10a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z" />
      <path d="M10 10a1.25 1.25 0 1 0 0-2.5A1.25 1.25 0 0 0 10 10Z" />
      <path d="M15.25 10a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="m5 12 13-7-3.5 7L18 19l-13-7Zm0 0h9.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M8 4H4v4M20 8V4h-4M16 20h4v-4M4 16v4h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M8 8 4 4m0 0v4m0-4h4m8 16 4 4m0 0v-4m0 4h-4M8 16l-4 4m0 0h4m-4 0v-4m16-8 4-4m0 0h-4m4 0v4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="m6 6 12 12M18 6 6 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2ZM5.5 14l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function MetricTile({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="rounded-[20px] border border-slate-100 bg-slate-50/80 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className="mt-2 text-[25px] font-semibold tracking-[-0.04em] text-slate-950">{value}</p>
    </div>
  );
}

function ProgressRow({
  label,
  value,
}: Readonly<{
  label: string;
  value: number;
}>) {
  return (
    <div className="grid grid-cols-[88px_1fr_38px] items-center gap-3">
      <span className="truncate text-[13px] font-medium text-slate-700">{label}</span>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#4CAF7A_0%,#A2D9B3_100%)] transition-all duration-300"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-right text-[12px] font-semibold text-slate-600">{value}%</span>
    </div>
  );
}

function SourcePill({
  title,
  locationHint,
  summary,
}: Readonly<{
  title: string;
  locationHint: string;
  summary: string;
}>) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white p-3 shadow-[0_6px_16px_rgba(15,23,42,0.04)]">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-[11px] font-semibold text-[#4CAF7A]">{locationHint}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{summary}</p>
    </div>
  );
}

function ChatBubble({ message }: Readonly<{ message: ChatMessage }>) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[82%] space-y-2">
          <p className="text-right text-[11px] font-medium text-slate-400">User</p>
          <div className="rounded-[22px] rounded-tr-[10px] bg-slate-950 px-4 py-3 text-sm leading-6 text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]">
            {message.text}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8F6EC] text-[#4CAF7A]">
        <SparkIcon />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="rounded-[22px] rounded-tl-[10px] border border-slate-200 bg-white px-4 py-3 shadow-[0_10px_22px_rgba(15,23,42,0.06)]">
          <p className="whitespace-pre-line text-sm leading-6 text-slate-700">{message.text}</p>
        </div>
        {message.sources && message.sources.length > 0 ? (
          <div className="space-y-2">
            {message.sources.map((source) => (
              <SourcePill
                key={source.id}
                title={source.title}
                locationHint={source.locationHint}
                summary={source.summary}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MaterialsFloatingNav({ groupId }: Readonly<{ groupId: string }>) {
  const pathname = usePathname();
  const tabs = [
    { id: "home", label: "홈", href: `/group/${groupId}`, icon: <HomeIcon /> },
    { id: "study", label: "스터디", href: `/group/${groupId}/study`, icon: <BookIcon /> },
    { id: "plan", label: "계획", href: `/group/${groupId}/plan`, icon: <CalendarIcon /> },
    { id: "materials", label: "자료", href: `/group/${groupId}/materials`, icon: <FolderIcon /> },
  ] as const;

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0.9rem)] z-40 px-4">
      <div className="mx-auto w-full max-w-[390px]">
        <div
          className="pointer-events-auto rounded-[28px] border bg-white/95 p-2 shadow-[0_20px_46px_rgba(15,23,42,0.14)] backdrop-blur"
          style={{ borderColor: materialBrandLine }}
        >
          <div className="grid grid-cols-4 gap-2">
            {tabs.map((tab) => {
              const active = pathname === tab.href;

              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-[20px] px-2 py-2 text-center transition ${
                    active
                      ? "bg-[#4CAF7A] text-white shadow-[0_12px_24px_rgba(76,175,122,0.24)]"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
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

function BookIcon() {
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

function CalendarIcon() {
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

function FolderIcon() {
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

type MaterialRowProps = {
  material: Material;
  isSelected: boolean;
  isMenuOpen: boolean;
  onOpenChat: () => void;
  onToggleMenu: () => void;
  onRecordView: () => void;
};

function MaterialRow({
  material,
  isSelected,
  isMenuOpen,
  onOpenChat,
  onToggleMenu,
  onRecordView,
}: Readonly<MaterialRowProps>) {
  return (
    <div
      className={`relative rounded-[22px] border px-4 py-3 transition duration-200 ${
        isSelected
          ? "border-[#4CAF7A] bg-[#F3FBF5] shadow-[0_14px_30px_rgba(76,175,122,0.12)]"
          : "border-slate-200 bg-white hover:border-[rgba(76,175,122,0.24)] hover:bg-[#FCFEFD]"
      }`}
    >
      <div className="flex items-start gap-3">
        <button type="button" onClick={onOpenChat} className="flex min-w-0 flex-1 items-start gap-3 text-left">
          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-slate-50">
            <FileIcon />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-slate-900">{material.title}</p>
            <p className="mt-1 text-[12px] text-slate-500">{formatUploadDate(material.uploadedAt)}</p>
            <p className="mt-2 text-[12px] text-slate-400">{material.locationHint}</p>
          </div>
        </button>

        <div className="relative shrink-0" data-material-menu-root="true">
          <button
            type="button"
            onClick={onToggleMenu}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={`${material.title} 메뉴`}
          >
            <DotsIcon />
          </button>

          {isMenuOpen ? (
            <div className="absolute right-0 top-11 z-20 w-40 rounded-[18px] border border-slate-200 bg-white p-2 shadow-[0_18px_32px_rgba(15,23,42,0.10)]">
              <button
                type="button"
                onClick={onOpenChat}
                className="block w-full rounded-[14px] px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                AI로 열기
              </button>
              <button
                type="button"
                onClick={onRecordView}
                className="mt-1 block w-full rounded-[14px] px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                읽기 기록 남기기
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type AiPanelProps = {
  activeView: ActiveView;
  messages: ChatMessage[];
  selectedMaterialTitle: string | null;
  draft: string;
  hasMaterials: boolean;
  isAnswering: boolean;
  isSubmitting: boolean;
  onDraftChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onExpand: () => void;
  onCollapse: () => void;
  onClose: () => void;
};

function AiPanel({
  activeView,
  messages,
  selectedMaterialTitle,
  draft,
  hasMaterials,
  isAnswering,
  isSubmitting,
  onDraftChange,
  onSubmit,
  onExpand,
  onCollapse,
  onClose,
}: Readonly<AiPanelProps>) {
  const isFull = activeView === "chat-full";
  const title = isFull ? "🤖 자료 AI (자료 기반 답변)" : "🤖 자료 AI";
  const panelMessages = isFull ? messages : messages.slice(-4);

  return (
    <section
      className={`rounded-[28px] border bg-[linear-gradient(180deg,#ffffff_0%,#f7fcf9_100%)] p-4 transition-all duration-300 ${
        isFull ? "shadow-[0_24px_50px_rgba(76,175,122,0.16)]" : "shadow-[0_18px_36px_rgba(76,175,122,0.12)]"
      }`}
      style={{ borderColor: materialBrandLine }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[18px] font-semibold tracking-[-0.03em] text-slate-950">{title}</p>
            {selectedMaterialTitle ? (
              <span className="rounded-full bg-[#E8F6EC] px-3 py-1 text-[11px] font-semibold text-[#4CAF7A]">
                {selectedMaterialTitle}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {isFull
              ? "자료 전체 문맥을 바탕으로 이어서 질문해도 자연스럽게 연결돼요."
              : "선택한 자료를 기준으로 바로 이어서 질문할 수 있어요."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isFull ? (
            <button
              type="button"
              onClick={onCollapse}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              aria-label="챗봇 축소"
            >
              <CollapseIcon />
            </button>
          ) : (
            <button
              type="button"
              onClick={onExpand}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              aria-label="챗봇 확장"
            >
              <ExpandIcon />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            aria-label="챗봇 닫기"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      <div className={`mt-4 space-y-4 ${isFull ? "min-h-[360px]" : "min-h-[200px]"}`}>
        {panelMessages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}

        {isAnswering ? (
          <div className="flex gap-3">
            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8F6EC] text-[#4CAF7A]">
              <SparkIcon />
            </div>
            <div className="rounded-[22px] rounded-tl-[10px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-[0_10px_22px_rgba(15,23,42,0.06)]">
              자료를 바탕으로 답변을 정리하고 있어요...
            </div>
          </div>
        ) : null}
      </div>

      <form
        onSubmit={onSubmit}
        className={`mt-4 ${isFull ? "sticky bottom-[6.25rem] z-10 rounded-[24px] bg-[linear-gradient(180deg,rgba(247,252,249,0.2)_0%,#f7fcf9_28%)] pt-3" : ""}`}
      >
        <div className="flex items-center gap-2 rounded-[999px] border border-slate-200 bg-white px-3 py-2 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
          <input
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder="자료에서 궁금한 점을 입력하세요"
            disabled={!hasMaterials || isSubmitting}
            className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!hasMaterials || !draft.trim() || isSubmitting}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#4CAF7A] text-white shadow-[0_12px_24px_rgba(76,175,122,0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
            aria-label="질문 보내기"
          >
            <SendIcon />
          </button>
        </div>
      </form>
    </section>
  );
}

export function MaterialsScreen({ groupId }: Readonly<{ groupId: string }>) {
  const {
    groups,
    getWeaknessInsights,
    isAnswering,
    isLoading,
    isMutating,
    recordMaterialView,
    sendQuestion,
    uploadMaterialFile,
  } = usePrototype();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeView, setActiveView] = useState<ActiveView>("list");
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadSheetOpen, setIsUploadSheetOpen] = useState(false);
  const [openMenuMaterialId, setOpenMenuMaterialId] = useState<string | null>(null);
  const group = getGroupById(groups, groupId);

  const materials = useMemo(() => (group ? sortMaterials(group) : []), [group]);
  const weaknessInsights = useMemo(
    () => (group ? getWeaknessInsights(group.id) : []),
    [getWeaknessInsights, group],
  );

  useEffect(() => {
    if (materials.length === 0) {
      setSelectedMaterialId(null);
      setActiveView("list");
      return;
    }

    setSelectedMaterialId((previous) => {
      if (previous && materials.some((material) => material.id === previous)) {
        return previous;
      }

      return materials[0]?.id ?? null;
    });
  }, [materials]);

  useEffect(() => {
    if (!openMenuMaterialId) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement | null;

      if (target?.closest("[data-material-menu-root='true']")) {
        return;
      }

      setOpenMenuMaterialId(null);
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [openMenuMaterialId]);

  if (isLoading && !group) {
    return (
      <AppShell
        groupId={groupId}
        title="자료"
        subtitle="팀원들과 자료를 공유하고 AI에게 질문해보세요."
        headerVariant="bare"
        headerContent={<MaterialsHeader />}
        showNavigation={false}
      >
        <LoadingState message="자료와 학습 분석을 불러오는 중입니다." />
      </AppShell>
    );
  }

  if (!group) {
    return (
      <AppShell
        groupId={groupId}
        title="자료"
        subtitle="팀원들과 자료를 공유하고 AI에게 질문해보세요."
        headerVariant="bare"
        headerContent={<MaterialsHeader />}
        showNavigation={false}
      >
        <MissingGroupState />
      </AppShell>
    );
  }

  const activeGroup = group;
  const hasMaterials = materials.length > 0;
  const selectedMaterial =
    materials.find((material) => material.id === selectedMaterialId) ?? materials[0] ?? null;
  const leader =
    activeGroup.members.find((member) => isLeaderRole(member.role)) ?? activeGroup.members[0] ?? null;
  const leaderInsight =
    (leader ? weaknessInsights.find((insight) => insight.memberId === leader.id) : null) ??
    weaknessInsights[0] ??
    null;
  const leaderProgress = leader ? getMemberProgress(activeGroup, leader.id) : 0;
  const weakPointBars = buildWeakPointBars(activeGroup, leaderInsight, materials);
  const thread = activeGroup.chat.length > 0 ? activeGroup.chat : buildPlaceholderThread(selectedMaterial?.title ?? null);
  const isSubmitting = isAnswering(activeGroup.id);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      await uploadMaterialFile(activeGroup.id, file);
      setFeedbackMessage(`${file.name} 자료를 업로드했어요.`);
      setIsUploadSheetOpen(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "자료 업로드 중 오류가 발생했어요.",
      );
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  function handleRecordMaterial(material: Material) {
    recordMaterialView(activeGroup.id, material.id, material.title, material.locationHint, 3 * 60 * 1000);
    setFeedbackMessage(`${material.title} 읽기 기록을 남겼어요.`);
    setErrorMessage(null);
    setOpenMenuMaterialId(null);
  }

  function openMaterialChat(material: Material) {
    setSelectedMaterialId(material.id);
    setActiveView("chat-split");
    setOpenMenuMaterialId(null);
    setFeedbackMessage(null);
    setErrorMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const question = draft.trim();

    if (!question) {
      return;
    }

    setDraft("");
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      await sendQuestion(activeGroup.id, question);
    } catch (error) {
      setDraft(question);
      setErrorMessage(error instanceof Error ? error.message : "질문 전송 중 오류가 발생했어요.");
    }
  }

  return (
    <AppShell
      groupId={groupId}
      title="자료"
      subtitle="팀원들과 자료를 공유하고 AI에게 질문해보세요."
      headerVariant="bare"
      headerContent={<MaterialsHeader />}
      showNavigation={false}
    >
      <div className="space-y-5 pb-28">
        {activeView === "chat-full" ? (
          <>
            <AiPanel
              activeView={activeView}
              messages={thread}
              selectedMaterialTitle={selectedMaterial?.title ?? null}
              draft={draft}
              hasMaterials={hasMaterials}
              isAnswering={isSubmitting}
              isSubmitting={isSubmitting}
              onDraftChange={setDraft}
              onSubmit={handleSubmit}
              onExpand={() => setActiveView("chat-full")}
              onCollapse={() => setActiveView("chat-split")}
              onClose={() => setActiveView("list")}
            />

            {errorMessage ? (
              <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </div>
            ) : null}
            {feedbackMessage ? (
              <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {feedbackMessage}
              </div>
            ) : null}

            <SurfaceCard title="학습 분석">
              <div className="rounded-[22px] border border-slate-100 bg-white p-4 shadow-[0_10px_20px_rgba(15,23,42,0.04)]">
                <div className="flex items-center gap-3">
                  {leader ? (
                    <ProfileAvatar
                      name={leader.name}
                      avatarPreset={leader.avatarPreset}
                      size="md"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-slate-100 text-lg font-semibold text-slate-500">
                      A
                    </div>
                  )}
                  <div>
                    <p className="text-[16px] font-semibold text-slate-950">{leader?.name ?? "팀장"}</p>
                    <p className="mt-1 text-[12px] text-slate-500">{leader?.role ?? "팀장"}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <MetricTile label="완료율" value={`${leaderProgress}%`} />
                  <MetricTile label="질문" value={`${leaderInsight?.questionCount ?? 0}개`} />
                  <MetricTile label="읽기 시간" value={formatReadTime(leaderInsight?.totalViewMinutes ?? 0)} />
                </div>
                <div className="mt-5 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Weak subjects</p>
                  {weakPointBars.map((item) => (
                    <ProgressRow key={item.id} label={item.label} value={item.percent} />
                  ))}
                </div>
              </div>
            </SurfaceCard>
          </>
        ) : (
          <>
            <SurfaceCard
              title={
                <div className="flex items-center gap-2">
                  <FileIcon />
                  <span>자료 관리</span>
                </div>
              }
              action={
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadSheetOpen((previous) => !previous);
                    setOpenMenuMaterialId(null);
                  }}
                  className="rounded-full bg-[#4CAF7A] px-4 py-2 text-xs font-semibold text-white shadow-[0_12px_24px_rgba(76,175,122,0.22)] transition hover:brightness-105"
                >
                  + 자료 업로드
                </button>
              }
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,.markdown,.csv,.json,text/plain,text/markdown,text/csv,application/json"
                onChange={handleFileChange}
                className="hidden"
              />

              {isUploadSheetOpen ? (
                <div className="rounded-[22px] border border-dashed border-[rgba(76,175,122,0.32)] bg-[#F8FDF9] p-4">
                  <p className="text-sm font-semibold text-slate-900">공용 자료를 더 추가해볼까요?</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    PDF, TXT, MD, CSV, JSON 같은 텍스트 기반 자료를 올리면 팀원 모두가 같은 기준으로 질문할 수 있어요.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || isMutating}
                      className="rounded-full bg-[#4CAF7A] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-50"
                    >
                      {isUploading ? "업로드 중..." : "파일 선택"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsUploadSheetOpen(false)}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              ) : null}

              {materials.length > 0 ? (
                <div className="space-y-3">
                  {materials.map((material) => (
                    <MaterialRow
                      key={material.id}
                      material={material}
                      isSelected={selectedMaterial?.id === material.id && activeView !== "list"}
                      isMenuOpen={openMenuMaterialId === material.id}
                      onOpenChat={() => openMaterialChat(material)}
                      onToggleMenu={() =>
                        setOpenMenuMaterialId((previous) =>
                          previous === material.id ? null : material.id,
                        )
                      }
                      onRecordView={() => handleRecordMaterial(material)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-sm leading-6 text-slate-500">
                  아직 등록된 자료가 없어요. 자료를 먼저 올리면 AI 답변과 학습 분석이 더 풍부해집니다.
                </div>
              )}

              {errorMessage ? (
                <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errorMessage}
                </div>
              ) : null}
              {feedbackMessage ? (
                <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {feedbackMessage}
                </div>
              ) : null}
            </SurfaceCard>

            {activeView === "chat-split" ? (
              <AiPanel
                activeView={activeView}
                messages={thread}
                selectedMaterialTitle={selectedMaterial?.title ?? null}
                draft={draft}
                hasMaterials={hasMaterials}
                isAnswering={isSubmitting}
                isSubmitting={isSubmitting}
                onDraftChange={setDraft}
                onSubmit={handleSubmit}
                onExpand={() => setActiveView("chat-full")}
                onCollapse={() => setActiveView("chat-split")}
                onClose={() => setActiveView("list")}
              />
            ) : null}

            <SurfaceCard title="학습 분석">
              <div className="rounded-[22px] border border-slate-100 bg-white p-4 shadow-[0_10px_20px_rgba(15,23,42,0.04)]">
                <div className="flex items-center gap-3">
                  {leader ? (
                    <ProfileAvatar
                      name={leader.name}
                      avatarPreset={leader.avatarPreset}
                      size="md"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-slate-100 text-lg font-semibold text-slate-500">
                      A
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-semibold text-slate-950">
                      {leader?.name ?? "팀장"}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-500">{leader?.role ?? "팀장"}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <MetricTile label="완료율" value={`${leaderProgress}%`} />
                  <MetricTile label="질문" value={`${leaderInsight?.questionCount ?? 0}개`} />
                  <MetricTile
                    label="읽기 시간"
                    value={formatReadTime(leaderInsight?.totalViewMinutes ?? 0)}
                  />
                </div>

                <div className="mt-5 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Weak subjects
                  </p>
                  {weakPointBars.map((item) => (
                    <ProgressRow key={item.id} label={item.label} value={item.percent} />
                  ))}
                </div>
              </div>
            </SurfaceCard>
          </>
        )}
      </div>

      <MaterialsFloatingNav groupId={groupId} />
    </AppShell>
  );
}
