"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { GroupPageHeader } from "@/components/group-page-header";
import {
  AppShell,
  LoadingState,
  MissingGroupState,
  SectionCard,
} from "@/components/mobile-shell";
import { PlanReferenceViewerDialog } from "@/components/plan-reference-viewer-dialog";
import { usePrototype } from "@/components/prototype-provider";
import { WeeklyPlanTabs } from "@/components/weekly-plan-tabs";
import {
  buildPlanAgentDraft,
  isLeader,
  parseStoredPlanAgentMessage,
  type PlanAgentDraft,
} from "@/lib/plan-flow";
import { type StudyGroup, type Weekday, type WeeklyPlanItem } from "@/lib/mock-data";

type PreviewDraftState = {
  groupId: string;
  draft: PlanAgentDraft;
  sourceMessageId: string;
  sourceQuestion: string;
};

const MANUAL_PREVIEW_SOURCE_ID = "manual-preview";
const MANUAL_PREVIEW_SOURCE_QUESTION = "직접 편집";

function getGroupById(groups: StudyGroup[], groupId: string) {
  return groups.find((group) => group.id === groupId);
}

function cloneWeeklyPlanItem(item: WeeklyPlanItem): WeeklyPlanItem {
  return {
    ...item,
    memberStatus: { ...item.memberStatus },
    referenceUnitSequence: item.referenceUnitSequence ?? null,
  };
}

function buildManualPreviewDraft(group: StudyGroup): PlanAgentDraft {
  return {
    scope: "weekly-plan",
    weeklyGoal: group.weeklyGoal.trim() || `${group.subject || group.name} 이번 주 학습`,
    recentUpdate: "직접 편집 중인 이번 주 계획입니다.",
    roadmap: [],
    weeklyPlan: group.plan.map(cloneWeeklyPlanItem),
  };
}

function createManualPreviewState(group: StudyGroup): PreviewDraftState {
  return {
    groupId: group.id,
    draft: buildManualPreviewDraft(group),
    sourceMessageId: `${MANUAL_PREVIEW_SOURCE_ID}-${group.id}`,
    sourceQuestion: MANUAL_PREVIEW_SOURCE_QUESTION,
  };
}

