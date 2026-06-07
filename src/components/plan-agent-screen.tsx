"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  type PlanAgentDraft,
} from "@/lib/plan-flow";
import { type StudyGroup } from "@/lib/mock-data";

function getGroupById(groups: StudyGroup[], groupId: string) {
  return groups.find((group) => group.id === groupId);
}

type PreviewDraftState = {
  groupId: string;
  draft: PlanAgentDraft;
  sourceMessageId: string;
  sourceQuestion: string;
};

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
  const [previewEditMode, setPreviewEditMode] = useState(false);
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
      sourceQuestion,
      previewDraft:
        message.role === "assistant" && sourceQuestion
          ? buildPlanAgentDraft(activeGroup, sourceQuestion)
          : null,
    };
  });
  const previewDraft =
    previewDraftState?.groupId === activeGroup.id ? previewDraftState.draft : null;
  const lastPlanAgentMessage = activeGroup.planAgentChat.at(-1) ?? null;
  const retryQuestion =
    !planAgentBusy &&
    Boolean(planAgentStatus?.includes("다시 시도")) &&
    lastPlanAgentMessage?.role === "user"
      ? lastPlanAgentMessage.text.trim()
      : "";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const question = draftQuestion.trim();

    if (!question) {
      return;
    }

    void sendPlanAgentMessage(activeGroup.id, question);
    setDraftQuestion("");
  }

  function handleReflectDraft(sourceMessageId: string, sourceQuestion: string) {
    const draft = buildPlanAgentDraft(activeGroup, sourceQuestion);

    if (!draft) {
      return;
    }

    setPreviewDraftState({
      groupId: activeGroup.id,
      draft,
      sourceMessageId,
      sourceQuestion,
    });
    setPreviewEditMode(false);
  }

  function updatePreviewDraftItem(
    itemId: string,
    field: "title" | "detail" | "duration",
    value: string,
  ) {
    setPreviewDraftState((previous) => {
      if (!previous || previous.groupId !== activeGroup.id) {
        return previous;
      }

      return {
        ...previous,
        draft: {
          ...previous.draft,
          weeklyPlan: previous.draft.weeklyPlan.map((item) =>
            item.id === itemId ? { ...item, [field]: value } : item,
          ),
        },
      };
    });
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
                    <div>
                      <p className="truncate text-[13px] font-semibold text-slate-900">{upload.fileName}</p>
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
              <p className="whitespace-pre-line text-[13px] leading-5 text-slate-800">{introMessage}</p>
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
                  const { message, previewDraft: draftForMessage, sourceQuestion } = entry;
                  const isAssistant = message.role === "assistant";
                  const isSelectedPreview =
                    previewDraftState?.groupId === activeGroup.id &&
                    previewDraftState.sourceMessageId === message.id;
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
                          <p className="whitespace-pre-line text-[13px] leading-5">{message.text}</p>

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
                                  handleReflectDraft(message.id, sourceQuestion);
                                }}
                                className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-[var(--brand)] hover:text-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isSelectedPreview ? "미리보기에 반영됨" : leaderMode ? "계획 반영" : "팀장만 반영 가능"}
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
          {!previewDraft ? (
            <div className="space-y-2.5 rounded-[13px] border border-dashed border-slate-200 bg-white px-3.5 py-3.5 text-[13px] leading-5 text-[var(--ink-soft)]">
              <p>채팅 답변 아래의 계획 반영 버튼을 눌러야 미리보기에 반영됩니다.</p>
              <p>미리보기만으로는 실제 계획이 바뀌지 않고, 아래 계획 적용하기를 눌러야 최종 반영됩니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500">반영한 질문</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {previewDraftState?.sourceQuestion}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
                      이번 주 계획 미리보기
                    </span>
                    <button
                      type="button"
                      disabled={!leaderMode || !previewDraft}
                      onClick={() => {
                        setPreviewEditMode((previous) => !previous);
                      }}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {previewEditMode ? "수정 완료" : "직접 수정"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-4">
                <p className="text-xs font-medium text-slate-500">이번 주 목표</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {previewDraft.weeklyGoal}
                </p>
              </div>

              <WeeklyPlanTabs
                items={previewDraft.weeklyPlan}
                editMode={previewEditMode}
                onUpdateDraftItem={updatePreviewDraftItem}
                emptyMessage="미리볼 이번 주 계획이 아직 없습니다."
              />

              <div className="rounded-[16px] border border-dashed border-[var(--line)] bg-[var(--surface)] px-4 py-4 text-xs leading-6 text-slate-500">
                이 단계는 미리보기입니다. 아래 계획 적용하기를 눌러야 계획 탭에 최종 반영됩니다.
              </div>

              <button
                type="button"
                disabled={!leaderMode || !previewDraft || isMutating}
                onClick={() => {
                  if (!previewDraft) {
                    return;
                  }

                  void applyPlanAgentDraft(activeGroup.id, previewDraft);
                }}
                className="w-full rounded-[16px] bg-slate-950 px-4 py-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {leaderMode ? "계획 적용하기" : "팀장만 적용 가능"}
              </button>
            </div>
          )}
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
