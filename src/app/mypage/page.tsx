"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  type UpdateProfileInput,
  useAuth,
} from "@/components/auth-provider";
import { AppShell, LoadingState, SectionCard } from "@/components/mobile-shell";
import { ProfileAvatar } from "@/components/profile-avatar";
import { usePrototype } from "@/components/prototype-provider";
import { createGroupJoinCode } from "@/lib/group-join-code";
import { getGroupMembership, getMemberGroups } from "@/lib/group-membership";
import { type AvatarPreset, formatExamDate, getDaysLeft, type StudyGroup } from "@/lib/mock-data";

type Notice = {
  tone: "success" | "error";
  text: string;
};

const avatarPresetOptions: Array<{
  value: AvatarPreset;
  label: string;
}> = [
  { value: "sky", label: "하늘" },
  { value: "emerald", label: "에메랄드" },
  { value: "rose", label: "로즈" },
  { value: "amber", label: "앰버" },
];

const initialProfileForm: UpdateProfileInput = {
  displayName: "",
  bio: "",
  avatarPreset: "sky",
};

function sortGroupsForMyPage(groups: StudyGroup[], recentGroupId: string | null) {
  return [...groups].sort((left, right) => {
    const leftIsRecent = left.id === recentGroupId;
    const rightIsRecent = right.id === recentGroupId;

    if (leftIsRecent !== rightIsRecent) {
      return leftIsRecent ? -1 : 1;
    }

    if (left.status !== right.status) {
      return left.status === "active" ? -1 : 1;
    }

    if (left.status === "completed" && right.status === "completed") {
      return right.examDate.localeCompare(left.examDate);
    }

    const leftDays = getDaysLeft(left.examDate);
    const rightDays = getDaysLeft(right.examDate);

    if (leftDays !== rightDays) {
      return leftDays - rightDays;
    }

    return left.name.localeCompare(right.name, "ko");
  });
}

function getGroupBadge(group: StudyGroup) {
  if (group.status === "completed") {
    return "운영 종료";
  }

  const daysLeft = getDaysLeft(group.examDate);
  return daysLeft === 0 ? "D-day" : `D-${daysLeft}`;
}

function getMembershipStatus(group: StudyGroup, isRecentGroup: boolean) {
  if (group.status === "completed") {
    return "운영 종료";
  }

  return isRecentGroup ? "최근 사용 중" : "가입 완료";
}

