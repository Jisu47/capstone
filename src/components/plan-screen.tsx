"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type ChangeEvent } from "react";
import { GroupPageHeader } from "@/components/group-page-header";
import {
  AppShell,
  LoadingState,
  MissingGroupState,
  SectionCard,
} from "@/components/mobile-shell";
import { usePrototype } from "@/components/prototype-provider";
import {
  buildReviewCards,
  getCurrentUserPersonalPlanItems,
  getReviewIntervalLabel,
  isLeader,
  orderedWeekdays,
  reviewIntervalOptions,
  type PersonalPlanItemDraft,
} from "@/lib/plan-flow";
import { currentUserId, type StudyGroup, type Weekday } from "@/lib/mock-data";

function getGroupById(groups: StudyGroup[], groupId: string) {
  return groups.find((group) => group.id === groupId);
}

function Chevron({
  open,
}: Readonly<{
  open: boolean;
}>) {
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
  action?: React.ReactNode;
  children: React.ReactNode;
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
      {subtitle ? (
        <p className="text-sm leading-6 text-[var(--ink-soft)]">{subtitle}</p>
      ) : null}

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

export function PlanFlowScreen({ groupId }: Readonly<{ groupId: string }>) {
  const {
    groups,
    isLoading,
    isMutating,
    togglePlanItem,
    uploadPlanReference,
    updateReviewDays,
    updateReviewInterval,
    addPersonalPlanItem,
    updatePersonalPlanItem,
    togglePersonalPlanItem,
  } = usePrototype();
  const group = getGroupById(groups, groupId);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [newPersonalItem, setNewPersonalItem] = useState<PersonalPlanItemDraft>({
    title: "",
    detail: "",
  });
  const [editingPersonalItemId, setEditingPersonalItemId] = useState<string | null>(null);
  const [editingPersonalDraft, setEditingPersonalDraft] =
    useState<PersonalPlanItemDraft>({
      title: "",
      detail: "",
    });

  if (isLoading && !group) {
    return (
      <AppShell
        groupId={groupId}
        title="계획"
        subtitle="계획 데이터를 불러오는 중입니다."
      >
        <LoadingState message="계획 탭을 준비하고 있습니다." />
      </AppShell>
    );
  }

  if (!group) {
    return (
      <AppShell
        groupId={groupId}
        title="계획"
        subtitle="선택한 그룹을 찾을 수 없습니다."
      >
        <MissingGroupState />
      </AppShell>
    );
  }

  const activeGroup = group;
  const leaderMode = isLeader(activeGroup);
  const reviewCards = buildReviewCards(activeGroup, currentUserId);
  const personalPlanItems = getCurrentUserPersonalPlanItems(activeGroup, currentUserId);
  const reviewInterval = activeGroup.reviewIntervals[currentUserId] ?? null;

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
    if (!newPersonalItem.title.trim()) {
      return;
    }

    await addPersonalPlanItem(activeGroup.id, {
      title: newPersonalItem.title.trim(),
      detail: newPersonalItem.detail.trim(),
    });
    setNewPersonalItem({ title: "", detail: "" });
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

  function toggleReviewDay(day: Weekday) {
    const nextReviewDays = activeGroup.reviewDays.includes(day)
      ? activeGroup.reviewDays.filter((entry) => entry !== day)
      : [...activeGroup.reviewDays, day];

    void updateReviewDays(activeGroup.id, nextReviewDays);
  }

  return (
    <AppShell
      groupId={groupId}
      title="계획"
      subtitle={`${activeGroup.subject} 계획 흐름과 복습 설정`}
      headerContent={<GroupPageHeader groupId={activeGroup.id} groupName={activeGroup.name} />}
    >
      <div className="space-y-4">
        <ExpandableSection
          title="진도표 업로드"
          subtitle="인강 진도표나 문제집 목차 사진을 올리면 총 계획과 복습 기준이 됩니다."
          action={
            leaderMode ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full border border-[var(--brand)] bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand)]"
              >
                이미지 업로드
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
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/70 px-4 py-5 text-sm leading-6 text-[var(--ink-soft)]">
              {leaderMode
                ? "아직 업로드된 진도표가 없습니다. 계획 에이전트를 쓰기 전에 이미지 진도표를 먼저 올려 주세요."
                : "팀장이 올린 진도표가 아직 없습니다."}
            </div>
          ) : (
            <div className="space-y-3">
              {activeGroup.planReferenceUploads.map((upload) => (
                <article
                  key={upload.id}
                  className="overflow-hidden rounded-[26px] border border-[var(--line)] bg-white/82 shadow-[0_16px_36px_rgba(28,64,120,0.08)]"
                >
                  <div className="relative h-40 w-full">
                    <Image
                      fill
                      unoptimized
                      alt={upload.fileName}
                      className="object-cover"
                      src={upload.imageDataUrl}
                    />
                  </div>
                  <div className="space-y-2 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {upload.fileName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {upload.uploadedBy} · {upload.mimeType}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm leading-6 text-[var(--ink-soft)]">
                      {upload.summary}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </ExpandableSection>

        <ExpandableSection
          title="총 계획"
          subtitle="업로드한 진도표를 바탕으로 계획 에이전트가 만든 주차별 로드맵입니다."
          action={
            leaderMode ? (
              <Link
                href={`/group/${activeGroup.id}/plan/agent`}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
              >
                계획 새로 짜기
              </Link>
            ) : null
          }
        >
          {activeGroup.roadmap.length === 0 ? (
            <div className="rounded-[24px] bg-white/75 px-4 py-5 text-sm leading-6 text-[var(--ink-soft)]">
              {activeGroup.planReferenceUploads.length === 0
                ? "먼저 진도표 이미지를 올린 뒤 계획 에이전트로 총 계획을 생성해 주세요."
                : "진도표는 준비됐습니다. 팀장이 계획 에이전트에서 총 계획 초안을 만들고 적용하면 여기에 보입니다."}
            </div>
          ) : (
            <div className="space-y-3">
              {activeGroup.roadmap.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[26px] border border-[var(--line)] bg-white/84 p-4 shadow-[0_16px_36px_rgba(28,64,120,0.08)]"
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
                  <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
                    {item.summary}
                  </p>
                </article>
              ))}
            </div>
          )}
        </ExpandableSection>

        <ExpandableSection
          title="이번주 계획"
          subtitle="팀의 현재 주 핵심 계획입니다. 복습 카드는 계산형이라 완료율에는 포함되지 않습니다."
        >
          <div className="space-y-4">
            {orderedWeekdays.map((day) => {
              const dayPlanItems = activeGroup.plan.filter((item) => item.day === day);
              const dayReviewCards = reviewCards.filter((item) => item.day === day);

              return (
                <section key={day} className="rounded-[26px] bg-white/78 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                      {day}
                    </p>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {dayPlanItems.length + dayReviewCards.length}개
                    </span>
                  </div>

                  <div className="space-y-3">
                    {dayPlanItems.map((item) => {
                      const checked = item.memberStatus[currentUserId];

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            void togglePlanItem(activeGroup.id, item.id);
                          }}
                          className={`w-full rounded-[22px] border px-4 py-4 text-left transition ${
                            checked
                              ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                              : "border-[var(--line)] bg-white"
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
                            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">
                              {item.duration}
                            </span>
                          </div>
                        </button>
                      );
                    })}

                    {dayReviewCards.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-4"
                      >
                        <p className="text-sm font-semibold text-amber-900">{item.title}</p>
                        <p className="mt-1 text-xs leading-5 text-amber-800">
                          {item.detail}
                        </p>
                      </div>
                    ))}

                    {dayPlanItems.length === 0 && dayReviewCards.length === 0 ? (
                      <div className="rounded-[22px] border border-dashed border-slate-200 bg-white px-4 py-4 text-sm text-slate-400">
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
          title="이번주 추가 할 일"
          subtitle="내가 따로 챙길 개인 할 일만 보이고 수정할 수 있습니다."
        >
          <div className="space-y-3">
            {personalPlanItems.map((item) => {
              const editing = editingPersonalItemId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-[24px] border border-[var(--line)] bg-white/82 p-4"
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
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
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
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            void handleSavePersonalItem();
                          }}
                          className="rounded-2xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white"
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPersonalItemId(null);
                            setEditingPersonalDraft({ title: "", detail: "" });
                          }}
                          className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
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
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
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
                                ? "bg-emerald-500 text-white"
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

            <div className="rounded-[24px] border border-dashed border-[var(--line)] bg-white/72 p-4">
              <div className="space-y-3">
                <input
                  value={newPersonalItem.title}
                  onChange={(event) =>
                    setNewPersonalItem((previous) => ({
                      ...previous,
                      title: event.target.value,
                    }))
                  }
                  placeholder="개인 추가 할 일 제목"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                />
                <textarea
                  rows={3}
                  value={newPersonalItem.detail}
                  onChange={(event) =>
                    setNewPersonalItem((previous) => ({
                      ...previous,
                      detail: event.target.value,
                    }))
                  }
                  placeholder="보완 이유나 메모를 적어 주세요."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    void handleAddPersonalItem();
                  }}
                  className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                >
                  추가 할 일 저장
                </button>
              </div>
            </div>
          </div>
        </ExpandableSection>

        <ExpandableSection
          title="복습 계획"
          subtitle="팀장은 공통 복습 요일을 정하고, 각 팀원은 자기 복습 간격을 선택합니다."
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">그룹 공통 복습 요일</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {orderedWeekdays.map((day) => {
                  const active = activeGroup.reviewDays.includes(day);

                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={!leaderMode}
                      onClick={() => toggleReviewDay(day)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        active
                          ? "bg-[var(--brand)] text-white"
                          : "bg-slate-100 text-slate-600"
                      } ${leaderMode ? "" : "cursor-default opacity-70"}`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              {!leaderMode ? (
                <p className="mt-2 text-xs text-slate-500">
                  복습 요일은 팀장만 바꿀 수 있습니다.
                </p>
              ) : null}
            </div>

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
                        void updateReviewInterval(
                          activeGroup.id,
                          active ? null : option.days,
                        );
                      }}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        active
                          ? "bg-amber-500 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                현재 선택: {getReviewIntervalLabel(reviewInterval)}
              </p>
            </div>
          </div>
        </ExpandableSection>

        {leaderMode ? (
          <Link
            href={`/group/${activeGroup.id}/plan/agent`}
            className="flex w-full items-center justify-center rounded-[28px] bg-[linear-gradient(135deg,#1e467f,#2f6ee5)] px-5 py-4 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(47,110,229,0.24)]"
          >
            계획 새로 짜기
          </Link>
        ) : null}

        {isMutating ? (
          <div className="rounded-[24px] bg-white/80 px-4 py-3 text-xs font-medium text-slate-500">
            계획 변경 사항을 저장하는 중입니다.
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
