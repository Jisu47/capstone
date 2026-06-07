"use client";

import { useEffect, useRef, useState } from "react";
import { usePrototype } from "@/components/prototype-provider";
import { getCurrentUserPersonalPlanItems } from "@/lib/plan-flow";
import {
  formatExamDate,
  getDaysLeft,
  isDatePast,
  type StudyGroup,
  type UnderstandingLevel,
} from "@/lib/mock-data";

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

function MeatballIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="5" r="1.8" fill="currentColor" />
      <circle cx="12" cy="12" r="1.8" fill="currentColor" />
      <circle cx="12" cy="19" r="1.8" fill="currentColor" />
    </svg>
  );
}

function StudyInfoIcon({
  type,
}: Readonly<{
  type: "leader" | "members" | "date" | "time";
}>) {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF8F1] text-[#57AE79]">
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        {type === "leader" ? (
          <>
            <path
              d="M12 12a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M5.5 19.25a6.5 6.5 0 0 1 13 0"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.8"
            />
          </>
        ) : null}
        {type === "members" ? (
          <>
            <path
              d="M9 10.25a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Z"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M15.5 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M4.75 18a4.25 4.25 0 0 1 8.5 0"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.8"
            />
            <path
              d="M13 18a3.5 3.5 0 0 1 6.25-2.15"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.8"
            />
          </>
        ) : null}
        {type === "date" ? (
          <>
            <rect
              x="4.75"
              y="6.5"
              width="14.5"
              height="12.75"
              rx="2.25"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M8 4.75v3.5M16 4.75v3.5M4.75 9.75h14.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.8"
            />
          </>
        ) : null}
        {type === "time" ? (
          <>
            <circle cx="12" cy="12" r="7.25" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M12 8.75v3.5l2.5 1.75"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </>
        ) : null}
      </svg>
    </span>
  );
}

function getDdayLabel(daysLeft: number, isPast: boolean) {
  if (isPast) {
    return "마감 지남";
  }

  if (daysLeft === 0) {
    return "D-day";
  }

  return `D-${daysLeft}`;
}

