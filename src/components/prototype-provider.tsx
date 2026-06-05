"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { type AuthUser, type UserRole, useAuth } from "@/components/auth-provider";
import type { AiChatRequest, AiChatScope } from "@/lib/ai-chat";
import { uploadMaterial } from "@/lib/client-api";
import {
  buildMemberWeaknessInsights,
  recordMaterialQuestion,
  recordMaterialView as saveMaterialView,
  type MemberWeaknessInsight,
} from "@/lib/material-analytics";
import {
  createMemberProfile,
  currentUserId as fallbackCurrentUserId,
  type CreateGroupInput,
  type GroupDetailsInput,
  type Member,
  type ReviewIntervalDays,
  type StudyGroup,
  type UnderstandingLevel,
  type Weekday,
} from "@/lib/mock-data";
import type {
  PersonalPlanItemDraft,
  PlanAgentDraft,
  PlanReferenceUploadDraft,
  SavedPersonalTaskDraft,
} from "@/lib/plan-flow";
import { getReviewIntervalLabel } from "@/lib/plan-flow";
import {
  addPrototypeAssistantAnswer,
  addPrototypeDueReviewCandidateTodos,
  addPrototypePersonalPlanItem,
  addSavedTaskToPrototypePersonalPlan,
  addPrototypePlanItem,
  addPrototypePlanReferenceUpload,
  addPrototypeUpload,
  addPrototypeUploadedMaterial,
  addPrototypeUserQuestion,
  deletePrototypePersonalTaskLibraryItem,
  applyPrototypePlanAgentDraft,
  bootstrapPrototypeGroups,
  clearPrototypePlanItemCompletion,
  completePrototypePlanItemWithFeedback,
  completePrototypeGroup,
  createPrototypeGroup,
  deletePrototypeGroup,
  savePrototypePersonalTaskLibraryItem,
  ensurePrototypeGroupMembership,
  leavePrototypeGroup,
  listPrototypeGroups,
  syncPrototypeProfile,
  togglePrototypePersonalPlanItem,
  togglePrototypePlanItem,
  transferPrototypeGroupLeadership,
  updatePrototypeGroupDetails,
  updatePrototypePersonalPlanItem,
  updatePrototypePersonalTaskLibraryItem,
  updatePrototypePlanItem,
  updatePrototypeReviewDays,
  updatePrototypeReviewInterval,
  renewPrototypeGroupCycle,
  type PlanItemDraft,
} from "@/lib/prototype-repository";

