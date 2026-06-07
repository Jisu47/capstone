"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { GroupHomeTutorial } from "@/components/group-home-tutorial";
import { AppShell, LoadingState, MissingGroupState } from "@/components/mobile-shell";
import { GroupPageHeader } from "@/components/group-page-header";
import { usePrototype } from "@/components/prototype-provider";
import { StudyRulesModal } from "@/components/study-rules-modal";
import { createGroupJoinCode } from "@/lib/group-join-code";
import { clearPendingGroupHomeTour, hasPendingGroupHomeTour } from "@/lib/group-home-tour";
import { getGroupMembership } from "@/lib/group-membership";
import {
  formatExamDate,
  getDefaultStudyRules,
  getDaysLeft,
  getMemberProgress,
  isDatePast,
  type Member,
  type StudyGroup,
  type UnderstandingLevel,
} from "@/lib/mock-data";

const memberAccents = [
  {
    avatar: "bg-[#E6F5EB] text-[#2F8C5C]",
    track: "bg-[#EDF6F0]",
    fill: "bg-[linear-gradient(90deg,#86D1A0_0%,#4CAF7A_100%)]",
  },
  {
    avatar: "bg-[#EEF7F0] text-[#4B9A6A]",
    track: "bg-[#EDF6F0]",
    fill: "bg-[linear-gradient(90deg,#A7DBB9_0%,#67B487_100%)]",
  },
  {
    avatar: "bg-[#F4F8F5] text-[#5F8F70]",
    track: "bg-[#EEF5F0]",
    fill: "bg-[linear-gradient(90deg,#C6E6D0_0%,#7CB994_100%)]",
  },
];

const weekdayMap = ["일", "월", "화", "수", "목", "금", "토"] as const;

const understandingOptions: Array<{
  value: UnderstandingLevel;
  label: string;
  description: string;
}> = [
  {
    value: "low",
    label: "낮음",
    description: "다시 복습이 필요해요. 복습 예정 항목으로 저장됩니다.",
  },
  {
    value: "medium",
    label: "보통",
    description: "한 번 더 보면 안정적으로 기억할 수 있어요.",
  },
  {
    value: "high",
    label: "높음",
    description: "지금 바로 설명하거나 문제를 풀 수 있는 상태예요.",
  },
];

function getStudyManagementHref(groupId: string) {
  return `/group/${groupId}/plan#study-management`;
}

type GroupActionModal = "invite" | "leave" | "delete" | "transfer" | null;
type PostExamModal = "decision" | "renew" | null;

function getGroupById(groups: StudyGroup[], groupId: string) {
  return groups.find((group) => group.id === groupId);
}

function getTodayWeekday() {
  return weekdayMap[new Date().getDay()];
}

function getTodayFocusTasks(group: StudyGroup, memberId: string) {
  const today = getTodayWeekday();
  const exactDayItems = group.plan.filter((item) => item.day === today);

  if (exactDayItems.length > 0) {
    return exactDayItems.slice(0, 3);
  }

  const pendingItems = group.plan.filter((item) => !item.memberStatus[memberId]);
  if (pendingItems.length > 0) {
    return pendingItems.slice(0, 3);
  }

  return group.plan.slice(0, 3);
}

function getTodayProgressCopy(progress: number, totalCount: number, completedCount: number) {
  if (totalCount === 0) {
    return "오늘 표시할 할 일이 없어요. 계획 탭에서 새 일정을 추가해보세요.";
  }

  if (progress === 100) {
    return "오늘 목표를 모두 마쳤어요. 좋은 흐름을 그대로 이어가보세요.";
  }

  if (completedCount === 0) {
    return "아직 시작하지 않았어요. 오늘 목표를 달성해보세요.";
  }

  return `${totalCount}개 중 ${completedCount}개를 끝냈어요. 지금 흐름이 좋아요.`;
}

function getDdayLabel(daysLeft: number, isPast: boolean) {
  if (isPast) {
    return "마감 지남";
  }

  if (daysLeft === 0) {
    return "D-day";
  }

  return `D-${daysLeft}`;
}

function MeatballIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="5" r="1.8" fill="currentColor" />
      <circle cx="12" cy="12" r="1.8" fill="currentColor" />
      <circle cx="12" cy="19" r="1.8" fill="currentColor" />
    </svg>
  );
}

function CheckIcon({ active }: Readonly<{ active: boolean }>) {
  return (
    <span
      className={`flex h-6 w-6 items-center justify-center rounded-full border transition ${
        active
          ? "border-[#4CAF7A] bg-[#4CAF7A] text-white shadow-[0_8px_18px_rgba(76,175,122,0.24)]"
          : "border-slate-200 bg-white text-transparent"
      }`}
    >
      <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
        <path
          d="M5 12.5L9.5 17L19 7.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </span>
  );
}

function HeroIllustration() {
  return (
    <div className="relative flex h-[126px] w-[118px] shrink-0 items-end justify-end">
      <Image
        src="/hero-study-illustration.svg"
        alt=""
        aria-hidden="true"
        width={132}
        height={144}
        className="h-[122px] w-[112px] object-contain drop-shadow-[0_14px_24px_rgba(35,73,51,0.16)]"
      />
    </div>
  );
}

function StudyRuleIcon() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF8F1] text-[#57AE79]">
      <svg aria-hidden="true" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24">
        <path
          d="M12 3.75 5.75 6.5v5.25c0 3.7 2.55 7.1 6.25 8.5 3.7-1.4 6.25-4.8 6.25-8.5V6.5L12 3.75Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    </span>
  );
}

function StudyRuleCheckIcon() {
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EAF7EE] text-[#48A96D]">
      <svg aria-hidden="true" className="h-3 w-3" fill="none" viewBox="0 0 24 24">
        <path
          d="M5 12.5L9.5 17L19 7.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </span>
  );
}

function ProgressBar({
  value,
  trackClassName,
  fillClassName,
  heightClassName = "h-2.5",
}: Readonly<{
  value: number;
  trackClassName: string;
  fillClassName: string;
  heightClassName?: string;
}>) {
  return (
    <div className={`${heightClassName} w-full overflow-hidden rounded-full ${trackClassName}`}>
      <div
        className={`h-full rounded-full transition-all ${fillClassName}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function MenuActionButton({
  children,
  destructive = false,
  disabled = false,
  onClick,
}: Readonly<{
  children: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-between rounded-[14px] px-3 py-2.5 text-left text-sm font-medium transition ${
        destructive
          ? "text-rose-600 hover:bg-rose-50"
          : "text-slate-700 hover:bg-slate-50"
      } disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent`}
    >
      {children}
    </button>
  );
}

function GroupActionModalShell({
  title,
  description,
  onClose,
  children,
  footer,
}: Readonly<{
  title: string;
  description: string;
  onClose: () => void;
  children?: React.ReactNode;
  footer: React.ReactNode;
}>) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/30 px-4 pb-6 pt-10 sm:items-center">
      <div className="absolute inset-0" aria-hidden="true" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[400px] rounded-[28px] bg-white p-5 shadow-[0_24px_48px_rgba(15,23,42,0.16)]"
      >
        <div className="space-y-2">
          <h3 className="text-[18px] font-semibold tracking-[-0.03em] text-slate-950">{title}</h3>
          <p className="text-sm leading-6 text-slate-600">{description}</p>
        </div>

        {children ? <div className="mt-4">{children}</div> : null}

        <div className="mt-5 flex gap-2">{footer}</div>
      </div>
    </div>
  );
}

