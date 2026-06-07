"use client";

import { type ReactNode, useMemo, useState } from "react";
import { orderedWeekdays } from "@/lib/plan-flow";
import { type Weekday, type WeeklyPlanItem } from "@/lib/mock-data";

type WeeklyPlanDraftItem = Pick<
  WeeklyPlanItem,
  "id" | "day" | "title" | "detail" | "duration" | "memberStatus" | "referenceUnitSequence"
>;

function BookIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
      <path
        d="M4.75 6.75A2.75 2.75 0 0 1 7.5 4h11.75v13.25H7.5a2.75 2.75 0 0 0-2.75 2.75V6.75Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M7.5 4v16M9.75 7.5h6.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
      <path
        d="M4.75 6.75A2.75 2.75 0 0 1 7.5 4h9A2.75 2.75 0 0 1 19.25 6.75v10.5A2.75 2.75 0 0 1 16.5 20h-9a2.75 2.75 0 0 1-2.75-2.75V6.75Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="m10 9.25 4.5 2.75L10 14.75v-5.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M4.75 8.75h14.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        d="m4.75 16.5 8.8-8.8a2.3 2.3 0 1 1 3.25 3.25L8 19.75l-3.25.75.75-4Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="m12.75 8.5 3.25 3.25"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        d="M5.75 7.25h12.5M9.25 4.75h5.5m-7 2.5 1 11a1.75 1.75 0 0 0 1.74 1.59h3.52a1.75 1.75 0 0 0 1.74-1.59l1-11"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M10 10.25v5.5M14 10.25v5.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        d="M12 5.5v13M5.5 12h13"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function parseDurationMinutes(duration: string) {
  const matched = duration.match(/(\d+)/);
  const parsed = matched ? Number.parseInt(matched[1], 10) : Number.NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 60;
  }

  return parsed;
}

function formatClock(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function buildTimeRangeLabel(duration: string, index: number) {
  const startMinutes = 9 * 60 + index * 120;
  const endMinutes = startMinutes + parseDurationMinutes(duration);
  return `${formatClock(startMinutes)} - ${formatClock(endMinutes)}`;
}

function getPlanVisualType(title: string, detail: string) {
  const normalized = `${title} ${detail}`.toLowerCase();

  if (/강의|시청|영상|비디오|lecture|video/.test(normalized)) {
    return "video";
  }

  if (/문제|코드|연습|필기|발표|질문|학습|코딩|작성|정리/.test(normalized)) {
    return "pencil";
  }

  return "book";
}

function PlanTypeIcon({ type }: Readonly<{ type: "book" | "video" | "pencil" }>) {
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] text-slate-900 shadow-[0_6px_14px_rgba(15,23,42,0.05)]">
      {type === "video" ? <VideoIcon /> : type === "pencil" ? <PencilIcon /> : <BookIcon />}
    </span>
  );
}

