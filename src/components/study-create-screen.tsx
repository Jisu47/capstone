"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AppShell, SectionCard } from "@/components/mobile-shell";
import { usePrototype } from "@/components/prototype-provider";
import { type CreateGroupInput } from "@/lib/mock-data";

export function StudyCreateScreen() {
  const { createGroup, isMutating } = usePrototype();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<CreateGroupInput>({
    name: "알고리즘 기말 대비",
    subject: "알고리즘",
    examDate: "2026-04-30",
    presentationDate: "2026-04-24",
    deadlineDate: "2026-04-27",
    weeklyGoal: "그리디와 DP 정리, 기출 2회독, 발표 질문 준비",
    overallGoal:
      "기말고사 직전까지 전 범위를 안정적으로 설명하고 문제 풀이 흐름을 공유할 수 있는 상태 만들기",
  });

  function handleChange<Key extends keyof CreateGroupInput>(
    key: Key,
    value: CreateGroupInput[Key],
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const groupId = await createGroup(form);

      startTransition(() => {
        router.push(`/group/${groupId}`);
      });
    } catch {}
  }

  return (
    <AppShell
      showNavigation={false}
      title="새 스터디 그룹"
      subtitle="시험 일정과 공동 목표를 먼저 정의하면 스터디 탭에서 그룹을 선택하고, 각 그룹의 상세 화면으로 이어갈 수 있어요."
    >
      <SectionCard title="기본 정보 입력">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">모임명</span>
            <input
              required
              value={form.name}
              onChange={(event) => handleChange("name", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">과목/주제</span>
            <input
              required
              value={form.subject}
              onChange={(event) => handleChange("subject", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">시험일</span>
              <input
                required
                type="date"
                value={form.examDate}
                onChange={(event) => handleChange("examDate", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">발표 일정</span>
              <input
                type="date"
                value={form.presentationDate}
                onChange={(event) =>
                  handleChange("presentationDate", event.target.value)
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">마감일</span>
            <input
              type="date"
              value={form.deadlineDate}
              onChange={(event) => handleChange("deadlineDate", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">이번 주 목표</span>
            <textarea
              required
              rows={4}
              value={form.weeklyGoal}
              onChange={(event) => handleChange("weeklyGoal", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">전체 목표</span>
            <textarea
              required
              rows={4}
              value={form.overallGoal}
              onChange={(event) => handleChange("overallGoal", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
            />
          </label>

          <button
            type="submit"
            disabled={isPending || isMutating}
            className="w-full rounded-2xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(47,110,229,0.26)] transition hover:brightness-105 disabled:opacity-70"
          >
            {isPending ? "모임 생성 중..." : "모임 생성하기"}
          </button>
        </form>
      </SectionCard>

      <SectionCard title="생성 후 바로 이어지는 흐름">
        <div className="grid gap-3">
          {[
            "스터디 탭에서 내 그룹 카드 목록을 보고 원하는 그룹을 선택할 수 있어요.",
            "그룹을 선택하면 시험 일정, 공동 목표, 팀원 진행 상태가 담긴 그룹 정보 화면으로 이어져요.",
            "계획 탭과 자료 탭은 선택한 그룹 기준으로 같은 데이터를 공유해요.",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl bg-white/80 p-3 text-sm leading-6 text-slate-700"
            >
              {item}
            </div>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
