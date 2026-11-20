"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import type { AuthUser } from "../auth-provider";

import { createDemoGroup, demoGroupId, demoCurrentUserId as currentUserId } from "./demo-data";
export type { AuthUser, UserRole } from "../auth-provider";
type PrototypeValue = ReturnType<typeof import("../prototype-provider").usePrototype>;
type AuthValue = ReturnType<typeof import("../auth-provider").useAuth>;
const DemoContext = createContext<PrototypeValue | null>(null);
const user: AuthUser = { userId: currentUserId, email: "", displayName: "사용자", bio: "발표용 예시 사용자", avatarPreset: "emerald", role: "leader", hasJoinedGroup: true, joinedGroupId: demoGroupId };
const noAction = async () => {};
export function DemoProvider({ children }: { children: ReactNode }) {
  const [group, setGroup] = useState(createDemoGroup);
  const value: PrototypeValue = {
    groups: [group], allGroups: [group], currentUserId, error: null, isLoading: false, isMutating: false,
    createGroup: async () => demoGroupId, joinGroup: noAction, leaveGroup: noAction, deleteGroup: noAction, transferGroupLeadership: noAction,
    completeGroup: noAction, renewGroupCycle: noAction, syncCurrentUserProfile: noAction, updateGroupDetails: noAction, updateGroupStudyRules: noAction,
    togglePlanItem: async (_, id) => setGroup(g => ({ ...g, plan: g.plan.map(item => item.id === id ? { ...item, memberStatus: { ...item.memberStatus, [currentUserId]: !item.memberStatus[currentUserId] } } : item) })),
    clearPlanItemCompletion: noAction, completePlanItemWithFeedback: noAction, updatePlanItem: noAction, addPlanItem: noAction,
    queueMockUpload: noAction, uploadMaterialFile: noAction, deleteMaterialFile: noAction, recordMaterialView: () => {}, getWeaknessInsights: () => [],
    uploadPlanReference: noAction, reanalyzePlanReferenceUploads: noAction, replacePlanReferenceUpload: noAction, deletePlanReferenceUpload: noAction,
    updateReviewDays: noAction, updateReviewInterval: async (_, interval) => setGroup(g => ({ ...g, reviewIntervals: { [currentUserId]: interval } })), deleteReviewCandidates: noAction,
    addPersonalPlanItem: noAction, updatePersonalPlanItem: noAction,
    togglePersonalPlanItem: async (id, completed) => setGroup(g => ({ ...g, personalPlanItems: g.personalPlanItems.map(item => item.id === id ? { ...item, completed } : item) })),
    deletePersonalPlanItem: noAction, savePersonalTaskLibraryItem: noAction, updatePersonalTaskLibraryItem: noAction, deletePersonalTaskLibraryItem: noAction, addSavedTaskToPersonalPlan: noAction,
    sendQuestion: noAction, sendPlanAgentMessage: noAction,
    applyPlanAgentDraft: async (_, draft) => setGroup(g => ({ ...g, plan: draft.weeklyPlan, weeklyGoal: draft.weeklyGoal })),
    isAnswering: () => false, isPlanAgentAnswering: () => false, getPlanAgentStatus: () => "예시 응답"
  };
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
export function usePrototype(): PrototypeValue {
  const value = useContext(DemoContext);
  if (!value) throw new Error("Presentation Preview requires DemoProvider");
  return value;
}
export function useAuth(): AuthValue {
  return { isAuthReady: true, sessionName: user.displayName, currentUser: user,
    signIn: async () => ({ ok: true, user }), signUp: async () => ({ ok: true, user }), updateProfile: async () => ({ ok: true, user }),
    signOut: noAction, deleteAccount: async () => ({ ok: true }), markGroupJoined: async () => user, setJoinedGroupState: async () => user, resolvePostAuthPath: () => "/" };
}