function ActionIconButton({
  label,
  onClick,
  children,
  tone = "default",
}: Readonly<{
  label: string;
  onClick: () => void;
  children: ReactNode;
  tone?: "default" | "danger";
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-slate-500 transition hover:border-slate-300 hover:text-slate-900 ${
        tone === "danger"
          ? "border-rose-100 bg-rose-50 text-rose-500 hover:border-rose-200 hover:text-rose-600"
          : "border-slate-200 bg-white"
      }`}
    >
      {children}
    </button>
  );
}

export function WeeklyPlanTabs({
  items,
  currentUserId,
  onTogglePlanItem,
  editable = false,
  editingItemId = null,
  onStartEditItem,
  onDeleteDraftItem,
  onAddDraftItem,
  onUpdateDraftItem,
  emptyMessage = "선택한 요일에 등록된 계획이 없습니다.",
}: Readonly<{
  items: WeeklyPlanDraftItem[];
  currentUserId?: string;
  onTogglePlanItem?: (itemId: string) => void;
  editable?: boolean;
  editingItemId?: string | null;
  onStartEditItem?: (itemId: string | null) => void;
  onDeleteDraftItem?: (itemId: string) => void;
  onAddDraftItem?: (day: Weekday) => void;
  onUpdateDraftItem?: (
    itemId: string,
    field: "title" | "detail" | "duration",
    value: string,
  ) => void;
  emptyMessage?: string;
}>) {
  const [activeDay, setActiveDay] = useState<Weekday>(orderedWeekdays[0]);
  const plansByDay = useMemo(
    () =>
      orderedWeekdays.map((day) => ({
        day,
        items: items.filter((item) => item.day === day),
      })),
    [items],
  );
  const activeDayItems = plansByDay.find((entry) => entry.day === activeDay)?.items ?? [];

  return (
    <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
      <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fcfdfc_100%)]">
        <div className="grid grid-cols-5">
          {plansByDay.map(({ day, items: dayItems }) => {
            const active = day === activeDay;
            const count = dayItems.length;
            const countClass =
              count === 0
                ? "bg-slate-100 text-slate-500"
                : active
                  ? "bg-[var(--brand)] text-white"
                  : "bg-[rgba(121,184,149,0.18)] text-[var(--brand)]";

            return (
              <button
                key={day}
                type="button"
                onClick={() => setActiveDay(day)}
                className={`relative flex flex-col items-center gap-1.5 px-1.5 pb-3 pt-3 text-[13px] transition ${
                  active ? "font-semibold text-slate-950" : "font-medium text-slate-500"
                }`}
                aria-pressed={active}
              >
                <span className="flex items-center gap-1.5">
                  <span>{day}</span>
                  <span
                    className={`inline-flex min-w-7 items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${countClass}`}
                  >
                    {count}
                  </span>
                </span>
                {active ? (
                  <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-[var(--brand)]" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2.5 px-3.5 py-3.5">
        {activeDayItems.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-slate-200 bg-slate-50/70 px-3.5 py-6 text-center text-[13px] text-slate-400">
            {emptyMessage}
          </div>
        ) : (
          activeDayItems.map((item, index) => {
            const checked = currentUserId ? item.memberStatus[currentUserId] : false;
            const timeRangeLabel = buildTimeRangeLabel(item.duration, index);
            const visualType = getPlanVisualType(item.title, item.detail);
            const cardClass = checked
              ? "border-[var(--brand)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fdf9_100%)] shadow-[0_10px_22px_rgba(121,184,149,0.10)]"
              : "border-slate-200 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.04)]";
            const isEditing = editable && editingItemId === item.id;

            const inner = (
              <>
                <PlanTypeIcon type={visualType} />
                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <input
                          value={item.title}
                          onChange={(event) => {
                            onUpdateDraftItem?.(item.id, "title", event.target.value);
                          }}
                          placeholder="계획 제목"
                          className="w-full rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-[14px] font-semibold text-slate-950 outline-none focus:border-[var(--brand)]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            onStartEditItem?.(null);
                          }}
                          className="shrink-0 rounded-full border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-500"
                        >
                          완료
                        </button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)]">
                        <input
                          value={item.duration}
                          onChange={(event) => {
                            onUpdateDraftItem?.(item.id, "duration", event.target.value);
                          }}
                          placeholder="60분"
                          className="w-full rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-600 outline-none focus:border-[var(--brand)]"
                        />
                        <p className="self-center text-[12px] font-medium text-slate-500">
                          {timeRangeLabel}
                        </p>
                      </div>
                      <textarea
                        rows={3}
                        value={item.detail}
                        onChange={(event) => {
                          onUpdateDraftItem?.(item.id, "detail", event.target.value);
                        }}
                        placeholder="세부 내용"
                        className="w-full resize-none rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-[13px] leading-5 text-slate-700 outline-none focus:border-[var(--brand)]"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-semibold tracking-[-0.03em] text-slate-950">
                            {item.title || "새 계획"}
                          </p>
                          <p className="mt-1 text-[12px] font-medium text-slate-600">
                            {timeRangeLabel}
                          </p>
                        </div>
                        {editable ? (
                          <div className="flex shrink-0 items-center gap-1.5">
                            <ActionIconButton
                              label="계획 수정"
                              onClick={() => {
                                onStartEditItem?.(item.id);
                              }}
                            >
                              <PencilIcon />
                            </ActionIconButton>
                            <ActionIconButton
                              label="계획 삭제"
                              onClick={() => {
                                onDeleteDraftItem?.(item.id);
                              }}
                              tone="danger"
                            >
                              <TrashIcon />
                            </ActionIconButton>
                          </div>
                        ) : null}
                      </div>
                      {item.detail ? (
                        <p className="mt-2 whitespace-pre-line text-[12px] leading-5 text-slate-500">
                          {item.detail}
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
              </>
            );

            if (onTogglePlanItem) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTogglePlanItem(item.id)}
                  className={`flex w-full items-center gap-3 rounded-[16px] border px-3.5 py-3 text-left transition ${cardClass} hover:border-slate-300`}
                >
                  {inner}
                </button>
              );
            }

            return (
              <div
                key={item.id}
                className={`flex w-full items-start gap-3 rounded-[16px] border px-3.5 py-3 text-left ${cardClass}`}
              >
                {inner}
              </div>
            );
          })
        )}

        {editable ? (
          <button
            type="button"
            onClick={() => {
              onAddDraftItem?.(activeDay);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-[15px] border border-dashed border-[var(--line)] bg-[var(--surface)] px-3.5 py-3 text-[13px] font-semibold text-[var(--brand)] transition hover:border-[var(--brand)]"
          >
            <PlusIcon />
            <span>새 계획 추가</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
