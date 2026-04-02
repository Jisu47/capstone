import type {
  ChatMessage,
  CreateGroupInput,
  Material,
  SourceCard,
  StudyGroup,
  Weekday,
} from "@/lib/mock-data";

export type MaterialDto = {
  id: string;
  groupId: string;
  title: string;
  summary: string;
  uploadedBy: string;
  uploadedAt: string;
  format: Material["format"];
  locationHint: string;
  processingStatus: NonNullable<Material["processingStatus"]>;
};

export type SourceCardDto = {
  materialId: string;
  title: string;
  locationHint: string;
  snippet: string;
};

export type ChatAnswerDto = {
  answer: string;
  sources: SourceCardDto[];
  assistantMessage: ChatMessage;
  userMessage: ChatMessage;
};

export type HomeGroupCard = {
  id: string;
  name: string;
  subject: string;
  examDate: string;
  daysLeft: number;
  todayTaskCount: number;
};

export type HomeTaskCard = {
  id: string;
  groupId: string;
  groupName: string;
  subject: string;
  day: Weekday;
  title: string;
  duration: string;
};

export type RecentMaterialCard = {
  id: string;
  groupId: string;
  groupName: string;
  title: string;
  summary: string;
  uploadedAt: string;
  locationHint: string;
};

export type HomeDashboardResponse = {
  currentUserId: string;
  myGroups: HomeGroupCard[];
  todayTasks: HomeTaskCard[];
  dDayGroups: Array<Pick<HomeGroupCard, "id" | "name" | "examDate" | "daysLeft">>;
  recentMaterials: RecentMaterialCard[];
};

export type PlanMutationRequest =
  | {
      type: "toggle";
      itemId: string;
    }
  | {
      type: "update";
      itemId: string;
      updates: { day: Weekday; title: string; detail: string; duration: string };
    }
  | {
      type: "add";
      item: { day: Weekday; title: string; detail: string; duration: string };
    };

export type PlanMutationResponse = {
  group: StudyGroup;
};

export type GroupsResponse = {
  currentUserId: string;
  groups: StudyGroup[];
};

export type CreateGroupRequest = {
  input: CreateGroupInput;
};

export type MaterialListResponse = {
  groupId: string;
  materials: MaterialDto[];
};

export type ChatListResponse = {
  groupId: string;
  messages: ChatMessage[];
};

export type AskQuestionRequest = {
  question: string;
};

export type AppErrorResponse = {
  error: string;
};

export type StoredUser = {
  id: string;
  name: string;
  role: string;
  focus: string;
};

export type StoredGroup = {
  id: string;
  name: string;
  subject: string;
  examDate: string;
  weeklyGoal: string;
  description: string;
  recentUpdate: string;
};

export type StoredGroupMember = {
  groupId: string;
  userId: string;
};

export type StoredPlanItem = {
  id: string;
  groupId: string;
  day: Weekday;
  title: string;
  detail: string;
  duration: string;
};

export type StoredPlanCompletion = {
  planItemId: string;
  userId: string;
  completed: boolean;
};

export type StoredMaterial = {
  id: string;
  groupId: string;
  uploaderId: string;
  title: string;
  storagePath: string;
  mimeType: string;
  format: Material["format"];
  uploadedAt: string;
  summary: string;
  processingStatus: NonNullable<Material["processingStatus"]>;
  locationHint: string;
};

export type StoredMaterialChunk = {
  id: string;
  materialId: string;
  chunkIndex: number;
  text: string;
  locationHint: string;
};

export type StoredChatMessage = {
  id: string;
  groupId: string;
  userId: string;
  role: ChatMessage["role"];
  text: string;
  createdAt: string;
  sources: SourceCard[];
};

export type PrototypeDatabase = {
  version: 1;
  users: StoredUser[];
  groups: StoredGroup[];
  groupMembers: StoredGroupMember[];
  planItems: StoredPlanItem[];
  planCompletions: StoredPlanCompletion[];
  materials: StoredMaterial[];
  materialChunks: StoredMaterialChunk[];
  chatMessages: StoredChatMessage[];
};
