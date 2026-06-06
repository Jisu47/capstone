"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell, LoadingState, SectionCard } from "@/components/mobile-shell";
import { useAuth } from "@/components/auth-provider";
import { usePrototype } from "@/components/prototype-provider";
import { getMemberGroups } from "@/lib/group-membership";
import { createGroupJoinCode, findGroupByJoinCode } from "@/lib/group-join-code";

export default function GroupSetupPage() {
  const router = useRouter();
  const { isAuthReady, currentUser } = useAuth();
  const { allGroups, isLoading, isMutating, joinGroup } = usePrototype();
  const activeGroups = allGroups.filter((group) => group.status === "active");
  const [joinCode, setJoinCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const joinedGroups = currentUser ? getMemberGroups(allGroups, currentUser.userId) : [];

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

    if (joinedGroups.some((group) => group.id === matchedGroup.id)) {
      setErrorMessage("이미 참여 중인 그룹이에요.");
      return;
    }

    try {
      await joinGroup(matchedGroup.id);
      router.replace("/mypage");
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
      title="그룹 설정"
      subtitle={
        joinedGroups.length > 0
          ? `${currentUser.displayName}님이 참여할 그룹을 더 추가하거나 새로 만들 수 있어요.`
          : `${currentUser.displayName}님에게 맞는 첫 그룹 연결 단계를 준비했어요.`
      }
    >
      <SectionCard title="가입 후 첫 단계">
        <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-4">
          <p className="text-sm font-semibold text-slate-900">
            {joinedGroups.length > 0
              ? "다른 그룹도 이어서 연결할 수 있어요."
              : "역할은 아직 정해지지 않았어요."}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            그룹을 만들면 해당 그룹의 팀장으로, 참여 코드를 입력하면 그 그룹의 팀원으로
            자동 지정됩니다.
          </p>
        </div>
      </SectionCard>

      <SectionCard title={joinedGroups.length > 0 ? "새 그룹 추가하기" : "그룹 만들기"}>
        <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-5 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
          <p className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
            새 스터디 그룹을 만들고 바로 운영을 시작해 보세요.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            그룹을 만들면 현재 계정이 그 그룹의 팀장으로 자동 지정되고, 이후 마이페이지에서
            내 그룹 목록을 함께 관리할 수 있어요.
          </p>
          <button
            type="button"
            onClick={() => router.push("/create")}
            className="mt-5 inline-flex w-full items-center justify-center rounded-[18px] bg-sky-600 px-4 py-4 text-base font-semibold text-white shadow-[0_14px_28px_rgba(2,132,199,0.22)] transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
          >
            그룹 만들기
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title={joinedGroups.length > 0 ? "참여 코드로 그룹 추가하기" : "그룹 참여하기"}
      >
        <form className="space-y-4" onSubmit={handleJoinGroup}>
          <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-4">
            <p className="text-sm leading-6 text-slate-600">
              팀장에게 받은 참여 코드를 입력하면 팀원으로 자동 연결돼요.
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
              className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
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
            className="inline-flex w-full items-center justify-center rounded-[18px] bg-sky-600 px-4 py-4 text-base font-semibold text-white shadow-[0_14px_28px_rgba(2,132,199,0.22)] transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 disabled:opacity-70"
          >
            {isMutating ? "그룹 연결 중..." : "그룹 참여하기"}
          </button>
        </form>
      </SectionCard>
    </AppShell>
  );
}
