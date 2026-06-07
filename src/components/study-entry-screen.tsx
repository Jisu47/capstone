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

function ProfileUserIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 12C14.4853 12 16.5 9.98528 16.5 7.5C16.5 5.01472 14.4853 3 12 3C9.51472 3 7.5 5.01472 7.5 7.5C7.5 9.98528 9.51472 12 12 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4.5 21C4.5 17.4101 7.85786 14.5 12 14.5C16.1421 14.5 19.5 17.4101 19.5 21"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
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

function AddGroupIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M15.5 18.25a4.25 4.25 0 0 0-8.5 0M11.25 10a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5ZM18.5 9.5v5M16 12h5"
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

function HeaderBar({ totalCount }: Readonly<{ totalCount: number }>) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 px-1 py-1">
      <Link
        href="/"
        className="inline-flex h-10 items-center rounded-full bg-[linear-gradient(180deg,#F4FBF6_0%,#EBF6EE_100%)] px-4 text-[12px] font-semibold tracking-[0.08em] text-[#2D6B46] shadow-[0_8px_20px_rgba(76,175,122,0.08)]"
      >
        STUDY FLOW
      </Link>

      <div className="flex min-w-0 items-center gap-2">
        <div className="inline-flex h-10 items-center rounded-full bg-[linear-gradient(180deg,#F4FBF6_0%,#EBF6EE_100%)] px-4 text-[13px] font-semibold text-[#4CAF7A] shadow-[0_8px_20px_rgba(76,175,122,0.08)]">
          내 그룹 {totalCount}개
        </div>
        <Link
          href="/mypage"
          aria-label="마이페이지로 이동"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition hover:translate-y-[-1px]"
        >
          <ProfileUserIcon />
        </Link>
      </div>
    </div>
  );
}

function PageTitle() {
  return (
    <h1 className="mt-6 mb-6 min-w-0 whitespace-normal text-[36px] font-[family:var(--font-study-display)] font-extrabold leading-[1.2] tracking-[-0.05em] text-slate-950">
      그룹 선택
    </h1>
  );
}

function HeroCard({ displayName }: Readonly<{ displayName: string }>) {
  return (
    <section className="h-[200px] max-h-[220px] rounded-[28px] bg-[linear-gradient(135deg,#F7FCF8_0%,#EEF8F1_52%,#FBFDFB_100%)] p-6 shadow-[0_8px_30px_rgba(76,175,122,0.10)]">
      <div className="flex h-full min-w-0 items-center justify-between gap-4">
        <h2 className="min-w-0 flex-1 whitespace-normal text-[24px] font-semibold leading-[1.35] tracking-[-0.04em] text-slate-950 sm:text-[26px]">
          {displayName}님,
          <br />
          어디부터 들어갈까요?
        </h2>

        <div className="mt-4 flex h-[132px] w-[132px] max-w-[140px] shrink-0 items-center justify-center self-end">
          <Image
            src="/hero-study-illustration.svg"
            alt="공부하는 학생 일러스트"
            width={132}
            height={132}
            className="h-[132px] w-[132px] object-contain"
            priority
          />
        </div>
      </div>
    </section>
  );
}

