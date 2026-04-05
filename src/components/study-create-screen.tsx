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
    weeklyGoal: "그래프/DP 정리, 기출 2회독, 발표 질문 준비",
    overallGoal: "기말고사 전까지 핵심 유형을 팀 전체가 안정적으로 풀 수 있는 상태 만들기",
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
      title="새 스터디 모임"
      subtitle="시험 일정과 공동 목표를 먼저 정의하면 스터디 탭과 계획 탭이 같은 기준 데이터를 공유합니다."
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
                onChange={(event) => handleChange("presentationDate", event.target.value)}
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

      <SectionCard title="생성 후 바로 연결되는 흐름">
        <div className="grid gap-3">
          {[
            "스터디 탭에서 현재 모임, 시험 일정, 공동 목표, 팀원 상태를 한 번에 관리합니다.",
            "계획 탭은 방금 입력한 시험일과 목표를 기준으로 주간 체크 흐름을 이어갑니다.",
            "자료와 AI 화면은 팀원 B 담당 영역으로 유지되고 같은 모임 데이터를 함께 참조합니다.",
          ].map((item) => (
            <div key={item} className="rounded-2xl bg-white/80 p-3 text-sm leading-6 text-slate-700">
              {item}
            </div>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
