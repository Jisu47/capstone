"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { AppShell, SectionCard } from "@/components/mobile-shell";
import { usePrototype } from "@/components/prototype-provider";
import { getMemberGroups } from "@/lib/group-membership";
import { formatExamDate, getDaysLeft, type StudyGroup } from "@/lib/mock-data";

function sortGroupsByStatusAndExamDate(groups: StudyGroup[]) {
  return [...groups].sort((left, right) => {
    if (left.status !== right.status) {
      return left.status === "active" ? -1 : 1;
    }

    if (left.status === "completed" && right.status === "completed") {
      return right.examDate.localeCompare(left.examDate);
    }

    return getDaysLeft(left.examDate) - getDaysLeft(right.examDate);
  });
}

function getGroupStatusLabel(group: StudyGroup) {
  if (group.status === "completed") {
    return "운영 종료";
  }

  const daysLeft = getDaysLeft(group.examDate);
  return daysLeft === 0 ? "D-day" : `D-${daysLeft}`;
}

function SplashLogoMark() {
  return (
    <div className="flex h-44 w-44 items-center justify-center rounded-[30px] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,250,246,0.92))] shadow-[0_28px_60px_rgba(121,184,149,0.16)]">
      <Image
        src="/logo-study.png"
        alt="Study logo"
        width={132}
        height={132}
        className="h-32 w-32 object-contain drop-shadow-[0_10px_24px_rgba(121,184,149,0.14)]"
        priority
      />
    </div>
  );
}