export function GroupHomeScreen({ groupId }: Readonly<{ groupId: string }>) {
  const router = useRouter();
  const {
    completeGroup,
    renewGroupCycle,
    groups,
    currentUserId,
    clearPlanItemCompletion,
    completePlanItemWithFeedback,
    deleteGroup,
    deletePersonalPlanItem,
    leaveGroup,
    togglePersonalPlanItem,
    transferGroupLeadership,
    updateGroupStudyRules,
    isLoading,
    isMutating,
  } = usePrototype();
  const { currentUser } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<GroupActionModal>(null);
  const [postExamModal, setPostExamModal] = useState<PostExamModal>(null);
  const [selectedLeaderId, setSelectedLeaderId] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [, bumpTutorialState] = useState(0);
  const [pendingChecklistId, setPendingChecklistId] = useState<string | null>(null);
  const [selectedUnderstanding, setSelectedUnderstanding] = useState<UnderstandingLevel | null>(
    null,
  );
  const [renewalError, setRenewalError] = useState<string | null>(null);
  const [renewalDraft, setRenewalDraft] = useState({
    examDate: "",
    overallGoal: "",
  });
  const [isStudyRulesOpen, setIsStudyRulesOpen] = useState(false);
  const [startStudyRulesInEditMode, setStartStudyRulesInEditMode] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const group = getGroupById(groups, groupId);
  const membership = currentUser && group ? getGroupMembership(group, currentUser.userId) : null;

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handleOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handleOutsideClick);
    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isMenuOpen]);

  if (isLoading && !group) {
    return (
      <AppShell groupId={groupId} title="홈" headerBehavior="fixed">
        <LoadingState message="그룹 정보를 불러오는 중입니다." />
      </AppShell>
    );
  }

  if (!group) {
    return (
      <AppShell groupId={groupId} title="홈" headerBehavior="fixed">
        <MissingGroupState />
      </AppShell>
    );
  }

  if (currentUser && !membership) {
    return (
      <AppShell groupId={groupId} title="홈" headerBehavior="fixed">
        <MissingGroupState />
      </AppShell>
    );
  }

  const activeGroup = group;
  const studyRules = activeGroup.studyRules ?? getDefaultStudyRules();
  const inviteCode = createGroupJoinCode(activeGroup.id);
  const currentMember = activeGroup.members.find((member) => member.id === currentUserId) ?? null;
  const leaderMode = currentMember?.role === "팀장";
  const showTutorial = leaderMode && hasPendingGroupHomeTour(currentUserId, activeGroup.id);
  const shouldPromptPostExamDecision =
    leaderMode && activeGroup.status === "active" && isDatePast(activeGroup.examDate);
  const resolvedPostExamModal = postExamModal ?? (shouldPromptPostExamDecision ? "decision" : null);
  const transferableMembers = activeGroup.members.filter((member) => member.id !== currentUserId);
  const daysLeft = getDaysLeft(activeGroup.examDate);
  const ddayLabel = getDdayLabel(daysLeft, shouldPromptPostExamDecision);
  const memberProgresses = activeGroup.members.map((member, index) => ({
    member,
    progress: getMemberProgress(activeGroup, member.id),
    accent: memberAccents[index % memberAccents.length],
  }));
  const todayTasks = getTodayFocusTasks(activeGroup, currentUserId);
  const personalTasks = activeGroup.personalPlanItems.filter((item) => item.memberId === currentUserId);
  const pendingChecklistItem = todayTasks.find((item) => item.id === pendingChecklistId) ?? null;
  const pendingChecklistChecked = pendingChecklistItem?.memberStatus[currentUserId] ?? false;
  const completedTodayTasks = todayTasks.filter((item) => item.memberStatus[currentUserId]).length;
  const completedPersonalTasks = personalTasks.filter((item) => item.completed).length;
  const totalTaskCount = todayTasks.length + personalTasks.length;
  const completedTaskCount = completedTodayTasks + completedPersonalTasks;
  const todayProgress = totalTaskCount
    ? Math.round((completedTaskCount / totalTaskCount) * 100)
    : 0;
  const todayProgressCopy = getTodayProgressCopy(
    todayProgress,
    totalTaskCount,
    completedTaskCount,
  );
  const greetingName = currentUser?.displayName ?? currentMember?.name ?? "스터디 메이트";

  function closeModal() {
    setActiveModal(null);
    setSelectedLeaderId(null);
    setCopyFeedback(null);
  }

  function closeTutorial() {
    clearPendingGroupHomeTour(currentUserId, activeGroup.id);
    bumpTutorialState((value) => value + 1);
  }

  function handleRenewalDraftChange(key: "examDate" | "overallGoal", value: string) {
    setRenewalDraft((previous) => ({
      ...previous,
      [key]: value,
    }));
    setRenewalError(null);
  }

  function openRenewGroupCycleModal() {
    setRenewalDraft({
      examDate: activeGroup.examDate,
      overallGoal: activeGroup.overallGoal,
    });
    setRenewalError(null);
    setPostExamModal("renew");
  }

  function closeChecklistModal() {
    setPendingChecklistId(null);
    setSelectedUnderstanding(null);
  }

  async function handleCopyInviteCode() {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopyFeedback("초대 코드를 복사했어요.");
    } catch {
      setCopyFeedback("복사에 실패했어요. 다시 한 번 시도해 주세요.");
    }
  }

  async function handleLeaveGroup() {
    try {
      await leaveGroup(activeGroup.id);
      router.replace("/");
    } catch {
      // AppShell error banner handles the message.
    }
  }

  async function handleDeleteGroup() {
    try {
      await deleteGroup(activeGroup.id);
      router.replace("/");
    } catch {
      // AppShell error banner handles the message.
    }
  }

  async function handleTransferGroupLeadership() {
    if (!selectedLeaderId) {
      return;
    }

    try {
      await transferGroupLeadership(activeGroup.id, selectedLeaderId);
      closeModal();
    } catch {
      // AppShell error banner handles the message.
    }
  }

  async function handleCompleteGroup() {
    try {
      await completeGroup(activeGroup.id);
      router.replace("/");
    } catch {
      // AppShell error banner handles the message.
    }
  }

  async function handleRenewGroupCycle() {
    try {
      await renewGroupCycle(activeGroup.id, renewalDraft);
      setPostExamModal(null);
      setRenewalError(null);
    } catch (error) {
      setRenewalError(
        error instanceof Error
          ? error.message
          : "다음 시험 일정과 목표를 저장하지 못했어요.",
      );
    }
  }

  async function confirmChecklistAction() {
    if (!pendingChecklistItem) {
      return;
    }

    if (pendingChecklistChecked) {
      await clearPlanItemCompletion(activeGroup.id, pendingChecklistItem.id);
      closeChecklistModal();
      return;
    }

    if (!selectedUnderstanding) {
      return;
    }

    await completePlanItemWithFeedback(
      activeGroup.id,
      pendingChecklistItem.id,
      selectedUnderstanding,
    );
    closeChecklistModal();
  }

  async function handleDeletePersonalTask(itemId: string) {
    const shouldDelete = window.confirm("이 할 일을 삭제할까요?");

    if (!shouldDelete) {
      return;
    }

    try {
      await deletePersonalPlanItem(itemId);
    } catch {
      // AppShell error banner handles the message.
    }
  }

  async function handleSaveStudyRules(nextRules: string[]) {
    try {
      await updateGroupStudyRules(activeGroup.id, nextRules);
      setIsStudyRulesOpen(false);
      setStartStudyRulesInEditMode(false);
    } catch {
      // AppShell error banner handles the message.
    }
  }

  return (
    <AppShell
      groupId={groupId}
      title={activeGroup.name}
      headerBehavior="fixed"
      headerContent={<GroupPageHeader groupId={activeGroup.id} groupName={activeGroup.name} />}
    >
      <div className="space-y-3.5 pt-5 pb-1">
        <section className="flex items-start justify-between gap-3 px-1">
          <div className="space-y-1">
            <p className="text-[13px] font-medium text-slate-500">안녕하세요, {greetingName}님</p>
            <h1 className="text-[24px] font-semibold tracking-[-0.05em] text-slate-950">
              오늘도 화이팅이에요 💪
            </h1>
          </div>

          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
              onClick={() => setIsMenuOpen((previous) => !previous)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-[0_8px_20px_rgba(15,23,42,0.07)] transition hover:translate-y-[-1px]"
            >
              <MeatballIcon />
            </button>

            {isMenuOpen ? (
              <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-[204px] rounded-[18px] bg-white p-1.5 shadow-[0_16px_34px_rgba(15,23,42,0.12)]">
                <div className="space-y-1">
                  <MenuActionButton
                    onClick={() => {
                      setIsMenuOpen(false);
                      setActiveModal("invite");
                    }}
                  >
                    <span>초대 코드 확인</span>
                  </MenuActionButton>

                  {leaderMode ? (
                    <>
                      <MenuActionButton
                        disabled={transferableMembers.length === 0}
                        onClick={() => {
                          setIsMenuOpen(false);
                          setActiveModal("transfer");
                        }}
                      >
                        <span>팀장 권한 넘기기</span>
                      </MenuActionButton>
                      <MenuActionButton
                        destructive
                        onClick={() => {
                          setIsMenuOpen(false);
                          setActiveModal("delete");
                        }}
                      >
                        <span>그룹 삭제</span>
                      </MenuActionButton>
                    </>
                  ) : (
                    <MenuActionButton
                      destructive
                      onClick={() => {
                        setIsMenuOpen(false);
                        setActiveModal("leave");
                      }}
                    >
                      <span>그룹 나가기</span>
                    </MenuActionButton>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#7FCB95_0%,#67B884_56%,#56AA79_100%)] px-4 pb-4 pt-4 text-white shadow-[0_6px_16px_rgba(15,23,42,0.05)]">
          <div className="absolute inset-x-0 bottom-0 h-20 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.18),transparent_58%)]" />
          <div className="absolute right-[-38px] top-[-34px] h-28 w-28 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-white/80">목표일</p>
              <p className="mt-1 text-[15px] font-semibold tracking-[-0.03em] text-white">
                {formatExamDate(activeGroup.examDate)}
              </p>
            </div>
            <span className="inline-flex shrink-0 rounded-full bg-white/88 px-3 py-1.5 text-[13px] font-semibold text-[#4A9568] shadow-[0_8px_16px_rgba(20,60,38,0.12)]">
              {ddayLabel}
            </span>
          </div>

          <div className="relative mt-4 flex items-end justify-between gap-3">
            <div className="min-w-0 max-w-[190px]">
              <p className="text-sm font-medium text-white/88">오늘 진행률</p>
              <p className="mt-2 text-[40px] font-semibold leading-none tracking-[-0.06em] text-white">
                {todayProgress}%
              </p>

              <div className="mt-3.5">
                <ProgressBar
                  value={todayProgress}
                  trackClassName="bg-white/30"
                  fillClassName="bg-white"
                  heightClassName="h-2"
                />
              </div>

              <p className="mt-4 text-sm leading-6 text-white/88">{todayProgressCopy}</p>
            </div>

            <HeroIllustration />
          </div>
        </section>

        <section className="rounded-[18px] bg-white px-4 py-4 shadow-[0_4px_16px_rgba(15,23,42,0.05)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-[16px] font-semibold tracking-[-0.03em] text-slate-950">
              팀원 진행 현황
            </h2>
            <span className="text-xs font-medium text-slate-400">전체 {activeGroup.members.length}명</span>
          </div>

          <div className="space-y-3">
            {memberProgresses.map(({ member, progress, accent }) => (
              <div key={member.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold ${accent.avatar}`}
                >
                  {(member.name.trim().charAt(0) || "?").toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-slate-900">{member.name}</p>
                  <div className="mt-1.5">
                    <ProgressBar
                      value={progress}
                      trackClassName={accent.track}
                      fillClassName={accent.fill}
                    />
                  </div>
                </div>
                <span className="text-[13px] font-semibold text-slate-500">{progress}%</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[18px] bg-white px-4 py-4 shadow-[0_4px_16px_rgba(15,23,42,0.05)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-slate-950">오늘 할 일</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">
                {completedTaskCount}/{totalTaskCount || 0}
              </span>
              <button
                type="button"
                onClick={() => {
                  void router.push(getStudyManagementHref(activeGroup.id));
                }}
                className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-700 shadow-[0_4px_14px_rgba(15,23,42,0.08)]"
              >
                <span className="text-base leading-none text-slate-500">+</span>
                <span>추가</span>
              </button>
            </div>
          </div>

          {totalTaskCount === 0 ? (
            <div className="rounded-[16px] bg-[#F7FAF8] px-3.5 py-4 text-[13px] leading-5 text-slate-500">
              오늘 표시할 할 일이 없어요. 계획 탭에서 새 일정을 추가해보세요.
            </div>
          ) : (
            <div className="space-y-2">
              {todayTasks.map((item) => {
                const checked = item.memberStatus[currentUserId];

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setPendingChecklistId(item.id);
                    }}
                    className={`flex w-full items-center gap-3 rounded-[15px] px-3 py-2.5 text-left transition ${
                      checked
                        ? "bg-[#F3FAF5]"
                        : "bg-[#FAFCFA] hover:bg-[#F5FBF7]"
                    }`}
                  >
                    <CheckIcon active={checked} />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-[13px] font-medium ${
                          checked ? "text-slate-400 line-through" : "text-slate-900"
                        }`}
                      >
                        {item.title}
                      </p>
                    </div>
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-slate-300"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M9 6L15 12L9 18"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                    </svg>
                  </button>
                );
              })}

              {personalTasks.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 rounded-[15px] px-3 py-2.5 transition ${
                    item.completed
                      ? "bg-[#F3FAF5]"
                      : "bg-[#FAFCFA] hover:bg-[#F5FBF7]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      void togglePersonalPlanItem(item.id, !item.completed);
                    }}
                    className="shrink-0"
                  >
                    <CheckIcon active={item.completed} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void togglePersonalPlanItem(item.id, !item.completed);
                    }}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p
                      className={`truncate text-[13px] font-medium ${
                        item.completed ? "text-slate-400 line-through" : "text-slate-900"
                      }`}
                    >
                      {item.title}
                    </p>
                    {item.detail ? (
                      <p
                        className={`mt-1 truncate text-[11px] ${
                          item.completed ? "text-slate-300" : "text-slate-400"
                        }`}
                      >
                        {item.detail}
                      </p>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    aria-label="할 일 삭제"
                    onClick={() => {
                      void handleDeletePersonalTask(item.id);
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-300 transition hover:bg-white hover:text-slate-500"
                  >
                    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M7 7L17 17M17 7L7 17"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth="1.8"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="relative overflow-hidden rounded-[18px] border border-slate-200 bg-white px-4 py-4 shadow-[0_4px_16px_rgba(15,23,42,0.05)]">
          <div className="absolute bottom-3 right-3 opacity-90">
            <div className="rounded-[18px] bg-[linear-gradient(180deg,#EBF8EF_0%,#F7FCF8_100%)] p-3 shadow-[0_8px_18px_rgba(121,184,149,0.08)]">
              <svg aria-hidden="true" className="h-14 w-14 text-[#62B57F]" fill="none" viewBox="0 0 64 64">
                <path
                  d="M13 18.5c0-2.49 2.01-4.5 4.5-4.5h26c2.49 0 4.5 2.01 4.5 4.5v27.5c0 2.21-1.79 4-4 4H18c-2.76 0-5-2.24-5-5V18.5Z"
                  fill="currentColor"
                  fillOpacity="0.15"
                  stroke="currentColor"
                  strokeWidth="2.25"
                />
                <path
                  d="M20 18h24v28H20a4 4 0 0 0-4 4V22a4 4 0 0 1 4-4Z"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="2.25"
                />
                <path d="M27 23h10" stroke="currentColor" strokeLinecap="round" strokeWidth="2.25" />
                <path d="M26 52 20 46" stroke="currentColor" strokeLinecap="round" strokeWidth="2.25" />
              </svg>
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <StudyRuleIcon />
              <h2 className="text-[16px] font-semibold tracking-[-0.03em] text-slate-950">
                스터디 규칙
              </h2>
            </div>

            <button
              type="button"
              disabled={!leaderMode}
              onClick={() => {
                setStartStudyRulesInEditMode(true);
                setIsStudyRulesOpen(true);
              }}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-[var(--brand)] shadow-[0_4px_12px_rgba(15,23,42,0.04)] disabled:cursor-not-allowed disabled:text-slate-300"
            >
              수정하기
            </button>
          </div>

          <div className="max-w-[78%] space-y-2.5">
            {studyRules.map((rule, index) => (
              <div key={`${rule}-${index + 1}`} className="flex items-start gap-3">
                <StudyRuleCheckIcon />
                <p className="text-[14px] leading-6 text-slate-700">{rule}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {isStudyRulesOpen ? (
        <StudyRulesModal
          key={`${activeGroup.id}:${startStudyRulesInEditMode ? "edit" : "view"}:${studyRules.join("|")}`}
          canEdit={leaderMode}
          isOpen
          isSaving={isMutating}
          startInEditMode={startStudyRulesInEditMode}
          studyRules={studyRules}
          onClose={() => {
            setIsStudyRulesOpen(false);
            setStartStudyRulesInEditMode(false);
          }}
          onSave={handleSaveStudyRules}
        />
      ) : null}

      <GroupHomeTutorial
        key={showTutorial ? `${activeGroup.id}:open` : `${activeGroup.id}:closed`}
        open={showTutorial}
        groupId={activeGroup.id}
        hasMaterials={activeGroup.materials.length > 0}
        hasPlanReferenceUploads={activeGroup.planReferenceUploads.length > 0}
        onClose={closeTutorial}
      />

      {resolvedPostExamModal === "decision" ? (
        <GroupActionModalShell
          title="스터디 일정이 지났어요"
          description={`${formatExamDate(activeGroup.examDate)} 기준으로 목표 일정이 지났습니다. 이 스터디를 종료할지, 새 일정과 목표로 이어갈지 선택해 주세요.`}
          onClose={() => {}}
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  void handleCompleteGroup();
                }}
                disabled={isMutating}
                className="flex-1 rounded-[16px] bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.26)] disabled:opacity-70"
              >
                스터디 종료
              </button>
              <button
                type="button"
                onClick={openRenewGroupCycleModal}
                className="flex-1 rounded-[16px] bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white"
              >
                새 목표로 이어가기
              </button>
            </>
          }
        />
      ) : null}

      {resolvedPostExamModal === "renew" ? (
        <GroupActionModalShell
          title="새 시험 일정과 목표 설정"
          description="다음 사이클을 위해 새로운 목표일과 전체 목표를 입력해 주세요."
          onClose={() => setPostExamModal("decision")}
          footer={
            <>
              <button
                type="button"
                onClick={() => setPostExamModal("decision")}
                className="flex-1 rounded-[16px] bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.26)]"
              >
                이전으로
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleRenewGroupCycle();
                }}
                disabled={isMutating}
                className="flex-1 rounded-[16px] bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                저장하기
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">목표 날짜</span>
              <input
                type="date"
                value={renewalDraft.examDate}
                onChange={(event) => handleRenewalDraftChange("examDate", event.target.value)}
                className="w-full rounded-[16px] bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-[inset_0_0_0_1px_rgba(148,163,184,0.20)] transition focus:ring-4 focus:ring-[rgba(76,175,122,0.16)]"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">전체 목표</span>
              <textarea
                rows={3}
                value={renewalDraft.overallGoal}
                onChange={(event) => handleRenewalDraftChange("overallGoal", event.target.value)}
                className="w-full rounded-[16px] bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-[inset_0_0_0_1px_rgba(148,163,184,0.20)] transition focus:ring-4 focus:ring-[rgba(76,175,122,0.16)]"
              />
            </label>
            {renewalError ? (
              <p className="rounded-[14px] bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {renewalError}
              </p>
            ) : null}
          </div>
        </GroupActionModalShell>
      ) : null}

      {pendingChecklistItem ? (
        <GroupActionModalShell
          title={pendingChecklistChecked ? "체크 해제" : "이해도 체크"}
          description={pendingChecklistItem.title}
          onClose={closeChecklistModal}
          footer={
            <>
              <button
                type="button"
                onClick={closeChecklistModal}
                className="flex-1 rounded-[16px] bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.26)]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  void confirmChecklistAction();
                }}
                disabled={isMutating || (!pendingChecklistChecked && !selectedUnderstanding)}
                className="flex-1 rounded-[16px] bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {isMutating ? "처리 중" : pendingChecklistChecked ? "해제하기" : "완료"}
              </button>
            </>
          }
        >
          <div className="space-y-3">
            {pendingChecklistChecked ? (
              <p className="rounded-[14px] bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-500">
                완료 체크를 해제할까요? 이미 저장된 복습 예정 항목이나 현재 개인 할 일은 그대로 유지됩니다.
              </p>
            ) : (
              <>
                <p className="rounded-[14px] bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-500">
                  이 할 일을 어느 정도 이해했는지 선택해 주세요. 이해도가 낮으면 복습 예정 항목으로 저장되고,
                  복습 간격이 지나면 개인 할 일로 자동 추가됩니다.
                </p>
                <div className="space-y-2">
                  {understandingOptions.map((option) => {
                    const active = selectedUnderstanding === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSelectedUnderstanding(option.value)}
                        className={`w-full rounded-[14px] border px-4 py-3 text-left transition ${
                          active
                            ? "border-[var(--brand)] bg-[var(--brand-soft)] shadow-[0_6px_16px_rgba(121,184,149,0.10)]"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {option.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </GroupActionModalShell>
      ) : null}

      {activeModal === "invite" ? (
        <GroupActionModalShell
          title="초대 코드 확인"
          description="이 코드를 팀원에게 공유하면 같은 그룹에 참여할 수 있어요."
          onClose={closeModal}
          footer={
            <>
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-[16px] bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.26)]"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleCopyInviteCode();
                }}
                className="flex-1 rounded-[16px] bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white"
              >
                복사하기
              </button>
            </>
          }
        >
          <div className="rounded-[22px] bg-[var(--brand-soft)] px-4 py-4 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Group Invite Code
            </p>
            <p className="mt-2 text-[22px] font-semibold tracking-[0.16em] text-[var(--brand)]">
              {inviteCode}
            </p>
            {copyFeedback ? (
              <p className="mt-3 text-sm font-medium text-slate-600">{copyFeedback}</p>
            ) : null}
          </div>
        </GroupActionModalShell>
      ) : null}

      {activeModal === "leave" ? (
        <GroupActionModalShell
          title="정말 그룹에서 나가시겠어요?"
          description="나가면 이 그룹의 스터디 계획과 자료 화면에 더 이상 접근할 수 없어요."
          onClose={closeModal}
          footer={
            <>
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-[16px] bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.26)]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleLeaveGroup();
                }}
                disabled={isMutating}
                className="flex-1 rounded-[16px] bg-rose-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                나가기
              </button>
            </>
          }
        />
      ) : null}

      {activeModal === "delete" ? (
        <GroupActionModalShell
          title="정말 이 그룹을 삭제할까요?"
          description="삭제하면 이 그룹의 계획, 자료, 초대 코드가 모두 사라져요."
          onClose={closeModal}
          footer={
            <>
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-[16px] bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.26)]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleDeleteGroup();
                }}
                disabled={isMutating}
                className="flex-1 rounded-[16px] bg-rose-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                삭제하기
              </button>
            </>
          }
        />
      ) : null}

      {activeModal === "transfer" ? (
        <GroupActionModalShell
          title="팀장 권한 넘기기"
          description="새 팀장을 선택하면 현재 사용자는 일반 팀원으로 전환돼요."
          onClose={closeModal}
          footer={
            <>
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-[16px] bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.26)]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleTransferGroupLeadership();
                }}
                disabled={!selectedLeaderId || isMutating}
                className="flex-1 rounded-[16px] bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                넘기기
              </button>
            </>
          }
        >
          {transferableMembers.length > 0 ? (
            <div className="space-y-2">
              {transferableMembers.map((member: Member) => {
                const selected = selectedLeaderId === member.id;

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setSelectedLeaderId(member.id)}
                    className={`flex w-full items-center justify-between rounded-[18px] px-4 py-3 text-left transition ${
                      selected
                        ? "bg-[var(--brand-soft)] shadow-[inset_0_0_0_1px_rgba(76,175,122,0.28)]"
                        : "bg-white shadow-[inset_0_0_0_1px_rgba(148,163,184,0.18)]"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{member.focus}</p>
                    </div>
                    {selected ? (
                      <span className="text-xs font-semibold text-[var(--brand)]">선택됨</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[18px] bg-slate-50 px-4 py-4 text-sm text-slate-600">
              권한을 넘길 다른 팀원이 아직 없어요.
            </div>
          )}
        </GroupActionModalShell>
      ) : null}
    </AppShell>
  );
}
