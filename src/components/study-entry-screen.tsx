"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { AppShell, SectionCard } from "@/components/mobile-shell";
import { ProfileAvatar } from "@/components/profile-avatar";
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
    <div className="relative flex h-44 w-44 items-center justify-center rounded-[30px] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,250,246,0.92))] shadow-[0_28px_60px_rgba(121,184,149,0.16)] backdrop-blur-md">
      <div className="absolute inset-4 rounded-[24px] bg-[radial-gradient(circle_at_top,rgba(121,184,149,0.16),transparent_52%),linear-gradient(160deg,rgba(255,255,255,0.78),rgba(248,252,249,0.44))]" />
      <div className="absolute right-7 top-7 h-3.5 w-3.5 rounded-full bg-[var(--brand)] shadow-[0_0_18px_rgba(121,184,149,0.42)]" />
      <Image
        src="/logo-study.png"
        alt="Study logo"
        width={133}
        height={132}
        className="relative z-10 h-32 w-32 object-contain drop-shadow-[0_10px_24px_rgba(121,184,149,0.14)]"
        priority
      />
    </div>
  );
}

function SplashScreen() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-[var(--background)] text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(121,184,149,0.18),_transparent_32%),radial-gradient(circle_at_bottom,_rgba(230,243,235,0.72),_transparent_34%)]" />

      <div className="relative mx-auto flex w-full max-w-[430px] flex-1 flex-col px-6 pb-10 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span className="font-semibold tracking-[0.24em] text-slate-600">STUDY FLOW</span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          <SplashLogoMark />

          <div className="mt-8 text-center">
            <p className="font-[family:var(--font-study-display)] text-[56px] leading-none tracking-[0.06em] text-slate-950">
              STUDY
            </p>
            <p className="mt-3 text-sm tracking-[0.18em] text-slate-500">
              필요한 스터디 흐름을 바로 시작해 보세요.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-full bg-[var(--brand)] px-6 py-4 text-base font-semibold text-white shadow-[0_18px_36px_rgba(121,184,149,0.26)] transition hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
          >
            로그인 시작하기
          </Link>

          <div className="flex items-center justify-center gap-3 text-sm text-slate-500">
            <Link
              href="/signup"
              className="font-medium text-[var(--brand)] transition hover:brightness-90"
            >
              계정 만들기
            </Link>
            <span className="text-slate-300">|</span>
            <span>아이디/비밀번호 찾기</span>
          </div>
        </div>
      </div>
    </main>
  );
}

function HomeHeader({ totalCount }: Readonly<{ totalCount: number }>) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex rounded-full border border-[rgba(121,184,149,0.18)] bg-white/90 px-3 py-1 text-[10px] font-semibold tracking-[0.16em] text-slate-700 shadow-[0_6px_16px_rgba(121,184,149,0.08)]"
        >
          STUDY FLOW
        </Link>
        <div className="rounded-full border border-[rgba(121,184,149,0.22)] bg-[rgba(230,243,235,0.82)] px-3 py-1 text-[10px] font-semibold text-[var(--brand)]">
          내 그룹 {totalCount}개
        </div>
      </div>

      <p className="font-[family:var(--font-study-display)] text-[31px] leading-none tracking-[-0.06em] text-slate-950">
        그룹 선택
      </p>
    </div>
  );
}

function QuickActionLink({
  href,
  label,
  caption,
  strong = false,
}: Readonly<{
  href: string;
  label: string;
  caption: string;
  strong?: boolean;
}>) {
  return (
    <Link
      href={href}
      className={`rounded-[20px] border px-4 py-4 transition ${
        strong
          ? "border-[rgba(121,184,149,0.24)] bg-[linear-gradient(180deg,#81b999_0%,#6ea584_100%)] text-white shadow-[0_18px_32px_rgba(121,184,149,0.22)] hover:brightness-[0.99]"
          : "border-[rgba(121,184,149,0.14)] bg-white/92 text-slate-900 shadow-[0_10px_24px_rgba(121,184,149,0.08)] hover:border-[rgba(121,184,149,0.24)]"
      }`}
    >
      <p className="text-sm font-semibold tracking-[-0.02em]">{label}</p>
      <p className={`mt-1 text-xs leading-5 ${strong ? "text-white/78" : "text-slate-500"}`}>
        {caption}
      </p>
    </Link>
  );
}

