"use client";

import {
  type ChatMessage,
  type CreateGroupInput,
  type StudyGroup,
  type Weekday,
  buildMockAnswer,
  createGroupFromInput,
  currentUserId,
  getInitialGroups,
} from "@/lib/mock-data";
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
  createGroup: (input: CreateGroupInput) => string;
  togglePlanItem: (groupId: string, itemId: string) => void;
  updatePlanItem: (
    groupId: string,
    itemId: string,
    updates: { day: Weekday; title: string; detail: string; duration: string },
  ) => void;
  addPlanItem: (
    groupId: string,
    item: { day: Weekday; title: string; detail: string; duration: string },
  ) => void;
  queueMockUpload: (groupId: string) => void;
  sendQuestion: (groupId: string, question: string) => void;
  isAnswering: (groupId: string) => boolean;
};

const PrototypeContext = createContext<PrototypeContextValue | null>(null);

export function PrototypeProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [groups, setGroups] = useState<StudyGroup[]>(() => getInitialGroups());
  const [pendingAnswers, setPendingAnswers] = useState<Record<string, boolean>>({});
  const timeoutIds = useRef<number[]>([]);

  useEffect(() => {
    const timeouts = timeoutIds;

    return () => {
      timeouts.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  function createGroup(input: CreateGroupInput) {
    const group = createGroupFromInput(input);
    setGroups((previous) => [group, ...previous]);
    return group.id;
  }

  function togglePlanItem(groupId: string, itemId: string) {
    setGroups((previous) =>
      previous.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        return {
          ...group,
          plan: group.plan.map((item) => {
            if (item.id !== itemId) {
              return item;
            }

            return {
              ...item,
              memberStatus: {
                ...item.memberStatus,
                [currentUserId]: !item.memberStatus[currentUserId],
              },
            };
          }),
        };
      }),
    );
  }

  function updatePlanItem(
    groupId: string,
    itemId: string,
    updates: { day: Weekday; title: string; detail: string; duration: string },
  ) {
    setGroups((previous) =>
      previous.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        return {
          ...group,
          plan: group.plan.map((item) => {
            if (item.id !== itemId) {
              return item;
            }

            return {
              ...item,
              ...updates,
            };
          }),
        };
      }),
    );
  }

  function addPlanItem(
    groupId: string,
    item: { day: Weekday; title: string; detail: string; duration: string },
  ) {
    setGroups((previous) =>
      previous.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        return {
          ...group,
          plan: [
            ...group.plan,
            {
              id: `plan-custom-${Date.now().toString(36)}`,
              ...item,
              memberStatus: Object.fromEntries(
                group.members.map((member) => [member.id, false]),
              ),
            },
          ],
        };
      }),
    );
  }

  function queueMockUpload(groupId: string) {
    setGroups((previous) =>
      previous.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        const nextCount = group.uploadDraftCount + 1;
        const newMaterial = {
          id: `${group.id}-upload-${nextCount}`,
          title: `${group.subject} 추가 정리 ${nextCount}.pdf`,
          summary: "업로드 박스에서 추가된 mock 자료입니다. 실제 파일 업로드는 연결되지 않습니다.",
          uploadedBy: "영희",
          uploadedAt: new Date().toISOString(),
          format: "PDF" as const,
          locationHint: `업로드 박스 #${nextCount}`,
        };

        return {
          ...group,
          uploadDraftCount: nextCount,
          recentUpdate: `업로드 박스에서 mock 자료 ${nextCount}건이 추가됨`,
          materials: [newMaterial, ...group.materials],
        };
      }),
    );
  }

  function sendQuestion(groupId: string, question: string) {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `chat-user-${Date.now().toString(36)}`,
      role: "user",
      text: trimmedQuestion,
      createdAt: "방금 전",
    };

    setGroups((previous) =>
      previous.map((group) =>
        group.id === groupId ? { ...group, chat: [...group.chat, userMessage] } : group,
      ),
    );
    setPendingAnswers((previous) => ({ ...previous, [groupId]: true }));

    const timeoutId = window.setTimeout(() => {
      setGroups((previous) =>
        previous.map((group) => {
          if (group.id !== groupId) {
            return group;
          }

          const answer = buildMockAnswer(group, trimmedQuestion);
          const assistantMessage: ChatMessage = {
            id: `chat-assistant-${Date.now().toString(36)}`,
            role: "assistant",
            text: answer.text,
            createdAt: "방금 전",
            sources: answer.sources,
          };

          return {
            ...group,
            chat: [...group.chat, assistantMessage],
          };
        }),
      );

      setPendingAnswers((previous) => ({
        ...previous,
        [groupId]: false,
      }));
    }, 700);

    timeoutIds.current.push(timeoutId);
  }

  const value: PrototypeContextValue = {
    groups,
    currentUserId,
    createGroup,
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
