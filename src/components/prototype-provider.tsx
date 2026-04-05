"use client";

import {
  currentUserId,
  type CreateGroupInput,
  type GroupDetailsInput,
  type StudyGroup,
  type Weekday,
} from "@/lib/mock-data";
import {
  addPrototypeAssistantAnswer,
  addPrototypePlanItem,
  addPrototypeUpload,
  addPrototypeUserQuestion,
  bootstrapPrototypeGroups,
  createPrototypeGroup,
  listPrototypeGroups,
  togglePrototypePlanItem,
  type PlanItemDraft,
  updatePrototypeGroupDetails,
  updatePrototypePlanItem,
} from "@/lib/prototype-repository";
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
  error: string | null;
  isLoading: boolean;
  isMutating: boolean;
  createGroup: (input: CreateGroupInput) => Promise<string>;
  updateGroupDetails: (groupId: string, updates: GroupDetailsInput) => Promise<void>;
  togglePlanItem: (groupId: string, itemId: string) => Promise<void>;
  updatePlanItem: (
    groupId: string,
    itemId: string,
    updates: { day: Weekday; title: string; detail: string; duration: string },
  ) => Promise<void>;
  addPlanItem: (
    groupId: string,
    item: { day: Weekday; title: string; detail: string; duration: string },
  ) => Promise<void>;
  queueMockUpload: (groupId: string) => Promise<void>;
  sendQuestion: (groupId: string, question: string) => Promise<void>;
  isAnswering: (groupId: string) => boolean;
};

const PrototypeContext = createContext<PrototypeContextValue | null>(null);

function getGroupById(groups: StudyGroup[], groupId: string) {
  return groups.find((group) => group.id === groupId);
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
      error.message.includes("overall_goal")
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

  async function sendQuestion(groupId: string, question: string) {
    const trimmedQuestion = question.trim();
    const group = getGroupById(groups, groupId);

    if (!trimmedQuestion || !group) {
      return;
    }

    try {
      await runMutation(async () => {
        await addPrototypeUserQuestion(groupId, trimmedQuestion);
        await refreshGroups();
      });
    } catch {
      setPendingAnswers((previous) => ({
        ...previous,
        [groupId]: false,
      }));
      return;
    }

    setPendingAnswers((previous) => ({
      ...previous,
      [groupId]: true,
    }));

    const timeoutId = window.setTimeout(() => {
      void runMutation(async () => {
        try {
          await addPrototypeAssistantAnswer(group, trimmedQuestion);
          await refreshGroups();
        } finally {
          setPendingAnswers((previous) => ({
            ...previous,
            [groupId]: false,
          }));
        }
      }).catch(() => undefined);
    }, 700);

    timeoutIds.current.push(timeoutId);
  }

  const value: PrototypeContextValue = {
    groups,
    currentUserId,
    error,
    isLoading,
    isMutating: mutationCount > 0,
    createGroup,
    updateGroupDetails,
    togglePlanItem,
    updatePlanItem,
    addPlanItem,
    queueMockUpload,
    sendQuestion,
    isAnswering: (groupId: string) => Boolean(pendingAnswers[groupId]),
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