function ActionCard({
  href,
  title,
  description,
  icon,
  strong = false,
}: Readonly<{
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  strong?: boolean;
}>) {
  return (
    <Link
      href={href}
      className={`flex min-h-[108px] w-full min-w-0 items-center gap-4 rounded-[24px] px-5 py-5 transition ${
        strong
          ? "bg-[linear-gradient(135deg,#7AC595_0%,#4CAF7A_100%)] text-white shadow-[0_16px_30px_rgba(76,175,122,0.18)] hover:brightness-[0.99]"
          : "bg-white text-slate-900 shadow-[0_8px_30px_rgba(15,23,42,0.05)] hover:translate-y-[-1px]"
      }`}
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
          strong ? "bg-white/16 text-white" : "bg-[rgba(76,175,122,0.08)] text-[#4CAF7A]"
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="min-w-0 whitespace-nowrap text-[20px] font-semibold tracking-[-0.03em]">
          {title}
        </p>
        <p className={`mt-1.5 min-w-0 whitespace-normal text-[14px] leading-[1.4] ${strong ? "text-white/82" : "text-slate-500"}`}>
          {description}
        </p>
      </div>

      <span
        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
          strong ? "bg-white/92 text-[#4CAF7A]" : "bg-[#F7FBF8] text-slate-700"
        }`}
      >
        <ArrowRightIcon />
      </span>
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
    <div className="min-w-0 rounded-[18px] bg-[#FBFDFC] px-3 py-3 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.04)]">
      <div className="flex min-w-0 items-center gap-2 text-[12px] font-medium text-slate-500">
        <span className="shrink-0 text-[#69B486]">{icon}</span>
        <span className="min-w-0 whitespace-normal">{label}</span>
      </div>
      <p className="mt-2.5 min-w-0 whitespace-normal text-[16px] font-semibold tracking-[-0.03em] text-slate-950">
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
    <article className="min-w-0 rounded-[28px] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
      <div className="space-y-4">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold tracking-[0.18em] text-[#74B98D]">NEXT GROUP</p>

          <div className="mt-3 flex min-w-0 flex-wrap items-center gap-3">
            <h2 className="min-w-0 whitespace-normal text-[24px] font-semibold tracking-[-0.05em] text-slate-950">
              {group.name}
            </h2>
            <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-sm font-semibold text-[#4CAF7A]">
              {getGroupStatusLabel(group)}
            </span>
          </div>

          <div className="mt-3 space-y-1.5 text-sm leading-6 text-slate-600">
            <p className="min-w-0 whitespace-normal">{group.subject}</p>
            <p className="min-w-0 whitespace-normal">{group.recentUpdate}</p>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-2 gap-3 min-[420px]:grid-cols-3">
          <GroupInfoCard icon={<CalendarIcon />} label="목표 날짜" value={formatExamDate(group.examDate)} />
          <GroupInfoCard icon={<MembersIcon />} label="팀원 수" value={`${group.members.length}명`} />
          <GroupInfoCard icon={<MaterialIcon />} label="자료 수" value={`${group.materials.length}개`} />
        </div>

        <button
          type="button"
          onClick={() => onOpen(group.id)}
          className="inline-flex h-[52px] w-full items-center justify-center gap-3 rounded-[18px] bg-[linear-gradient(135deg,#7AC595_0%,#4CAF7A_100%)] px-6 text-base font-semibold text-white shadow-[0_16px_30px_rgba(76,175,122,0.18)] transition hover:brightness-[0.99]"
        >
          <span>들어가기</span>
          <ArrowRightIcon />
        </button>
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
      className="flex min-w-0 w-full items-start gap-4 rounded-[24px] bg-white px-5 py-4 text-left shadow-[0_8px_30px_rgba(15,23,42,0.05)] transition hover:translate-y-[-1px]"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#F3F6FA_0%,#E7EDF4_100%)] text-slate-500">
        <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
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

        <p className="mt-2.5 min-w-0 whitespace-normal text-[18px] font-semibold tracking-[-0.04em] text-slate-950">
          {group.name}
        </p>

        <div className="mt-3 flex min-w-0 flex-col gap-2 text-sm text-slate-500 min-[390px]:flex-row min-[390px]:items-center min-[390px]:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0">
              <CalendarIcon />
            </span>
            <span className="min-w-0 whitespace-normal">
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

function JoinedGroupListCard({
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
      className="flex w-full min-w-0 items-start gap-4 rounded-[24px] bg-white px-5 py-4 text-left shadow-[0_8px_30px_rgba(15,23,42,0.05)] transition hover:translate-y-[-1px]"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#F3FBF6_0%,#E8F5EC_100%)] text-[#4CAF7A]">
        <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path
            d="M12 5.75a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5ZM6 18c0-2.761 2.686-5 6-5s6 2.239 6 5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
        </svg>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[#4CAF7A]">
            {group.subject}
          </span>
          <span className="rounded-full bg-[#F5FBF7] px-3 py-1 text-xs font-semibold text-[#4CAF7A]">
            {getGroupStatusLabel(group)}
          </span>
        </div>

        <p className="mt-2.5 min-w-0 whitespace-normal text-[18px] font-semibold tracking-[-0.04em] text-slate-950">
          {group.name}
        </p>

        <p className="mt-1.5 min-w-0 whitespace-normal text-sm leading-6 text-slate-500">
          {group.recentUpdate}
        </p>

        <div className="mt-3 flex min-w-0 flex-col gap-2 text-sm text-slate-500 min-[390px]:flex-row min-[390px]:items-center min-[390px]:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0">
              <CalendarIcon />
            </span>
            <span className="min-w-0 whitespace-normal">{formatExamDate(group.examDate)}</span>
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
      <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
        <p className="text-[20px] font-semibold tracking-[-0.03em] text-slate-950">
          아직 참여 중인 그룹이 없어요.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          새 그룹을 만들거나 참여 코드로 합류하면 여기에서 바로 이어서 들어갈 수 있어요.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3">
          <Link
            href="/create"
            className="inline-flex items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#7AC595_0%,#4CAF7A_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(76,175,122,0.18)]"
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
  const secondaryActiveGroups = featuredGroup
    ? activeGroups.filter((group) => group.id !== featuredGroup.id)
    : activeGroups;
  const recentGroupId = currentUser?.joinedGroupId ?? featuredGroup?.id ?? null;
  const displayName = currentUser?.displayName ?? sessionName ?? "스터디 메이트";

  return (
    <AppShell
      requireAuth={false}
      showNavigation={false}
      navReady={Boolean(recentGroupId)}
      navGroupId={recentGroupId}
      headerBehavior="fixed"
      headerVariant="bare"
      title="그룹 선택"
      headerContent={<HeaderBar totalCount={sortedGroups.length} />}
    >
      <section>
        <div className="hidden">
          <PageTitle />
        </div>
        <HeroCard displayName={displayName} />
      </section>

      <section className="grid grid-cols-1 gap-4">
        <ActionCard
          href="/create"
          title="새 그룹 만들기"
          description="내 목표 날짜와 팀 방향을 설정해보세요."
          icon={<AddGroupIcon />}
          strong
        />
        <ActionCard
          href="/group-setup"
          title="그룹 참여하기"
          description="참여 코드로 기존 그룹에 합류하세요."
          icon={<MembersIcon />}
        />
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

      {secondaryActiveGroups.length > 0 ? (
        <section className="space-y-4">
          <h3 className="px-1 text-[20px] font-semibold tracking-[-0.04em] text-slate-950">
            가입한 다른 그룹
          </h3>
          {secondaryActiveGroups.map((group) => (
            <JoinedGroupListCard
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
          <h3 className="px-1 text-[20px] font-semibold tracking-[-0.04em] text-slate-950">
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
