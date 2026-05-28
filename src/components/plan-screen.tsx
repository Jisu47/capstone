"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { GroupPageHeader } from "@/components/group-page-header";
import {
  AppShell,
  LoadingState,
  MissingGroupState,
  SectionCard,
} from "@/components/mobile-shell";
import { usePrototype } from "@/components/prototype-provider";
import {
  getCurrentUserPersonalPlanItems,
  getNextPendingReviewDate,
  getPendingReviewCandidates,
  getReviewCandidateScheduledDate,
  getReviewIntervalLabel,
  isLeader,
  orderedWeekdays,
  reviewIntervalOptions,
  type PersonalPlanItemDraft,
} from "@/lib/plan-flow";
import { type StudyGroup } from "@/lib/mock-data";

function getGroupById(groups: StudyGroup[], groupId: string) {
  return groups.find((group) => group.id === groupId);
}

function Chevron({ open }: Readonly<{ open: boolean }>) {
  return (
    <svg
      aria-hidden="true"
      className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
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
  );
}

function ExpandableSection({
  title,
  subtitle,
  defaultOpen = true,
  action,
  children,
}: Readonly<{
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  action?: ReactNode;
  children: ReactNode;
}>) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <SectionCard
      title={title}
      action={
        <div className="flex items-center gap-2">
          {action}
          <button
            type="button"
            onClick={() => setOpen((previous) => !previous)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600"
            aria-expanded={open}
          >
            <Chevron open={open} />
          </button>
        </div>
      }
    >
      {subtitle ? <p className="text-sm text-[var(--ink-soft)]">{subtitle}</p> : null}
      {open ? children : null}
    </SectionCard>
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Failed to read image data."));
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error("Failed to read image data."));
    };

    reader.readAsDataURL(file);
  });
}