function FeaturedGroupCard({
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
      className="group relative w-full overflow-hidden rounded-[30px] border border-[rgba(121,184,149,0.2)] bg-[linear-gradient(160deg,#fffefd_0%,#f9fcfa_42%,#eef7f1_100%)] p-5 text-left shadow-[0_18px_40px_rgba(121,184,149,0.14)] transition hover:-translate-y-[1px] hover:shadow-[0_24px_48px_rgba(121,184,149,0.18)]"
    >
      <div className="pointer-events-none absolute inset-[1px] rounded-[29px] border border-white/70" />
      <div className="pointer-events-none absolute -right-10 top-2 h-28 w-28 rounded-full bg-[rgba(121,184,149,0.12)] blur-3xl" />

      <div className="relative mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
            Next Group
          </p>
          <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.04em] text-slate-950">
            {group.name}
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500">{group.subject}</p>
        </div>
        <span className="rounded-full border border-white/80 bg-white/88 px-4 py-2 text-sm font-semibold text-[var(--brand)] shadow-[0_10px_20px_rgba(121,184,149,0.1)]">
          {getGroupStatusLabel(group)}
        </span>
      </div>

      <p className="relative max-w-[18rem] text-sm leading-6 text-slate-600">
        {group.overallGoal}
      </p>

      <div className="relative mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-[18px] border border-[rgba(121,184,149,0.12)] bg-white/88 px-3 py-3 shadow-[0_8px_18px_rgba(121,184,149,0.06)]">
          <p className="text-[11px] font-medium text-slate-500">목표 날짜</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{formatExamDate(group.examDate)}</p>
        </div>
        <div className="rounded-[18px] border border-[rgba(121,184,149,0.12)] bg-white/88 px-3 py-3 shadow-[0_8px_18px_rgba(121,184,149,0.06)]">
          <p className="text-[11px] font-medium text-slate-500">팀원 수</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{group.members.length}명</p>
        </div>
        <div className="rounded-[18px] border border-[rgba(121,184,149,0.12)] bg-white/88 px-3 py-3 shadow-[0_8px_18px_rgba(121,184,149,0.06)]">
          <p className="text-[11px] font-medium text-slate-500">자료 수</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{group.materials.length}개</p>
        </div>
      </div>

      <div className="relative mt-5 flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">그룹 홈부터 바로 이어서 들어가기</p>
        <span className="rounded-full bg-[linear-gradient(180deg,#81b999_0%,#6ea584_100%)] px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_20px_rgba(121,184,149,0.18)] transition group-hover:brightness-[0.98]">
          들어가기
        </span>
      </div>
    </button>
  );
}

function CompactGroupCard({
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
      className="w-full rounded-[22px] border border-[rgba(121,184,149,0.14)] bg-[linear-gradient(180deg,#ffffff,#fbfdfb)] px-4 py-4 text-left shadow-[0_10px_24px_rgba(121,184,149,0.08)] transition hover:border-[rgba(121,184,149,0.24)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {group.subject}
          </p>
          <p className="mt-1 text-base font-semibold tracking-[-0.02em] text-slate-950">
            {group.name}
          </p>
        </div>
        <span className="rounded-full border border-[rgba(121,184,149,0.12)] bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
          {getGroupStatusLabel(group)}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>목표 날짜 {formatExamDate(group.examDate)}</span>
        <span>{group.members.length}명</span>
      </div>
    </button>
  );
}

function CompletedGroupCard({ group }: Readonly<{ group: StudyGroup }>) {
  return (
    <div className="rounded-[22px] border border-[rgba(121,184,149,0.14)] bg-[linear-gradient(180deg,#ffffff,#f8fbf9)] px-4 py-4 shadow-[0_10px_24px_rgba(121,184,149,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {group.subject}
          </p>
          <p className="mt-1 text-base font-semibold text-slate-900">{group.name}</p>
        </div>
        <span className="rounded-full border border-[rgba(121,184,149,0.14)] bg-white px-3 py-1 text-xs font-semibold text-slate-600">
          운영 종료
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>마지막 목표 날짜 {formatExamDate(group.examDate)}</span>
        <span>{group.members.length}명</span>
      </div>
    </div>
  );
}

