"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { AppShell, LoadingState, SectionCard } from "@/components/mobile-shell";
import { useAuth } from "@/components/auth-provider";
import { usePrototype } from "@/components/prototype-provider";
import { createGroupJoinCode } from "@/lib/group-join-code";

export default function MyPage() {
  const router = useRouter();
  const { isAuthReady, currentUser, signOut } = useAuth();
  const { groups } = usePrototype();

  useEffect(() => {
    if (isAuthReady && !currentUser) {
      router.replace("/login");
      return;
    }

    if (currentUser && !currentUser.hasJoinedGroup) {
      router.replace("/group-setup");
    }
  }, [currentUser, isAuthReady, router]);

  const joinedGroup = useMemo(() => {
    if (!currentUser?.joinedGroupId) {
      return null;
    }

    return groups.find((group) => group.id === currentUser.joinedGroupId) ?? null;
  }, [currentUser?.joinedGroupId, groups]);

  if (!isAuthReady || !currentUser) {
    return (
      <AppShell
        requireAuth={false}
        showNavigation={false}
        title="마이페이지"
        subtitle="사용자 정보를 준비하고 있어요."
      >
        <LoadingState message="마이페이지를 불러오는 중입니다." />
      </AppShell>
    );
  }

  return (
    <AppShell
      requireAuth={false}
      showNavigation={false}
      title="마이페이지"
      subtitle="내 역할과 그룹 상태를 한눈에 확인해 보세요."
    >
      <SectionCard
        title={`${currentUser.username}님`}
        action={
          <button
            type="button"
            onClick={() => {
              signOut();
              router.replace("/");
            }}
            className="text-sm font-semibold text-sky-700"
          >
            로그아웃
          </button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              역할
            </p>
            <p className="mt-2 text-base font-semibold text-slate-950">
              {currentUser.role === "leader" ? "팀장" : "팀원"}
            </p>
          </div>
          <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              그룹 상태
            </p>
            <p className="mt-2 text-base font-semibold text-slate-950">
              {currentUser.hasJoinedGroup ? "가입 완료" : "미가입"}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="내 그룹">
        {joinedGroup ? (
          <div className="space-y-4">
            <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-5 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {joinedGroup.subject}
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                {joinedGroup.name}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                현재 연결된 그룹입니다. 이어서 그룹 홈으로 이동하거나 메인 화면에서 다른 스터디를 확인할 수 있어요.
              </p>
            </div>

            {currentUser.role === "leader" ? (
              <div className="rounded-[18px] border border-slate-200 bg-sky-50 px-4 py-4">
                <p className="text-sm font-semibold text-slate-900">팀원 초대 코드</p>
                <p className="mt-2 text-lg font-semibold tracking-[0.08em] text-sky-700">
                  {createGroupJoinCode(joinedGroup.id)}
                </p>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => router.push(`/group/${joinedGroup.id}`)}
                className="inline-flex items-center justify-center rounded-[18px] bg-sky-600 px-4 py-4 text-base font-semibold text-white shadow-[0_14px_28px_rgba(2,132,199,0.22)] transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
              >
                그룹 홈으로 이동
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-[18px] border border-slate-200 bg-white px-4 py-4 text-base font-semibold text-slate-800 transition hover:border-slate-300"
              >
                메인 화면 보기
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm leading-6 text-slate-600">
              연결된 그룹 정보를 찾지 못했어요. 그룹 설정 화면에서 다시 참여하거나 그룹을 만들어 주세요.
            </p>
            <Link
              href="/group-setup"
              className="inline-flex items-center justify-center rounded-[18px] bg-sky-600 px-4 py-4 text-base font-semibold text-white shadow-[0_14px_28px_rgba(2,132,199,0.22)] transition hover:bg-sky-700"
            >
              그룹 설정으로 이동
            </Link>
          </div>
        )}
      </SectionCard>
    </AppShell>
  );
}
