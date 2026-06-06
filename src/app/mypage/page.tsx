"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { type UpdateProfileInput, useAuth } from "@/components/auth-provider";
import { AppShell, LoadingState } from "@/components/mobile-shell";
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

function NotificationBellIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M14.25 19.5a2.25 2.25 0 0 1-4.5 0M6 9.75a6 6 0 1 1 12 0v4.04c0 .52.21 1.02.59 1.38l.57.57a.75.75 0 0 1-.53 1.28H5.37a.75.75 0 0 1-.53-1.28l.57-.57A1.95 1.95 0 0 0 6 13.79V9.75Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M7 10L12 15L17 10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 5V19M5 12H19"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M3.75 8.5A1.75 1.75 0 0 1 5.5 6.75h4.12l1.45 1.75h7.43A1.75 1.75 0 0 1 20.25 10v7.25A1.75 1.75 0 0 1 18.5 19H5.5a1.75 1.75 0 0 1-1.75-1.75V8.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function BookGroupIcon() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
      <path
        d="M7.75 5.25h8.5A1.75 1.75 0 0 1 18 7v10.5a1.25 1.25 0 0 1-1.25 1.25h-9A2.75 2.75 0 0 1 5 16V8A2.75 2.75 0 0 1 7.75 5.25Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M7.5 8.25h7M7.5 11.5h7M7.5 14.75h4.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function TrophyGroupIcon() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
      <path
        d="M8 5.75h8v2.5a4 4 0 0 1-8 0v-2.5ZM9.5 18.25h5M12 14.25v4M6.75 7.25H5.5a1.75 1.75 0 0 0 0 3.5H8M17.25 7.25h1.25a1.75 1.75 0 0 1 0 3.5H16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M7 4.75v2.5M17 4.75v2.5M5.5 8.25h13M6.75 6.25h10.5A1.75 1.75 0 0 1 19 8v9.25A1.75 1.75 0 0 1 17.25 19H6.75A1.75 1.75 0 0 1 5 17.25V8A1.75 1.75 0 0 1 6.75 6.25Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function MembersIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M9 10.5a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5ZM16.5 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5ZM4.5 18a4.5 4.5 0 0 1 9 0M14 18a3.5 3.5 0 0 1 6.5-1.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M5.25 9.5L8.5 13l3.5-5 3.5 5 3.25-3.5 1.25 8.25H4l1.25-8.25Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function StatusIcon() {
  return <span className="h-2.5 w-2.5 rounded-full bg-[#8FD3A7]" aria-hidden="true" />;
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M9.75 9.75h8.5v8.5h-8.5zM5.75 5.75h8.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M5.75 5.75v8.5h2.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M9 6L15 12L9 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function MetricInfoCard({
  icon,
  label,
  value,
}: Readonly<{
  icon: React.ReactNode;
  label: string;
  value: string;
}>) {
  return (
    <div className="min-w-0 rounded-[20px] bg-white px-3.5 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] bg-[#F4FBF6] text-[#4CAF7A]">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[12px] font-medium text-slate-500">{label}</p>
          <p className="mt-1 truncate text-[18px] font-semibold tracking-[-0.03em] text-slate-950">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function GroupInfoItem({
  icon,
  label,
  value,
}: Readonly<{
  icon: React.ReactNode;
  label: string;
  value: string;
}>) {
  return (
    <div className="min-w-0 rounded-[18px] bg-[#FBFDFC] px-3 py-3 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.04)]">
      <div className="flex min-w-0 items-center gap-2 text-[12px] font-medium text-slate-500">
        <div className="shrink-0 text-[#69B68A]">{icon}</div>
        <p className="truncate">{label}</p>
      </div>
      <p className="mt-2 min-w-0 whitespace-normal text-[15px] font-semibold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function HeroIllustration() {
  return (
    <div className="mx-auto flex h-[132px] w-[132px] max-w-[140px] items-center justify-center rounded-[24px] bg-white/65 shadow-[0_10px_24px_rgba(76,175,122,0.08)]">
      <Image
        src="/hero-study-illustration.svg"
        alt=""
        aria-hidden="true"
        width={132}
        height={132}
        className="h-[132px] w-[132px] object-contain"
      />
    </div>
  );
}

export default function MyPage() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { allGroups, isLoading, syncCurrentUserProfile } = usePrototype();
  const { isAuthReady, currentUser, updateProfile, signOut, deleteAccount } = useAuth();
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
  const navGroupId = recentGroup?.id ?? sortedGroups[0]?.id ?? null;

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

  async function handleCopyJoinCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setNotice({
        tone: "success",
        text: "참여 코드를 복사했어요.",
      });
    } catch {
      setNotice({
        tone: "error",
        text: "참여 코드 복사에 실패했어요. 다시 시도해 주세요.",
      });
    }
  }

  const headerContent = (
    <div className="flex min-w-0 items-center justify-between gap-3 px-1 py-1">
      <Link
        href="/"
        className="inline-flex h-10 items-center rounded-full bg-[linear-gradient(180deg,#F4FBF6_0%,#EBF6EE_100%)] px-4 text-[12px] font-semibold tracking-[0.08em] text-[#2D6B46] shadow-[0_8px_20px_rgba(76,175,122,0.08)]"
      >
        STUDY FLOW
      </Link>

      <div ref={menuRef} className="relative shrink-0">
        <button
          type="button"
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          onClick={() => setIsMenuOpen((previous) => !previous)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition hover:translate-y-[-1px]"
        >
          <span className="sr-only">계정 메뉴 열기</span>
          <NotificationBellIcon />
        </button>

        {isMenuOpen ? (
          <div className="absolute right-0 top-[calc(100%+10px)] z-30 w-44 rounded-[20px] bg-white p-2 shadow-[0_18px_42px_rgba(15,23,42,0.14)]">
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
    </div>
  );

  if (!isAuthReady || !currentUser) {
    return (
      <AppShell
        requireAuth={false}
        showNavigation
        navReady={false}
        navGroupId={null}
        headerBehavior="fixed"
        title="마이페이지"
        headerContent={headerContent}
      >
        <LoadingState message="계정 상태를 확인하는 중입니다." />
      </AppShell>
    );
  }

  return (
    <>
      <AppShell
        requireAuth={false}
        showNavigation
        navReady={Boolean(navGroupId)}
        navGroupId={navGroupId}
        headerBehavior="fixed"
        title="마이페이지"
        headerContent={headerContent}
      >
        <div className="space-y-5">
          <section className="space-y-6">
            <h1 className="mt-6 mb-6 min-w-0 whitespace-normal text-[32px] font-[family:var(--font-study-display)] font-extrabold leading-[1.2] tracking-[-0.05em] text-slate-950">
              마이페이지
            </h1>

            <section className="rounded-[28px] bg-[linear-gradient(135deg,#F6FBF7_0%,#ECF7EF_45%,#F8FCF9_100%)] px-6 py-6 shadow-[0_12px_34px_rgba(76,175,122,0.10)]">
              <div className="space-y-5">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="rounded-[24px] bg-[linear-gradient(135deg,#7FCB95_0%,#4CAF7A_100%)] p-[3px] shadow-[0_12px_24px_rgba(76,175,122,0.16)]">
                    <div className="rounded-[21px] bg-white/12 p-1">
                      <ProfileAvatar
                        name={currentUser.displayName}
                        avatarPreset={currentUser.avatarPreset}
                        size="lg"
                      />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 pt-1">
                    <h2 className="truncate text-[24px] font-extrabold tracking-[-0.04em] text-slate-950">
                      {currentUser.displayName}
                    </h2>
                    <p className="mt-1 truncate text-[14px] text-slate-500">{currentUser.email}</p>
                    <p className="mt-3 line-clamp-2 text-[15px] leading-[1.5] text-slate-700">
                      {currentUser.bio}
                    </p>
                  </div>
                </div>

                <HeroIllustration />

                <div className="grid min-w-0 grid-cols-2 gap-3">
                  <MetricInfoCard
                    icon={<MembersIcon />}
                    label="참여 그룹 수"
                    value={`${sortedGroups.length}개`}
                  />
                  <MetricInfoCard
                    icon={<FolderIcon />}
                    label="최근 사용 그룹"
                    value={recentGroup ? recentGroup.name : "아직 없음"}
                  />
                </div>
              </div>
            </section>

            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/group-setup"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-[18px] bg-white px-4 text-[16px] font-bold text-slate-900 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition hover:translate-y-[-1px]"
              >
                <PlusIcon />
                <span className="whitespace-nowrap">그룹 추가하기</span>
              </Link>
              <Link
                href={recentGroup ? `/group/${recentGroup.id}` : "/create"}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-[18px] bg-[linear-gradient(135deg,#67B884_0%,#4CAF7A_100%)] px-4 text-[16px] font-bold text-white shadow-[0_16px_30px_rgba(76,175,122,0.18)] transition hover:brightness-[0.98]"
              >
                <FolderIcon />
                <span className="whitespace-nowrap">최근 그룹 열기</span>
              </Link>
            </div>
          </section>

          {notice ? (
            <div
              className={`rounded-[18px] px-4 py-3 text-sm font-medium shadow-[0_8px_20px_rgba(15,23,42,0.05)] ${
                notice.tone === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {notice.text}
            </div>
          ) : null}

          <section className="space-y-4">
            <div className="mt-8 flex items-center justify-between gap-3 px-1">
              <h2 className="text-[22px] font-semibold tracking-[-0.04em] text-slate-950">내 그룹</h2>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-[0_8px_22px_rgba(15,23,42,0.06)]"
              >
                <span>최신순</span>
                <ChevronDownIcon />
              </button>
            </div>

            {isLoading && sortedGroups.length === 0 ? (
              <div className="rounded-[28px] bg-white px-5 py-6 text-sm leading-6 text-slate-500 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
                참여 중인 그룹을 불러오는 중입니다.
              </div>
            ) : null}

            {!isLoading && sortedGroups.length === 0 ? (
              <div className="rounded-[30px] bg-white px-5 py-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
                <p className="text-[20px] font-semibold tracking-[-0.03em] text-slate-950">
                  아직 참여 중인 그룹이 없어요
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  새 그룹을 만들거나 참여 코드로 들어오면 여기에서 바로 관리할 수 있어요.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Link
                    href="/create"
                    className="inline-flex items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#67B884_0%,#4CAF7A_100%)] px-4 py-3 text-sm font-semibold text-white"
                  >
                    그룹 만들기
                  </Link>
                  <Link
                    href="/group-setup"
                    className="inline-flex items-center justify-center rounded-[18px] bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
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
              const joinCode = createGroupJoinCode(group.id);
              const showJoinCode = membership.role === "팀장";
              const isCompleted = group.status === "completed";

              return (
                <article
                  key={group.id}
                  className="rounded-[28px] bg-white p-[22px] shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
                >
                  <div className="flex min-w-0 flex-col gap-4">
                    <div className="flex min-w-0 items-start gap-4">
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] ${
                          isCompleted
                            ? "bg-[linear-gradient(135deg,#FFD36A_0%,#FFB536_100%)] text-white"
                            : "bg-[linear-gradient(135deg,#D9D7FF_0%,#B6BBFF_100%)] text-white"
                        }`}
                      >
                        {isCompleted ? <TrophyGroupIcon /> : <BookGroupIcon />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-semibold tracking-[0.08em] text-slate-400">
                          {group.subject}
                        </p>

                        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
                          <h3 className="min-w-0 whitespace-normal text-[20px] font-semibold tracking-[-0.04em] text-slate-950">
                            {group.name}
                          </h3>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              isCompleted
                                ? "bg-slate-100 text-slate-600"
                                : "bg-[rgba(76,175,122,0.14)] text-[#4CAF7A]"
                            }`}
                          >
                            {getGroupBadge(group)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 min-[390px]:flex-row min-[390px]:items-center min-[390px]:justify-between">
                      <Link
                        href={`/group/${group.id}`}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-[16px] bg-white px-4 text-sm font-semibold text-[#4CAF7A] shadow-[inset_0_0_0_1px_rgba(76,175,122,0.22)] transition hover:bg-[#F7FBF8] min-[390px]:self-start"
                      >
                        <span>{isCompleted ? "그룹 기록 보기" : "그룹 바로가기"}</span>
                        <ArrowRightIcon />
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <GroupInfoItem
                        icon={<CalendarIcon />}
                        label="목표 날짜"
                        value={formatExamDate(group.examDate)}
                      />
                      <GroupInfoItem
                        icon={<MembersIcon />}
                        label="멤버 수"
                        value={`${group.members.length}명`}
                      />
                      <GroupInfoItem
                        icon={<CrownIcon />}
                        label="내 역할"
                        value={membership.role}
                      />
                      <GroupInfoItem
                        icon={<StatusIcon />}
                        label="가입 상태"
                        value={getMembershipStatus(group, isRecentGroup)}
                      />
                    </div>

                    {showJoinCode ? (
                      <div className="flex h-14 items-center justify-between gap-3 rounded-[18px] bg-[#F7FAF8] px-4">
                        <div className="min-w-0">
                          <p className="text-[12px] font-medium text-slate-500">참여 코드</p>
                          <p className="mt-0.5 truncate text-[16px] font-semibold tracking-[-0.03em] text-[#3E9A65]">
                            {joinCode}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            void handleCopyJoinCode(joinCode);
                          }}
                          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-white px-3 text-sm font-semibold text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.06)]"
                        >
                          <CopyIcon />
                          <span>복사</span>
                        </button>
                      </div>
                    ) : null}

                    {group.overallGoal.trim() ? (
                      <div className="rounded-[18px] bg-[linear-gradient(135deg,#F4F9FF_0%,#F1F9F4_100%)] px-4 py-4 text-sm leading-[1.5] text-slate-700">
                        {group.overallGoal}
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </section>
        </div>
      </AppShell>

      {isEditingProfile ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/28 px-4 pb-4 pt-10">
          <div className="w-full max-w-[430px] rounded-[30px] bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
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
                  className="w-full rounded-[18px] bg-white px-4 py-3 text-sm outline-none shadow-[inset_0_0_0_1px_rgba(148,163,184,0.18)] transition focus:ring-4 focus:ring-[rgba(76,175,122,0.16)]"
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
                  className="w-full rounded-[18px] bg-white px-4 py-3 text-sm outline-none shadow-[inset_0_0_0_1px_rgba(148,163,184,0.18)] transition focus:ring-4 focus:ring-[rgba(76,175,122,0.16)]"
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
                        className={`flex items-center gap-3 rounded-[18px] px-3 py-3 text-left transition ${
                          active
                            ? "bg-[var(--brand-soft)] shadow-[inset_0_0_0_1px_rgba(76,175,122,0.22)]"
                            : "bg-white shadow-[inset_0_0_0_1px_rgba(148,163,184,0.18)]"
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
                  className="inline-flex flex-1 items-center justify-center rounded-[18px] bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="inline-flex flex-1 items-center justify-center rounded-[18px] bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
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
          <div className="w-full max-w-sm rounded-[30px] bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">회원 탈퇴</h2>

            {leaderGroups.length > 0 ? (
              <>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  팀장으로 남아 있는 그룹이 있어 지금은 탈퇴할 수 없어요. 먼저 권한을 위임하거나
                  그룹을 정리한 뒤 다시 시도해 주세요.
                </p>
                <div className="mt-3 rounded-[18px] bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                  {leaderGroups.map((group) => group.name).join(", ")}
                </div>
                <div className="mt-5 flex gap-3">
                  <Link
                    href="/group-setup"
                    onClick={() => setIsDeleteDialogOpen(false)}
                    className="inline-flex flex-1 items-center justify-center rounded-[18px] bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
                  >
                    그룹 확인하기
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsDeleteDialogOpen(false)}
                    className="inline-flex flex-1 items-center justify-center rounded-[18px] bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white"
                  >
                    확인
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  계정 정보와 참여 멤버십이 정리되고 바로 로그아웃돼요. 이 동작은 되돌릴 수 없어요.
                </p>
                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDeleteDialogOpen(false)}
                    className="inline-flex flex-1 items-center justify-center rounded-[18px] bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void handleDeleteAccount();
                    }}
                    disabled={isDeletingAccount}
                    className="inline-flex flex-1 items-center justify-center rounded-[18px] bg-rose-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
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