function EmptyGroupState() {
  return (
    <SectionCard title="첫 그룹부터 시작하기">
      <div className="rounded-[24px] border border-[rgba(121,184,149,0.14)] bg-[linear-gradient(145deg,#fffefd_0%,#f8fbf8_50%,#eef7f1_100%)] p-5 shadow-[0_14px_30px_rgba(121,184,149,0.08)]">
        <p className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
          아직 참여 중인 그룹이 없어요.
        </p>
        <p className="mt-2 max-w-[19rem] text-sm leading-6 text-slate-600">
          새 그룹을 직접 만들거나 참여 코드로 바로 연결해서 스터디 흐름을 시작해 보세요.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <QuickActionLink
            href="/create"
            label="그룹 만들기"
            caption="목표 날짜와 전체 목표부터 설정"
            strong
          />
          <QuickActionLink
            href="/group-setup"
            label="코드로 참여"
            caption="기존 그룹에 바로 합류"
          />
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
  const secondaryGroups = activeGroups.slice(1);

  return (
    <AppShell
      requireAuth={false}
      showNavigation={false}
      title="그룹 선택"
      subtitle="내가 참여 중인 흐름을 고르고 이어서 들어가요."
      headerContent={
        <HomeHeader totalCount={sortedGroups.length} />
      }
    >
      <section className="relative overflow-hidden rounded-[30px] border border-[rgba(121,184,149,0.18)] bg-[linear-gradient(145deg,#fffefd_0%,#fafcf9_52%,#f1f8f3_100%)] p-5 shadow-[0_18px_42px_rgba(121,184,149,0.12)]">
        <div className="pointer-events-none absolute inset-[1px] rounded-[29px] border border-white/70" />
        <div className="pointer-events-none absolute -right-16 -top-14 h-32 w-32 rounded-full bg-[rgba(121,184,149,0.12)] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-10 h-28 w-28 rounded-full bg-[rgba(218,236,224,0.7)] blur-3xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className="rounded-[28px] border border-white/80 bg-white/82 p-2 shadow-[0_12px_24px_rgba(121,184,149,0.1)]">
              <ProfileAvatar
                name={currentUser?.displayName ?? sessionName ?? "S"}
                avatarPreset={currentUser?.avatarPreset ?? "sky"}
                size="lg"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--ink-soft)]">오늘의 스터디 흐름</p>
              <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.04em] text-slate-950">
                {sessionName}님, 어디부터 들어갈까요?
              </h2>
              <p className="mt-2 max-w-[17rem] text-sm leading-6 text-slate-600">
                진행 중인 그룹은 빠르게, 보관된 그룹은 기록처럼 정리해서 볼 수 있게 바꿨어요.
              </p>
            </div>
          </div>

          <Link
            href="/mypage"
            className="shrink-0 rounded-full border border-[rgba(121,184,149,0.16)] bg-white/90 px-4 py-2 text-sm font-semibold text-[var(--brand)] shadow-[0_8px_18px_rgba(121,184,149,0.08)]"
          >
            마이페이지
          </Link>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-3">
          <QuickActionLink
            href="/create"
            label="새 그룹 만들기"
            caption="내 목표 날짜와 팀 방향부터 설정"
            strong
          />
          <QuickActionLink
            href="/group-setup"
            label="그룹 참여하기"
            caption="참여 코드로 기존 흐름에 합류"
          />
        </div>
      </section>

      {isLoading && sortedGroups.length === 0 ? (
        <SectionCard title="그룹 불러오는 중">
          <p className="text-sm leading-6 text-[var(--ink-soft)]">
            참여 중인 스터디 흐름을 정리하고 있어요.
          </p>
        </SectionCard>
      ) : null}

      {!isLoading && sortedGroups.length === 0 ? <EmptyGroupState /> : null}

      {featuredGroup ? (
        <FeaturedGroupCard
          group={featuredGroup}
          onOpen={(groupId) => {
            router.push(`/group/${groupId}`);
          }}
        />
      ) : null}

      {secondaryGroups.length > 0 ? (
        <SectionCard title="다른 진행 중 그룹">
          {secondaryGroups.map((group) => (
            <CompactGroupCard
              key={group.id}
              group={group}
              onOpen={(groupId) => {
                router.push(`/group/${groupId}`);
              }}
            />
          ))}
        </SectionCard>
      ) : null}

      {completedGroups.length > 0 ? (
        <SectionCard title="보관된 그룹">
          {completedGroups.map((group) => (
            <CompletedGroupCard key={group.id} group={group} />
          ))}
        </SectionCard>
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