export function StudyHub({ group }: Readonly<StudyHubProps>) {
  const {
    clearPlanItemCompletion,
    completePlanItemWithFeedback,
    currentUserId,
    isMutating,
    togglePersonalPlanItem,
    updateGroupDetails,
  } = usePrototype();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [pendingChecklistId, setPendingChecklistId] = useState<string | null>(null);
  const [selectedUnderstanding, setSelectedUnderstanding] = useState<UnderstandingLevel | null>(
    null,
  );
  const [isStudyInfoEditOpen, setIsStudyInfoEditOpen] = useState(false);
  const [isTeamMemberModalOpen, setIsTeamMemberModalOpen] = useState(false);
  const [isStudyInfoMenuOpen, setIsStudyInfoMenuOpen] = useState(false);
  const [studyInfoError, setStudyInfoError] = useState<string | null>(null);
  const [studyInfoDraft, setStudyInfoDraft] = useState({
    name: "",
    subject: "",
    examDate: "",
    overallGoal: "",
  });
  const currentMember = group.members.find((member) => member.id === currentUserId) ?? null;
  const leaderMode = currentMember?.role === "팀장";
  const leaderMember = group.members.find((member) => member.role === "팀장") ?? currentMember;
  const teammates = group.members.filter((member) => member.id !== currentUserId).slice(0, 2);
  const selectedMember = teammates.find((member) => member.id === selectedMemberId) ?? null;
  const pendingChecklistItem = group.plan.find((item) => item.id === pendingChecklistId) ?? null;
  const pendingChecklistChecked = pendingChecklistItem?.memberStatus[currentUserId] ?? false;
  const completedCount = group.plan.filter((item) => item.memberStatus[currentUserId]).length;
  const personalPlanItems = getCurrentUserPersonalPlanItems(group, currentUserId);
  const teammateCount = Math.max(0, group.members.length - 1);
  const daysLeft = getDaysLeft(group.examDate);
  const ddayLabel = group.status === "completed" ? "수료함" : getDdayLabel(daysLeft, isDatePast(group.examDate));
  const studyInfoMenuRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!isStudyInfoMenuOpen) {
      return;
    }

    function handleOutsideClick(event: MouseEvent) {
      if (!studyInfoMenuRef.current?.contains(event.target as Node)) {
        setIsStudyInfoMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handleOutsideClick);
    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isStudyInfoMenuOpen]);

  function closeChecklistModal() {
    setPendingChecklistId(null);
    setSelectedUnderstanding(null);
  }

  function openStudyInfoEditModal() {
    if (!leaderMode) {
      return;
    }

    setStudyInfoDraft({
      name: group.name,
      subject: group.subject,
      examDate: group.examDate,
      overallGoal: group.overallGoal,
    });
    setStudyInfoError(null);
    setIsStudyInfoEditOpen(true);
  }

  async function saveStudyInfo() {
    if (!leaderMode) {
      return;
    }

    if (
      !studyInfoDraft.name.trim() ||
      !studyInfoDraft.subject.trim() ||
      !studyInfoDraft.examDate ||
      !studyInfoDraft.overallGoal.trim()
    ) {
      setStudyInfoError("그룹명, 과목, 목표일, 전체 목표를 모두 입력해 주세요.");
      return;
    }

    setStudyInfoError(null);

    await updateGroupDetails(group.id, {
      name: studyInfoDraft.name,
      subject: studyInfoDraft.subject,
      examDate: studyInfoDraft.examDate,
      presentationDate: group.presentationDate ?? "",
      deadlineDate: group.deadlineDate ?? "",
      weeklyGoal: group.weeklyGoal,
      overallGoal: studyInfoDraft.overallGoal,
    });

    setIsStudyInfoEditOpen(false);
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
        <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold tracking-[-0.03em] text-slate-950">
              {group.name}
            </h2>
            <div ref={studyInfoMenuRef} className="relative shrink-0">
              <button
                type="button"
                aria-expanded={isStudyInfoMenuOpen}
                aria-haspopup="menu"
                onClick={() => setIsStudyInfoMenuOpen((previous) => !previous)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-[0_6px_14px_rgba(15,23,42,0.05)] transition hover:translate-y-[-1px]"
              >
                <MeatballIcon />
              </button>

              {isStudyInfoMenuOpen ? (
                <div className="absolute right-0 top-[calc(100%+10px)] z-40 w-[180px] rounded-[18px] border border-slate-200 bg-white p-2 shadow-[0_18px_42px_rgba(15,23,42,0.14)]">
                  <div className="space-y-1">
                    {leaderMode ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsStudyInfoMenuOpen(false);
                          openStudyInfoEditModal();
                        }}
                        className="flex w-full items-center rounded-[12px] px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        수정
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setIsStudyInfoMenuOpen(false);
                        setIsTeamMemberModalOpen(true);
                      }}
                      className="flex w-full items-center rounded-[12px] px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      팀원 확인
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="overflow-hidden rounded-[18px] border border-slate-200">
            <div className="grid grid-cols-2 divide-x divide-slate-200">
              <div className="flex items-center gap-2.5 px-3.5 py-3">
                <StudyInfoIcon type="leader" />
                <div>
                  <p className="text-[12px] font-medium text-slate-500">팀장</p>
                  <p className="mt-0.5 text-[15px] font-semibold tracking-[-0.03em] text-slate-950">
                    {leaderMember?.name ?? "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 px-3.5 py-3">
                <StudyInfoIcon type="members" />
                <div>
                  <p className="text-[12px] font-medium text-slate-500">팀원</p>
                  <p className="mt-0.5 text-[15px] font-semibold tracking-[-0.03em] text-slate-950">
                    {teammateCount}명
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-200 border-t border-slate-200">
              <div className="flex items-center gap-2.5 px-3.5 py-3">
                <StudyInfoIcon type="date" />
                <div>
                  <p className="text-[12px] font-medium text-slate-500">목표일</p>
                  <p className="mt-0.5 text-[15px] font-semibold tracking-[-0.03em] text-slate-950">
                    {formatExamDate(group.examDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 px-3.5 py-3">
                <StudyInfoIcon type="time" />
                <div>
                  <p className="text-[12px] font-medium text-slate-500">남은 기간</p>
                  <p className="mt-0.5 text-[15px] font-semibold tracking-[-0.03em] text-[var(--brand)]">
                    {ddayLabel}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[18px] border border-slate-200 bg-white px-4 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
          <div>
            <div className="flex h-[88px] w-full flex-col items-center justify-center rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-center shadow-[0_4px_10px_rgba(15,23,42,0.03)]">
              <p className="text-[34px] font-semibold leading-none tracking-[-0.06em] text-slate-950">
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

      {isStudyInfoEditOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/24 px-6">
          <div className="w-full max-w-[360px] rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.10)]">
            <p className="text-base font-semibold text-slate-900">스터디 정보 수정</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              그룹명, 과목, 목표일, 전체 목표를 수정할 수 있어요.
            </p>

            <div className="mt-4 space-y-3">
              <input
                value={studyInfoDraft.name}
                onChange={(event) =>
                  setStudyInfoDraft((previous) => ({ ...previous, name: event.target.value }))
                }
                className="w-full rounded-[14px] border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[var(--brand)]"
                placeholder="그룹명"
                type="text"
              />
              <input
                value={studyInfoDraft.subject}
                onChange={(event) =>
                  setStudyInfoDraft((previous) => ({ ...previous, subject: event.target.value }))
                }
                className="w-full rounded-[14px] border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[var(--brand)]"
                placeholder="과목"
                type="text"
              />
              <input
                value={studyInfoDraft.examDate}
                onChange={(event) =>
                  setStudyInfoDraft((previous) => ({ ...previous, examDate: event.target.value }))
                }
                className="w-full rounded-[14px] border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[var(--brand)]"
                type="date"
              />
              <textarea
                value={studyInfoDraft.overallGoal}
                onChange={(event) =>
                  setStudyInfoDraft((previous) => ({
                    ...previous,
                    overallGoal: event.target.value,
                  }))
                }
                className="min-h-[96px] w-full rounded-[14px] border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[var(--brand)]"
                placeholder="전체 목표"
              />
            </div>

            {studyInfoError ? (
              <p className="mt-3 text-sm font-medium text-rose-500">{studyInfoError}</p>
            ) : null}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsStudyInfoEditOpen(false);
                  setStudyInfoError(null);
                }}
                className="rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  void saveStudyInfo();
                }}
                disabled={isMutating}
                className="rounded-[14px] bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {isMutating ? "저장 중" : "저장하기"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isTeamMemberModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/24 px-6">
          <div className="w-full max-w-[360px] rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.10)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-900">팀원 확인</p>
                <p className="mt-1 text-sm text-slate-500">현재 그룹에 참여 중인 멤버예요.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                총 {group.members.length}명
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {group.members.map((member) => (
                <div
                  key={member.id}
                  className="rounded-[14px] border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{member.focus}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                        member.role === "팀장"
                          ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {member.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsTeamMemberModalOpen(false)}
              className="mt-5 w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
            >
              닫기
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
