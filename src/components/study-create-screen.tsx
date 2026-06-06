"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AppShell, SectionCard } from "@/components/mobile-shell";
import { usePrototype } from "@/components/prototype-provider";
import { markGroupHomeTourPending } from "@/lib/group-home-tour";
import { type CreateGroupInput } from "@/lib/mock-data";

const initialForm: CreateGroupInput = {
  name: "",
  subject: "",
  examDate: "",
  overallGoal: "",
};

export function StudyCreateScreen() {
  const { createGroup, currentUserId, isMutating } = usePrototype();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<CreateGroupInput>(initialForm);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleChange<Key extends keyof CreateGroupInput>(
    key: Key,
    value: CreateGroupInput[Key],
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
    setErrorMessage(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const groupId = await createGroup(form);
      markGroupHomeTourPending(currentUserId, groupId);

      startTransition(() => {
        router.push(`/group/${groupId}`);
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "그룹 생성 중 오류가 발생했어요.",
      );
    }
  }

  return (
    <AppShell
      showNavigation={false}
      headerVariant="capsule"
      title="새 스터디 그룹"
    >
      <SectionCard title="기본 정보 입력">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">모임명</span>
            <input
              required
              value={form.name}
              onChange={(event) => handleChange("name", event.target.value)}
              placeholder="예: 알고리즘 기말 대비"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[var(--brand)]"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">과목/주제</span>
            <input
              required
              value={form.subject}
              onChange={(event) => handleChange("subject", event.target.value)}
              placeholder="예: 알고리즘"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[var(--brand)]"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">목표 날짜</span>
            <input
              required
              type="date"
              value={form.examDate}
              onChange={(event) => handleChange("examDate", event.target.value)}
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
              placeholder="예: 기말고사 전까지 팀 전체가 핵심 문제를 안정적으로 설명하고 해결할 수 있는 상태 만들기"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[var(--brand)]"
            />
          </label>

          {errorMessage ? (
            <p className="rounded-[14px] bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending || isMutating}
            className="w-full rounded-2xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(121,184,149,0.24)] transition hover:brightness-105 disabled:opacity-70"
          >
            {isPending ? "모임 생성 중..." : "모임 생성하기"}
          </button>
        </form>
      </SectionCard>

      <SectionCard title="생성 후 바로 이어지는 흐름">
        <div className="grid gap-3">
          {[
            "생성 직후 현재 계정이 팀장으로 자동 지정되고 그룹 화면으로 바로 이동해요.",
            "처음 만든 그룹은 빈 상태로 시작해서 자료와 계획을 필요한 만큼 직접 채워 넣을 수 있어요.",
            "이후 다시 로그인해도 그룹 가입 상태와 역할이 유지되고, 마이페이지와 그룹 선택 화면에서 바로 이어서 들어갈 수 있어요.",
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
