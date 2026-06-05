"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { AppShell, LoadingState, SectionCard } from "@/components/mobile-shell";
import { useAuth } from "@/components/auth-provider";
import { usePrototype } from "@/components/prototype-provider";
import { findGroupByJoinCode } from "@/lib/group-join-code";

export default function GroupSetupPage() {
  const router = useRouter();
  const { isAuthReady, currentUser } = useAuth();
  const { allGroups, isLoading, isMutating, joinGroup } = usePrototype();
  const [joinCode, setJoinCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthReady && !currentUser) {
      router.replace("/login");
      return;
    }

    if (currentUser?.hasJoinedGroup) {
      router.replace("/");
    }
  }, [currentUser, isAuthReady, router]);

  async function handleJoinGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedCode = joinCode.trim();

    if (!trimmedCode) {
      setErrorMessage("참여 코드를 입력해 주세요.");
      return;
    }

    const matchedGroup = findGroupByJoinCode(allGroups, trimmedCode);

    if (!matchedGroup) {
      setErrorMessage("일치하는 그룹 참여 코드를 찾지 못했어요.");
      return;
    }

    try {
      await joinGroup(matchedGroup.id);
      router.replace("/");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "그룹 참여 중 오류가 발생했어요.",
      );
    }
  }

  if (!isAuthReady || !currentUser) {
    return (
      <AppShell
        requireAuth={false}
        showNavigation={false}
        title="그룹 설정"
        subtitle="가입 후 첫 그룹 연결 단계를 준비하고 있어요."
      >
        <LoadingState message="사용자 상태를 확인하는 중입니다." />
      </AppShell>
    );
  }

  return (
    <AppShell
      requireAuth={false}
      showNavigation={false}
      title="그룹 설정"
      subtitle={`${currentUser.displayName}님에게 맞는 그룹 연결 단계를 준비했어요.`}
    >
      <SectionCard title="가입 후 첫 단계">
        <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-4">
          <p className="text-sm font-semibold text-slate-900">역할은 아직 정해지지 않았어요.</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            그룹을 만들면 팀장으로, 참여 코드를 입력하면 팀원으로 자동 지정됩니다.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="그룹 만들기">
        <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-5 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
          <p className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
            새 스터디 그룹을 만들고 바로 운영을 시작해 보세요.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            그룹을 만든 뒤에는 그룹 홈으로 바로 들어가고, 이후에는 그룹 선택 화면에서 다른 그룹
            흐름도 함께 관리할 수 있어요.
          </p>
          <button
            type="button"
            onClick={() => router.push("/create")}
            className="mt-5 inline-flex w-full items-center justify-center rounded-[18px] bg-[var(--brand)] px-4 py-4 text-base font-semibold text-white shadow-[0_14px_28px_rgba(121,184,149,0.22)] transition hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
          >
            그룹 만들기
          </button>
        </div>
      </SectionCard>

      <SectionCard title="그룹 참여하기">
        <form className="space-y-4" onSubmit={handleJoinGroup}>
          <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-4">
            <p className="text-sm leading-6 text-slate-600">
              팀장에게 받은 참여 코드를 입력하면 팀원으로 자동 연결돼요.
            </p>
            {isLoading ? (
              <p className="mt-2 text-sm text-slate-500">
                참여 가능한 그룹 정보를 확인하는 중이에요.
              </p>
            ) : null}
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">참여 코드</span>
            <input
              type="text"
              value={joinCode}
              onChange={(event) => {
                setJoinCode(event.target.value);
                setErrorMessage(null);
              }}
              required
              placeholder="예: SF-GROUP05"
              className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(121,184,149,0.16)]"
            />
          </label>

          {errorMessage ? (
            <p className="rounded-[14px] bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isMutating}
            className="inline-flex w-full items-center justify-center rounded-[18px] bg-[var(--brand)] px-4 py-4 text-base font-semibold text-white shadow-[0_14px_28px_rgba(121,184,149,0.22)] transition hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 disabled:opacity-70"
          >
            {isMutating ? "그룹 연결 중..." : "그룹 참여하기"}
          </button>
        </form>
      </SectionCard>
    </AppShell>
  );
}
