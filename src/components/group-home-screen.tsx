"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { GroupHomeTutorial } from "@/components/group-home-tutorial";
import { AppShell, LoadingState, MissingGroupState } from "@/components/mobile-shell";
import { GroupPageHeader } from "@/components/group-page-header";
import { usePrototype } from "@/components/prototype-provider";
import { createGroupJoinCode } from "@/lib/group-join-code";
import { clearPendingGroupHomeTour, hasPendingGroupHomeTour } from "@/lib/group-home-tour";
import { getGroupMembership } from "@/lib/group-membership";
import {
  formatExamDate,
  getDaysLeft,
  getGroupProgress,
  getMemberProgress,
  isDatePast,
  type Member,
  type StudyGroup,
} from "@/lib/mock-data";

const memberAccents = [
  {
    segment: "bg-emerald-300",
    bar: "bg-[linear-gradient(90deg,#86efac,#4ade80)]",
  },
  {
    segment: "bg-green-300",
    bar: "bg-[linear-gradient(90deg,#86efac,#65a30d)]",
  },
  {
    segment: "bg-teal-300",
    bar: "bg-[linear-gradient(90deg,#99f6e4,#2dd4bf)]",
  },
  {
    segment: "bg-lime-300",
    bar: "bg-[linear-gradient(90deg,#d9f99d,#84cc16)]",
  },
];

type GroupActionModal = "invite" | "leave" | "delete" | "transfer" | null;
type PostExamModal = "decision" | "renew" | null;

function getGroupById(groups: StudyGroup[], groupId: string) {
  return groups.find((group) => group.id === groupId);
}