type PrototypeContextValue = {
  groups: StudyGroup[];
  allGroups: StudyGroup[];
  currentUserId: string;
  error: string | null;
  isLoading: boolean;
  isMutating: boolean;
  createGroup: (input: CreateGroupInput) => Promise<string>;
  joinGroup: (groupId: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  transferGroupLeadership: (groupId: string, nextLeaderId: string) => Promise<void>;
  completeGroup: (groupId: string) => Promise<void>;
  renewGroupCycle: (
    groupId: string,
    input: { examDate: string; weeklyGoal: string; overallGoal: string },
  ) => Promise<void>;
  syncCurrentUserProfile: () => Promise<void>;
  updateGroupDetails: (groupId: string, updates: GroupDetailsInput) => Promise<void>;
  togglePlanItem: (groupId: string, itemId: string) => Promise<void>;
  clearPlanItemCompletion: (groupId: string, itemId: string) => Promise<void>;
  completePlanItemWithFeedback: (
    groupId: string,
    itemId: string,
    understandingLevel: UnderstandingLevel,
  ) => Promise<void>;
  updatePlanItem: (groupId: string, itemId: string, updates: PlanItemDraft) => Promise<void>;
  addPlanItem: (groupId: string, item: PlanItemDraft) => Promise<void>;
  queueMockUpload: (groupId: string) => Promise<void>;
  uploadMaterialFile: (groupId: string, file: File) => Promise<void>;
  recordMaterialView: (
    groupId: string,
    materialId: string,
    title: string,
    locationHint: string,
    durationMs: number,
  ) => void;
  getWeaknessInsights: (groupId: string) => MemberWeaknessInsight[];
  uploadPlanReference: (
    groupId: string,
    upload: PlanReferenceUploadDraft,
  ) => Promise<void>;
  updateReviewDays: (groupId: string, reviewDays: Weekday[]) => Promise<void>;
  updateReviewInterval: (
    groupId: string,
    reviewIntervalDays: ReviewIntervalDays | null,
  ) => Promise<void>;
  addPersonalPlanItem: (groupId: string, item: PersonalPlanItemDraft) => Promise<void>;
  updatePersonalPlanItem: (itemId: string, item: PersonalPlanItemDraft) => Promise<void>;
  togglePersonalPlanItem: (itemId: string, completed: boolean) => Promise<void>;
  savePersonalTaskLibraryItem: (groupId: string, item: SavedPersonalTaskDraft) => Promise<void>;
  updatePersonalTaskLibraryItem: (
    itemId: string,
    item: SavedPersonalTaskDraft,
  ) => Promise<void>;
  deletePersonalTaskLibraryItem: (itemId: string) => Promise<void>;
  addSavedTaskToPersonalPlan: (groupId: string, savedTaskId: string) => Promise<void>;
  sendQuestion: (groupId: string, question: string) => Promise<void>;
  sendPlanAgentMessage: (groupId: string, question: string) => Promise<void>;
  applyPlanAgentDraft: (groupId: string, draft: PlanAgentDraft) => Promise<void>;
  isAnswering: (groupId: string) => boolean;
  isPlanAgentAnswering: (groupId: string) => boolean;
  getPlanAgentStatus: (groupId: string) => string | null;
};

const PrototypeContext = createContext<PrototypeContextValue | null>(null);

function getGroupById(groups: StudyGroup[], groupId: string) {
  return groups.find((group) => group.id === groupId);
}

function getPendingAnswerKey(groupId: string, scope: "materials" | "plan-agent") {
  return `${scope}:${groupId}`;
}

type PlanAgentStatusSequence = {
  intervalId: number | null;
  timeoutIds: number[];
};

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (
      error.message.includes("study_groups") ||
      error.message.includes("relation") ||
      error.message.includes("schema cache") ||
      error.message.includes("presentation_date") ||
      error.message.includes("deadline_date") ||
      error.message.includes("overall_goal") ||
      error.message.includes("review_days") ||
      error.message.includes("reference_unit_sequence") ||
      error.message.includes("plan_reference_uploads") ||
      error.message.includes("plan_reference_units") ||
      error.message.includes("group_roadmap_items") ||
      error.message.includes("review_candidates") ||
      error.message.includes("personal_plan_items") ||
      error.message.includes("personal_task_library_items") ||
      error.message.includes("plan_item_feedbacks") ||
      error.message.includes("review_interval_days") ||
      error.message.includes("source_plan_item_id") ||
      error.message.includes("scope")
    ) {
      return "Supabase 스키마가 아직 준비되지 않았어요. bootstrap SQL을 먼저 실행해 주세요.";
    }

    if (error.message.includes("NEXT_PUBLIC_SUPABASE")) {
      return "Supabase 환경 변수가 비어 있어요.";
    }

    if (error.message.includes("GEMINI_API_KEY")) {
      return "Gemini API 키가 비어 있어요.";
    }

    return error.message;
  }

  return "알 수 없는 오류가 발생했어요.";
}

function buildCurrentMember(user: AuthUser, roleOverride?: UserRole | null): Member {
  const resolvedRole = roleOverride ?? user.role ?? "member";

  return createMemberProfile({
    id: user.userId,
    name: user.displayName.trim() || user.email,
    role: resolvedRole === "leader" ? "팀장" : "팀원",
    focus: resolvedRole === "leader" ? "그룹 운영" : "학습 정리",
    bio: user.bio,
    avatarPreset: user.avatarPreset,
  });
}

function syncCurrentMemberGroupState(group: StudyGroup, currentMember: Member | null) {
  if (!currentMember) {
    return group;
  }

  const hasCurrentMember = group.members.some((member) => member.id === currentMember.id);

  if (!hasCurrentMember) {
    return group;
  }

  const members = group.members.map((member) =>
    member.id === currentMember.id
      ? {
          ...member,
          ...currentMember,
        }
      : member,
  );

  return {
    ...group,
    members,
    reviewIntervals: {
      ...group.reviewIntervals,
      [currentMember.id]: group.reviewIntervals[currentMember.id] ?? null,
    },
    plan: group.plan.map((item) => ({
      ...item,
      memberStatus: {
        ...item.memberStatus,
        [currentMember.id]: item.memberStatus[currentMember.id] ?? false,
      },
    })),
    materials: group.materials.map((material) =>
      material.uploadedByMemberId === currentMember.id
        ? {
            ...material,
            uploadedBy: currentMember.name,
          }
        : material,
    ),
  };
}

