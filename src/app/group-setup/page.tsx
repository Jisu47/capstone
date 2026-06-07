"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell, LoadingState, SectionCard } from "@/components/mobile-shell";
import { useAuth } from "@/components/auth-provider";
import { usePrototype } from "@/components/prototype-provider";
import { createGroupJoinCode, findGroupByJoinCode } from "@/lib/group-join-code";

export default function GroupSetupPage() {
  const router = useRouter();
  const { isAuthReady, currentUser } = useAuth();
  const { allGroups, isLoading, isMutating, joinGroup } = usePrototype();
  const activeGroups = allGroups.filter((group) => group.status === "active");
  const [joinCode, setJoinCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthReady && !currentUser) {
      router.replace("/login");
    }
  }, [currentUser, isAuthReady, router]);

  const suggestedCode = useMemo(() => {
    if (!activeGroups[0]) {
      return null;
    }

    return createGroupJoinCode(activeGroups[0].id);
  }, [activeGroups]);

  async function handleJoinGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedCode = joinCode.trim();

    if (!trimmedCode) {
      setErrorMessage("참여 코드를 입력해 주세요.");
      return;
    }

    const matchedGroup = findGroupByJoinCode(activeGroups, trimmedCode);

    if (!matchedGroup) {
      setErrorMessage("일치하는 그룹 참여 코드를 찾지 못했어요.");
      return;
    }

    if (matchedGroup.members.some((member) => member.id === currentUser?.userId)) {
      setErrorMessage("이미 참여 중인 그룹이에요.");
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
        subtitle="그룹 연결 화면을 준비하고 있어요."
      >
        <LoadingState message="사용자 상태를 확인하는 중입니다." />
      </AppShell>
    );
  }

  return (
    <AppShell
      requireAuth={false}
      showNavigation={false}
      title="그룹 참여하기"
      subtitle={`${currentUser.displayName}님이 사용할 참여 코드만 입력하면 바로 그룹에 연결돼요.`}
    >
      <SectionCard title="참여 코드로 그룹 추가하기">
        <form className="space-y-4" onSubmit={handleJoinGroup}>
          <div className="rounded-[18px] border border-[var(--line)] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdfb_100%)] px-4 py-4 shadow-[0_8px_20px_rgba(121,184,149,0.06)]">
            <p className="text-sm leading-6 text-slate-600">
              팀장에게 받은 참여 코드를 입력하면 해당 그룹에 팀원으로 바로 연결돼요.
            </p>
            {isLoading ? (
              <p className="mt-2 text-sm text-slate-500">
                참여 가능한 그룹 목록을 불러오는 중이에요.
              </p>
            ) : suggestedCode ? (
              <p className="mt-2 text-xs text-slate-500">테스트용 예시 코드: {suggestedCode}</p>
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
              className="w-full rounded-[16px] border border-[var(--line)] bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(121,184,149,0.14)]"
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
            className="inline-flex w-full items-center justify-center rounded-[18px] bg-[var(--brand)] px-4 py-4 text-base font-semibold text-white shadow-[0_14px_28px_rgba(121,184,149,0.22)] transition hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(121,184,149,0.42)] focus-visible:ring-offset-2 disabled:opacity-70"
          >
            {isMutating ? "그룹 연결 중..." : "그룹 참여하기"}
          </button>
        </form>
      </SectionCard>
    </AppShell>
  );
}