function createManualPreviewItem(group: StudyGroup, day: Weekday): WeeklyPlanItem {
  return {
    id: `manual-plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    day,
    title: "",
    detail: "",
    duration: "60분",
    memberStatus: Object.fromEntries(group.members.map((member) => [member.id, false])),
    referenceUnitSequence: null,
  };
}

export function PlanAgentScreen({ groupId }: Readonly<{ groupId: string }>) {
  const {
    groups,
    isLoading,
    currentUserId,
    sendPlanAgentMessage,
    isPlanAgentAnswering,
    getPlanAgentStatus,
    applyPlanAgentDraft,
    reanalyzePlanReferenceUploads,
    isMutating,
  } = usePrototype();
  const group = getGroupById(groups, groupId);
  const [draftQuestion, setDraftQuestion] = useState("");
  const [previewDraftState, setPreviewDraftState] = useState<PreviewDraftState | null>(null);
  const [editingPreviewItemId, setEditingPreviewItemId] = useState<string | null>(null);
  const [editingWeeklyGoal, setEditingWeeklyGoal] = useState(false);
  const latestChatMessageRef = useRef<HTMLDivElement | null>(null);
  const [viewingUploadId, setViewingUploadId] = useState<string | null>(null);

  const planAgentChatLength = group?.planAgentChat.length ?? 0;
  const planAgentStatus = group ? getPlanAgentStatus(group.id) : null;

  useEffect(() => {
    if (!latestChatMessageRef.current || !group) {
      return;
    }

    latestChatMessageRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [group, planAgentChatLength, planAgentStatus]);

  if (isLoading && !group) {
    return (
      <AppShell groupId={groupId} title="계획 에이전트">
        <LoadingState message="계획 에이전트를 준비하고 있습니다." />
      </AppShell>
    );
  }

  if (!group) {
    return (
      <AppShell groupId={groupId} title="계획 에이전트">
        <MissingGroupState />
      </AppShell>
    );
  }

  const activeGroup = group;
  const viewingUpload =
    activeGroup.planReferenceUploads.find((upload) => upload.id === viewingUploadId) ?? null;
  const leaderMode = isLeader(activeGroup, currentUserId);
  const planAgentBusy = isPlanAgentAnswering(activeGroup.id);
  const quickQuestions = [
    "진도표 기준으로 이번 주 계획 정리",
    "이번 주 학습량이 무리 없도록 계획 조정",
  ] as const;
  const conversationSubject = activeGroup.subject.trim() || activeGroup.name.trim();
  const introMessage = `안녕하세요! ${conversationSubject} 학습 계획을 세워볼까요? 질문을 선택해 빠른 대화를 시작할 수 있고 직접 대화를 입력하실 수 있어요.`;
  const chatEntries = activeGroup.planAgentChat.map((message, index, messages) => {
    const parsedMessage =
      message.role === "assistant"
        ? parseStoredPlanAgentMessage(message.text)
        : { visibleText: message.text, draft: null as PlanAgentDraft | null };
    let sourceQuestion = "";

    if (message.role === "assistant") {
      for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
        const previousMessage = messages[cursor];

        if (previousMessage?.role === "user") {
          sourceQuestion = previousMessage.text.trim();
          break;
        }
      }
    }

    return {
      message,
      visibleText: parsedMessage.visibleText,
      sourceQuestion,
      previewDraft:
        message.role === "assistant"
          ? parsedMessage.draft ?? (sourceQuestion ? buildPlanAgentDraft(activeGroup, sourceQuestion) : null)
          : null,
    };
  });
  const fallbackPreviewState = createManualPreviewState(activeGroup);
  const effectivePreviewState =
    previewDraftState?.groupId === activeGroup.id ? previewDraftState : fallbackPreviewState;
  const previewDraft = effectivePreviewState.draft;
  const effectiveEditingItemId = previewDraft.weeklyPlan.some(
    (item) => item.id === editingPreviewItemId,
  )
    ? editingPreviewItemId
    : null;
  const isManualPreview =
    effectivePreviewState.sourceQuestion === MANUAL_PREVIEW_SOURCE_QUESTION;
  const lastPlanAgentMessage = activeGroup.planAgentChat.at(-1) ?? null;
  const retryQuestion =
    !planAgentBusy &&
    Boolean(planAgentStatus?.includes("다시 시도")) &&
    lastPlanAgentMessage?.role === "user"
      ? lastPlanAgentMessage.text.trim()
      : "";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const question = draftQuestion.trim();

    if (!question) {
      return;
    }

    void sendPlanAgentMessage(activeGroup.id, question);
    setDraftQuestion("");
  }

  function handleReflectDraft(
    sourceMessageId: string,
    sourceQuestion: string,
    draftOverride?: PlanAgentDraft | null,
  ) {
    const draft = draftOverride ?? buildPlanAgentDraft(activeGroup, sourceQuestion);

    if (!draft) {
      return;
    }

    setPreviewDraftState({
      groupId: activeGroup.id,
      draft,
      sourceMessageId,
      sourceQuestion,
    });
    setEditingPreviewItemId(null);
    setEditingWeeklyGoal(false);
  }

  function updatePreviewDraftItem(
    itemId: string,
    field: "title" | "detail" | "duration",
    value: string,
  ) {
    setPreviewDraftState((previous) => {
      const baseState =
        previous && previous.groupId === activeGroup.id
          ? previous
          : createManualPreviewState(activeGroup);

      return {
        ...baseState,
        draft: {
          ...baseState.draft,
          weeklyPlan: baseState.draft.weeklyPlan.map((item) =>
            item.id === itemId ? { ...item, [field]: value } : item,
          ),
        },
      };
    });
  }

  function updatePreviewWeeklyGoal(value: string) {
    setPreviewDraftState((previous) => {
      const baseState =
        previous && previous.groupId === activeGroup.id
          ? previous
          : createManualPreviewState(activeGroup);

      return {
        ...baseState,
        draft: {
          ...baseState.draft,
          weeklyGoal: value,
        },
      };
    });
  }

  function deletePreviewDraftItem(itemId: string) {
    setPreviewDraftState((previous) => {
      const baseState =
        previous && previous.groupId === activeGroup.id
          ? previous
          : createManualPreviewState(activeGroup);

      return {
        ...baseState,
        draft: {
          ...baseState.draft,
          weeklyPlan: baseState.draft.weeklyPlan.filter((item) => item.id !== itemId),
        },
      };
    });

    if (editingPreviewItemId === itemId) {
      setEditingPreviewItemId(null);
    }
  }

  function addPreviewDraftItem(day: Weekday) {
    const nextItem = createManualPreviewItem(activeGroup, day);

    setPreviewDraftState((previous) => {
      const baseState =
        previous && previous.groupId === activeGroup.id
          ? previous
          : createManualPreviewState(activeGroup);

      return {
        ...baseState,
        draft: {
          ...baseState.draft,
          weeklyPlan: [...baseState.draft.weeklyPlan, nextItem],
        },
      };
    });
    setEditingPreviewItemId(nextItem.id);
  }

  return (
    <AppShell
      groupId={groupId}
      title="계획 에이전트"
      headerContent={<GroupPageHeader groupId={activeGroup.id} groupName={activeGroup.name} />}
    >
      <div className="space-y-3">
        <SectionCard title="진도표">
          {activeGroup.planReferenceUploads.length === 0 ? (
            <div className="rounded-[13px] border border-dashed border-slate-200 bg-white px-3.5 py-3.5 text-[13px] leading-5 text-[var(--ink-soft)]">
              계획 화면에서 진도표를 먼저 올려 주세요.
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeGroup.planReferenceUploads.map((upload) => (
                <div
                  key={upload.id}
                  className="rounded-[14px] border border-slate-200 bg-white px-3.5 py-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-slate-900">
                        {upload.fileName}
                      </p>
                      <p className="mt-1 truncate text-[11px] text-slate-500">{upload.summary}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setViewingUploadId(upload.id);
                        }}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600"
                      >
                        보기
                      </button>
                      {leaderMode ? (
                        <button
                          type="button"
                          disabled={isMutating}
                          onClick={() => {
                            void reanalyzePlanReferenceUploads(activeGroup.id);
                          }}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 disabled:opacity-60"
                        >
                          재분석
                        </button>
                      ) : null}
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        {activeGroup.planReferenceUnits.length}개 단위
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="채팅">
          <div className="space-y-2.5">
            <div className="max-w-[88%] rounded-[16px] rounded-bl-[6px] border border-slate-200 bg-slate-50 px-3.5 py-3.5">
              <p className="whitespace-pre-line text-[13px] leading-5 text-slate-800">
                {introMessage}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  disabled={planAgentBusy}
                  onClick={() => {
                    void sendPlanAgentMessage(activeGroup.id, question);
                  }}
                  className="rounded-full border border-[var(--line)] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-slate-700 shadow-[0_4px_10px_rgba(15,23,42,0.03)] transition hover:border-[var(--brand)] hover:text-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {question}
                </button>
              ))}
            </div>

            <div className="max-h-[420px] overflow-y-auto rounded-[18px] border border-slate-200 bg-slate-50/55 px-2.5 py-2.5">
              {chatEntries.length > 0 ? (
                chatEntries.map((entry, index) => {
                  const { message, visibleText, previewDraft: draftForMessage, sourceQuestion } = entry;
                  const isAssistant = message.role === "assistant";
                  const isSelectedPreview =
                    effectivePreviewState.groupId === activeGroup.id &&
                    effectivePreviewState.sourceMessageId === message.id;
                  const isLastMessage = index === chatEntries.length - 1;

                  return (
                    <div
                      key={message.id}
                      ref={isLastMessage ? latestChatMessageRef : null}
                      className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                    >
                      <div className="max-w-[88%] py-1.5">
                        <div
                          className={`rounded-[16px] px-3.5 py-3.5 ${
                            isAssistant
                              ? "rounded-bl-[6px] border border-slate-200 bg-white"
                              : "rounded-br-[6px] border border-[var(--brand)] bg-[var(--brand-soft)] text-slate-900"
                          }`}
                        >
                          <p className="whitespace-pre-line text-[13px] leading-5">{visibleText}</p>

                          <div
                            className={`mt-3 flex items-center justify-between gap-3 ${
                              isAssistant ? "text-slate-400" : "text-[var(--brand)]"
                            }`}
                          >
                            <p className="text-[11px] font-medium">{message.createdAt}</p>
                            {isAssistant ? (
                              <button
                                type="button"
                                disabled={!leaderMode || !sourceQuestion || !draftForMessage || planAgentBusy}
                                onClick={() => {
                                  handleReflectDraft(message.id, sourceQuestion, draftForMessage);
                                }}
                                className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-[var(--brand)] hover:text-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isSelectedPreview ? "미리보기에 반영됨" : "계획 반영"}
                              </button>
                            ) : null}
                          </div>
                        </div>

                        {isLastMessage && planAgentStatus ? (
                          <div className="px-1 pt-2">
                            <p className="text-xs leading-5 text-slate-400">{planAgentStatus}</p>
                            {retryQuestion ? (
                              <button
                                type="button"
                                onClick={() => {
                                  void sendPlanAgentMessage(activeGroup.id, retryQuestion);
                                }}
                                className="mt-2 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                              >
                                다시 시도
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[14px] border border-dashed border-slate-200 bg-white px-3.5 py-3.5 text-[13px] leading-5 text-[var(--ink-soft)]">
                  빠른 질문을 누르거나 직접 입력해서 계획 초안을 시작해 보세요.
                </div>
              )}
            </div>
          </div>

          <form
            className="rounded-[16px] border border-slate-200 bg-slate-50/80 p-2.5"
            onSubmit={handleSubmit}
          >
            <div className="flex items-end gap-3">
              <textarea
                rows={2}
                value={draftQuestion}
                onChange={(event) => setDraftQuestion(event.target.value)}
                placeholder="질문을 입력하면 계획 에이전트가 바로 이어서 답변합니다."
                className="min-h-[68px] flex-1 resize-none rounded-[13px] border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] outline-none transition focus:border-[var(--brand)]"
              />
              <button
                type="submit"
                disabled={!draftQuestion.trim() || planAgentBusy}
                className="inline-flex h-[68px] shrink-0 items-center justify-center rounded-[13px] bg-[var(--brand)] px-4 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                보내기
              </button>
            </div>
          </form>
        </SectionCard>

        <SectionCard title="미리보기">
          <div className="space-y-4">
            <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    {isManualPreview ? "현재 상태" : "반영한 질문"}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {isManualPreview
                      ? "AI 초안 전에도 여기서 직접 이번 주 계획을 구성할 수 있어요."
                      : effectivePreviewState.sourceQuestion}
                  </p>
                </div>
                <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
                  이번 주 계획 미리보기
                </span>
              </div>
            </div>

            <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-500">이번 주 목표</p>
                  {editingWeeklyGoal && leaderMode ? (
                    <div className="mt-2 flex items-start gap-2">
                      <input
                        value={previewDraft.weeklyGoal}
                        onChange={(event) => {
                          updatePreviewWeeklyGoal(event.target.value);
                        }}
                        placeholder="이번 주 목표를 입력해 주세요."
                        className="w-full rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-[14px] font-semibold text-slate-900 outline-none focus:border-[var(--brand)]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEditingWeeklyGoal(false);
                        }}
                        className="shrink-0 rounded-full border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-500"
                      >
                        완료
                      </button>
                    </div>
                  ) : (
                    <p className="mt-2 text-base font-semibold text-slate-900">
                      {previewDraft.weeklyGoal || "아직 설정된 이번 주 목표가 없습니다."}
                    </p>
                  )}
                </div>
                {leaderMode && !editingWeeklyGoal ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingWeeklyGoal(true);
                    }}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                  >
                    수정
                  </button>
                ) : null}
              </div>
            </div>

            <WeeklyPlanTabs
              items={previewDraft.weeklyPlan}
              editable={leaderMode}
              editingItemId={effectiveEditingItemId}
              onStartEditItem={setEditingPreviewItemId}
              onDeleteDraftItem={deletePreviewDraftItem}
              onAddDraftItem={addPreviewDraftItem}
              onUpdateDraftItem={updatePreviewDraftItem}
              emptyMessage={
                leaderMode
                  ? "아직 추가된 계획이 없습니다. 아래 + 버튼으로 이번 주 계획을 직접 추가해 보세요."
                  : "아직 추가된 계획이 없습니다."
              }
            />

            <div className="rounded-[16px] border border-dashed border-[var(--line)] bg-[var(--surface)] px-4 py-4 text-xs leading-6 text-slate-500">
              이 단계는 미리보기입니다. 항목과 이번 주 목표를 직접 수정하거나 AI 초안을
              반영한 뒤, 아래 계획 적용하기를 눌러야 계획 탭에 최종 저장됩니다.
            </div>

            <button
              type="button"
              disabled={!leaderMode || previewDraft.weeklyPlan.length === 0 || isMutating}
              onClick={() => {
                void applyPlanAgentDraft(activeGroup.id, previewDraft);
              }}
              className="w-full rounded-[16px] bg-slate-950 px-4 py-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {leaderMode ? "계획 적용하기" : "팀장만 적용 가능"}
            </button>
          </div>
        </SectionCard>

        <Link
          href={`/group/${activeGroup.id}/plan`}
          className="flex items-center justify-center rounded-[16px] border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-700"
        >
          계획으로 돌아가기
        </Link>
      </div>

      <PlanReferenceViewerDialog
        fileName={viewingUpload?.fileName ?? ""}
        imageDataUrl={viewingUpload?.imageDataUrl ?? ""}
        summary={viewingUpload?.summary}
        isOpen={Boolean(viewingUpload)}
        onClose={() => {
          setViewingUploadId(null);
        }}
      />
    </AppShell>
  );
}