function filterVisibleGroups(
  groups: StudyGroup[],
  currentUserId: string | null,
  joinedGroupId: string | null,
) {
  const activeGroups = groups.filter((group) => group.status === "active");

  if (!currentUserId) {
    return activeGroups;
  }

  return activeGroups.filter((group) => {
    return (
      group.members.some((member) => member.id === currentUserId) ||
      group.id === joinedGroupId
    );
  });
}

function findActiveMembershipGroups(groups: StudyGroup[], memberId: string | null) {
  if (!memberId) {
    return [];
  }

  return groups.filter(
    (group) =>
      group.status === "active" &&
      group.members.some((member) => member.id === memberId),
  );
}

function getMemberAuthRole(group: StudyGroup, memberId: string): UserRole | null {
  const currentMember = group.members.find((member) => member.id === memberId);

  if (!currentMember) {
    return null;
  }

  return currentMember.role === "팀장" ? "leader" : "member";
}

function findRelatedMaterial(group: StudyGroup, question: string) {
  const normalizedQuestion = question.trim().toLowerCase();

  if (!normalizedQuestion) {
    return null;
  }

  return (
    group.materials.find((material) => {
      const candidates = [
        material.title,
        material.summary,
        material.locationHint,
      ].map((value) => value.toLowerCase());

      return candidates.some(
        (value) =>
          normalizedQuestion.includes(value) || value.includes(normalizedQuestion),
      );
    }) ?? group.materials[0] ?? null
  );
}

