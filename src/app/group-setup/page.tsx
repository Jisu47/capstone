"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell, LoadingState, SectionCard } from "@/components/mobile-shell";
import { useAuth } from "@/components/auth-provider";
import { usePrototype } from "@/components/prototype-provider";
import { createGroupJoinCode, findGroupByJoinCode } from "@/lib/group-join-code";

export default function GroupSetupPage() {
  const router = useRouter();
  const { isAuthReady, currentUser, markGroupJoined } = useAuth();
  const { groups, isLoading } = usePrototype();
  const [joinCode, setJoinCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthReady && !currentUser) {
      router.replace("/login");
      return;
    }

    if (currentUser?.hasJoinedGroup) {
      router.replace("/mypage");
    }
  }, [currentUser, isAuthReady, router]);

  const suggestedCode = useMemo(() => {
    const firstGroup = groups[0];

    if (!firstGroup) {
      return null;
    }

    return createGroupJoinCode(firstGroup.id);
  }, [groups]);

  function handleJoinGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedCode = joinCode.trim();

    if (!trimmedCode) {
      setErrorMessage("참여 코드를 입력해 주세요.");
      return;
    }

    const matchedGroup = findGroupByJoinCode(groups, trimmedCode);

    if (!matchedGroup) {
      setErrorMessage("일치하는 그룹 참여 코드를 찾을 수 없습니다.");
      return;
    }

    markGroupJoined(matchedGroup.id);
    router.replace("/mypage");
  }

  if (!isAuthReady || !currentUser) {
    return (
      <AppShell
        requireAuth={false}
        showNavigation={false}
        title="그룹 설정"
        subtitle="가입 후 첫 설정을 준비하고 있어요."
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
      subtitle={`${currentUser.username}님에게 맞는 다음 단계를 준비했어요.`}
    >
      <SectionCard title="가입 상태">
        <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-4">
          <p className="text-sm font-semibold text-slate-900">
            역할: {currentUser.role === "leader" ? "팀장" : "팀원"}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            그룹 가입 여부를 확인한 결과 아직 연결된 그룹이 없어서 그룹 설정 단계로 이동했어요.
          </p>
        </div>
      </SectionCard>

      {currentUser.role === "leader" ? (
        <SectionCard title="팀장 시작하기">
          <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-5 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
            <p className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
              새 그룹을 만들고 스터디를 시작해 보세요.
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              그룹을 만든 뒤에는 자동으로 그룹 가입 상태가 반영되고, 다음 로그인부터는 바로 마이페이지로 이동해요.
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
      ) : (
        <SectionCard title="팀원 참여하기">
          <form className="space-y-4" onSubmit={handleJoinGroup}>
            <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-4">
              <p className="text-sm leading-6 text-slate-600">
                팀장에게 받은 참여 코드를 입력하면 바로 그룹에 연결돼요.
              </p>
              {isLoading ? (
                <p className="mt-2 text-sm text-slate-500">
                  참여 가능한 그룹 목록을 불러오는 중이에요.
                </p>
              ) : suggestedCode ? (
                <p className="mt-2 text-xs text-slate-500">
                  테스트용 예시 코드: {suggestedCode}
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
                placeholder="예: SF-GROUPOS"
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
              className="inline-flex w-full items-center justify-center rounded-[18px] bg-sky-600 px-4 py-4 text-base font-semibold text-white shadow-[0_14px_28px_rgba(2,132,199,0.22)] transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
            >
              그룹 참여하기
            </button>
          </form>
        </SectionCard>
      )}
    </AppShell>
  );
}