function ProgressTrack({
  value,
  className,
}: Readonly<{
  value: number;
  className: string;
}>) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full transition-all ${className}`} style={{ width: `${value}%` }} />
    </div>
  );
}

function SegmentedProgressTrack({
  segments,
}: Readonly<{
  segments: Array<{
    id: string;
    width: number;
    className: string;
  }>;
}>) {
  const filledWidth = segments.reduce((sum, segment) => sum + segment.width, 0);

  return (
    <div className="overflow-hidden rounded-full border border-slate-200 bg-white">
      <div className="flex h-3.5 w-full">
        {segments.map((segment) => (
          <div
            key={segment.id}
            className={segment.className}
            style={{ width: `${segment.width}%` }}
          />
        ))}
        <div className="bg-slate-100" style={{ width: `${Math.max(0, 100 - filledWidth)}%` }} />
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="rounded-[14px] border border-slate-200 bg-white px-3 py-3 shadow-[0_4px_10px_rgba(15,23,42,0.03)]">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function getSummaryText(group: StudyGroup) {
  const description = group.description.trim();
  if (description) {
    return description;
  }

  return group.overallGoal.trim();
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
      className={`flex w-full items-center justify-between rounded-[12px] px-3 py-2.5 text-left text-sm font-medium transition ${
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
      <div
        className="absolute inset-0"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[400px] rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_24px_48px_rgba(15,23,42,0.16)]"
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
    deleteGroup,
    leaveGroup,
    transferGroupLeadership,
    isLoading,
    isMutating,
  } = usePrototype();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<GroupActionModal>(null);
  const [postExamModal, setPostExamModal] = useState<PostExamModal>(null);
  const [selectedLeaderId, setSelectedLeaderId] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [, bumpTutorialState] = useState(0);
  const [renewalError, setRenewalError] = useState<string | null>(null);
  const [renewalDraft, setRenewalDraft] = useState({
    examDate: "",
    weeklyGoal: "",
    overallGoal: "",
  });
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { currentUser } = useAuth();
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
      <AppShell groupId={groupId} title="홈">
        <LoadingState message="그룹 정보를 불러오는 중입니다." />
      </AppShell>
    );
  }

  if (!group) {
    return (
      <AppShell groupId={groupId} title="홈">
        <MissingGroupState />
      </AppShell>
    );
  }

  if (currentUser && !membership) {
    return (
      <AppShell groupId={groupId} title="홈">
        <MissingGroupState />
      </AppShell>
    );
  }

  const activeGroup = group;
  const inviteCode = createGroupJoinCode(activeGroup.id);
  const leader =
    activeGroup.members.find((member) => member.role === "팀장") ?? activeGroup.members[0];
  const currentMember =
    activeGroup.members.find((member) => member.id === currentUserId) ?? null;
  const leaderMode = currentMember?.role === "팀장";
  const showTutorial = leaderMode && hasPendingGroupHomeTour(currentUserId, activeGroup.id);
  const shouldPromptPostExamDecision =
    leaderMode && activeGroup.status === "active" && isDatePast(activeGroup.examDate);
  const resolvedPostExamModal = postExamModal ?? (shouldPromptPostExamDecision ? "decision" : null);
  const transferableMembers = activeGroup.members.filter((member) => member.id !== currentUserId);
  const daysLeft = getDaysLeft(activeGroup.examDate);
  const groupProgress = getGroupProgress(activeGroup);
  const summaryText = getSummaryText(activeGroup);
  const totalSlots = activeGroup.plan.length * activeGroup.members.length;
  const completedSlots = activeGroup.plan.reduce((count, item) => {
    return count + Object.values(item.memberStatus).filter(Boolean).length;
  }, 0);
  const memberProgresses = activeGroup.members.map((member, index) => ({
    member,
    progress: getMemberProgress(activeGroup, member.id),
    accent: memberAccents[index % memberAccents.length],
  }));
  const memberProgressTotal = memberProgresses.reduce((sum, item) => sum + item.progress, 0);
  const segmentedProgress = memberProgresses
    .filter((item) => item.progress > 0 && memberProgressTotal > 0)
    .map((item) => ({
      id: item.member.id,
      width: (item.progress / memberProgressTotal) * groupProgress,
      className: item.accent.segment,
    }));

  function closeModal() {
    setActiveModal(null);
    setSelectedLeaderId(null);
    setCopyFeedback(null);
  }

  function closeTutorial() {
    clearPendingGroupHomeTour(currentUserId, activeGroup.id);
    bumpTutorialState((value) => value + 1);
  }

  function handleRenewalDraftChange(
    key: "examDate" | "weeklyGoal" | "overallGoal",
    value: string,
  ) {
    setRenewalDraft((previous) => ({
      ...previous,
      [key]: value,
    }));
    setRenewalError(null);
  }

  function openRenewGroupCycleModal() {
    setRenewalDraft({
      examDate: activeGroup.examDate,
      weeklyGoal: activeGroup.weeklyGoal,
      overallGoal: activeGroup.overallGoal,
    });
    setRenewalError(null);
    setPostExamModal("renew");
  }

  async function handleCopyInviteCode() {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopyFeedback("초대코드를 복사했어요.");
    } catch {
      setCopyFeedback("복사에 실패했어요. 잠시 후 다시 시도해 주세요.");
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
        error instanceof Error ? error.message : "새 시험 일정과 목표를 저장하지 못했어요.",
      );
    }
  }

  return (
    <AppShell
      groupId={groupId}
      title="홈"
      headerContent={<GroupPageHeader groupId={activeGroup.id} groupName={activeGroup.name} />}
    >
      <div className="space-y-4">
        <section className="rounded-[18px] border border-slate-200 bg-white px-4 py-5 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                {activeGroup.subject}
              </p>
              <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.04em] text-slate-950">
                {activeGroup.name}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{summaryText}</p>
            </div>

            <div ref={menuRef} className="relative shrink-0">
              <button
                type="button"
                aria-expanded={isMenuOpen}
                aria-haspopup="menu"
                onClick={() => setIsMenuOpen((previous) => !previous)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-[0_4px_10px_rgba(15,23,42,0.03)] transition hover:bg-slate-50"
              >
                <MeatballIcon />
              </button>

              {isMenuOpen ? (
                <div className="absolute right-0 top-[calc(100%+10px)] z-40 w-[220px] rounded-[18px] border border-slate-200 bg-white p-2 shadow-[0_16px_32px_rgba(15,23,42,0.12)]">
                  <div className="space-y-1">
                    <MenuActionButton
                      onClick={() => {
                        setIsMenuOpen(false);
                        setActiveModal("invite");
                      }}
                    >
                      <span>초대코드 확인</span>
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
                          <span>팀장 위임</span>
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
                        <span>그룹 탈퇴</span>
                      </MenuActionButton>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <SummaryItem label="팀장" value={leader?.name ?? "미정"} />
            <SummaryItem label="팀원" value={`${activeGroup.members.length}명`} />
            <SummaryItem label="목표 날짜" value={formatExamDate(activeGroup.examDate)} />
            <SummaryItem
              label="목표까지"
              value={shouldPromptPostExamDecision ? "일정 지남" : daysLeft === 0 ? "D-day" : `D-${daysLeft}`}
            />
          </div>
        </section>

        <section className="space-y-2 px-1">
          <div className="flex items-end justify-between gap-3">
            <p className="text-[18px] font-semibold tracking-[-0.03em] text-slate-900">
              오늘의 진행도
            </p>
            <p className="text-[24px] font-semibold tracking-[-0.05em] text-slate-950">
              {groupProgress}%
            </p>
          </div>

          <SegmentedProgressTrack segments={segmentedProgress} />

          <p className="text-xs text-slate-500">
            총 {completedSlots}/{totalSlots}개 체크 완료
          </p>
        </section>

        <section className="rounded-[18px] border border-slate-200 bg-white px-4 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold text-slate-900">팀원별 진행 현황</h2>
            <span className="text-xs text-slate-500">{activeGroup.members.length}명</span>
          </div>

          <div className="space-y-4">
            {memberProgresses.map(({ member, progress, accent }) => (
              <div key={member.id} className="grid grid-cols-[64px_1fr_auto] items-center gap-3">
                <p className="truncate text-sm font-medium text-slate-900">{member.name}</p>
                <ProgressTrack value={progress} className={accent.bar} />
                <span className="text-xs font-semibold text-slate-500">{progress}%</span>
              </div>
            ))}
          </div>
        </section>
      </div>

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
          title="스터디 일정이 끝났어요"
          description={`${formatExamDate(activeGroup.examDate)} 기준 일정이 지났습니다. 이 스터디를 수료할지, 새로운 날짜와 목표로 이어갈지 결정해 주세요.`}
          onClose={() => {}}
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  void handleCompleteGroup();
                }}
                disabled={isMutating}
                className="flex-1 rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-70"
              >
                스터디 수료
              </button>
              <button
                type="button"
                onClick={openRenewGroupCycleModal}
                className="flex-1 rounded-[16px] bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white"
              >
                새 날짜와 목표 설정
              </button>
            </>
          }
        />
      ) : null}

      {resolvedPostExamModal === "renew" ? (
        <GroupActionModalShell
          title="새 시험 일정과 목표 설정"
          description="다음 스터디 주기를 위해 새로운 D-day와 목표를 저장해 주세요."
          onClose={() => setPostExamModal("decision")}
          footer={
            <>
              <button
                type="button"
                onClick={() => setPostExamModal("decision")}
                className="flex-1 rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
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
              <span className="text-sm font-semibold text-slate-800">새 D-day</span>
              <input
                type="date"
                value={renewalDraft.examDate}
                onChange={(event) => handleRenewalDraftChange("examDate", event.target.value)}
                className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(121,184,149,0.16)]"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">새 이번 목표</span>
              <textarea
                rows={3}
                value={renewalDraft.weeklyGoal}
                onChange={(event) => handleRenewalDraftChange("weeklyGoal", event.target.value)}
                className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(121,184,149,0.16)]"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">전체 목표</span>
              <textarea
                rows={3}
                value={renewalDraft.overallGoal}
                onChange={(event) => handleRenewalDraftChange("overallGoal", event.target.value)}
                className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(121,184,149,0.16)]"
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

      {activeModal === "invite" ? (
        <GroupActionModalShell
          title="초대코드 확인"
          description="이 코드를 팀원에게 공유하면 같은 그룹에 참여할 수 있어요."
          onClose={closeModal}
          footer={
            <>
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
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
          <div className="rounded-[18px] border border-slate-200 bg-[var(--brand-soft)] px-4 py-4 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              그룹 초대코드
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
          title="정말 이 그룹에서 탈퇴하시겠어요?"
          description="탈퇴하면 이 그룹의 홈, 스터디, 계획, 자료 화면에 더 이상 접근할 수 없어요."
          onClose={closeModal}
          footer={
            <>
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
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
                탈퇴하기
              </button>
            </>
          }
        />
      ) : null}

      {activeModal === "delete" ? (
        <GroupActionModalShell
          title="정말 이 그룹을 삭제하시겠어요?"
          description="삭제하면 이 그룹의 홈, 스터디, 계획, 자료와 초대코드가 모두 사라져요."
          onClose={closeModal}
          footer={
            <>
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
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
          title="팀장 위임"
          description="새 팀장을 선택하면 현재 사용자는 팀원으로 전환돼요."
          onClose={closeModal}
          footer={
            <>
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
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
                위임하기
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
                    className={`flex w-full items-center justify-between rounded-[16px] border px-4 py-3 text-left transition ${
                      selected
                        ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                        : "border-slate-200 bg-white hover:border-slate-300"
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
            <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              위임할 수 있는 다른 팀원이 아직 없어요.
            </div>
          )}
        </GroupActionModalShell>
      ) : null}
    </AppShell>
  );
}
