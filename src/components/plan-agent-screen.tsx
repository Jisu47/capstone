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
      <AppShell
        groupId={groupId}
        title="계획 에이전트"
        subtitle="계획 에이전트 화면을 불러오는 중입니다."
      >
        <LoadingState message="계획 에이전트 데이터를 준비하고 있습니다." />
      </AppShell>
    );
  }

  if (!group) {
    return (
      <AppShell
        groupId={groupId}
        title="계획 에이전트"
        subtitle="선택한 그룹을 찾을 수 없습니다."
      >
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
      subtitle={`${activeGroup.subject} 진도표를 기반으로 총 계획과 이번주 계획을 조정합니다.`}
      headerContent={<GroupPageHeader groupId={activeGroup.id} groupName={activeGroup.name} />}
    >
      <div className="space-y-4">
        <SectionCard title="진도표 요약">
          {activeGroup.planReferenceUploads.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/75 px-4 py-5 text-sm leading-6 text-[var(--ink-soft)]">
              아직 업로드된 진도표가 없습니다. 먼저 계획 탭에서 진도표 이미지를 올려 주세요.
            </div>
          ) : (
            <div className="space-y-3">
              {activeGroup.planReferenceUploads.map((upload) => (
                <div
                  key={upload.id}
                  className="rounded-[24px] border border-[var(--line)] bg-white/82 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {upload.fileName}
                      </p>
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

        <SectionCard title="현재 입력 상태">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] bg-white/82 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                복습 요일
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {activeGroup.reviewDays.length > 0 ? activeGroup.reviewDays.join(", ") : "설정 안 됨"}
              </p>
            </div>
            <div className="rounded-[24px] bg-white/82 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                내 복습 간격
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {getReviewIntervalLabel(reviewInterval)}
              </p>
            </div>
          </div>

          <div className="rounded-[24px] bg-[linear-gradient(140deg,#1e467f_0%,#2f6ee5_100%)] p-4 text-white">
            <p className="text-xs uppercase tracking-[0.18em] text-blue-100">Current Goal</p>
            <p className="mt-2 text-lg font-semibold tracking-[-0.03em]">
                {activeGroup.weeklyGoal}
            </p>
          </div>
        </SectionCard>

        <SectionCard title="추천 질문">
          <div className="flex flex-wrap gap-2">
            {[
              "복습 요일을 반영해서 이번주 계획을 다시 짜줘",
              "진도표 기준으로 총 계획을 주차별로 정리해줘",
              "팀원별 복습 간격을 고려해서 주간 계획을 다듬어줘",
            ].map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => {
                  void sendPlanAgentMessage(activeGroup.id, question);
                }}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
              >
                {question}
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="대화">
          <div className="space-y-3">
            {activeGroup.planAgentChat.length === 0 ? (
              <div className="rounded-[24px] bg-white/82 p-4 text-sm leading-6 text-[var(--ink-soft)]">
                아직 계획 에이전트와 나눈 대화가 없습니다. 추천 질문을 누르거나 직접 요청을 입력해 주세요.
              </div>
            ) : (
              activeGroup.planAgentChat.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-[24px] p-4 ${
                    message.role === "assistant"
                      ? "bg-white/90"
                      : "ml-auto max-w-[82%] bg-[var(--brand)] text-white"
                  }`}
                >
                  <p className="whitespace-pre-line text-sm leading-6">{message.text}</p>
                  <p
                    className={`mt-2 text-[11px] font-medium ${
                      message.role === "assistant" ? "text-slate-400" : "text-blue-100"
                    }`}
                  >
                    {message.createdAt}
                  </p>
                </div>
              ))
            )}

            {planAgentBusy ? (
              <div className="rounded-[24px] bg-white/90 p-4">
                <p className="text-sm font-semibold text-slate-900">계획 초안을 만드는 중입니다.</p>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">
                  현재 진도표, 복습 요일, 복습 간격을 합쳐 새 로드맵을 만들고 있습니다.
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
              placeholder="예: 월/수/금 복습 흐름을 반영해서 이번주 계획을 다시 짜줘"
              className="w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
            />
            <button
              type="submit"
              className="w-full rounded-2xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(47,110,229,0.24)]"
            >
              계획 에이전트에게 질문하기
            </button>
          </form>
        </SectionCard>

        <SectionCard title="미리보기">
          {!draft ? (
            <div className="rounded-[24px] bg-white/80 px-4 py-5 text-sm leading-6 text-[var(--ink-soft)]">
              진도표 업로드가 있어야 총 계획과 이번주 계획 초안을 만들 수 있습니다.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-[24px] bg-[linear-gradient(140deg,#1e467f_0%,#2f6ee5_100%)] p-4 text-white">
                <p className="text-xs uppercase tracking-[0.18em] text-blue-100">Draft Weekly Goal</p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em]">
                  {draft.weeklyGoal}
                </p>
              </div>

              <div className="space-y-3">
                {draft.roadmap.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[24px] border border-[var(--line)] bg-white/82 p-4"
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
                    className="rounded-[24px] border border-[var(--line)] bg-white/82 p-4"
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
            className="flex items-center justify-center rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-700"
          >
            계획 탭으로 돌아가기
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
            className="rounded-[24px] bg-slate-950 px-4 py-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {leaderMode ? "초안 적용하기" : "팀장만 적용 가능"}
          </button>
        </div>

        <div className="rounded-[24px] bg-white/80 px-4 py-4 text-xs leading-6 text-slate-500">
          복습 간격 옵션:
          {" "}
          {reviewIntervalOptions.map((option) => option.label).join(" / ")}
        </div>
      </div>
    </AppShell>
  );
}