function formatReviewDate(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function SummaryChip({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-4 shadow-[0_6px_16px_rgba(15,23,42,0.03)]">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function ReviewScheduleDialog({
  group,
  memberId,
  isOpen,
  onClose,
}: Readonly<{
  group: StudyGroup;
  memberId: string;
  isOpen: boolean;
  onClose: () => void;
}>) {
  const pendingReviewCandidates = getPendingReviewCandidates(group, memberId);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/28 px-4">
      <div className="w-full max-w-[420px] rounded-[20px] border border-slate-200 bg-white shadow-[0_20px_48px_rgba(15,23,42,0.14)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-base font-semibold text-slate-950">복습 예정 항목</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              이해도가 낮았던 항목만 모아 두고, 복습 간격이 되면 개인 할 일로 자동 추가합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
          >
            닫기
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {pendingReviewCandidates.length === 0 ? (
            <div className="rounded-[16px] border border-dashed border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-[var(--ink-soft)]">
              아직 예정된 복습 항목이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReviewCandidates.map((candidate) => {
                const scheduledDate = getReviewCandidateScheduledDate(group, candidate, memberId);

                return (
                  <article
                    key={candidate.id}
                    className="rounded-[16px] border border-slate-200 bg-white px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{candidate.title}</p>
                        {candidate.detail ? (
                          <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">
                            {candidate.detail}
                          </p>
                        ) : null}
                      </div>
                      <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                        예정
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-500">
                      {scheduledDate
                        ? `${formatReviewDate(scheduledDate)}에 개인 할 일로 추가 예정`
                        : "복습 간격을 설정하면 예정일이 계산됩니다."}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PlanFlowScreen({ groupId }: Readonly<{ groupId: string }>) {
  const {
    groups,
    isLoading,
    isMutating,
    currentUserId,
    togglePlanItem,
    uploadPlanReference,
    updateReviewInterval,
    addPersonalPlanItem,
    updatePersonalPlanItem,
    togglePersonalPlanItem,
  } = usePrototype();
  const group = getGroupById(groups, groupId);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [newPersonalDraft, setNewPersonalDraft] = useState<PersonalPlanItemDraft>({
    title: "",
    detail: "",
  });
  const [editingPersonalItemId, setEditingPersonalItemId] = useState<string | null>(null);
  const [editingPersonalDraft, setEditingPersonalDraft] = useState<PersonalPlanItemDraft>({
    title: "",
    detail: "",
  });
  const [isReviewScheduleOpen, setIsReviewScheduleOpen] = useState(false);

  if (isLoading && !group) {
    return (
      <AppShell groupId={groupId} title="계획">
        <LoadingState message="계획 화면을 불러오는 중입니다." />
      </AppShell>
    );
  }

  if (!group) {
    return (
      <AppShell groupId={groupId} title="계획">
        <MissingGroupState />
      </AppShell>
    );
  }

  const activeGroup = group;
  const leaderMode = isLeader(activeGroup, currentUserId);
  const personalPlanItems = getCurrentUserPersonalPlanItems(activeGroup, currentUserId);
  const pendingReviewCandidates = getPendingReviewCandidates(activeGroup, currentUserId);
  const reviewInterval = activeGroup.reviewIntervals[currentUserId] ?? null;
  const nextPendingReviewDate = getNextPendingReviewDate(activeGroup, currentUserId);
  const nextPendingReviewLabel = !reviewInterval
    ? "간격 미설정"
    : nextPendingReviewDate
      ? formatReviewDate(nextPendingReviewDate)
      : "예정 없음";

  async function handleUploadChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const imageDataUrl = await readFileAsDataUrl(file);
    await uploadPlanReference(activeGroup.id, {
      fileName: file.name,
      mimeType: file.type || "image/png",
      imageDataUrl,
    });
    event.target.value = "";
  }

  async function handleAddPersonalItem() {
    if (!newPersonalDraft.title.trim()) {
      return;
    }

    await addPersonalPlanItem(activeGroup.id, {
      title: newPersonalDraft.title.trim(),
      detail: newPersonalDraft.detail.trim(),
    });
    setNewPersonalDraft({ title: "", detail: "" });
  }

  async function handleSavePersonalItem() {
    if (!editingPersonalItemId || !editingPersonalDraft.title.trim()) {
      return;
    }

    await updatePersonalPlanItem(editingPersonalItemId, {
      title: editingPersonalDraft.title.trim(),
      detail: editingPersonalDraft.detail.trim(),
    });
    setEditingPersonalItemId(null);
    setEditingPersonalDraft({ title: "", detail: "" });
  }

  return (
    <AppShell
      groupId={groupId}
      title="계획"
      headerContent={<GroupPageHeader groupId={activeGroup.id} groupName={activeGroup.name} />}
    >
      <div className="space-y-4">
        <ExpandableSection
          title="진도표"
          action={
            leaderMode ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-[12px] border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-[0_4px_10px_rgba(15,23,42,0.03)]"
              >
                이미지 추가
              </button>
            ) : null
          }
        >
          <input
            ref={fileInputRef}
            hidden
            accept="image/*"
            type="file"
            onChange={(event) => {
              void handleUploadChange(event);
            }}
          />

          {activeGroup.planReferenceUploads.length === 0 ? (
            <div className="rounded-[14px] border border-dashed border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-[var(--ink-soft)]">
              {leaderMode
                ? "인강 진도표나 목차 이미지를 올리면 전체 계획을 잡을 수 있어요."
                : "팀장이 올린 진도표가 아직 없습니다."}
            </div>
          ) : (
            <div className="space-y-3">
              {activeGroup.planReferenceUploads.map((upload) => (
                <article
                  key={upload.id}
                  className="overflow-hidden rounded-[16px] border border-slate-200 bg-white"
                >
                  <div className="relative h-36 w-full">
                    <Image
                      fill
                      unoptimized
                      alt={upload.fileName}
                      className="object-cover"
                      src={upload.imageDataUrl}
                    />
                  </div>
                  <div className="space-y-2 px-4 py-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{upload.fileName}</p>
                      <p className="text-xs text-slate-500">
                        {upload.uploadedBy} · {upload.mimeType}
                      </p>
                    </div>
                    <p className="text-sm leading-6 text-[var(--ink-soft)]">{upload.summary}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </ExpandableSection>

        <ExpandableSection
          title="전체 계획"
          action={
            leaderMode ? (
              <Link
                href={`/group/${activeGroup.id}/plan/agent`}
                className="rounded-[12px] border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-[0_4px_10px_rgba(15,23,42,0.03)]"
              >
                계획 새로 짜기
              </Link>
            ) : null
          }
        >
          {activeGroup.roadmap.length === 0 ? (
            <div className="rounded-[14px] border border-dashed border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-[var(--ink-soft)]">
              {activeGroup.planReferenceUploads.length === 0
                ? "진도표를 먼저 올리면 주차별 로드맵이 여기 정리됩니다."
                : "계획 에이전트에서 초안을 만들면 전체 계획이 여기 반영됩니다."}
            </div>
          ) : (
            <div className="space-y-3">
              {activeGroup.roadmap.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[16px] border border-slate-200 bg-white px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                        {item.weekNumber}주차
                      </p>
                      <p className="mt-1 text-base font-semibold text-slate-900">
                        {item.title}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {item.unitStartSequence} ~ {item.unitEndSequence}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{item.summary}</p>
                </article>
              ))}
            </div>
          )}
        </ExpandableSection>

        <ExpandableSection title="이번 주 계획">
          <div className="space-y-4">
            {orderedWeekdays.map((day) => {
              const dayPlanItems = activeGroup.plan.filter((item) => item.day === day);

              return (
                <section
                  key={day}
                  className="rounded-[16px] border border-slate-200 bg-white px-4 py-4 shadow-[0_6px_16px_rgba(15,23,42,0.03)]"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">{day}</p>
                    <span className="text-xs text-slate-500">{dayPlanItems.length}개</span>
                  </div>

                  <div className="space-y-2">
                    {dayPlanItems.map((item) => {
                      const checked = item.memberStatus[currentUserId];

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            void togglePlanItem(activeGroup.id, item.id);
                          }}
                          className={`w-full rounded-[14px] border px-4 py-4 text-left transition ${
                            checked
                              ? "border-[var(--brand)] bg-white shadow-[0_6px_16px_rgba(121,184,149,0.10)]"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-900">
                                {item.title}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">
                                {item.detail}
                              </p>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                              {item.duration}
                            </span>
                          </div>
                        </button>
                      );
                    })}

                    {dayPlanItems.length === 0 ? (
                      <div className="rounded-[14px] border border-dashed border-slate-200 bg-white px-4 py-4 text-sm text-slate-400">
                        등록된 계획이 없습니다.
                      </div>
                    ) : null}
                  </div>
                </section>
              );
            })}
          </div>
        </ExpandableSection>

        <ExpandableSection
          title="개인 추가 할 일"
          subtitle="직접 추가한 할 일과 복습 시점이 된 [복습] 할 일만 여기 표시합니다."
        >
          <div className="space-y-4">
            <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-4">
              <p className="text-sm font-semibold text-slate-900">개인 할 일 직접 추가</p>
              <div className="mt-3 space-y-3">
                <input
                  value={newPersonalDraft.title}
                  onChange={(event) =>
                    setNewPersonalDraft((previous) => ({
                      ...previous,
                      title: event.target.value,
                    }))
                  }
                  placeholder="추가할 할 일 제목"
                  className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                />
                <textarea
                  rows={3}
                  value={newPersonalDraft.detail}
                  onChange={(event) =>
                    setNewPersonalDraft((previous) => ({
                      ...previous,
                      detail: event.target.value,
                    }))
                  }
                  placeholder="메모"
                  className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    void handleAddPersonalItem();
                  }}
                  disabled={isMutating || !newPersonalDraft.title.trim()}
                  className="w-full rounded-[14px] bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
                >
                  개인 할 일 추가
                </button>
              </div>
            </div>

            {personalPlanItems.length === 0 ? (
              <div className="rounded-[16px] border border-dashed border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-[var(--ink-soft)]">
                아직 추가된 개인 할 일이 없습니다. 직접 할 일을 추가하거나 복습 시점이 되면
                [복습] 할 일이 자동으로 들어옵니다.
              </div>
            ) : (
              <div className="space-y-3">
                {personalPlanItems.map((item) => {
                  const editing = editingPersonalItemId === item.id;
                  const isReviewTask =
                    item.title.startsWith("[복습]") || Boolean(item.sourcePlanItemId);

                  return (
                    <div
                      key={item.id}
                      className="rounded-[16px] border border-slate-200 bg-white px-4 py-4"
                    >
                      {editing ? (
                        <div className="space-y-3">
                          <input
                            value={editingPersonalDraft.title}
                            onChange={(event) =>
                              setEditingPersonalDraft((previous) => ({
                                ...previous,
                                title: event.target.value,
                              }))
                            }
                            className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                          />
                          <textarea
                            rows={3}
                            value={editingPersonalDraft.detail}
                            onChange={(event) =>
                              setEditingPersonalDraft((previous) => ({
                                ...previous,
                                detail: event.target.value,
                              }))
                            }
                            className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                void handleSavePersonalItem();
                              }}
                              className="rounded-[14px] bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white"
                            >
                              저장
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPersonalItemId(null);
                                setEditingPersonalDraft({ title: "", detail: "" });
                              }}
                              className="rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                                {isReviewTask ? (
                                  <span className="rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--brand)]">
                                    복습
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                    직접 추가
                                  </span>
                                )}
                              </div>
                              {item.detail ? (
                                <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">
                                  {item.detail}
                                </p>
                              ) : null}
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPersonalItemId(item.id);
                                  setEditingPersonalDraft({
                                    title: item.title,
                                    detail: item.detail,
                                  });
                                }}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                              >
                                수정
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  void togglePersonalPlanItem(item.id, !item.completed);
                                }}
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  item.completed
                                    ? "border border-[var(--brand)] bg-white text-[var(--brand)]"
                                    : "bg-slate-950 text-white"
                                }`}
                              >
                                {item.completed ? "완료" : "체크"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ExpandableSection>

        <ExpandableSection
          title="복습 관리"
          subtitle="이해도가 낮았던 항목은 복습 예정으로 저장되고, 복습 간격이 지나면 자동으로 개인 할 일로 추가됩니다."
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">내 복습 간격</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {reviewIntervalOptions.map((option) => {
                  const active = reviewInterval === option.days;

                  return (
                    <button
                      key={option.days}
                      type="button"
                      onClick={() => {
                        void updateReviewInterval(activeGroup.id, active ? null : option.days);
                      }}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        active
                          ? "border border-[var(--brand)] bg-white text-[var(--brand)]"
                          : "border border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryChip
                label="현재 설정"
                value={getReviewIntervalLabel(reviewInterval)}
              />
              <SummaryChip
                label="다음 예정일"
                value={nextPendingReviewLabel}
              />
              <SummaryChip
                label="예정 항목 수"
                value={`${pendingReviewCandidates.length}개`}
              />
            </div>

            <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">예정 항목 보기</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">
                    복습 예정 항목은 여기에서만 확인할 수 있고, 시점이 되면 개인 추가 할 일로 넘어갑니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReviewScheduleOpen(true)}
                  className="rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-[0_4px_10px_rgba(15,23,42,0.03)]"
                >
                  예정 항목 보기
                </button>
              </div>
            </div>
          </div>
        </ExpandableSection>

        {leaderMode ? (
          <Link
            href={`/group/${activeGroup.id}/plan/agent`}
            className="flex w-full items-center justify-center rounded-[16px] bg-[var(--brand)] px-5 py-4 text-sm font-semibold text-white"
          >
            계획 새로 짜기
          </Link>
        ) : null}

        {isMutating ? (
          <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-500 shadow-[0_6px_16px_rgba(15,23,42,0.03)]">
            계획을 저장하는 중입니다.
          </div>
        ) : null}
      </div>

      <ReviewScheduleDialog
        group={activeGroup}
        memberId={currentUserId}
        isOpen={isReviewScheduleOpen}
        onClose={() => setIsReviewScheduleOpen(false)}
      />
    </AppShell>
  );
}
