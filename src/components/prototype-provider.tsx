"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  createGroup as createGroupRequest,
  fetchGroups,
  mutatePlan as mutatePlanRequest,
} from "@/lib/client-api";
import type { CreateGroupInput, StudyGroup, Weekday } from "@/lib/mock-data";

type PrototypeContextValue = {
  groups: StudyGroup[];
  currentUserId: string;
  isLoadingGroups: boolean;
  groupsError: string | null;
  refreshGroups: () => Promise<void>;
  createGroup: (input: CreateGroupInput) => Promise<string>;
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
};

const PrototypeContext = createContext<PrototypeContextValue | null>(null);

export function PrototypeProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [groupsError, setGroupsError] = useState<string | null>(null);

  async function refreshGroups() {
    setIsLoadingGroups(true);

    try {
      const response = await fetchGroups();
      setGroups(response.groups);
      setCurrentUserId(response.currentUserId);
      setGroupsError(null);
    } catch (error) {
      setGroupsError(error instanceof Error ? error.message : "그룹 정보를 불러오지 못했습니다.");
    } finally {
      setIsLoadingGroups(false);
    }
  }

  useEffect(() => {
    void refreshGroups();
  }, []);

  async function createGroup(input: CreateGroupInput) {
    const group = await createGroupRequest({ input });
    setGroups((previous) => [group, ...previous.filter((entry) => entry.id !== group.id)]);
    setGroupsError(null);
    return group.id;
  }

  async function togglePlanItem(groupId: string, itemId: string) {
    const response = await mutatePlanRequest(groupId, {
      type: "toggle",
      itemId,
    });
    setGroups((previous) =>
      previous.map((group) => (group.id === groupId ? response.group : group)),
    );
    setGroupsError(null);
  }

  async function updatePlanItem(
    groupId: string,
    itemId: string,
    updates: { day: Weekday; title: string; detail: string; duration: string },
  ) {
    const response = await mutatePlanRequest(groupId, {
      type: "update",
      itemId,
      updates,
    });
    setGroups((previous) =>
      previous.map((group) => (group.id === groupId ? response.group : group)),
    );
    setGroupsError(null);
  }

  async function addPlanItem(
    groupId: string,
    item: { day: Weekday; title: string; detail: string; duration: string },
  ) {
    const response = await mutatePlanRequest(groupId, {
      type: "add",
      item,
    });
    setGroups((previous) =>
      previous.map((group) => (group.id === groupId ? response.group : group)),
    );
    setGroupsError(null);
  }

  const value: PrototypeContextValue = {
    groups,
    currentUserId,
    isLoadingGroups,
    groupsError,
    refreshGroups,
    createGroup,
    togglePlanItem,
    updatePlanItem,
    addPlanItem,
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
