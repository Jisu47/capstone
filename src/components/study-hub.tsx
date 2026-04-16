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
      title: `${currentMember?.focus ?? "중점 파트"} 다시 정리하기`,
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
    title: `${group.subject} 개인 보완 할 일 ${index}`,
    done: false,
  };
}

function getTeammateSessionLength(index: number) {
  return formatTimer(3600 + index * 780);
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
  const selectedMember =
    teammates.find((member) => member.id === selectedMemberId) ?? null;
  const pendingChecklistItem =
    group.plan.find((item) => item.id === pendingChecklistId) ?? null;
  const completedCount = group.plan.filter(
    (item) => item.memberStatus[currentUserId],
  ).length;

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
        <section className="relative overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(221,233,255,0.9))] p-5 shadow-[0_24px_60px_rgba(28,64,120,0.12)]">
          <div className="absolute right-[-24px] top-[-30px] h-32 w-32 rounded-full bg-[rgba(47,110,229,0.14)] blur-2xl" />
          <div className="absolute bottom-[-36px] left-[-18px] h-28 w-28 rounded-full bg-[rgba(16,185,129,0.14)] blur-2xl" />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  TODAY
                </p>
                <h2 className="mt-2 text-[25px] font-semibold tracking-[-0.05em] text-slate-950">
                  지금 스터디 흐름
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  오늘은 공통 체크리스트와 개인 보완 할 일을 함께 챙기면 됩니다.
                </p>
              </div>

              <div className="rounded-[24px] bg-slate-950 px-4 py-3 text-right text-white shadow-[0_14px_32px_rgba(15,23,42,0.18)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                  Timer
                </p>
                <p className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                  {formatTimer(elapsedSeconds)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-[1.1fr_0.9fr] gap-3">
              <button
                type="button"
                onClick={() => setIsTimerRunning((previous) => !previous)}
                className="rounded-[28px] border border-white/80 bg-white/84 px-4 py-5 text-left shadow-[0_16px_36px_rgba(28,64,120,0.08)] transition hover:bg-white"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Focus Session
                </p>
                <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-slate-950">
                  {isTimerRunning ? "집중 세션 진행 중" : "타이머 시작하기"}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {isTimerRunning
                    ? "집중이 끊기지 않도록 같은 흐름으로 이어가고 있어요."
                    : "오늘 세션을 켜 두면 팀 분위기를 맞추기 쉬워져요."}
                </p>
              </button>

              <div className="rounded-[28px] border border-white/80 bg-slate-950/5 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  오늘의 포인트
                </p>
                <p className="mt-2 text-base font-semibold tracking-[-0.03em] text-slate-900">
                  {group.weeklyGoal}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-[var(--line)] bg-white/84 p-4 shadow-[0_18px_48px_rgba(28,64,120,0.08)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[18px] font-semibold tracking-[-0.03em] text-slate-900">
                공부 중인 팀원
              </p>
              <p className="text-sm text-slate-500">
                팀원 카드를 눌러 현재 세션 상태를 확인해 보세요.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {teammates.length}명 집중 중
            </span>
          </div>

          <div className="mt-4 space-y-3">
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
                  className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                    active
                      ? "border-[var(--brand)] bg-[var(--brand-soft)] shadow-[0_12px_28px_rgba(47,110,229,0.12)]"
                      : "border-[var(--line)] bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold ${
                        active
                          ? "bg-[var(--brand)] text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {member.name.slice(0, 1)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-slate-900">
                            {member.name}
                          </p>
                          <p className="truncate text-sm text-slate-500">
                            {member.focus}
                          </p>
                        </div>
                        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">
                          {getTeammateSessionLength(index)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedMember ? (
            <div className="mt-3 rounded-[24px] border border-[var(--line)] bg-slate-950 px-4 py-4 text-white shadow-[0_16px_36px_rgba(15,23,42,0.16)]">
              <p className="text-sm font-semibold">{selectedMember.name}</p>
              <p className="mt-1 text-sm text-white/80">
                {selectedMember.focus} 중심으로 집중 세션을 이어가는 중이에요.
              </p>
            </div>
          ) : null}
        </section>

        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[18px] font-semibold tracking-[-0.03em] text-slate-900">
                오늘 할 일
              </p>
              <p className="text-sm text-slate-500">
                공통 체크리스트를 끝내고 개인 보완 할 일을 이어서 정리해요.
              </p>
            </div>
            <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
              {completedCount}/{group.plan.length} 완료
            </span>
          </div>

          <div className="rounded-[30px] border border-[var(--line)] bg-white/84 p-4 shadow-[0_18px_48px_rgba(28,64,120,0.08)] backdrop-blur">
            <div>
              <p className="text-lg font-semibold tracking-[-0.03em] text-slate-900">
                그룹 공통 체크리스트
              </p>
              <p className="mt-1 text-sm text-slate-500">
                기존 계획을 오늘 흐름에 맞춰 하나씩 확인해요.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {group.plan.map((item) => {
                const checked = item.memberStatus[currentUserId];

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPendingChecklistId(item.id)}
                    className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                      checked
                        ? "border-transparent bg-[linear-gradient(135deg,rgba(217,231,255,0.96),rgba(235,245,255,0.96))] shadow-[0_14px_30px_rgba(47,110,229,0.12)]"
                        : "border-[var(--line)] bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
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
                          <div
                            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                              checked
                                ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                                : "border-slate-300 bg-white text-transparent"
                            }`}
                          >
                            <svg
                              aria-hidden="true"
                              className="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <path
                                d="M5 12.5L9.5 17L19 7.5"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                              />
                            </svg>
                          </div>
                        </div>

                        <p className="mt-3 text-xs font-medium text-slate-500">
                          {item.duration}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[30px] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(237,249,244,0.9))] p-4 shadow-[0_18px_48px_rgba(28,64,120,0.08)] backdrop-blur">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold tracking-[-0.03em] text-slate-900">
                  개인 보완 할 일
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  오늘 공통 흐름 뒤에 바로 이어서 체크할 개인 항목이에요.
                </p>
              </div>
              <button
                type="button"
                onClick={addPersonalTodo}
                className="rounded-full border border-emerald-200 bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-white"
              >
                추가
              </button>
            </div>

            <div className="space-y-3">
              {personalTodos.map((todo) => (
                <button
                  key={todo.id}
                  type="button"
                  onClick={() => togglePersonalTodo(todo.id)}
                  className={`flex w-full items-center gap-3 rounded-[24px] border px-4 py-4 text-left transition ${
                    todo.done
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-[var(--line)] bg-white/84 hover:border-emerald-200"
                  }`}
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                      todo.done
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-slate-300 bg-white text-transparent"
                    }`}
                  >
                    <svg
                      aria-hidden="true"
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M5 12.5L9.5 17L19 7.5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    {todo.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      {pendingChecklistItem ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/28 px-6">
          <div className="w-full max-w-[296px] rounded-[30px] border border-white/80 bg-white p-6 text-center shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
            <p className="text-lg font-semibold text-slate-900">체크 상태 변경</p>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              {pendingChecklistItem.title}
              <br />
              이 항목의 완료 상태를 바꿀까요?
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPendingChecklistId(null)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  void confirmChecklistToggle();
                }}
                disabled={isMutating}
                className="rounded-2xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {isMutating ? "저장 중..." : "확인"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
