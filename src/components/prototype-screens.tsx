"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BottomNavigation } from "@/components/bottom-navigation";
import { usePrototype } from "@/components/prototype-provider";
import {
  type CreateGroupInput,
  type StudyGroup,
  type Weekday,
  currentUserId,
  formatExamDate,
  formatUploadDate,
  getDaysLeft,
  getGroupProgress,
  getMemberProgress,
} from "@/lib/mock-data";

const weekdayOptions: Weekday[] = ["월", "화", "수", "목", "금"];

const shellRootClass = "min-h-dvh bg-transparent text-slate-900";
const shellFrameClass = "mx-auto flex h-dvh w-full max-w-[430px] flex-col";
const shellHeaderClass =
  "sticky top-0 z-20 border-b border-white/80 bg-[rgba(245,249,255,0.92)] px-4 py-4 backdrop-blur-xl md:px-6 lg:px-8";
const shellMainClass =
  "flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-32 pt-4 md:px-6 md:pt-5 lg:px-8";
const shellMainWithoutNavClass =
  "flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-10 pt-4 md:px-6 md:pt-5 lg:px-8";

function getGroupById(groups: StudyGroup[], groupId: string) {
  return groups.find((group) => group.id === groupId);
}

function getRelativeExamText(dateString: string) {
  const daysLeft = getDaysLeft(dateString);
  return daysLeft === 0 ? "D-day" : `D-${daysLeft}`;
}

function sortMaterials(group: StudyGroup) {
  return [...group.materials].sort((left, right) => {
    return new Date(right.uploadedAt).getTime() - new Date(left.uploadedAt).getTime();
  });
}

function getTodayTasks(groups: StudyGroup[]) {
  return groups
    .flatMap((group) =>
      group.plan
        .filter((item) => !item.memberStatus[currentUserId])
        .map((item) => ({
          groupId: group.id,
          groupName: group.name,
          subject: group.subject,
          ...item,
        })),
    )
    .slice(0, 4);
}