export default function MyPage() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { allGroups, isLoading, syncCurrentUserProfile } = usePrototype();
  const {
    isAuthReady,
    currentUser,
    updateProfile,
    signOut,
    deleteAccount,
  } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [profileForm, setProfileForm] = useState<UpdateProfileInput>(initialProfileForm);

  useEffect(() => {
    if (isAuthReady && !currentUser) {
      router.replace("/login");
    }
  }, [currentUser, isAuthReady, router]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    setProfileForm({
      displayName: currentUser.displayName,
      bio: currentUser.bio,
      avatarPreset: currentUser.avatarPreset,
    });
  }, [currentUser]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isMenuOpen]);

  const joinedGroups = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    return getMemberGroups(allGroups, currentUser.userId);
  }, [allGroups, currentUser]);

  const sortedGroups = useMemo(() => {
    return sortGroupsForMyPage(joinedGroups, currentUser?.joinedGroupId ?? null);
  }, [currentUser?.joinedGroupId, joinedGroups]);

  const recentGroup = sortedGroups.find((group) => group.id === currentUser?.joinedGroupId) ?? null;
  const leaderGroups = currentUser
    ? sortedGroups.filter((group) => getGroupMembership(group, currentUser.userId)?.role === "팀장")
    : [];

  async function handleLogout() {
    setIsMenuOpen(false);
    await signOut();
    router.replace("/");
  }

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSavingProfile) {
      return;
    }

    setIsSavingProfile(true);

    try {
      const result = await updateProfile(profileForm);

      if (!result.ok) {
        setNotice({
          tone: "error",
          text: result.error,
        });
        return;
      }

      await syncCurrentUserProfile();
      setNotice({
        tone: "success",
        text: "프로필을 저장했어요.",
      });
      setIsEditingProfile(false);
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "프로필 저장 중 오류가 생겼어요.",
      });
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleDeleteAccount() {
    if (leaderGroups.length > 0 || isDeletingAccount) {
      return;
    }

    setIsDeletingAccount(true);

    try {
      const result = await deleteAccount();

      if (!result.ok) {
        setNotice({
          tone: "error",
          text: result.error,
        });
        return;
      }

      router.replace("/");
    } finally {
      setIsDeletingAccount(false);
      setIsDeleteDialogOpen(false);
    }
  }

  if (!isAuthReady || !currentUser) {
    return (
      <AppShell
        requireAuth={false}
        showNavigation={false}
        headerVariant="bare"
        title="마이페이지"
      >
        <LoadingState message="계정 상태를 확인하는 중입니다." />
      </AppShell>
    );
  }

  return (
    <>
      <AppShell
        requireAuth={false}
        showNavigation={false}
        headerVariant="bare"
        title="마이페이지"
      >
        <SectionCard
          title="내 계정"
          action={
            <div ref={menuRef} className="relative">
              <button
                type="button"
                aria-expanded={isMenuOpen}
                aria-haspopup="menu"
                onClick={() => setIsMenuOpen((previous) => !previous)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
              >
                <span className="sr-only">계정 메뉴 열기</span>
                <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 4.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
                  <path d="M10 11.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
                  <path d="M10 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
                </svg>
              </button>

              {isMenuOpen ? (
                <div className="absolute right-0 top-[calc(100%+10px)] z-30 w-44 rounded-[18px] border border-slate-200 bg-white p-2 shadow-[0_16px_34px_rgba(15,23,42,0.12)]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsEditingProfile(true);
                    }}
                    className="flex w-full items-center rounded-[14px] px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    프로필 편집
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void handleLogout();
                    }}
                    className="flex w-full items-center rounded-[14px] px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    로그아웃
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsDeleteDialogOpen(true);
                    }}
                    className="flex w-full items-center rounded-[14px] px-4 py-3 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                  >
                    회원 탈퇴
                  </button>
                </div>
              ) : null}
            </div>
          }
        >
          <div className="rounded-[26px] bg-[linear-gradient(145deg,#ffffff_0%,#eef8f2_52%,#e8f1ff_100%)] p-5">
            <div className="flex items-start gap-4">
              <ProfileAvatar
                name={currentUser.displayName}
                avatarPreset={currentUser.avatarPreset}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
                  {currentUser.displayName}
                </p>
                <p className="mt-1 truncate text-sm text-slate-500">{currentUser.email}</p>
                <p className="mt-3 text-sm leading-6 text-slate-700">{currentUser.bio}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[18px] bg-white/85 p-3">
                <p className="text-[11px] font-medium text-slate-500">참여 그룹</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {sortedGroups.length}개
                </p>
              </div>
              <div className="rounded-[18px] bg-white/85 p-3">
                <p className="text-[11px] font-medium text-slate-500">최근 사용</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                  {recentGroup ? recentGroup.name : "아직 없음"}
                </p>
              </div>
            </div>
          </div>

          {notice ? (
            <p
              className={`rounded-[16px] px-4 py-3 text-sm font-medium ${
                notice.tone === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {notice.text}
            </p>
          ) : null}

          <div className="flex gap-3">
            <Link
              href="/group-setup"
              className="inline-flex flex-1 items-center justify-center rounded-[16px] bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              그룹 추가하기
            </Link>
            <Link
              href={recentGroup ? `/group/${recentGroup.id}` : "/create"}
              className="inline-flex flex-1 items-center justify-center rounded-[16px] bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(121,184,149,0.22)] transition hover:brightness-[0.98]"
            >
              {recentGroup ? "최근 그룹 열기" : "첫 그룹 만들기"}
            </Link>
          </div>
        </SectionCard>

        <SectionCard title="내 그룹">
          {isLoading && sortedGroups.length === 0 ? (
            <p className="text-sm leading-6 text-[var(--ink-soft)]">
              참여 중인 그룹을 불러오는 중입니다.
            </p>
          ) : null}

          {!isLoading && sortedGroups.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-5">
              <p className="text-base font-semibold text-slate-900">아직 참여 중인 그룹이 없어요.</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                새 그룹을 만들거나 참여 코드로 그룹에 들어오면 여기서 한 번에 관리할 수 있어요.
              </p>
              <div className="mt-4 flex gap-3">
                <Link
                  href="/create"
                  className="inline-flex flex-1 items-center justify-center rounded-[16px] bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white"
                >
                  그룹 만들기
                </Link>
                <Link
                  href="/group-setup"
                  className="inline-flex flex-1 items-center justify-center rounded-[16px] bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  참여 코드 입력
                </Link>
              </div>
            </div>
          ) : null}

          {sortedGroups.map((group) => {
            const membership = getGroupMembership(group, currentUser.userId);

            if (!membership) {
              return null;
            }

            const isRecentGroup = group.id === currentUser.joinedGroupId;

            return (
              <div
                key={group.id}
                className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {group.subject}
                    </p>
                    <h3 className="mt-1 text-base font-semibold tracking-[-0.02em] text-slate-950">
                      {group.name}
                    </h3>
                  </div>
                  <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
                    {getGroupBadge(group)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-[18px] bg-slate-50 p-3">
                    <p className="text-[11px] font-medium text-slate-500">목표 날짜</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatExamDate(group.examDate)}
                    </p>
                  </div>
                  <div className="rounded-[18px] bg-slate-50 p-3">
                    <p className="text-[11px] font-medium text-slate-500">멤버 수</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {group.members.length}명
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                    내 역할 {membership.role}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                    가입 상태 {getMembershipStatus(group, isRecentGroup)}
                  </span>
                  {membership.role === "팀장" ? (
                    <span className="rounded-full bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700">
                      참여 코드 {createGroupJoinCode(group.id)}
                    </span>
                  ) : null}
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">{group.overallGoal}</p>

                <div className="mt-4 flex gap-3">
                  <Link
                    href={`/group/${group.id}`}
                    className="inline-flex flex-1 items-center justify-center rounded-[16px] bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white"
                  >
                    {group.status === "completed" ? "그룹 기록 보기" : "그룹 바로가기"}
                  </Link>
                  <Link
                    href="/group-setup"
                    className="inline-flex items-center justify-center rounded-[16px] bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
                  >
                    그룹 추가
                  </Link>
                </div>
              </div>
            );
          })}
        </SectionCard>
      </AppShell>

      {isEditingProfile ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/28 px-4 pb-4 pt-10">
          <div className="w-full max-w-[430px] rounded-[28px] bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
                  프로필 편집
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  이름, 소개, 아바타를 계정 기준으로 관리해요.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600"
              >
                <span className="sr-only">닫기</span>
                <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M7 7L17 17M17 7L7 17"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="1.8"
                  />
                </svg>
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleSaveProfile}>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-800">닉네임</span>
                <input
                  required
                  value={profileForm.displayName}
                  onChange={(event) =>
                    setProfileForm((previous) => ({
                      ...previous,
                      displayName: event.target.value,
                    }))
                  }
                  className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-800">자기소개</span>
                <textarea
                  rows={4}
                  value={profileForm.bio}
                  onChange={(event) =>
                    setProfileForm((previous) => ({
                      ...previous,
                      bio: event.target.value,
                    }))
                  }
                  className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
                />
              </label>

              <div className="space-y-2">
                <span className="text-sm font-semibold text-slate-800">아바타</span>
                <div className="grid grid-cols-2 gap-3">
                  {avatarPresetOptions.map((option) => {
                    const active = profileForm.avatarPreset === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setProfileForm((previous) => ({
                            ...previous,
                            avatarPreset: option.value,
                          }))
                        }
                        className={`flex items-center gap-3 rounded-[18px] border px-3 py-3 text-left transition ${
                          active
                            ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <ProfileAvatar
                          name={profileForm.displayName || currentUser.displayName}
                          avatarPreset={option.value}
                          size="sm"
                        />
                        <span className="text-sm font-semibold text-slate-800">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="inline-flex flex-1 items-center justify-center rounded-[16px] bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="inline-flex flex-1 items-center justify-center rounded-[16px] bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
                >
                  {isSavingProfile ? "저장 중..." : "저장하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isDeleteDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/32 px-4">
          <div className="w-full max-w-sm rounded-[28px] bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
              회원 탈퇴
            </h2>

            {leaderGroups.length > 0 ? (
              <>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  팀장으로 남아 있는 그룹이 있어서 지금은 탈퇴할 수 없어요. 먼저 권한을
                  위임하거나 그룹을 정리한 뒤 다시 시도해 주세요.
                </p>
                <div className="mt-3 rounded-[18px] bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                  {leaderGroups.map((group) => group.name).join(", ")}
                </div>
                <div className="mt-5 flex gap-3">
                  <Link
                    href="/group-setup"
                    onClick={() => setIsDeleteDialogOpen(false)}
                    className="inline-flex flex-1 items-center justify-center rounded-[16px] bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
                  >
                    그룹 확인하기
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsDeleteDialogOpen(false)}
                    className="inline-flex flex-1 items-center justify-center rounded-[16px] bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white"
                  >
                    확인
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  계정 정보와 참여 멤버십이 정리되고 바로 로그아웃돼요. 이 동작은 되돌릴 수
                  없어요.
                </p>
                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDeleteDialogOpen(false)}
                    className="inline-flex flex-1 items-center justify-center rounded-[16px] bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void handleDeleteAccount();
                    }}
                    disabled={isDeletingAccount}
                    className="inline-flex flex-1 items-center justify-center rounded-[16px] bg-rose-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
                  >
                    {isDeletingAccount ? "처리 중..." : "탈퇴하기"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
