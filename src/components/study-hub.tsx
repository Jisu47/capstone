"use client";

import { useEffect, useState } from "react";
import { usePrototype } from "@/components/prototype-provider";
import { getCurrentUserPersonalPlanItems } from "@/lib/plan-flow";
import { type StudyGroup, type UnderstandingLevel } from "@/lib/mock-data";

type StudyHubProps = {
  group: StudyGroup;
};

const understandingOptions: Array<{
  value: UnderstandingLevel;
  label: string;
  description: string;
}> = [
  {
    value: "low",
    label: "낮음",
    description: "다시 복습이 필요해요. 복습 예정 항목으로 저장됩니다.",
  },
  {
    value: "medium",
    label: "보통",
    description: "한 번 더 보면 더 안정적으로 기억할 수 있어요.",
  },
  {
    value: "high",
    label: "높음",
    description: "지금 바로 설명하거나 문제를 풀 수 있는 상태예요.",
  },
];

function formatTimer(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

function getTeammateSessionLength(index: number) {
  return formatTimer(3600 + index * 780);
}

function CheckIcon({ active }: Readonly<{ active: boolean }>) {
  return (
    <div
      className={`flex h-5 w-5 items-center justify-center rounded-full border ${
        active
          ? "border-[var(--brand)] bg-[var(--brand)] text-white"
          : "border-slate-300 bg-white text-transparent"
      }`}
    >
      <svg aria-hidden="true" className="h-3 w-3" fill="none" viewBox="0 0 24 24">
        <path
          d="M5 12.5L9.5 17L19 7.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

export function StudyHub({ group }: Readonly<StudyHubProps>) {
  const {
    clearPlanItemCompletion,
    completePlanItemWithFeedback,
    currentUserId,
    isMutating,
    togglePersonalPlanItem,
  } = usePrototype();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [pendingChecklistId, setPendingChecklistId] = useState<string | null>(null);
  const [selectedUnderstanding, setSelectedUnderstanding] = useState<UnderstandingLevel | null>(
    null,
  );
  const teammates = group.members.filter((member) => member.id !== currentUserId).slice(0, 2);
  const selectedMember = teammates.find((member) => member.id === selectedMemberId) ?? null;
  const pendingChecklistItem = group.plan.find((item) => item.id === pendingChecklistId) ?? null;
  const pendingChecklistChecked = pendingChecklistItem?.memberStatus[currentUserId] ?? false;
  const completedCount = group.plan.filter((item) => item.memberStatus[currentUserId]).length;
  const personalPlanItems = getCurrentUserPersonalPlanItems(group, currentUserId);

  useEffect(() => {
    if (!isTimerRunning) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds((previous) => previous + 1);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isTimerRunning]);

  function closeChecklistModal() {
    setPendingChecklistId(null);
    setSelectedUnderstanding(null);
  }

  async function confirmChecklistAction() {
    if (!pendingChecklistItem) {
      return;
    }

    if (pendingChecklistChecked) {
      await clearPlanItemCompletion(group.id, pendingChecklistItem.id);
      closeChecklistModal();
      return;
    }

    if (!selectedUnderstanding) {
      return;
    }

    await completePlanItemWithFeedback(group.id, pendingChecklistItem.id, selectedUnderstanding);
    closeChecklistModal();
  }

  return (
    <>
      <div className="space-y-4">
        <section className="rounded-[18px] border border-slate-200 bg-white px-4 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                타이머
              </p>
              <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.04em] text-slate-950">
                {group.weeklyGoal}
              </h2>
            </div>
            <div className="rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-right shadow-[0_4px_10px_rgba(15,23,42,0.03)]">
              <p className="text-[11px] font-medium text-slate-500">타이머</p>
              <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-950">
                {formatTimer(elapsedSeconds)}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
            <button
              type="button"
              onClick={() => setIsTimerRunning((previous) => !previous)}
              className="rounded-[14px] bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white"
            >
              {isTimerRunning ? "타이머 멈추기" : "타이머 시작"}
            </button>
            <div className="rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-[0_4px_10px_rgba(15,23,42,0.03)]">
              오늘 {group.plan.length}개
            </div>
          </div>
        </section>

        <section className="rounded-[18px] border border-slate-200 bg-white px-4 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold text-slate-900">공부 중인 팀원</h2>
            <span className="text-xs text-slate-500">{teammates.length}명</span>
          </div>

          <div className="space-y-2">
            {teammates.map((member, index) => {
              const active = member.id === selectedMemberId;

              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() =>
                    setSelectedMemberId((previous) => (previous === member.id ? null : member.id))
                  }
                  className={`w-full rounded-[14px] border px-4 py-3 text-left transition ${
                    active
                      ? "border-[var(--brand)] bg-white shadow-[0_6px_16px_rgba(121,184,149,0.10)]"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{member.focus}</p>
                    </div>
                    <span className="text-xs font-medium text-slate-500">
                      {getTeammateSessionLength(index)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedMember ? (
            <div className="mt-3 rounded-[14px] border border-slate-200 bg-white px-4 py-3 shadow-[0_4px_10px_rgba(15,23,42,0.03)]">
              <p className="text-sm font-semibold text-slate-900">{selectedMember.name}</p>
              <p className="mt-1 text-sm text-slate-600">
                {selectedMember.focus} 중심으로 공부를 이어가고 있어요.
              </p>
            </div>
          ) : null}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3 px-1">
            <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-slate-900">
              오늘 할 일
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              {completedCount}/{group.plan.length}
            </span>
          </div>

          <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
            {group.plan.length === 0 ? (
              <div className="rounded-[14px] border border-dashed border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-[var(--ink-soft)]">
                아직 등록된 공동 계획이 없습니다. 계획 탭에서 할 일을 추가하면 여기에서 바로 체크할 수 있어요.
              </div>
            ) : (
              <div className="space-y-2">
                {group.plan.map((item) => {
                  const checked = item.memberStatus[currentUserId];

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPendingChecklistId(item.id)}
                      className={`w-full rounded-[14px] border px-4 py-4 text-left transition ${
                        checked
                          ? "border-[var(--brand)] bg-white shadow-[0_6px_16px_rgba(121,184,149,0.10)]"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                          {item.day}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                {item.detail}
                              </p>
                            </div>
                            <CheckIcon active={checked} />
                          </div>

                          <p className="mt-2 text-xs font-medium text-slate-500">{item.duration}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-semibold text-slate-900">개인 보강 할 일</h2>
              <span className="text-xs text-slate-500">{personalPlanItems.length}개</span>
            </div>

            {personalPlanItems.length === 0 ? (
              <div className="rounded-[14px] border border-dashed border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-[var(--ink-soft)]">
                아직 추가된 개인 할 일이 없습니다. 계획 탭에서 직접 추가하거나
                복습 시점이 되면 [복습] 할 일이 여기에 자동으로 들어옵니다.
              </div>
            ) : (
              <div className="space-y-2">
                {personalPlanItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      void togglePersonalPlanItem(item.id, !item.completed);
                    }}
                    className={`flex w-full items-start gap-3 rounded-[14px] border px-4 py-3 text-left transition ${
                      item.completed
                        ? "border-[var(--brand)] bg-white text-[var(--brand)] shadow-[0_6px_16px_rgba(121,184,149,0.10)]"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <CheckIcon active={item.completed} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-700">{item.title}</p>
                      {item.detail ? (
                        <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {pendingChecklistItem ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/24 px-6">
          <div className="w-full max-w-[320px] rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.10)]">
            <p className="text-base font-semibold text-slate-900">
              {pendingChecklistChecked ? "체크 해제" : "이해도 체크"}
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {pendingChecklistItem.title}
            </p>

            {pendingChecklistChecked ? (
              <p className="mt-2 text-sm leading-6 text-slate-500">
                완료 체크를 해제할까요? 이미 저장된 복습 예정 항목이나 현재 개인 할 일은
                그대로 유지됩니다.
              </p>
            ) : (
              <>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  이 할 일을 어느 정도 이해했는지 선택해 주세요. 이해도가 낮으면
                  복습 예정 항목으로 저장되고, 복습 간격이 지나면 개인 할 일에 자동으로 추가됩니다.
                </p>

                <div className="mt-4 space-y-2">
                  {understandingOptions.map((option) => {
                    const active = selectedUnderstanding === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSelectedUnderstanding(option.value)}
                        className={`w-full rounded-[14px] border px-4 py-3 text-left transition ${
                          active
                            ? "border-[var(--brand)] bg-[var(--brand-soft)] shadow-[0_6px_16px_rgba(121,184,149,0.10)]"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {option.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={closeChecklistModal}
                className="rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  void confirmChecklistAction();
                }}
                disabled={isMutating || (!pendingChecklistChecked && !selectedUnderstanding)}
                className="rounded-[14px] bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {isMutating ? "저장 중" : pendingChecklistChecked ? "해제하기" : "완료"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