function SplashScreen() {
  return (
    <main className="flex min-h-dvh flex-col overflow-x-hidden bg-[var(--background)] text-slate-900">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-1 flex-col px-6 pb-10 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span className="font-semibold tracking-[0.24em] text-slate-600">STUDY FLOW</span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          <SplashLogoMark />

          <div className="mt-8 text-center">
            <p className="font-[family:var(--font-study-display)] text-[56px] leading-none tracking-[0.06em] text-slate-950">
              STUDY
            </p>
            <p className="mt-3 text-sm tracking-[0.12em] text-slate-500">
              필요한 스터디 흐름을 바로 시작해 보세요.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-full bg-[var(--brand)] px-6 py-4 text-base font-semibold text-white shadow-[0_18px_36px_rgba(121,184,149,0.26)] transition hover:brightness-[0.98]"
          >
            로그인 시작하기
          </Link>

          <div className="flex items-center justify-center gap-3 text-sm text-slate-500">
            <Link href="/signup" className="font-medium text-[var(--brand)] transition hover:brightness-90">
              계정 만들기
            </Link>
            <span className="text-slate-300">|</span>
            <span>아이디 비밀번호 찾기</span>
          </div>
        </div>
      </div>
    </main>
  );
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

function ArrowRightIcon() {
  return (
    <svg aria-hidden="true" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24">
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

function MaterialIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M3.75 8.5A1.75 1.75 0 0 1 5.5 6.75h4.12l1.45 1.75h7.43A1.75 1.75 0 0 1 20.25 10v7.25A1.75 1.75 0 0 1 18.5 19H5.5a1.75 1.75 0 0 1-1.75-1.75V8.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M6.75 6.25h10.5A1.75 1.75 0 0 1 19 8v6.5a1.75 1.75 0 0 1-1.75 1.75h-5l-3.75 2v-2H6.75A1.75 1.75 0 0 1 5 14.5V8a1.75 1.75 0 0 1 1.75-1.75Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function BookOpenIcon() {
  return (
    <svg aria-hidden="true" className="h-10 w-10" fill="none" viewBox="0 0 24 24">
      <path
        d="M4.75 6.75A1.75 1.75 0 0 1 6.5 5h4a3 3 0 0 1 1.5.4 3 3 0 0 1 1.5-.4h4A1.75 1.75 0 0 1 19.25 6.75v10.5A1.75 1.75 0 0 1 17.5 19h-4a3 3 0 0 0-1.5.4 3 3 0 0 0-1.5-.4h-4a1.75 1.75 0 0 1-1.75-1.75V6.75Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path
        d="M12 5.4v14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function HomeHeader({ totalCount }: Readonly<{ totalCount: number }>) {
  return (
    <section className="min-w-0 space-y-5">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex rounded-full bg-[linear-gradient(180deg,#F4FBF6_0%,#EBF6EE_100%)] px-5 py-2.5 text-[12px] font-semibold tracking-[0.12em] text-[#2D6B46] shadow-[0_8px_24px_rgba(76,175,122,0.10)]"
        >
          STUDY FLOW
        </Link>

        <div className="flex min-w-0 items-center gap-2">
          <div className="rounded-full bg-[linear-gradient(180deg,#F4FBF6_0%,#EBF6EE_100%)] px-4 py-2.5 text-[13px] font-semibold text-[#4CAF7A] shadow-[0_8px_24px_rgba(76,175,122,0.10)]">
            내 그룹 {totalCount}개
          </div>
          <Link
            href="/mypage"
            aria-label="마이페이지로 이동"
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition hover:translate-y-[-1px]"
          >
            <NotificationBellIcon />
          </Link>
        </div>
      </div>

      <h1 className="min-w-0 whitespace-normal break-keep break-words font-[family:var(--font-study-display)] text-[34px] leading-none tracking-[-0.06em] text-slate-950">
        그룹 선택
      </h1>
    </section>
  );
}

function IllustrationPlaceholder() {
  return (
    <div className="flex w-full items-center justify-center rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.54),rgba(255,255,255,0.2))] px-6 py-8 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)]">
      <div className="flex w-full max-w-[220px] flex-col items-center gap-4 rounded-[28px] bg-white/85 px-6 py-7 shadow-[0_16px_36px_rgba(76,175,122,0.10)]">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(180deg,#F2FBF5_0%,#EAF6EE_100%)] text-[#4CAF7A]">
          <BookOpenIcon />
        </div>
        <div className="space-y-1 text-center">
          <p className="text-sm font-semibold text-slate-700">일러스트 영역</p>
          <p className="text-xs text-slate-400">추후 SVG 또는 PNG 삽입 예정</p>
        </div>
      </div>
    </div>
  );
}

function HeroActionCard({
  href,
  title,
  description,
  strong = false,
}: Readonly<{
  href: string;
  title: string;
  description: string;
  strong?: boolean;
}>) {
  return (
    <Link
      href={href}
      className={`flex min-w-0 w-full flex-col rounded-[28px] px-6 py-6 transition ${
        strong
          ? "bg-[linear-gradient(135deg,#7AC595_0%,#4CAF7A_100%)] text-white shadow-[0_18px_34px_rgba(76,175,122,0.20)] hover:brightness-[0.99]"
          : "bg-white text-slate-900 shadow-[0_8px_30px_rgba(15,23,42,0.05)] hover:translate-y-[-1px]"
      }`}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full ${
          strong ? "bg-white/16 text-white" : "bg-[rgba(76,175,122,0.08)] text-[#4CAF7A]"
        }`}
      >
        <MembersIcon />
      </div>

      <div className="mt-7 min-w-0">
        <p className="min-w-0 whitespace-normal break-keep break-words text-[18px] font-semibold tracking-[-0.03em]">
          {title}
        </p>
        <p className={`mt-3 min-w-0 whitespace-normal break-keep break-words text-sm leading-7 ${strong ? "text-white/82" : "text-slate-500"}`}>
          {description}
        </p>
      </div>

      <div className="mt-6 flex justify-end">
        <span
          className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${
            strong ? "bg-white/92 text-[#4CAF7A]" : "bg-[#F7FBF8] text-slate-700"
          }`}
        >
          <ArrowRightIcon />
        </span>
      </div>
    </Link>
  );
}

function GroupInfoCard({
  icon,
  label,
  value,
}: Readonly<{
  icon: ReactNode;
  label: string;
  value: string;
}>) {
  return (
    <div className="min-w-0 rounded-[22px] bg-[#FBFDFC] px-4 py-4 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.04)]">
      <div className="flex min-w-0 items-center gap-2 text-[12px] font-medium text-slate-500">
        <span className="shrink-0 text-[#69B486]">{icon}</span>
        <span className="min-w-0 whitespace-normal break-keep break-words">{label}</span>
      </div>
      <p className="mt-3 min-w-0 whitespace-normal break-keep break-words text-[18px] font-semibold tracking-[-0.03em] text-slate-950">
        {value}
      </p>
    </div>
  );
}

function NextGroupCard({
  group,
  onOpen,
}: Readonly<{
  group: StudyGroup;
  onOpen: (groupId: string) => void;
}>) {
  return (
    <article className="min-w-0 rounded-[30px] bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
      <div className="min-w-0 space-y-6">
        <div className="min-w-0 space-y-4">
          <p className="text-[12px] font-semibold tracking-[0.18em] text-[#74B98D]">NEXT GROUP</p>

          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h2 className="min-w-0 whitespace-normal break-keep break-words text-[28px] font-semibold tracking-[-0.05em] text-slate-950">
              {group.name}
            </h2>
            <span className="rounded-full bg-[var(--brand-soft)] px-4 py-2 text-sm font-semibold text-[#4CAF7A]">
              {getGroupStatusLabel(group)}
            </span>
          </div>

          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex min-w-0 items-center gap-3">
              <span className="shrink-0 text-slate-400">
                <MembersIcon />
              </span>
              <span className="min-w-0 whitespace-normal break-keep break-words">{group.subject}</span>
            </div>
            <div className="flex min-w-0 items-center gap-3">
              <span className="shrink-0 text-slate-400">
                <MessageIcon />
              </span>
              <span className="min-w-0 whitespace-normal break-keep break-words">{group.recentUpdate}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[radial-gradient(circle_at_center,rgba(121,184,149,0.12),transparent_72%)]">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[linear-gradient(180deg,#F7FBF8_0%,#EEF7F1_100%)] text-[#76B98E] shadow-[inset_0_0_0_1px_rgba(121,184,149,0.08)]">
              <BookOpenIcon />
            </div>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-3 min-[390px]:grid-cols-3">
          <GroupInfoCard icon={<CalendarIcon />} label="목표 날짜" value={formatExamDate(group.examDate)} />
          <GroupInfoCard icon={<MembersIcon />} label="팀원 수" value={`${group.members.length}명`} />
          <GroupInfoCard icon={<MaterialIcon />} label="자료 수" value={`${group.materials.length}개`} />
        </div>

        <div className="flex min-w-0 flex-col gap-3 min-[390px]:flex-row min-[390px]:items-center min-[390px]:justify-between">
          <p className="min-w-0 whitespace-normal break-keep break-words text-sm font-medium text-slate-500">
            그룹 홈부터 바로 이어서 들어가기
          </p>
          <button
            type="button"
            onClick={() => onOpen(group.id)}
            className="inline-flex w-full items-center justify-center gap-3 rounded-[18px] bg-[linear-gradient(135deg,#7AC595_0%,#4CAF7A_100%)] px-6 py-4 text-lg font-semibold text-white shadow-[0_18px_34px_rgba(76,175,122,0.20)] transition hover:brightness-[0.99] min-[390px]:w-auto"
          >
            <span>들어가기</span>
            <ArrowRightIcon />
          </button>
        </div>
      </div>
    </article>
  );
}

function ActiveGroupCard({
  group,
  onOpen,
}: Readonly<{
  group: StudyGroup;
  onOpen: (groupId: string) => void;
}>) {
  return (
    <article className="min-w-0 rounded-[28px] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex min-w-0 flex-col gap-3 min-[390px]:flex-row min-[390px]:items-start min-[390px]:justify-between">
          <div className="min-w-0">
            <p className="text-[12px] font-semibold tracking-[0.08em] text-slate-400">{group.subject}</p>
            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="min-w-0 whitespace-normal break-keep break-words text-[22px] font-semibold tracking-[-0.04em] text-slate-950">
                {group.name}
              </h3>
              <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[#4CAF7A]">
                {getGroupStatusLabel(group)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpen(group.id)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] bg-white px-4 py-3 text-sm font-semibold text-[#4CAF7A] shadow-[inset_0_0_0_1px_rgba(76,175,122,0.22)] min-[390px]:w-auto"
          >
            <span>그룹 바로가기</span>
            <ArrowRightIcon />
          </button>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-3 min-[390px]:grid-cols-3">
          <GroupInfoCard icon={<CalendarIcon />} label="목표 날짜" value={formatExamDate(group.examDate)} />
          <GroupInfoCard icon={<MembersIcon />} label="팀원 수" value={`${group.members.length}명`} />
          <GroupInfoCard icon={<MaterialIcon />} label="자료 수" value={`${group.materials.length}개`} />
        </div>
      </div>
    </article>
  );
}

function ArchivedGroupCard({
  group,
  onOpen,
}: Readonly<{
  group: StudyGroup;
  onOpen: (groupId: string) => void;
}>) {
  return (
    <button
      type="button"
      onClick={() => onOpen(group.id)}
      className="flex min-w-0 w-full items-start gap-4 rounded-[28px] bg-white px-5 py-5 text-left shadow-[0_8px_30px_rgba(15,23,42,0.05)] transition hover:translate-y-[-1px]"
    >
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#F3F6FA_0%,#E7EDF4_100%)] text-slate-500">
        <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24">
          <path
            d="M4.5 9.5 12 5l7.5 4.5L12 14 4.5 9.5ZM7.5 11.5V15c0 .8 2 2.5 4.5 2.5s4.5-1.7 4.5-2.5v-3.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
        </svg>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#F6F7F8] px-3 py-1 text-xs font-semibold text-slate-500">
            {group.subject}
          </span>
          <span className="rounded-full bg-[#F3F5F7] px-3 py-1 text-xs font-semibold text-slate-500">
            운영 종료
          </span>
        </div>

        <p className="mt-3 min-w-0 whitespace-normal break-keep break-words text-[20px] font-semibold tracking-[-0.04em] text-slate-950">
          {group.name}
        </p>

        <div className="mt-3 flex min-w-0 flex-col gap-2 text-sm text-slate-500 min-[390px]:flex-row min-[390px]:items-center min-[390px]:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0">
              <CalendarIcon />
            </span>
            <span className="min-w-0 whitespace-normal break-keep break-words">
              마지막 목표 날짜 {formatExamDate(group.examDate)}
            </span>
          </div>
          <span className="shrink-0">{group.members.length}명</span>
        </div>
      </div>

      <div className="shrink-0 pt-1 text-slate-400">
        <ArrowRightIcon />
      </div>
    </button>
  );
}

function EmptyGroupState() {
  return (
    <SectionCard title="내 그룹">
      <div className="rounded-[28px] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
        <p className="text-[20px] font-semibold tracking-[-0.03em] text-slate-950">
          아직 참여 중인 그룹이 없어요.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          새 그룹을 만들거나 참여 코드로 합류하면 여기에서 바로 이어서 들어갈 수 있어요.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3">
          <Link
            href="/create"
            className="inline-flex items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#7AC595_0%,#4CAF7A_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(76,175,122,0.20)]"
          >
            새 그룹 만들기
          </Link>
          <Link
            href="/group-setup"
            className="inline-flex items-center justify-center rounded-[18px] bg-[#F5F7F6] px-5 py-3 text-sm font-semibold text-slate-700"
          >
            그룹 참여하기
          </Link>
        </div>
      </div>
    </SectionCard>
  );
}

function AuthenticatedHome() {
  const { allGroups, isLoading } = usePrototype();
  const { currentUser, sessionName } = useAuth();
  const router = useRouter();
  const memberGroups = currentUser ? getMemberGroups(allGroups, currentUser.userId) : [];
  const sortedGroups = sortGroupsByStatusAndExamDate(memberGroups);
  const activeGroups = sortedGroups.filter((group) => group.status === "active");
  const completedGroups = sortedGroups.filter((group) => group.status === "completed");
  const featuredGroup = activeGroups[0] ?? null;
  const otherActiveGroups = activeGroups.slice(1);
  const recentGroupId = currentUser?.joinedGroupId ?? featuredGroup?.id ?? null;
  const displayName = currentUser?.displayName ?? sessionName ?? "스터디 메이트";

  return (
    <AppShell
      requireAuth={false}
      showNavigation
      navReady={Boolean(recentGroupId)}
      navGroupId={recentGroupId}
      headerBehavior="fixed"
      headerVariant="bare"
      title="그룹 선택"
      headerContent={<HomeHeader totalCount={sortedGroups.length} />}
    >
      <section className="min-w-0 rounded-[32px] bg-[linear-gradient(135deg,#F7FCF8_0%,#EEF8F1_45%,#FBFDFB_100%)] px-5 py-6 shadow-[0_10px_36px_rgba(76,175,122,0.10)] sm:px-6">
        <div className="flex min-w-0 flex-col gap-6">
          <h2 className="min-w-0 whitespace-normal break-keep break-words text-[30px] font-semibold leading-[1.25] tracking-[-0.055em] text-slate-950">
            {displayName}님, 어디부터 들어갈까요?
          </h2>

          <IllustrationPlaceholder />

          <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
            <HeroActionCard
              href="/create"
              title="새 그룹 만들기"
              description="내 목표 날짜와 팀 방향을 설정해보세요."
              strong
            />
            <HeroActionCard
              href="/group-setup"
              title="그룹 참여하기"
              description="참여 코드로 기존 그룹에 합류하세요."
            />
          </div>
        </div>
      </section>

      {isLoading && sortedGroups.length === 0 ? (
        <SectionCard title="그룹 불러오는 중">
          <p className="text-sm leading-6 text-[var(--ink-soft)]">
            참여 중인 스터디 그룹을 정리하고 있어요.
          </p>
        </SectionCard>
      ) : null}

      {!isLoading && sortedGroups.length === 0 ? <EmptyGroupState /> : null}

      {featuredGroup ? (
        <NextGroupCard
          group={featuredGroup}
          onOpen={(groupId) => {
            router.push(`/group/${groupId}`);
          }}
        />
      ) : null}

      {otherActiveGroups.length > 0 ? (
        <section className="space-y-4">
          <h3 className="px-1 text-[22px] font-semibold tracking-[-0.04em] text-slate-950">
            다른 진행 중인 그룹
          </h3>
          {otherActiveGroups.map((group) => (
            <ActiveGroupCard
              key={group.id}
              group={group}
              onOpen={(groupId) => {
                router.push(`/group/${groupId}`);
              }}
            />
          ))}
        </section>
      ) : null}

      {completedGroups.length > 0 ? (
        <section className="space-y-4">
          <h3 className="px-1 text-[22px] font-semibold tracking-[-0.04em] text-slate-950">
            보관된 그룹
          </h3>
          {completedGroups.map((group) => (
            <ArchivedGroupCard
              key={group.id}
              group={group}
              onOpen={(groupId) => {
                router.push(`/group/${groupId}`);
              }}
            />
          ))}
        </section>
      ) : null}
    </AppShell>
  );
}

export function StudyEntryScreen() {
  const { isAuthReady, sessionName } = useAuth();

  if (!isAuthReady || !sessionName) {
    return <SplashScreen />;
  }

  return <AuthenticatedHome />;
}
