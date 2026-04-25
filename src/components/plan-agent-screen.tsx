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
import { currentUserId, type StudyGroup } from "@/lib/mock-data";

function getGroupById(groups: StudyGroup[], groupId: string) {
  return groups.find((group) => group.id === groupId);
}

export function PlanAgentScreen({ groupId }: Readonly<{ groupId: string }>) {
  const {
    groups,
    isLoading,
    sendPlanAgentMessage,
    isPlanAgentAnswering,
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
  const leaderMode = isLeader(activeGroup);
  const draft = buildPlanAgentDraft(activeGroup);
  const reviewInterval = activeGroup.reviewIntervals[currentUserId] ?? null;
  const planAgentBusy = isPlanAgentAnswering(activeGroup.id);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draftQuestion.trim()) {
      return;
    }

    void sendPlanAgentMessage(activeGroup.id, draftQuestion);
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
              <p className="text-xs font-medium text-slate-500">복습 요일</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {activeGroup.reviewDays.length > 0 ? activeGroup.reviewDays.join(", ") : "설정 안 함"}
              </p>
            </div>
            <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-4 shadow-[0_6px_16px_rgba(15,23,42,0.03)]">
              <p className="text-xs font-medium text-slate-500">내 복습 간격</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {getReviewIntervalLabel(reviewInterval)}
              </p>
            </div>
          </div>

          <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-4">
            <p className="text-xs font-medium text-slate-500">이번 주 목표</p>
            <p className="mt-2 text-base font-semibold text-slate-900">{activeGroup.weeklyGoal}</p>
          </div>
        </SectionCard>

        <SectionCard title="빠른 질문">
          <div className="flex flex-wrap gap-2">
            {[
              "복습 요일을 반영해서 이번 주 계획 다시 짜 줘",
              "진도표 기준으로 전체 계획을 주차별로 정리해 줘",
              "복습 간격을 고려해서 주간 계획을 조정해 줘",
            ].map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => {
                  void sendPlanAgentMessage(activeGroup.id, question);
                }}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_4px_10px_rgba(15,23,42,0.03)]"
              >
                {question}
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="대화">
          <div className="space-y-3">
            {activeGroup.planAgentChat.length === 0 ? (
              <div className="rounded-[16px] border border-dashed border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-[var(--ink-soft)]">
                원하는 방향을 한 줄로 보내면 계획 초안을 만들어 드립니다.
              </div>
            ) : (
              activeGroup.planAgentChat.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-[16px] px-4 py-4 ${
                    message.role === "assistant"
                      ? "border border-slate-200 bg-white"
                      : "ml-auto max-w-[82%] border border-[var(--brand)] bg-white text-slate-900"
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
              ))
            )}

            {planAgentBusy ? (
              <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-4 shadow-[0_6px_16px_rgba(15,23,42,0.03)]">
                <p className="text-sm font-semibold text-slate-900">초안 정리 중</p>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">
                  진도표와 복습 설정을 반영하고 있습니다.
                </p>
              </div>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard title="질문 보내기">
          <form className="space-y-3" onSubmit={handleSubmit}>
            <textarea
              rows={3}
              value={draftQuestion}
              onChange={(event) => setDraftQuestion(event.target.value)}
              placeholder="예: 이번 주 복습 계획까지 반영해서 다시 짜 줘"
              className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
            />
            <button
              type="submit"
              className="w-full rounded-[14px] bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white"
            >
              질문 보내기
            </button>
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
