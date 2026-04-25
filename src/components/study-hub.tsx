"use client";

import { useEffect, useState } from "react";
import { usePrototype } from "@/components/prototype-provider";
import { currentUserId, type StudyGroup } from "@/lib/mock-data";

type StudyHubProps = {
  group: StudyGroup;
};

type PersonalTodo = {
  id: string;
  title: string;
  done: boolean;
};

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

function createInitialPersonalTodos(group: StudyGroup): PersonalTodo[] {
  const currentMember = group.members.find((member) => member.id === currentUserId);

  return [
    {
      id: `${group.id}-personal-focus`,
      title: `${currentMember?.focus ?? "핵심 개념"} 다시 정리하기`,
      done: false,
    },
    {
      id: `${group.id}-personal-review`,
      title: `${group.subject} 예상 질문 3개 만들기`,
      done: false,
    },
  ];
}

function createAdditionalPersonalTodo(group: StudyGroup, index: number): PersonalTodo {
  return {
    id: `${group.id}-personal-extra-${index}`,
    title: `${group.subject} 보완할 내용 ${index}`,
    done: false,
  };
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
  const { isMutating, togglePlanItem } = usePrototype();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [pendingChecklistId, setPendingChecklistId] = useState<string | null>(null);
  const [personalTodos, setPersonalTodos] = useState<PersonalTodo[]>(() =>
    createInitialPersonalTodos(group),
  );
  const [personalTodoCount, setPersonalTodoCount] = useState(3);
  const teammates = group.members.filter((member) => member.id !== currentUserId).slice(0, 2);
  const selectedMember = teammates.find((member) => member.id === selectedMemberId) ?? null;
  const pendingChecklistItem = group.plan.find((item) => item.id === pendingChecklistId) ?? null;
  const completedCount = group.plan.filter((item) => item.memberStatus[currentUserId]).length;

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

  async function confirmChecklistToggle() {
    if (!pendingChecklistItem) {
      return;
    }

    await togglePlanItem(group.id, pendingChecklistItem.id);
    setPendingChecklistId(null);
  }

  function togglePersonalTodo(todoId: string) {
    setPersonalTodos((previous) =>
      previous.map((todo) =>
        todo.id === todoId ? { ...todo, done: !todo.done } : todo,
      ),
    );
  }

  function addPersonalTodo() {
    setPersonalTodos((previous) => [
      ...previous,
      createAdditionalPersonalTodo(group, personalTodoCount),
    ]);
    setPersonalTodoCount((previous) => previous + 1);
  }

  return (
    <>
      <div className="space-y-4">
        <section className="rounded-[18px] border border-slate-200 bg-white px-4 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                오늘의 스터디
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
            <h2 className="text-[15px] font-semibold text-slate-900">함께 공부 중</h2>
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
                    setSelectedMemberId((previous) =>
                      previous === member.id ? null : member.id,
                    )
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
              <p className="mt-1 text-sm text-slate-600">{selectedMember.focus} 중심으로 진행 중</p>
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
                            <p className="text-sm font-semibold text-slate-900">
                              {item.title}
                            </p>
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
          </div>

          <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-semibold text-slate-900">추가 할 일</h2>
              <button
                type="button"
                onClick={addPersonalTodo}
                className="rounded-[12px] border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-[0_4px_10px_rgba(15,23,42,0.03)]"
              >
                추가
              </button>
            </div>

            <div className="space-y-2">
              {personalTodos.map((todo) => (
                <button
                  key={todo.id}
                  type="button"
                  onClick={() => togglePersonalTodo(todo.id)}
                  className={`flex w-full items-center gap-3 rounded-[14px] border px-4 py-3 text-left transition ${
                    todo.done
                      ? "border-[var(--brand)] bg-white text-[var(--brand)] shadow-[0_6px_16px_rgba(121,184,149,0.10)]"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <CheckIcon active={todo.done} />
                  <span className="text-sm font-medium text-slate-700">{todo.title}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      {pendingChecklistItem ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/24 px-6">
          <div className="w-full max-w-[296px] rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.10)]">
            <p className="text-base font-semibold text-slate-900">체크 상태 변경</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {pendingChecklistItem.title}
              <br />
              완료 상태를 바꿀까요?
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPendingChecklistId(null)}
                className="rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  void confirmChecklistToggle();
                }}
                disabled={isMutating}
                className="rounded-[14px] bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {isMutating ? "저장 중" : "확인"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