function SectionCard({
  title,
  action,
  children,
}: Readonly<{
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}>) {
  return (
    <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_18px_60px_rgba(28,64,120,0.08)] backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-slate-900">{title}</h2>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function ProgressBar({ value }: Readonly<{ value: number }>) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,#2f6ee5,#73a3ff)] transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function AppShell({
  title,
  subtitle,
  groupId,
  navGroupId,
  navReady,
  requireAuth = true,
  showNavigation = true,
  children,
}: Readonly<{
  title: string;
  subtitle: string;
  groupId?: string;
  navGroupId?: string | null;
  navReady?: boolean;
  requireAuth?: boolean;
  showNavigation?: boolean;
  children: React.ReactNode;
}>) {
  const { groups, error, isAuthReady, isLoading, isMutating, sessionName } = usePrototype();
  const resolvedNavGroupId =
    navGroupId === undefined ? (groupId ?? groups[0]?.id ?? null) : navGroupId;
  const resolvedNavReady = navReady ?? (groupId ? true : !isLoading);
  const shouldShowNavigation =
    showNavigation && (!requireAuth || (isAuthReady && Boolean(sessionName)));

  if (requireAuth && !isAuthReady) {
    return (
      <div className={shellRootClass}>
        <div className={shellFrameClass}>
          <header className={shellHeaderClass}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <Link
                href="/"
                className="inline-flex rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-700"
              >
                STUDY FLOW
              </Link>
            </div>
            <div className="space-y-1">
              <p className="font-[family:var(--font-study-display)] text-[27px] leading-none tracking-[-0.05em] text-slate-950">
                {title}
              </p>
              <p className="text-sm leading-5 text-[var(--ink-soft)]">{subtitle}</p>
            </div>
          </header>

          <main className={shellMainWithoutNavClass}>
            <LoadingState message="로그인 상태를 확인하는 중입니다." />
          </main>
        </div>
      </div>
    );
  }

  if (requireAuth && !sessionName) {
    return (
      <div className={shellRootClass}>
        <div className={shellFrameClass}>
          <header className={shellHeaderClass}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <Link
                href="/"
                className="inline-flex rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-700"
              >
                STUDY FLOW
              </Link>
            </div>
            <div className="space-y-1">
              <p className="font-[family:var(--font-study-display)] text-[27px] leading-none tracking-[-0.05em] text-slate-950">
                {title}
              </p>
              <p className="text-sm leading-5 text-[var(--ink-soft)]">{subtitle}</p>
            </div>
          </header>

          <main className={shellMainWithoutNavClass}>
            <SectionCard
              title="로그인이 필요해요"
              action={
                <Link href="/" className="text-sm font-semibold text-[var(--brand)]">
                  로그인으로
                </Link>
              }
            >
              <p className="text-sm leading-6 text-[var(--ink-soft)]">
                먼저 로그인하고 스터디그룹을 선택하면 그룹별 홈과 스터디, 계획,
                자료 화면을 이용할 수 있어요.
              </p>
            </SectionCard>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={shellRootClass}>
      <div className={shellFrameClass}>
        <header className={shellHeaderClass}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-700"
            >
              STUDY FLOW
            </Link>
          </div>
          <div className="space-y-1">
            <p className="font-[family:var(--font-study-display)] text-[27px] leading-none tracking-[-0.05em] text-slate-950">
              {title}
            </p>
            <p className="text-sm leading-5 text-[var(--ink-soft)]">{subtitle}</p>
          </div>
          {isLoading || isMutating ? (
            <div className="mt-3 rounded-2xl bg-white/80 px-3 py-2 text-[11px] font-medium text-slate-600">
              {isLoading ? "Syncing Supabase data..." : "Saving changes..."}
            </div>
          ) : null}
          {error ? (
            <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          ) : null}
        </header>

        <main className={shouldShowNavigation ? shellMainClass : shellMainWithoutNavClass}>{children}</main>

        {shouldShowNavigation ? (
          <BottomNavigation navReady={resolvedNavReady} navGroupId={resolvedNavGroupId} />
        ) : null}
      </div>
    </div>
  );
}

function MissingGroupState() {
  return (
    <SectionCard
      title="데모 세션이 초기화됐습니다"
      action={
        <Link href="/" className="text-sm font-semibold text-[var(--brand)]">
          홈으로
        </Link>
      }
    >
      <p className="text-sm leading-6 text-[var(--ink-soft)]">
        새로 만든 모임은 새로고침 시 유지되지 않습니다. 홈에서 기본 예시 모임을 다시 열어 확인하면 됩니다.
      </p>
    </SectionCard>
  );
}

function LoadingState({
  message = "Loading data from Supabase...",
}: Readonly<{
  message?: string;
}>) {
  return (
    <SectionCard title="Loading">
      <p className="text-sm leading-6 text-[var(--ink-soft)]">{message}</p>
    </SectionCard>
  );
}

export function HomeScreen() {
  const { groups, isLoading } = usePrototype();
  const todayTasks = getTodayTasks(groups);
  const dDayGroups = [...groups].sort((left, right) => {
    return getDaysLeft(left.examDate) - getDaysLeft(right.examDate);
  });

  return (
    <AppShell
      navGroupId={groups[0]?.id ?? null}
      navReady={!isLoading}
      title="한눈에 보는 스터디 홈"
      subtitle="오늘 할 일, 시험 디데이, 내가 속한 모임만 먼저 확인하는 단순한 홈 화면입니다."
    >
      <SectionCard
        title="내가 속한 스터디 모임"
        action={
          <Link href="/create" className="text-sm font-semibold text-[var(--brand)]">
            새 모임
          </Link>
        }
      >
        {isLoading && groups.length === 0 ? (
          <p className="text-sm leading-6 text-[var(--ink-soft)]">
            Loading study groups from Supabase...
          </p>
        ) : null}
        {!isLoading && groups.length === 0 ? (
          <p className="text-sm leading-6 text-[var(--ink-soft)]">
            No study groups yet. Create one to start.
          </p>
        ) : null}
        {groups.map((group) => (
          <Link
            key={group.id}
            href={`/group/${group.id}`}
            className="block rounded-[24px] border border-white/70 bg-white/75 p-4 transition hover:bg-white"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {group.subject}
                </p>
                <h3 className="mt-1 text-base font-semibold tracking-[-0.02em] text-slate-900">
                  {group.name}
                </h3>
              </div>
              <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
                {getRelativeExamText(group.examDate)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-[11px] font-medium text-slate-500">시험일</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatExamDate(group.examDate)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-[11px] font-medium text-slate-500">오늘 할 일</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {group.plan.filter((item) => !item.memberStatus[currentUserId]).length}개
                </p>
              </div>
            </div>
          </Link>
        ))}
      </SectionCard>

      <SectionCard title="오늘 할 일">
        {todayTasks.map((task) => (
          <Link
            key={`${task.groupId}-${task.id}`}
            href={`/group/${task.groupId}/plan`}
            className="flex items-start gap-3 rounded-2xl bg-white/80 p-3"
          >
            <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
              {task.day}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{task.title}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">
                {task.groupName} · {task.duration}
              </p>
            </div>
          </Link>
        ))}
      </SectionCard>

      <SectionCard title="시험 디데이">
        {dDayGroups.map((group) => (
          <Link
            key={group.id}
            href={`/group/${group.id}`}
            className="flex items-center justify-between rounded-2xl bg-white/80 p-3"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">{group.name}</p>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">{formatExamDate(group.examDate)}</p>
            </div>
            <span className="rounded-full bg-[var(--brand-soft)] px-3 py-2 text-xs font-semibold text-[var(--brand)]">
              {getRelativeExamText(group.examDate)}
            </span>
          </Link>
        ))}
      </SectionCard>
    </AppShell>
  );
}

export function CreateGroupScreen() {
  const { createGroup, isMutating } = usePrototype();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<CreateGroupInput>({
    name: "알고리즘 기말 대비",
    subject: "알고리즘",
    examDate: "2026-04-30",
    presentationDate: "2026-04-24",
    deadlineDate: "2026-04-27",
    overallGoal: "기말고사 전까지 팀 전체가 안정적으로 문제를 풀 수 있는 상태 만들기",
    weeklyGoal: "그래프/DP 정리, 기출 2회독, 발표 질문 준비",
  });

  function handleChange<Key extends keyof CreateGroupInput>(
    key: Key,
    value: CreateGroupInput[Key],
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const groupId = await createGroup(form);

      startTransition(() => {
        router.push(`/group/${groupId}`);
      });
    } catch {}
  }

  return (
    <AppShell
      title="새 스터디 모임 만들기"
      subtitle="모임명과 시험 일정만 넣으면 공용 자료, 주간 계획, AI 질문 흐름이 바로 이어지는 데모를 확인할 수 있습니다."
    >
      <SectionCard title="입력 정보">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">모임명</span>
            <input
              required
              value={form.name}
              onChange={(event) => handleChange("name", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">과목/주제</span>
            <input
              required
              value={form.subject}
              onChange={(event) => handleChange("subject", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">시험일 또는 마감일</span>
            <input
              required
              type="date"
              value={form.examDate}
              onChange={(event) => handleChange("examDate", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">주간 목표</span>
            <textarea
              required
              rows={4}
              value={form.weeklyGoal}
              onChange={(event) => handleChange("weeklyGoal", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
            />
          </label>

          <button
            type="submit"
            disabled={isPending || isMutating}
            className="w-full rounded-2xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(47,110,229,0.26)] transition hover:brightness-105 disabled:opacity-70"
          >
            {isPending ? "모임 생성 중..." : "모임 생성하기"}
          </button>
        </form>
      </SectionCard>

      <SectionCard title="생성 후 바로 보이는 것">
        <div className="grid gap-3">
          {[
            "공용 자료 3개가 예시 데이터로 자동 세팅됩니다.",
            "시험일까지 남은 기간을 기준으로 요일별 학습 계획이 생성됩니다.",
            "AI 질문 화면에서 추천 질문과 mock 답변을 바로 확인할 수 있습니다.",
          ].map((item) => (
            <div key={item} className="rounded-2xl bg-white/80 p-3 text-sm leading-6 text-slate-700">
              {item}
            </div>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}

export function GroupOverviewScreen({ groupId }: Readonly<{ groupId: string }>) {
  const { groups, isLoading } = usePrototype();
  const group = getGroupById(groups, groupId);

  if (isLoading && !group) {
    return (
      <AppShell
        groupId={groupId}
        title="Loading group..."
        subtitle="Waiting for the latest group snapshot from Supabase."
      >
        <LoadingState message="Loading group snapshot..." />
      </AppShell>
    );
  }

  if (!group) {
    return (
      <AppShell
        groupId={groupId}
        title="모임을 찾을 수 없어요"
        subtitle="데모 상태가 초기화된 경우 홈에서 다시 진입해 주세요."
      >
        <MissingGroupState />
      </AppShell>
    );
  }

  const daysLeft = getDaysLeft(group.examDate);
  const progress = getGroupProgress(group);
  const planPreview = group.plan.slice(0, 3);
  const materialPreview = sortMaterials(group).slice(0, 3);

  return (
    <AppShell
      groupId={groupId}
      title={group.name}
      subtitle={`${group.subject} · ${formatExamDate(group.examDate)} · ${daysLeft === 0 ? "시험일" : `${daysLeft}일 남음`}`}
    >
      <section className="overflow-hidden rounded-[30px] bg-[linear-gradient(140deg,#fdfefe_0%,#ebf2ff_48%,#d7e6ff_100%)] p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              Group Snapshot
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
              {group.subject} 시험 대비 스터디
            </h2>
          </div>
          <div className="rounded-[22px] bg-white px-3 py-2 text-center shadow-sm">
            <p className="text-[11px] font-medium text-slate-500">남은 기간</p>
            <p className="font-[family:var(--font-study-display)] text-[26px] leading-none text-slate-950">
              {daysLeft}
            </p>
          </div>
        </div>

        <p className="text-sm leading-6 text-slate-700">{group.description}</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/80 p-3">
            <p className="text-xs text-slate-500">모임 목표</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{group.weeklyGoal}</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-3">
            <p className="text-xs text-slate-500">팀 진행률</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{progress}% 완료</p>
          </div>
        </div>
      </section>

      <SectionCard title="팀원과 진행 상황">
        {group.members.map((member) => (
          <div key={member.id} className="rounded-2xl bg-white/80 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700">
                  {member.name.slice(0, 1)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                  <p className="text-xs text-[var(--ink-soft)]">
                    {member.role} · {member.focus}
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold text-[var(--brand)]">
                {getMemberProgress(group, member.id)}%
              </span>
            </div>
            <ProgressBar value={getMemberProgress(group, member.id)} />
          </div>
        ))}
      </SectionCard>

      <SectionCard
        title="최근 업로드 자료"
        action={
          <Link href={`/group/${group.id}/materials`} className="text-sm font-semibold text-[var(--brand)]">
            전체 보기
          </Link>
        }
      >
        {materialPreview.map((material) => (
          <div key={material.id} className="rounded-2xl bg-white/80 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">{material.title}</p>
              <span className="text-xs font-medium text-slate-500">{material.format}</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">{material.summary}</p>
          </div>
        ))}
      </SectionCard>

      <SectionCard
        title="이번 주 계획 요약"
        action={
          <Link href={`/group/${group.id}/plan`} className="text-sm font-semibold text-[var(--brand)]">
            계획 보기
          </Link>
        }
      >
        {planPreview.map((item) => (
          <div key={item.id} className="rounded-2xl bg-white/80 p-3">
            <div className="mb-1 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">
                {item.day} · {item.title}
              </p>
              <span className="text-xs font-medium text-slate-500">{item.duration}</span>
            </div>
            <p className="text-xs leading-5 text-[var(--ink-soft)]">{item.detail}</p>
          </div>
        ))}
      </SectionCard>
    </AppShell>
  );
}

export function MaterialsScreen({ groupId }: Readonly<{ groupId: string }>) {
  const { groups, queueMockUpload, sendQuestion, isAnswering, isLoading } = usePrototype();
  const group = getGroupById(groups, groupId);
  const [draft, setDraft] = useState("");

  if (isLoading && !group) {
    return (
      <AppShell
        groupId={groupId}
        title="Loading materials..."
        subtitle="Waiting for group materials from Supabase."
      >
        <LoadingState message="Loading materials..." />
      </AppShell>
    );
  }

  if (!group) {
    return (
      <AppShell
        groupId={groupId}
        title="자료를 불러오지 못했습니다"
        subtitle="홈에서 다시 진입해 주세요."
      >
        <MissingGroupState />
      </AppShell>
    );
  }

  const activeGroup = group;
  const materials = sortMaterials(activeGroup);
  const recommendedQuestions = [
    `${activeGroup.subject} 핵심 개념만 정리해줘`,
    "시험 범위에서 중요한 자료를 알려줘",
    "자료 기반으로 예상 질문 3개 만들어줘",
  ];

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendQuestion(activeGroup.id, draft);
    setDraft("");
  }

  return (
    <AppShell
      groupId={groupId}
      title="자료"
      subtitle={`${activeGroup.subject} 자료 ${materials.length}개와 자료 기반 AI 질문을 한 메뉴에서 확인합니다.`}
    >
      <SectionCard title="자료 업로드 박스">
        <div className="rounded-[28px] border border-dashed border-[var(--brand)] bg-[linear-gradient(180deg,rgba(217,231,255,0.5),rgba(255,255,255,0.94))] p-5">
          <p className="text-sm font-semibold text-slate-900">파일 업로드 UI만 제공됩니다</p>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
            실제 파일 선택이나 서버 전송은 연결하지 않고, 버튼을 누르면 mock 자료가 목록 상단에 추가됩니다.
          </p>
          <button
            type="button"
            onClick={() => {
              void queueMockUpload(activeGroup.id);
            }}
            className="mt-4 w-full rounded-2xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(47,110,229,0.24)]"
          >
            {activeGroup.uploadDraftCount > 0
              ? `Mock 자료 ${activeGroup.uploadDraftCount}개 추가됨`
              : "Mock 자료 추가해 보기"}
          </button>
        </div>
      </SectionCard>

      <SectionCard title="자료 목록">
        {materials.map((material) => (
          <div key={material.id} className="rounded-[24px] bg-white/80 p-4">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{material.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {material.uploadedBy} · {formatUploadDate(material.uploadedAt)} · {material.format}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                {material.locationHint}
              </span>
            </div>
            <p className="text-sm leading-6 text-[var(--ink-soft)]">{material.summary}</p>
          </div>
        ))}
      </SectionCard>

      <SectionCard title="자료 기반 AI 질문">
        <div className="flex flex-wrap gap-2">
          {recommendedQuestions.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => {
                void sendQuestion(activeGroup.id, question);
              }}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
            >
              {question}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {activeGroup.chat.map((message) => (
            <div
              key={message.id}
              className={`rounded-[24px] p-4 ${
                message.role === "assistant"
                  ? "bg-white/90"
                  : "ml-auto max-w-[82%] bg-[var(--brand)] text-white"
              }`}
            >
              <p className="whitespace-pre-line text-sm leading-6">{message.text}</p>
              <p
                className={`mt-2 text-[11px] font-medium ${
                  message.role === "assistant" ? "text-slate-400" : "text-blue-100"
                }`}
              >
                {message.createdAt}
              </p>

              {message.role === "assistant" && message.sources && message.sources.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {message.sources.map((source) => (
                    <div key={source.id} className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-sm font-semibold text-slate-900">{source.title}</p>
                      <p className="mt-1 text-xs font-medium text-[var(--brand)]">
                        {source.locationHint}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">
                        {source.summary}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}

          {isAnswering(activeGroup.id) ? (
            <div className="rounded-[24px] bg-white/90 p-4">
              <p className="text-sm font-semibold text-slate-900">답변 생성 중...</p>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">
                업로드된 자료를 근거 카드와 함께 보여주는 mock 응답입니다.
              </p>
            </div>
          ) : null}
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <textarea
            rows={3}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={`${activeGroup.subject} 자료에서 궁금한 점을 입력하세요`}
            className="w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
          />
          <button
            type="submit"
            className="w-full rounded-2xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(47,110,229,0.24)]"
          >
            AI에게 질문하기
          </button>
        </form>
      </SectionCard>
    </AppShell>
  );
}

export function PlanScreen({ groupId }: Readonly<{ groupId: string }>) {
  const { groups, togglePlanItem, updatePlanItem, addPlanItem, isLoading } = usePrototype();
  const group = getGroupById(groups, groupId);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    day: Weekday;
    title: string;
    detail: string;
    duration: string;
  } | null>(null);
  const [newItem, setNewItem] = useState<{
    day: Weekday;
    title: string;
    detail: string;
    duration: string;
  }>({
    day: "금",
    title: "",
    detail: "",
    duration: "30분",
  });

  if (isLoading && !group) {
    return (
      <AppShell
        groupId={groupId}
        title="Loading plan..."
        subtitle="Waiting for the latest plan data from Supabase."
      >
        <LoadingState message="Loading plan items..." />
      </AppShell>
    );
  }

  if (!group) {
    return (
      <AppShell
        groupId={groupId}
        title="학습 계획을 불러오지 못했습니다"
        subtitle="홈에서 다시 진입해 주세요."
      >
        <MissingGroupState />
      </AppShell>
    );
  }

  const activeGroup = group;
  const myProgress = getMemberProgress(activeGroup, currentUserId);

  function startEditing(item: (typeof activeGroup.plan)[number]) {
    setEditingItemId(item.id);
    setEditDraft({
      day: item.day,
      title: item.title,
      detail: item.detail,
      duration: item.duration,
    });
  }

  async function saveEditing() {
    if (!editingItemId || !editDraft) {
      return;
    }

    await updatePlanItem(activeGroup.id, editingItemId, editDraft);
    setEditingItemId(null);
    setEditDraft(null);
  }

  async function addCustomPlan() {
    if (!newItem.title.trim() || !newItem.detail.trim()) {
      return;
    }

    await addPlanItem(activeGroup.id, {
      ...newItem,
      title: newItem.title.trim(),
      detail: newItem.detail.trim(),
    });
    setNewItem({
      day: "금",
      title: "",
      detail: "",
      duration: "30분",
    });
  }

  return (
    <AppShell
      groupId={groupId}
      title="주간 학습 계획"
      subtitle={`자동 생성된 계획을 확인하고, 필요하면 직접 수정하거나 새 일정도 추가할 수 있습니다.`}
    >
      <SectionCard title="이번 주 요약">
        <div className="rounded-[24px] bg-[linear-gradient(140deg,#1e467f_0%,#2f6ee5_100%)] p-4 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-100">Auto Plan</p>
          <p className="mt-2 text-lg font-semibold tracking-[-0.03em]">{activeGroup.weeklyGoal}</p>
          <div className="mt-4 flex items-center justify-between text-sm text-blue-50">
            <span>내 진행률 {myProgress}%</span>
            <span>팀 평균 {getGroupProgress(activeGroup)}%</span>
          </div>
          <div className="mt-2 rounded-full bg-white/20 p-1">
            <ProgressBar value={myProgress} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="요일별 카드">
        {activeGroup.plan.map((item) => {
          const checked = item.memberStatus[currentUserId];
          const isEditing = editingItemId === item.id && editDraft;

          return (
            <div key={item.id} className="rounded-[26px] bg-white/85 p-4">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-[88px_1fr] gap-3">
                    <select
                      value={editDraft.day}
                      onChange={(event) =>
                        setEditDraft((previous) =>
                          previous
                            ? { ...previous, day: event.target.value as Weekday }
                            : previous,
                        )
                      }
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none"
                    >
                      {weekdayOptions.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                    <input
                      value={editDraft.title}
                      onChange={(event) =>
                        setEditDraft((previous) =>
                          previous ? { ...previous, title: event.target.value } : previous,
                        )
                      }
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={editDraft.detail}
                    onChange={(event) =>
                      setEditDraft((previous) =>
                        previous ? { ...previous, detail: event.target.value } : previous,
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  />
                  <div className="flex gap-3">
                    <input
                      value={editDraft.duration}
                      onChange={(event) =>
                        setEditDraft((previous) =>
                          previous ? { ...previous, duration: event.target.value } : previous,
                        )
                      }
                      className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        void saveEditing();
                      }}
                      className="rounded-2xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white"
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItemId(null);
                        setEditDraft(null);
                      }}
                      className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                        {item.day}
                      </p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{item.title}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEditing(item)}
                        className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void togglePlanItem(activeGroup.id, item.id);
                        }}
                        className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                          checked
                            ? "bg-[var(--brand)] text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {checked ? "완료" : "체크"}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-[var(--ink-soft)]">{item.detail}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>{item.duration}</span>
                    <span>
                      완료 {Object.values(item.memberStatus).filter(Boolean).length}/
                      {activeGroup.members.length}
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </SectionCard>

      <SectionCard title="직접 일정 추가">
        <div className="space-y-3 rounded-[24px] bg-white/85 p-4">
          <div className="grid grid-cols-[88px_1fr] gap-3">
            <select
              value={newItem.day}
              onChange={(event) =>
                setNewItem((previous) => ({
                  ...previous,
                  day: event.target.value as Weekday,
                }))
              }
              className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none"
            >
              {weekdayOptions.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
            <input
              value={newItem.title}
              onChange={(event) =>
                setNewItem((previous) => ({ ...previous, title: event.target.value }))
              }
              placeholder="예: 오답노트 직접 정리"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
            />
          </div>
          <textarea
            rows={3}
            value={newItem.detail}
            onChange={(event) =>
              setNewItem((previous) => ({ ...previous, detail: event.target.value }))
            }
            placeholder="직접 넣고 싶은 학습 내용을 적어주세요"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
          />
          <div className="flex gap-3">
            <input
              value={newItem.duration}
              onChange={(event) =>
                setNewItem((previous) => ({ ...previous, duration: event.target.value }))
              }
              className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
            />
            <button
              type="button"
              onClick={() => {
                void addCustomPlan();
              }}
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
            >
              일정 추가
            </button>
          </div>
        </div>
      </SectionCard>
    </AppShell>
  );
}

export function AiScreen({ groupId }: Readonly<{ groupId: string }>) {
  const { groups, sendQuestion, isAnswering, isLoading } = usePrototype();
  const group = getGroupById(groups, groupId);
  const [draft, setDraft] = useState("");

  if (isLoading && !group) {
    return (
      <AppShell
        groupId={groupId}
        title="Loading chat..."
        subtitle="Waiting for the latest AI chat history from Supabase."
      >
        <LoadingState message="Loading chat history..." />
      </AppShell>
    );
  }

  if (!group) {
    return (
      <AppShell
        groupId={groupId}
        title="AI 질문 화면을 불러오지 못했습니다"
        subtitle="홈에서 다시 진입해 주세요."
      >
        <MissingGroupState />
      </AppShell>
    );
  }

  const activeGroup = group;

  const recommendedQuestions = [
    `${activeGroup.subject} 핵심 개념이 뭐야?`,
    "시험 범위에서 중요한 부분만 정리해줘",
    "토론 질문 3개 만들어줘",
  ];

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendQuestion(activeGroup.id, draft);
    setDraft("");
  }

  return (
    <AppShell
      groupId={groupId}
      title="자료 기반 AI 질문"
      subtitle="업로드된 공용 자료를 읽은 것처럼 보이는 mock 답변과 근거 카드가 함께 표시됩니다."
    >
      <SectionCard title="추천 질문">
        <div className="flex flex-wrap gap-2">
          {recommendedQuestions.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => {
                void sendQuestion(activeGroup.id, question);
              }}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
            >
              {question}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="채팅">
        {activeGroup.chat.map((message) => (
          <div
            key={message.id}
            className={`rounded-[24px] p-4 ${
              message.role === "assistant"
                ? "bg-white/90"
                : "ml-auto max-w-[82%] bg-[var(--brand)] text-white"
            }`}
          >
            <p className="whitespace-pre-line text-sm leading-6">{message.text}</p>
            <p
              className={`mt-2 text-[11px] font-medium ${
                message.role === "assistant" ? "text-slate-400" : "text-blue-100"
              }`}
            >
              {message.createdAt}
            </p>

            {message.role === "assistant" && message.sources && message.sources.length > 0 ? (
              <div className="mt-3 space-y-2">
                {message.sources.map((source) => (
                  <div key={source.id} className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-900">{source.title}</p>
                    <p className="mt-1 text-xs font-medium text-[var(--brand)]">
                      {source.locationHint}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">
                      {source.summary}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}

        {isAnswering(activeGroup.id) ? (
          <div className="rounded-[24px] bg-white/90 p-4">
            <p className="text-sm font-semibold text-slate-900">답변 생성 중...</p>
            <p className="mt-1 text-xs text-[var(--ink-soft)]">
              공용 자료에서 근거 카드까지 함께 가져오는 것처럼 표시합니다.
            </p>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="질문 보내기">
        <form className="space-y-3" onSubmit={handleSubmit}>
          <textarea
            rows={3}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={`${activeGroup.subject} 범위에서 궁금한 점을 입력하세요`}
            className="w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
          />
          <button
            type="submit"
            className="w-full rounded-2xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(47,110,229,0.24)]"
          >
            질문하기
          </button>
        </form>
      </SectionCard>
    </AppShell>
  );
}

export function ProgressScreen({ groupId }: Readonly<{ groupId: string }>) {
  const { groups, isLoading } = usePrototype();
  const group = getGroupById(groups, groupId);

  if (isLoading && !group) {
    return (
      <AppShell
        groupId={groupId}
        title="Loading progress..."
        subtitle="Waiting for the latest progress snapshot from Supabase."
      >
        <LoadingState message="Loading progress..." />
      </AppShell>
    );
  }

  if (!group) {
    return (
      <AppShell
        groupId={groupId}
        title="팀원 진도를 불러오지 못했습니다"
        subtitle="홈에서 다시 진입해 주세요."
      >
        <MissingGroupState />
      </AppShell>
    );
  }

  return (
    <AppShell
      groupId={groupId}
      title="팀원 진도"
      subtitle="모임원별 완료율과 어떤 항목을 완료했는지 한 화면에서 볼 수 있습니다."
    >
      <SectionCard title="팀 요약">
        <div className="rounded-[24px] bg-white/85 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">전체 진행률</p>
            <p className="text-sm font-semibold text-[var(--brand)]">{getGroupProgress(group)}%</p>
          </div>
          <ProgressBar value={getGroupProgress(group)} />
        </div>
      </SectionCard>

      <SectionCard title="멤버별 상태">
        {group.members.map((member) => {
          const progress = getMemberProgress(group, member.id);
          const completedCount = group.plan.filter((item) => item.memberStatus[member.id]).length;

          return (
            <div key={member.id} className="rounded-[24px] bg-white/85 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                  <p className="text-xs text-[var(--ink-soft)]">
                    {member.role} · 완료 {completedCount}/{group.plan.length}
                  </p>
                </div>
                <span className="text-sm font-semibold text-[var(--brand)]">{progress}%</span>
              </div>
              <ProgressBar value={progress} />
            </div>
          );
        })}
      </SectionCard>

      <SectionCard title="누가 어떤 항목을 완료했는지">
        {group.plan.map((item) => (
          <div key={item.id} className="rounded-[24px] bg-white/85 p-4">
            <p className="text-sm font-semibold text-slate-900">
              {item.day} · {item.title}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {group.members.map((member) => {
                const completed = item.memberStatus[member.id];

                return (
                  <span
                    key={member.id}
                    className={`rounded-full px-3 py-2 text-xs font-semibold ${
                      completed
                        ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {member.name} {completed ? "완료" : "미완료"}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </SectionCard>
    </AppShell>
  );
}