export function PrototypeProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { currentUser, markGroupJoined, setJoinedGroupState } = useAuth();
  const [storedGroups, setStoredGroups] = useState<StudyGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mutationCount, setMutationCount] = useState(0);
  const [pendingAnswers, setPendingAnswers] = useState<Record<string, boolean>>({});
  const [planAgentStatuses, setPlanAgentStatuses] = useState<Record<string, string>>({});
  const timeoutIds = useRef<number[]>([]);
  const planAgentStatusSequences = useRef<Record<string, PlanAgentStatusSequence>>({});
  const syncingMembershipKeyRef = useRef<string | null>(null);

  const resolvedCurrentUserId = currentUser?.userId ?? fallbackCurrentUserId;
  const currentMember = currentUser ? buildCurrentMember(currentUser) : null;
  const allGroups = useMemo(() => {
    return storedGroups.map((group) => syncCurrentMemberGroupState(group, currentMember));
  }, [currentMember, storedGroups]);
  const groups = useMemo(() => {
    return filterVisibleGroups(
      allGroups,
      currentMember?.id ?? null,
      currentUser?.joinedGroupId ?? null,
    );
  }, [allGroups, currentMember?.id, currentUser?.joinedGroupId]);

  const applyDueReviewCandidateTodos = useCallback(async (nextGroups: StudyGroup[]) => {
    const hasNewReviewTodos = await addPrototypeDueReviewCandidateTodos(nextGroups);

    if (!hasNewReviewTodos) {
      return nextGroups;
    }

    return listPrototypeGroups();
  }, []);

  const refreshGroups = useCallback(async () => {
    const nextGroups = await applyDueReviewCandidateTodos(await listPrototypeGroups());
    setStoredGroups(nextGroups);
    return nextGroups;
  }, [applyDueReviewCandidateTodos]);

  const setPlanAgentStatus = useCallback((groupId: string, status: string | null) => {
    setPlanAgentStatuses((previous) => {
      if (!status) {
        if (!(groupId in previous)) {
          return previous;
        }

        const next = { ...previous };
        delete next[groupId];
        return next;
      }

      if (previous[groupId] === status) {
        return previous;
      }

      return {
        ...previous,
        [groupId]: status,
      };
    });
  }, []);

  const clearPlanAgentStatusSequence = useCallback((groupId: string) => {
    const sequence = planAgentStatusSequences.current[groupId];

    if (!sequence) {
      return;
    }

    if (sequence.intervalId !== null) {
      window.clearInterval(sequence.intervalId);
    }

    sequence.timeoutIds.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });

    delete planAgentStatusSequences.current[groupId];
  }, []);

  const startPlanAgentStatusSequence = useCallback(
    (group: StudyGroup) => {
      clearPlanAgentStatusSequence(group.id);

      const uploadNames = group.planReferenceUploads
        .map((upload) => upload.fileName.trim())
        .filter(Boolean);

      setPlanAgentStatus(group.id, "답변 생성 중입니다.");

      const sequence: PlanAgentStatusSequence = {
        intervalId: null,
        timeoutIds: [],
      };

      if (uploadNames.length > 0) {
        let currentIndex = 0;

        sequence.timeoutIds.push(
          window.setTimeout(() => {
            setPlanAgentStatus(group.id, `${uploadNames[0]}을 읽는 중입니다.`);
          }, 350),
        );

        if (uploadNames.length > 1) {
          sequence.intervalId = window.setInterval(() => {
            currentIndex = (currentIndex + 1) % uploadNames.length;
            setPlanAgentStatus(group.id, `${uploadNames[currentIndex]}을 읽는 중입니다.`);
          }, 1200);
        }

        sequence.timeoutIds.push(
          window.setTimeout(() => {
            if (sequence.intervalId !== null) {
              window.clearInterval(sequence.intervalId);
              sequence.intervalId = null;
            }

            setPlanAgentStatus(group.id, "진도표를 바탕으로 답변을 정리하는 중입니다.");
          }, 1800 + Math.max(0, uploadNames.length - 1) * 1200),
        );
      } else {
        sequence.timeoutIds.push(
          window.setTimeout(() => {
            setPlanAgentStatus(group.id, "현재 계획과 복습 설정을 바탕으로 답변을 정리하는 중입니다.");
          }, 700),
        );
      }

      planAgentStatusSequences.current[group.id] = sequence;
    },
    [clearPlanAgentStatusSequence, setPlanAgentStatus],
  );

  async function runMutation<T>(action: () => Promise<T>) {
    setMutationCount((count) => count + 1);

    try {
      const result = await action();
      setError(null);
      return result;
    } catch (caughtError) {
      setError(toErrorMessage(caughtError));
      throw caughtError;
    } finally {
      setMutationCount((count) => Math.max(0, count - 1));
    }
  }

  async function ensureCurrentMember(groupId: string) {
    if (!currentMember) {
      return null;
    }

    await ensurePrototypeGroupMembership(groupId, currentMember);
    return currentMember;
  }

  useEffect(() => {
    let cancelled = false;
    const timeouts = timeoutIds.current;
    const statusSequences = planAgentStatusSequences.current;

    async function bootstrap() {
      try {
        const nextGroups = await applyDueReviewCandidateTodos(
          await bootstrapPrototypeGroups(),
        );

        if (cancelled) {
          return;
        }

        setStoredGroups(nextGroups);
        setError(null);
      } catch (caughtError) {
        if (!cancelled) {
          setError(toErrorMessage(caughtError));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
      timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
      Object.values(statusSequences).forEach((sequence) => {
        if (sequence.intervalId !== null) {
          window.clearInterval(sequence.intervalId);
        }

        sequence.timeoutIds.forEach((timeoutId) => {
          window.clearTimeout(timeoutId);
        });
      });
    };
  }, [applyDueReviewCandidateTodos]);

  useEffect(() => {
    if (!currentUser || !currentMember || isLoading) {
      syncingMembershipKeyRef.current = null;
      return;
    }

    const storedGroup = currentUser.joinedGroupId
      ? storedGroups.find((group) => group.id === currentUser.joinedGroupId) ?? null
      : null;

    if (
      storedGroup &&
      storedGroup.status === "active" &&
      !storedGroup.members.some((member) => member.id === currentMember.id)
    ) {
      const syncKey = `${currentMember.id}:${storedGroup.id}:membership`;

      if (syncingMembershipKeyRef.current === syncKey) {
        return;
      }

      syncingMembershipKeyRef.current = syncKey;

      void runMutation(async () => {
        await ensurePrototypeGroupMembership(storedGroup.id, currentMember);
        await refreshGroups();
      }).finally(() => {
        syncingMembershipKeyRef.current = null;
      });

      return;
    }

    const activeMembershipGroups = findActiveMembershipGroups(storedGroups, currentMember.id);

    if (activeMembershipGroups.length === 0) {
      if (!currentUser.hasJoinedGroup && !currentUser.joinedGroupId) {
        syncingMembershipKeyRef.current = null;
        return;
      }

      const syncKey = `${currentMember.id}:clear`;

      if (syncingMembershipKeyRef.current === syncKey) {
        return;
      }

      syncingMembershipKeyRef.current = syncKey;

      void setJoinedGroupState(null, null).finally(() => {
        syncingMembershipKeyRef.current = null;
      });

      return;
    }

    const preferredGroup =
      activeMembershipGroups.find((group) => group.id === currentUser.joinedGroupId) ??
      activeMembershipGroups[0];
    const preferredRole =
      getMemberAuthRole(preferredGroup, currentMember.id) ?? currentUser.role ?? "member";
    const needsAuthSync =
      !currentUser.hasJoinedGroup ||
      currentUser.joinedGroupId !== preferredGroup.id ||
      currentUser.role !== preferredRole;

    if (!needsAuthSync) {
      syncingMembershipKeyRef.current = null;
      return;
    }

    const syncKey = `${currentMember.id}:${preferredGroup.id}:${preferredRole}`;

    if (syncingMembershipKeyRef.current === syncKey) {
      return;
    }

    syncingMembershipKeyRef.current = syncKey;

    void setJoinedGroupState(preferredGroup.id, preferredRole).finally(() => {
      syncingMembershipKeyRef.current = null;
    });
  }, [
    currentMember,
    currentUser,
    currentUser?.joinedGroupId,
    isLoading,
    refreshGroups,
    setJoinedGroupState,
    storedGroups,
  ]);

  async function createGroup(input: CreateGroupInput) {
    return runMutation(async () => {
      const creator = currentUser ? buildCurrentMember(currentUser, "leader") : undefined;
      const groupId = await createPrototypeGroup(input, creator);
      await markGroupJoined(groupId, "leader");
      await refreshGroups();
      return groupId;
    });
  }

  async function joinGroup(groupId: string) {
    await runMutation(async () => {
      const targetGroup = allGroups.find((group) => group.id === groupId);

      if (targetGroup?.status === "completed") {
        throw new Error("수료된 그룹에는 더 이상 참여할 수 없어요.");
      }

      const joiningMember = currentUser ? buildCurrentMember(currentUser, "member") : null;

      if (joiningMember) {
        await ensurePrototypeGroupMembership(groupId, joiningMember);
      }

      await markGroupJoined(groupId, "member");
      await refreshGroups();
    });
  }

  async function syncJoinedGroupAfterRemoval(removedGroupId: string, nextGroups: StudyGroup[]) {
    if (!currentUser || currentUser.joinedGroupId !== removedGroupId) {
      return;
    }

    const remainingGroups = nextGroups.filter((group) =>
      group.status === "active" &&
      group.members.some((member) => member.id === resolvedCurrentUserId),
    );
    const fallbackGroup = remainingGroups[0] ?? null;

    if (!fallbackGroup) {
      await setJoinedGroupState(null, null);
      return;
    }

    await markGroupJoined(fallbackGroup.id, currentUser.role ?? "member");
  }

  async function leaveGroup(groupId: string) {
    await runMutation(async () => {
      await leavePrototypeGroup(groupId, resolvedCurrentUserId);
      const nextGroups = await refreshGroups();
      await syncJoinedGroupAfterRemoval(groupId, nextGroups);
    });
  }

  async function deleteGroup(groupId: string) {
    await runMutation(async () => {
      await deletePrototypeGroup(groupId);
      const nextGroups = await refreshGroups();
      await syncJoinedGroupAfterRemoval(groupId, nextGroups);
    });
  }

  async function transferGroupLeadership(groupId: string, nextLeaderId: string) {
    if (!currentUser) {
      return;
    }

    await runMutation(async () => {
      await transferPrototypeGroupLeadership(groupId, currentUser.userId, nextLeaderId);
      await markGroupJoined(groupId, "member");
      await refreshGroups();
    });
  }

  async function completeGroup(groupId: string) {
    await runMutation(async () => {
      await completePrototypeGroup(groupId);
      const nextGroups = await refreshGroups();
      await syncJoinedGroupAfterRemoval(groupId, nextGroups);
    });
  }

  async function renewGroupCycle(
    groupId: string,
    input: { examDate: string; weeklyGoal: string; overallGoal: string },
  ) {
    await runMutation(async () => {
      await renewPrototypeGroupCycle(groupId, input);
      await refreshGroups();
    });
  }

  async function syncCurrentUserProfile() {
    if (!currentMember) {
      return;
    }

    await runMutation(async () => {
      await syncPrototypeProfile(currentMember);

      if (currentUser?.joinedGroupId) {
        await ensurePrototypeGroupMembership(currentUser.joinedGroupId, currentMember);
      }

      await refreshGroups();
    });
  }

  async function updateGroupDetails(groupId: string, updates: GroupDetailsInput) {
    await runMutation(async () => {
      await updatePrototypeGroupDetails(groupId, updates);
      await refreshGroups();
    });
  }

  async function togglePlanItem(_groupId: string, itemId: string) {
    await runMutation(async () => {
      await togglePrototypePlanItem(itemId, resolvedCurrentUserId);
      await refreshGroups();
    });
  }

  async function clearPlanItemCompletion(_groupId: string, itemId: string) {
    await runMutation(async () => {
      await clearPrototypePlanItemCompletion(itemId, resolvedCurrentUserId);
      await refreshGroups();
    });
  }

  async function completePlanItemWithFeedback(
    groupId: string,
    itemId: string,
    understandingLevel: UnderstandingLevel,
  ) {
    const group = getGroupById(groups, groupId);

    if (!group) {
      return;
    }

    await runMutation(async () => {
      await completePrototypePlanItemWithFeedback(
        group,
        itemId,
        resolvedCurrentUserId,
        understandingLevel,
      );
      await refreshGroups();
    });
  }

  async function updatePlanItem(
    _groupId: string,
    itemId: string,
    updates: PlanItemDraft,
  ) {
    await runMutation(async () => {
      await updatePrototypePlanItem(itemId, updates);
      await refreshGroups();
    });
  }

  async function addPlanItem(groupId: string, item: PlanItemDraft) {
    const group = getGroupById(groups, groupId);

    if (!group) {
      return;
    }

    await runMutation(async () => {
      await addPrototypePlanItem(group, item);
      await refreshGroups();
    });
  }

  async function queueMockUpload(groupId: string) {
    const group = getGroupById(groups, groupId);

    if (!group) {
      return;
    }

    await runMutation(async () => {
      await addPrototypeUpload(group, resolvedCurrentUserId);
      await refreshGroups();
    });
  }

  async function uploadMaterialFile(groupId: string, file: File) {
    await runMutation(async () => {
      const member = await ensureCurrentMember(groupId);
      const uploaded = await uploadMaterial(groupId, file);

      await addPrototypeUploadedMaterial(
        groupId,
        {
          id: uploaded.id,
          title: uploaded.title,
          summary: uploaded.summary,
          uploadedAt: uploaded.uploadedAt,
          format: uploaded.format,
          locationHint: uploaded.locationHint,
        },
        member?.id ?? resolvedCurrentUserId,
      );

      await refreshGroups();
    });
  }

  function recordMaterialView(
    groupId: string,
    materialId: string,
    title: string,
    locationHint: string,
    durationMs: number,
  ) {
    saveMaterialView({
      groupId,
      memberId: resolvedCurrentUserId,
      materialId,
      title,
      locationHint,
      durationMs,
    });
  }

  function getWeaknessInsights(groupId: string) {
    const group = getGroupById(groups, groupId);

    if (!group) {
      return [];
    }

    return buildMemberWeaknessInsights(group, resolvedCurrentUserId);
  }

  async function uploadPlanReference(
    groupId: string,
    upload: PlanReferenceUploadDraft,
  ) {
    const group = getGroupById(groups, groupId);

    if (!group) {
      return;
    }

    await runMutation(async () => {
      await addPrototypePlanReferenceUpload(group, upload, resolvedCurrentUserId);
      await refreshGroups();
    });
  }

  async function updateReviewDays(groupId: string, reviewDays: Weekday[]) {
    await runMutation(async () => {
      await updatePrototypeReviewDays(groupId, reviewDays);
      await refreshGroups();
    });
  }

  async function updateReviewInterval(
    groupId: string,
    reviewIntervalDays: ReviewIntervalDays | null,
  ) {
    await runMutation(async () => {
      await updatePrototypeReviewInterval(groupId, resolvedCurrentUserId, reviewIntervalDays);
      await refreshGroups();
    });
  }

  async function addPersonalPlanItem(groupId: string, item: PersonalPlanItemDraft) {
    const group = getGroupById(groups, groupId);

    if (!group) {
      return;
    }

    const currentItemCount = group.personalPlanItems.filter(
      (entry) => entry.memberId === resolvedCurrentUserId,
    ).length;

    await runMutation(async () => {
      await addPrototypePersonalPlanItem(
        groupId,
        resolvedCurrentUserId,
        item,
        currentItemCount,
      );
      await refreshGroups();
    });
  }

  async function savePersonalTaskLibraryItem(
    groupId: string,
    item: SavedPersonalTaskDraft,
  ) {
    const group = getGroupById(groups, groupId);

    if (!group) {
      return;
    }

    const currentItemCount = group.savedPersonalTaskLibraryItems.filter(
      (entry) => entry.memberId === resolvedCurrentUserId,
    ).length;

    await runMutation(async () => {
      await savePrototypePersonalTaskLibraryItem(
        groupId,
        resolvedCurrentUserId,
        item,
        currentItemCount,
      );
      await refreshGroups();
    });
  }

  async function updatePersonalTaskLibraryItem(
    itemId: string,
    item: SavedPersonalTaskDraft,
  ) {
    await runMutation(async () => {
      await updatePrototypePersonalTaskLibraryItem(itemId, item);
      await refreshGroups();
    });
  }

  async function deletePersonalTaskLibraryItem(itemId: string) {
    await runMutation(async () => {
      await deletePrototypePersonalTaskLibraryItem(itemId);
      await refreshGroups();
    });
  }

  async function addSavedTaskToPersonalPlan(groupId: string, savedTaskId: string) {
    const group = getGroupById(groups, groupId);

    if (!group) {
      return;
    }

    const currentItemCount = group.personalPlanItems.filter(
      (entry) => entry.memberId === resolvedCurrentUserId,
    ).length;

    await runMutation(async () => {
      await addSavedTaskToPrototypePersonalPlan(
        groupId,
        resolvedCurrentUserId,
        savedTaskId,
        currentItemCount,
      );
      await refreshGroups();
    });
  }

  async function updatePersonalPlanItem(itemId: string, item: PersonalPlanItemDraft) {
    await runMutation(async () => {
      await updatePrototypePersonalPlanItem(itemId, item);
      await refreshGroups();
    });
  }

  async function togglePersonalPlanItem(itemId: string, completed: boolean) {
    await runMutation(async () => {
      await togglePrototypePersonalPlanItem(itemId, completed);
      await refreshGroups();
    });
  }

  async function requestAiAnswer(
    group: StudyGroup,
    question: string,
    scope: AiChatScope,
  ) {
    const history = scope === "materials" ? group.chat : group.planAgentChat;

    const payload: AiChatRequest = {
      scope,
      question,
      history: history.map((message) => ({
        role: message.role,
        text: message.text,
      })),
      group: {
        id: group.id,
        name: group.name,
        subject: group.subject,
        weeklyGoal: group.weeklyGoal,
        overallGoal: group.overallGoal,
        description: group.description,
        recentUpdate: group.recentUpdate,
        reviewIntervalLabel: getReviewIntervalLabel(
          group.reviewIntervals[resolvedCurrentUserId] ?? null,
        ),
        materials: group.materials.map((material) => ({
          title: material.title,
          summary: material.summary,
          locationHint: material.locationHint,
        })),
        plan: group.plan.map((item) => ({
          day: item.day,
          title: item.title,
          detail: item.detail,
          duration: item.duration,
          referenceUnitSequence: item.referenceUnitSequence ?? null,
        })),
        roadmap: group.roadmap.map((item) => ({
          weekNumber: item.weekNumber,
          title: item.title,
          summary: item.summary,
        })),
      },
    };

    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as { error?: string; text?: string };

    if (!response.ok || !data.text?.trim()) {
      throw new Error(data.error ?? "Gemini API returned an empty response.");
    }

    return data.text.trim();
  }

  async function sendScopedQuestion(
    groupId: string,
    question: string,
    scope: "materials" | "plan-agent",
  ) {
    const trimmedQuestion = question.trim();
    const group = getGroupById(groups, groupId);
    const pendingKey = getPendingAnswerKey(groupId, scope);

    if (!trimmedQuestion || !group) {
      return;
    }

    await runMutation(async () => {
      await addPrototypeUserQuestion(groupId, trimmedQuestion, scope);

      if (scope === "materials") {
        const relatedMaterial = findRelatedMaterial(group, trimmedQuestion);

        recordMaterialQuestion({
          groupId,
          memberId: resolvedCurrentUserId,
          question: trimmedQuestion,
          materialId: relatedMaterial?.id ?? null,
          title: relatedMaterial?.title ?? null,
          locationHint: relatedMaterial?.locationHint ?? null,
        });
      }

      await refreshGroups();
    });

    setPendingAnswers((previous) => ({
      ...previous,
      [pendingKey]: true,
    }));

    if (scope === "plan-agent") {
      startPlanAgentStatusSequence(group);
    }

    const timeoutId = window.setTimeout(() => {
      void runMutation(async () => {
        try {
          const answerText = await requestAiAnswer(group, trimmedQuestion, scope);
          await addPrototypeAssistantAnswer(group, trimmedQuestion, scope, answerText);
          await refreshGroups();
          if (scope === "plan-agent") {
            clearPlanAgentStatusSequence(groupId);
            setPlanAgentStatus(groupId, "답변 완료");
          }
        } catch (caughtError) {
          if (scope === "plan-agent") {
            clearPlanAgentStatusSequence(groupId);
            setPlanAgentStatus(groupId, "답변 생성에 실패했어요. 다시 시도해 주세요.");
          }

          throw caughtError;
        } finally {
          setPendingAnswers((previous) => ({
            ...previous,
            [pendingKey]: false,
          }));
        }
      }).catch(() => {
        if (scope === "plan-agent") {
          clearPlanAgentStatusSequence(groupId);
        }

        setPendingAnswers((previous) => ({
          ...previous,
          [pendingKey]: false,
        }));
      });
    }, 700);

    timeoutIds.current.push(timeoutId);
  }

  async function sendQuestion(groupId: string, question: string) {
    await sendScopedQuestion(groupId, question, "materials");
  }

  async function sendPlanAgentMessage(groupId: string, question: string) {
    await sendScopedQuestion(groupId, question, "plan-agent");
  }

  async function applyPlanAgentDraft(groupId: string, draft: PlanAgentDraft) {
    await runMutation(async () => {
      await applyPrototypePlanAgentDraft(groupId, draft);
      await refreshGroups();
    });
  }

  const value: PrototypeContextValue = {
    groups,
    allGroups,
    currentUserId: resolvedCurrentUserId,
    error,
    isLoading,
    isMutating: mutationCount > 0,
    createGroup,
    joinGroup,
    leaveGroup,
    deleteGroup,
    transferGroupLeadership,
    completeGroup,
    renewGroupCycle,
    syncCurrentUserProfile,
    updateGroupDetails,
    togglePlanItem,
    clearPlanItemCompletion,
    completePlanItemWithFeedback,
    updatePlanItem,
    addPlanItem,
    queueMockUpload,
    uploadMaterialFile,
    recordMaterialView,
    getWeaknessInsights,
    uploadPlanReference,
    updateReviewDays,
    updateReviewInterval,
    addPersonalPlanItem,
    updatePersonalPlanItem,
    togglePersonalPlanItem,
    savePersonalTaskLibraryItem,
    updatePersonalTaskLibraryItem,
    deletePersonalTaskLibraryItem,
    addSavedTaskToPersonalPlan,
    sendQuestion,
    sendPlanAgentMessage,
    applyPlanAgentDraft,
    isAnswering: (groupId: string) =>
      Boolean(pendingAnswers[getPendingAnswerKey(groupId, "materials")]),
    isPlanAgentAnswering: (groupId: string) =>
      Boolean(pendingAnswers[getPendingAnswerKey(groupId, "plan-agent")]),
    getPlanAgentStatus: (groupId: string) => planAgentStatuses[groupId] ?? null,
  };

  return <PrototypeContext.Provider value={value}>{children}</PrototypeContext.Provider>;
}

export function usePrototype() {
  const context = useContext(PrototypeContext);

  if (!context) {
    throw new Error("usePrototype must be used within PrototypeProvider");
  }

  return context;
}
