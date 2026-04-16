"use client";

import {
  currentUserId,
  type CreateGroupInput,
  type GroupDetailsInput,
  type ReviewIntervalDays,
  type StudyGroup,
  type Weekday,
} from "@/lib/mock-data";
import {
  applyPrototypePlanAgentDraft,
  addPrototypePlanReferenceUpload,
  addPrototypePersonalPlanItem,
  addPrototypeAssistantAnswer,
  addPrototypePlanItem,
  addPrototypeUpload,
  addPrototypeUserQuestion,
  bootstrapPrototypeGroups,
  createPrototypeGroup,
  listPrototypeGroups,
  togglePrototypePersonalPlanItem,
  togglePrototypePlanItem,
  type PlanItemDraft,
  updatePrototypePersonalPlanItem,
  updatePrototypeReviewDays,
  updatePrototypeReviewInterval,
  updatePrototypeGroupDetails,
  updatePrototypePlanItem,
} from "@/lib/prototype-repository";
import type {
  PersonalPlanItemDraft,
  PlanAgentDraft,
  PlanReferenceUploadDraft,
} from "@/lib/plan-flow";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type PrototypeContextValue = {
  groups: StudyGroup[];
  currentUserId: string;
  isAuthReady: boolean;
  sessionName: string | null;
  error: string | null;
  isLoading: boolean;
  isMutating: boolean;
  signIn: (name: string) => void;
  signOut: () => void;
  createGroup: (input: CreateGroupInput) => Promise<string>;
  updateGroupDetails: (groupId: string, updates: GroupDetailsInput) => Promise<void>;
  togglePlanItem: (groupId: string, itemId: string) => Promise<void>;
  updatePlanItem: (groupId: string, itemId: string, updates: PlanItemDraft) => Promise<void>;
  addPlanItem: (groupId: string, item: PlanItemDraft) => Promise<void>;
  queueMockUpload: (groupId: string) => Promise<void>;
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
  sendQuestion: (groupId: string, question: string) => Promise<void>;
  sendPlanAgentMessage: (groupId: string, question: string) => Promise<void>;
  applyPlanAgentDraft: (groupId: string, draft: PlanAgentDraft) => Promise<void>;
  isAnswering: (groupId: string) => boolean;
  isPlanAgentAnswering: (groupId: string) => boolean;
};

const PrototypeContext = createContext<PrototypeContextValue | null>(null);
const sessionStorageKey = "study-flow-session-name";

function getGroupById(groups: StudyGroup[], groupId: string) {
  return groups.find((group) => group.id === groupId);
}

function getPendingAnswerKey(groupId: string, scope: "materials" | "plan-agent") {
  return `${scope}:${groupId}`;
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (
      error.message.includes("study_groups") ||
      error.message.includes("relation") ||
      error.message.includes("schema cache") ||
      error.message.includes("inspect study groups") ||
      error.message.includes("presentation_date") ||
      error.message.includes("deadline_date") ||
      error.message.includes("overall_goal") ||
      error.message.includes("review_days") ||
      error.message.includes("reference_unit_sequence") ||
      error.message.includes("plan_reference_uploads") ||
      error.message.includes("plan_reference_units") ||
      error.message.includes("group_roadmap_items") ||
      error.message.includes("personal_plan_items") ||
      error.message.includes("review_interval_days") ||
      error.message.includes("scope")
    ) {
      return "Supabase schema is missing. Run supabase/bootstrap.sql in the Supabase SQL editor.";
    }

    if (error.message.includes("NEXT_PUBLIC_SUPABASE")) {
      return "Supabase environment variables are missing.";
    }

    return error.message;
  }

  return "Unexpected error.";
}

export function PrototypeProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mutationCount, setMutationCount] = useState(0);
  const [pendingAnswers, setPendingAnswers] = useState<Record<string, boolean>>({});
  const timeoutIds = useRef<number[]>([]);

  async function refreshGroups() {
    const nextGroups = await listPrototypeGroups();
    setGroups(nextGroups);
  }

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

  useEffect(() => {
    let cancelled = false;
    const timeouts = timeoutIds;
    const savedSessionName = window.localStorage.getItem(sessionStorageKey);
    setSessionName(savedSessionName);
    setIsAuthReady(true);

    async function bootstrap() {
      try {
        const nextGroups = await bootstrapPrototypeGroups();

        if (cancelled) {
          return;
        }

        setGroups(nextGroups);
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
      timeouts.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  function signIn(name: string) {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    window.localStorage.setItem(sessionStorageKey, trimmedName);
    setSessionName(trimmedName);
  }

  function signOut() {
    window.localStorage.removeItem(sessionStorageKey);
    setSessionName(null);
  }

  async function createGroup(input: CreateGroupInput) {
    return runMutation(async () => {
      const groupId = await createPrototypeGroup(input);
      await refreshGroups();
      return groupId;
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
      await togglePrototypePlanItem(itemId);
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
      await addPrototypeUpload(group);
      await refreshGroups();
    });
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
      await addPrototypePlanReferenceUpload(group, upload);
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
      await updatePrototypeReviewInterval(groupId, currentUserId, reviewIntervalDays);
      await refreshGroups();
    });
  }

  async function addPersonalPlanItem(groupId: string, item: PersonalPlanItemDraft) {
    const group = getGroupById(groups, groupId);

    if (!group) {
      return;
    }

    const currentItemCount = group.personalPlanItems.filter(
      (entry) => entry.memberId === currentUserId,
    ).length;

    await runMutation(async () => {
      await addPrototypePersonalPlanItem(groupId, currentUserId, item, currentItemCount);
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

    try {
      await runMutation(async () => {
        await addPrototypeUserQuestion(groupId, trimmedQuestion, scope);
        await refreshGroups();
      });
    } catch {
      setPendingAnswers((previous) => ({
        ...previous,
        [pendingKey]: false,
      }));
      return;
    }

    setPendingAnswers((previous) => ({
      ...previous,
      [pendingKey]: true,
    }));

    const timeoutId = window.setTimeout(() => {
      void runMutation(async () => {
        try {
          await addPrototypeAssistantAnswer(group, trimmedQuestion, scope);
          await refreshGroups();
        } finally {
          setPendingAnswers((previous) => ({
            ...previous,
            [pendingKey]: false,
          }));
        }
      }).catch(() => undefined);
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
    currentUserId,
    isAuthReady,
    sessionName,
    error,
    isLoading,
    isMutating: mutationCount > 0,
    signIn,
    signOut,
    createGroup,
    updateGroupDetails,
    togglePlanItem,
    updatePlanItem,
    addPlanItem,
    queueMockUpload,
    uploadPlanReference,
    updateReviewDays,
    updateReviewInterval,
    addPersonalPlanItem,
    updatePersonalPlanItem,
    togglePersonalPlanItem,
    sendQuestion,
    sendPlanAgentMessage,
    applyPlanAgentDraft,
    isAnswering: (groupId: string) =>
      Boolean(pendingAnswers[getPendingAnswerKey(groupId, "materials")]),
    isPlanAgentAnswering: (groupId: string) =>
      Boolean(pendingAnswers[getPendingAnswerKey(groupId, "plan-agent")]),
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
