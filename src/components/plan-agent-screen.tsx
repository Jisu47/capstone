"use client";

import Link from "next/link";
import { useState } from "react";
import { GroupPageHeader } from "@/components/group-page-header";
import {
  AppShell,
  LoadingState,
  MissingGroupState,
  SectionCard,
} from "@/components/mobile-shell";
import { usePrototype } from "@/components/prototype-provider";
import {
  buildPlanAgentDraft,
  getReviewIntervalLabel,
  isLeader,
  reviewIntervalOptions,
} from "@/lib/plan-flow";
import { type StudyGroup } from "@/lib/mock-data";

function getGroupById(groups: StudyGroup[], groupId: string) {
  return groups.find((group) => group.id === groupId);
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
    isMutating,
  } = usePrototype();
  const group = getGroupById(groups, groupId);
  const [draftQuestion, setDraftQuestion] = useState("");

  if (isLoading && !group) {
    return (
      <AppShell groupId={groupId} title="계획 에이전트">
        <LoadingState message="계획 에이전트를 준비하는 중입니다." />
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
  const leaderMode = isLeader(activeGroup, currentUserId);
  const draft = buildPlanAgentDraft(activeGroup);
  const reviewInterval = activeGroup.reviewIntervals[currentUserId] ?? null;
  const planAgentBusy = isPlanAgentAnswering(activeGroup.id);
  const planAgentStatus = getPlanAgentStatus(activeGroup.id);
  const quickQuestions = [
    "진도표 기준으로 전체 계획 주차별 정리",
    "진도표 1주차 기준으로 이번주 계획 생성",
    "저번주 미완료 계획 바탕으로 주간 계획 재조정",
  ] as const;
  const conversationSubject = activeGroup.subject.trim() || activeGroup.name.trim();
  const introMessage = `안녕하세요! ${conversationSubject} 학습 계획을 세워볼까요? 질문을 선택해 빠른 대화를 시작할 수 있고 직접 대화를 입력하실 수 있어요.`;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const question = draftQuestion.trim();

    if (!question) {
      return;
    }

    void sendPlanAgentMessage(activeGroup.id, question);
    setDraftQuestion("");
  }

  return (
    <AppShell
      groupId={groupId}
      title="계획 에이전트"
      headerContent={<GroupPageHeader groupId={activeGroup.id} groupName={activeGroup.name} />}
    >
      <div className="space-y-4">
        <SectionCard title="진도표">
          {activeGroup.planReferenceUploads.length === 0 ? (
            <div className="rounded-[14px] border border-dashed border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-[var(--ink-soft)]">
              계획 화면에서 진도표를 먼저 올려 주세요.
            </div>
          ) : (
            <div className="space-y-3">
              {activeGroup.planReferenceUploads.map((upload) => (
                <div
                  key={upload.id}
                  className="rounded-[16px] border border-slate-200 bg-white px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{upload.fileName}</p>
                      <p className="mt-1 text-xs text-slate-500">{upload.summary}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {activeGroup.planReferenceUnits.length}개 단위
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="현재 설정">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-4 shadow-[0_6px_16px_rgba(15,23,42,0.03)]">
              <p className="text-xs font-medium text-slate-500">내 복습 간격</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {getReviewIntervalLabel(reviewInterval)}
              </p>
            </div>
            <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-4 shadow-[0_6px_16px_rgba(15,23,42,0.03)]">
              <p className="text-xs font-medium text-slate-500">복습 기준</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                이해도 낮음 항목을 간격 기준으로 자동 추가
              </p>
            </div>
          </div>

          <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-4">
            <p className="text-xs font-medium text-slate-500">이번 주 목표</p>
            <p className="mt-2 text-base font-semibold text-slate-900">{activeGroup.weeklyGoal}</p>
          </div>
        </SectionCard>

        <SectionCard title="채팅">
          <div className="space-y-3">
            <div className="max-w-[88%] rounded-[18px] rounded-bl-[6px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="whitespace-pre-line text-sm leading-6 text-slate-800">{introMessage}</p>
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
                  className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_4px_10px_rgba(15,23,42,0.03)] transition hover:border-[var(--brand)] hover:text-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {question}
                </button>
              ))}
            </div>

            <p className="min-h-[20px] text-xs leading-5 text-slate-400">
              {planAgentStatus ?? ""}
            </p>

            {activeGroup.planAgentChat.length > 0 ? (
              activeGroup.planAgentChat.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[88%] rounded-[18px] px-4 py-4 ${
                      message.role === "assistant"
                        ? "rounded-bl-[6px] border border-slate-200 bg-white"
                        : "rounded-br-[6px] border border-[var(--brand)] bg-[var(--brand-soft)] text-slate-900"
                    }`}
                  >
                    <p className="whitespace-pre-line text-sm leading-6">{message.text}</p>
                    <p
                      className={`mt-2 text-[11px] font-medium ${
                        message.role === "assistant" ? "text-slate-400" : "text-[var(--brand)]"
                      }`}
                    >
                      {message.createdAt}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[16px] border border-dashed border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-[var(--ink-soft)]">
                빠른 질문을 누르거나 직접 입력해서 계획 초안을 시작해 보세요.
              </div>
            )}
          </div>

          <form
            className="rounded-[18px] border border-slate-200 bg-slate-50/80 p-3"
            onSubmit={handleSubmit}
          >
            <div className="flex items-end gap-3">
              <textarea
                rows={2}
                value={draftQuestion}
                onChange={(event) => setDraftQuestion(event.target.value)}
                placeholder="질문을 입력하면 계획 에이전트가 바로 이어서 답변합니다."
                className="min-h-[76px] flex-1 resize-none rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
              />
              <button
                type="submit"
                disabled={!draftQuestion.trim() || planAgentBusy}
                className="inline-flex h-[76px] shrink-0 items-center justify-center rounded-[14px] bg-[var(--brand)] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                보내기
              </button>
            </div>
          </form>
        </SectionCard>

        <SectionCard title="미리보기">
          {!draft ? (
            <div className="rounded-[14px] border border-dashed border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-[var(--ink-soft)]">
              진도표가 준비되면 전체 계획과 이번 주 초안이 여기에 보입니다.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-4">
                <p className="text-xs font-medium text-slate-500">이번 주 목표</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{draft.weeklyGoal}</p>
              </div>

              <div className="space-y-3">
                {draft.roadmap.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[16px] border border-slate-200 bg-white px-4 py-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                      {item.weekNumber}주차
                    </p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                      {item.summary}
                    </p>
                  </article>
                ))}
              </div>

              <div className="space-y-3">
                {draft.weeklyPlan.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[16px] border border-slate-200 bg-white px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                          {item.day}
                        </p>
                        <p className="mt-1 text-base font-semibold text-slate-900">
                          {item.title}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {item.duration}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                      {item.detail}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/group/${activeGroup.id}/plan`}
            className="flex items-center justify-center rounded-[16px] border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-700"
          >
            계획으로 돌아가기
          </Link>
          <button
            type="button"
            disabled={!leaderMode || !draft || isMutating}
            onClick={() => {
              if (!draft) {
                return;
              }

              void applyPlanAgentDraft(activeGroup.id, draft);
            }}
            className="rounded-[16px] bg-slate-950 px-4 py-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {leaderMode ? "초안 적용하기" : "팀장만 적용 가능"}
          </button>
        </div>

        <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-4 text-xs leading-6 text-slate-500 shadow-[0_6px_16px_rgba(15,23,42,0.03)]">
          복습 간격 옵션: {reviewIntervalOptions.map((option) => option.label).join(" / ")}
        </div>
      </div>
    </AppShell>
  );
}
