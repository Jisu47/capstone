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
      title: `${currentMember?.focus ?? "핵심 파트"} 다시 정리하기`,
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
        <section className="rounded-[28px] border border-slate-300 bg-white/80 p-4 shadow-[0_18px_60px_rgba(28,64,120,0.08)]">
          <div className="flex items-end justify-between gap-3">
            <p className="text-[18px] font-semibold uppercase tracking-[-0.03em] text-slate-700">
              TODAY
            </p>
            <p className="text-[18px] font-semibold text-slate-700">
              {formatTimer(elapsedSeconds)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsTimerRunning((previous) => !previous)}
            className="mt-3 flex w-full items-center justify-center rounded-[18px] border border-slate-300 bg-white px-4 py-5 text-base font-semibold text-slate-700"
          >
            {isTimerRunning ? "타이머 일시정지" : "타이머 시작"}
          </button>

          <div className="mt-3 relative">
            <p className="text-sm text-slate-500">공부 중인 팀원</p>
            <div className="mt-2 flex items-center justify-end gap-3">
              {teammates.map((member) => {
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
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition ${
                      active
                        ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                        : "border-slate-300 bg-white text-slate-600"
                    }`}
                  >
                    {member.name.slice(0, 1)}
                  </button>
                );
              })}
            </div>

            {selectedMember ? (
              <div className="absolute right-0 top-11 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_18px_40px_rgba(15,23,42,0.14)]">
                {selectedMember.name} 01:00:00
              </div>
            ) : null}
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-center text-[17px] font-semibold text-slate-700">오늘 할 일</p>

          <div className="rounded-[28px] border border-slate-300 bg-white/80 p-4 shadow-[0_18px_60px_rgba(28,64,120,0.08)]">
            <p className="mb-3 text-center text-lg font-semibold text-slate-700">
              그룹 공통 체크리스트
            </p>

            <div className="space-y-3">
              {group.plan.map((item) => {
                const checked = item.memberStatus[currentUserId];

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPendingChecklistId(item.id)}
                    className={`w-full rounded-[20px] border px-4 py-3 text-left transition ${
                      checked
                        ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1 h-5 w-5 rounded-full border ${
                          checked
                            ? "border-[var(--brand)] bg-[var(--brand)]"
                            : "border-slate-400 bg-white"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {item.day} · {item.duration}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-center text-[34px] font-semibold text-slate-500">
            +
          </div>

          <div className="rounded-[28px] border border-slate-300 bg-white/80 p-4 shadow-[0_18px_60px_rgba(28,64,120,0.08)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-center text-lg font-semibold text-slate-700">
                개인 맞춤 추가 할 일
              </p>
              <button
                type="button"
                onClick={addPersonalTodo}
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
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
                  className={`flex w-full items-center gap-3 rounded-[20px] border px-4 py-3 text-left transition ${
                    todo.done
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full border ${
                      todo.done
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-slate-400 bg-white"
                    }`}
                  />
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
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/20 px-6">
          <div className="w-full max-w-[260px] rounded-[28px] border border-slate-300 bg-white p-6 text-center shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
            <p className="text-lg font-semibold text-slate-900">체크리스트 확인</p>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              {pendingChecklistItem.title}
              <br />
              체크 상태를 변경할까요?
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
                {isMutating ? "저장 중..." : "체크"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
