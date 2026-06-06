import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  buildMockPlanReferenceUnits,
  buildPlanAgentDraft,
  buildPlanAgentAnswer,
  isReviewCandidateDue,
  type PersonalPlanItemDraft,
  type PlanAgentDraft,
  type PlanReferenceUploadDraft,
  type SavedPersonalTaskDraft,
} from "@/lib/plan-flow";
import {
  buildGroupDescription,
  buildRecentUpdateFromGoal,
  buildMockAnswer,
  createGroupFromInput,
  createMemberProfile,
  currentUserId,
  getAvatarPresetFromSeed,
  getInitialGroups,
  type CreateGroupInput,
  type GroupDetailsInput,
  type GroupStatus,
  type Material,
  type Member,
  type PersonalPlanItem,
  type PlanItemFeedback,
  type PlanReferenceUnit,
  type PlanReferenceUpload,
  type ReviewCandidate,
  type ReviewIntervalDays,
  type RoadmapItem,
  type SavedPersonalTaskItem,
  type SourceCard,
  type StudyGroup,
  type UnderstandingLevel,
  type Weekday,
} from "@/lib/mock-data";

export type PlanItemDraft = {
  day: Weekday;
  title: string;
  detail: string;
  duration: string;
  referenceUnitSequence?: number | null;
};

type ProfileRow = {
  id: string;
  email: string | null;
  name: string | null;
  display_name: string | null;
  role: string | null;
  focus: string | null;
  bio: string | null;
  avatar_preset: string | null;
  has_joined_group: boolean | null;
  joined_group_id: string | null;
};

type StudyGroupRow = {
  id: string;
  name: string;
  subject: string;
  status: GroupStatus;
  exam_date: string;
  presentation_date: string | null;
  deadline_date: string | null;
  weekly_goal: string;
  overall_goal: string | null;
  description: string;
  recent_update: string;
  review_days: Weekday[] | null;
  created_at: string;
};

type GroupMemberRow = {
  group_id: string;
  member_id: string;
  sort_order: number;
  review_interval_days: ReviewIntervalDays | null;
  member_role: "leader" | "member";
};

type MaterialRow = {
  id: string;
  group_id: string;
  title: string;
  summary: string;
  uploaded_by_member_id: string;
  uploaded_at: string;
  format: Material["format"];
  location_hint: string;
};

type PlanItemRow = {
  id: string;
  group_id: string;
  day: Weekday;
  title: string;
  detail: string;
  duration: string;
  reference_unit_sequence: number | null;
  sort_order: number;
  created_at: string;
};

type PlanItemCompletionRow = {
  plan_item_id: string;
  member_id: string;
};

type ChatMessageRow = {
  id: string;
  group_id: string;
  role: "user" | "assistant";
  scope: "materials" | "plan-agent";
  text: string;
  created_at: string;
};

type ChatMessageSourceRow = {
  id: string;
  message_id: string;
  material_id: string | null;
  title: string;
  location_hint: string;
  summary: string;
  sort_order: number;
};

type PlanReferenceUploadRow = {
  id: string;
  group_id: string;
  uploaded_by_member_id: string;
  file_name: string;
  mime_type: string;
  image_data_url: string;
  summary: string;
  created_at: string;
};

type PlanReferenceUnitRow = {
  id: string;
  group_id: string;
  upload_id: string;
  sequence_number: number;
  label: string;
  detail: string;
  sort_order: number;
};

type GroupRoadmapItemRow = {
  id: string;
  group_id: string;
  week_number: number;
  title: string;
  summary: string;
  unit_start_sequence: number;
  unit_end_sequence: number;
  sort_order: number;
};

type PersonalPlanItemRow = {
  id: string;
  group_id: string;
  member_id: string;
  title: string;
  detail: string;
  completed: boolean;
  source_plan_item_id: string | null;
  sort_order: number;
  created_at: string;
};

type PersonalTaskLibraryItemRow = {
  id: string;
  group_id: string;
  member_id: string;
  title: string;
  detail: string;
  source_plan_item_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type ReviewCandidateRow = {
  id: string;
  group_id: string;
  member_id: string;
  source_plan_item_id: string;
  title: string;
  detail: string;
  created_at: string;
  updated_at: string;
};

type PlanItemFeedbackRow = {
  plan_item_id: string;
  member_id: string;
  understanding_level: UnderstandingLevel;
  created_at: string;
  updated_at: string;
};

type GroupBundle = {
  profiles: ProfileRow[];
  group: StudyGroupRow;
  groupMembers: GroupMemberRow[];
  materials: MaterialRow[];
  planItems: PlanItemRow[];
  completions: PlanItemCompletionRow[];
  chatMessages: ChatMessageRow[];
  chatSources: ChatMessageSourceRow[];
  planReferenceUploads: PlanReferenceUploadRow[];
  planReferenceUnits: PlanReferenceUnitRow[];
  roadmapItems: GroupRoadmapItemRow[];
  reviewCandidates: ReviewCandidateRow[];
  personalPlanItems: PersonalPlanItemRow[];
  personalTaskLibraryItems: PersonalTaskLibraryItemRow[];
  planItemFeedbacks: PlanItemFeedbackRow[];
};

type FetchRows = {
  groups: StudyGroupRow[];
  profiles: ProfileRow[];
  groupMembers: GroupMemberRow[];
  materials: MaterialRow[];
  planItems: PlanItemRow[];
  completions: PlanItemCompletionRow[];
  chatMessages: ChatMessageRow[];
  chatSources: ChatMessageSourceRow[];
  planReferenceUploads: PlanReferenceUploadRow[];
  planReferenceUnits: PlanReferenceUnitRow[];
  roadmapItems: GroupRoadmapItemRow[];
  reviewCandidates: ReviewCandidateRow[];
  personalPlanItems: PersonalPlanItemRow[];
  personalTaskLibraryItems: PersonalTaskLibraryItemRow[];
  planItemFeedbacks: PlanItemFeedbackRow[];
};

function unwrapData<T>(
  label: string,
  response: { data: T | null; error: { message: string } | null },
) {
  if (response.error) {
    throw new Error(`${label}: ${response.error.message}`);
  }

  if (response.data === null) {
    throw new Error(`${label}: No data returned.`);
  }

  return response.data;
}

function unwrapNullableData<T>(
  label: string,
  response: { data: T | null; error: { message: string } | null },
) {
  if (response.error) {
    throw new Error(`${label}: ${response.error.message}`);
  }

  return response.data;
}

function ensureSuccess(
  label: string,
  response: { error: { message: string } | null },
) {
  if (response.error) {
    throw new Error(`${label}: ${response.error.message}`);
  }
}

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function toStoredProfileRole(role: Member["role"]) {
  return role === "팀장" ? "leader" : "member";
}

function toStoredMembershipRole(role: Member["role"]) {
  return role === "팀장" ? "leader" : "member";
}

function toMemberRole(role: string | null | undefined): Member["role"] {
  if (role === "leader" || role === "팀장") {
    return "팀장";
  }

  return "팀원";
}

function getProfileDisplayName(profile: ProfileRow | undefined, fallback: string) {
  return profile?.display_name?.trim() || profile?.name?.trim() || fallback;
}

function getProfileFocus(profile: ProfileRow | undefined, role: Member["role"]) {
  return profile?.focus?.trim() || (role === "팀장" ? "그룹 운영" : "학습 정리");
}

function getProfileAvatarPreset(profile: ProfileRow | undefined, fallbackSeed: string) {
  if (
    profile?.avatar_preset === "sky" ||
    profile?.avatar_preset === "emerald" ||
    profile?.avatar_preset === "rose" ||
    profile?.avatar_preset === "amber"
  ) {
    return profile.avatar_preset;
  }

  return getAvatarPresetFromSeed(fallbackSeed);
}

function normalizeGroupDetailsInput(input: GroupDetailsInput) {
  const name = input.name.trim();
  const subject = input.subject.trim();
  const examDate = input.examDate;
  const presentationDate = input.presentationDate.trim() || null;
  const deadlineDate = input.deadlineDate.trim() || null;
  const weeklyGoal = input.weeklyGoal.trim();
  const overallGoal = input.overallGoal.trim();

  if (!name || !subject || !examDate || !weeklyGoal || !overallGoal) {
    throw new Error("Study group name, subject, exam date, weekly goal, and overall goal are required.");
  }

  return {
    name,
    subject,
    examDate,
    presentationDate,
    deadlineDate,
    weeklyGoal,
    overallGoal,
  };
}

function isValidTimestamp(value: string) {
  return Number.isFinite(new Date(value).getTime());
}

function addMinutes(value: string, minutes: number) {
  return new Date(new Date(value).getTime() + minutes * 60_000).toISOString();
}

function formatChatTimestamp(value: string) {
  const parsed = new Date(value);

  if (!Number.isFinite(parsed.getTime())) {
    return value;
  }

  const now = new Date();
  const sameDay =
    parsed.getFullYear() === now.getFullYear() &&
    parsed.getMonth() === now.getMonth() &&
    parsed.getDate() === now.getDate();

  if (sameDay) {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(parsed);
  }

  return new Intl.DateTimeFormat("en-GB", {
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
}

function getUploadDraftCount(groupId: string, materials: MaterialRow[]) {
  return materials.filter((material) => material.id.startsWith(`${groupId}-upload-`)).length;
}

function getSourceMaterialId(group: StudyGroup, source: SourceCard) {
  return group.materials.find((material) => material.title === source.title)?.id ?? null;
}

function bundleGroup(group: StudyGroup, groupCreatedAt: string): GroupBundle {
  const profiles = group.members.map<ProfileRow>((member) => ({
    id: member.id,
    email: null,
    name: member.name,
    display_name: member.name,
    role: toStoredProfileRole(member.role),
    focus: member.focus,
    bio: member.bio,
    avatar_preset: member.avatarPreset,
    has_joined_group: true,
    joined_group_id: group.id,
  }));

  const groupRow: StudyGroupRow = {
    id: group.id,
    name: group.name,
    subject: group.subject,
    status: group.status,
    exam_date: group.examDate,
    presentation_date: group.presentationDate,
    deadline_date: group.deadlineDate,
    weekly_goal: group.weeklyGoal,
    overall_goal: group.overallGoal,
    description: group.description,
    recent_update: group.recentUpdate,
    review_days: group.reviewDays,
    created_at: groupCreatedAt,
  };

  const groupMembers = group.members.map<GroupMemberRow>((member, index) => ({
    group_id: group.id,
    member_id: member.id,
    sort_order: index,
    review_interval_days: group.reviewIntervals[member.id] ?? null,
    member_role: toStoredMembershipRole(member.role),
  }));

  const materials = group.materials.map<MaterialRow>((material) => {
    const uploader =
      material.uploadedByMemberId ??
      group.members.find((member) => member.name === material.uploadedBy)?.id ??
      currentUserId;

    return {
      id: material.id,
      group_id: group.id,
      title: material.title,
      summary: material.summary,
      uploaded_by_member_id: uploader,
      uploaded_at: isValidTimestamp(material.uploadedAt)
        ? material.uploadedAt
        : groupCreatedAt,
      format: material.format,
      location_hint: material.locationHint,
    };
  });

  const planItems = group.plan.map<PlanItemRow>((item, index) => ({
    id: item.id,
    group_id: group.id,
    day: item.day,
    title: item.title,
    detail: item.detail,
    duration: item.duration,
    reference_unit_sequence: item.referenceUnitSequence ?? null,
    sort_order: index,
    created_at: addMinutes(groupCreatedAt, index),
  }));

  const completions = group.plan.flatMap<PlanItemCompletionRow>((item) =>
    Object.entries(item.memberStatus)
      .filter(([, completed]) => completed)
      .map(([memberId]) => ({
        plan_item_id: item.id,
        member_id: memberId,
      })),
  );

  const chatMessages = group.chat.map<ChatMessageRow>((message, index) => ({
    id: message.id,
    group_id: group.id,
    role: message.role,
    scope: "materials",
    text: message.text,
    created_at: isValidTimestamp(message.createdAt)
      ? message.createdAt
      : addMinutes(groupCreatedAt, index),
  }));

  const planAgentMessages = group.planAgentChat.map<ChatMessageRow>((message, index) => ({
    id: message.id,
    group_id: group.id,
    role: message.role,
    scope: "plan-agent",
    text: message.text,
    created_at: isValidTimestamp(message.createdAt)
      ? message.createdAt
      : addMinutes(groupCreatedAt, index + group.chat.length),
  }));

  const chatSources = group.chat.flatMap<ChatMessageSourceRow>((message) =>
    (message.sources ?? []).map((source, sourceIndex) => ({
      id: `${message.id}-source-${sourceIndex + 1}`,
      message_id: message.id,
      material_id: getSourceMaterialId(group, source),
      title: source.title,
      location_hint: source.locationHint,
      summary: source.summary,
      sort_order: sourceIndex,
    })),
  );

  const planReferenceUploads = group.planReferenceUploads.map<PlanReferenceUploadRow>(
    (upload, index) => {
      const uploader =
        group.members.find((member) => member.name === upload.uploadedBy)?.id ?? currentUserId;

      return {
        id: upload.id,
        group_id: group.id,
        uploaded_by_member_id: uploader,
        file_name: upload.fileName,
        mime_type: upload.mimeType,
        image_data_url: upload.imageDataUrl,
        summary: upload.summary,
        created_at: isValidTimestamp(upload.uploadedAt)
          ? upload.uploadedAt
          : addMinutes(groupCreatedAt, index + 1),
      };
    },
  );

  const planReferenceUnits = group.planReferenceUnits.map<PlanReferenceUnitRow>((unit, index) => ({
    id: unit.id,
    group_id: group.id,
    upload_id: unit.uploadId,
    sequence_number: unit.sequence,
    label: unit.label,
    detail: unit.detail,
    sort_order: index,
  }));

  const roadmapItems = group.roadmap.map<GroupRoadmapItemRow>((item, index) => ({
    id: item.id,
    group_id: group.id,
    week_number: item.weekNumber,
    title: item.title,
    summary: item.summary,
    unit_start_sequence: item.unitStartSequence,
    unit_end_sequence: item.unitEndSequence,
    sort_order: index,
  }));

  const reviewCandidates = group.reviewCandidates.map<ReviewCandidateRow>((item) => ({
    id: item.id,
    group_id: group.id,
    member_id: item.memberId,
    source_plan_item_id: item.sourcePlanItemId,
    title: item.title,
    detail: item.detail,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  }));

  const personalPlanItems = group.personalPlanItems.map<PersonalPlanItemRow>((item, index) => ({
    id: item.id,
    group_id: group.id,
    member_id: item.memberId,
    title: item.title,
    detail: item.detail,
    completed: item.completed,
    source_plan_item_id: item.sourcePlanItemId ?? null,
    sort_order: index,
    created_at: addMinutes(groupCreatedAt, index + 1),
  }));

  const personalTaskLibraryItems = group.savedPersonalTaskLibraryItems.map<PersonalTaskLibraryItemRow>(
    (item, index) => ({
      id: item.id,
      group_id: group.id,
      member_id: item.memberId,
      title: item.title,
      detail: item.detail,
      source_plan_item_id: item.sourcePlanItemId ?? null,
      sort_order: index,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    }),
  );

  const planItemFeedbacks = group.planItemFeedbacks.map<PlanItemFeedbackRow>((item) => ({
    plan_item_id: item.planItemId,
    member_id: item.memberId,
    understanding_level: item.understandingLevel,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  }));

  return {
    profiles,
    group: groupRow,
    groupMembers,
    materials,
    planItems,
    completions,
    chatMessages: [...chatMessages, ...planAgentMessages],
    chatSources,
    planReferenceUploads,
    planReferenceUnits,
    roadmapItems,
    reviewCandidates,
    personalPlanItems,
    personalTaskLibraryItems,
    planItemFeedbacks,
  };
}

function mergeBundles(bundles: GroupBundle[]) {
  const profiles = new Map<string, ProfileRow>();

  for (const bundle of bundles) {
    for (const profile of bundle.profiles) {
      profiles.set(profile.id, profile);
    }
  }

  return {
    profiles: [...profiles.values()],
    groups: bundles.map((bundle) => bundle.group),
    groupMembers: bundles.flatMap((bundle) => bundle.groupMembers),
    materials: bundles.flatMap((bundle) => bundle.materials),
    planItems: bundles.flatMap((bundle) => bundle.planItems),
    completions: bundles.flatMap((bundle) => bundle.completions),
    chatMessages: bundles.flatMap((bundle) => bundle.chatMessages),
    chatSources: bundles.flatMap((bundle) => bundle.chatSources),
    planReferenceUploads: bundles.flatMap((bundle) => bundle.planReferenceUploads),
    planReferenceUnits: bundles.flatMap((bundle) => bundle.planReferenceUnits),
    roadmapItems: bundles.flatMap((bundle) => bundle.roadmapItems),
    reviewCandidates: bundles.flatMap((bundle) => bundle.reviewCandidates),
    personalPlanItems: bundles.flatMap((bundle) => bundle.personalPlanItems),
    personalTaskLibraryItems: bundles.flatMap((bundle) => bundle.personalTaskLibraryItems),
    planItemFeedbacks: bundles.flatMap((bundle) => bundle.planItemFeedbacks),
  };
}

async function fetchRows(): Promise<FetchRows> {
  const client = getSupabaseBrowserClient();

  const [
    groupsResponse,
    profilesResponse,
    groupMembersResponse,
    materialsResponse,
    planItemsResponse,
    completionsResponse,
    chatMessagesResponse,
    chatSourcesResponse,
    planReferenceUploadsResponse,
    planReferenceUnitsResponse,
    roadmapItemsResponse,
    reviewCandidatesResponse,
    personalPlanItemsResponse,
    personalTaskLibraryItemsResponse,
    planItemFeedbacksResponse,
  ] = await Promise.all([
    client.from("study_groups").select("*").order("created_at", { ascending: false }),
    client.from("profiles").select("*"),
    client.from("group_members").select("*").order("sort_order", { ascending: true }),
    client.from("materials").select("*").order("uploaded_at", { ascending: false }),
    client.from("plan_items").select("*").order("sort_order", { ascending: true }),
    client.from("plan_item_completions").select("*"),
    client.from("chat_messages").select("*").order("created_at", { ascending: true }),
    client.from("chat_message_sources").select("*").order("sort_order", { ascending: true }),
    client
      .from("plan_reference_uploads")
      .select("*")
      .order("created_at", { ascending: true }),
    client
      .from("plan_reference_units")
      .select("*")
      .order("sort_order", { ascending: true }),
    client
      .from("group_roadmap_items")
      .select("*")
      .order("sort_order", { ascending: true }),
    client
      .from("review_candidates")
      .select("*")
      .order("created_at", { ascending: true }),
    client
      .from("personal_plan_items")
      .select("*")
      .order("sort_order", { ascending: true }),
    client
      .from("personal_task_library_items")
      .select("*")
      .order("sort_order", { ascending: true }),
    client
      .from("plan_item_feedbacks")
      .select("*")
      .order("updated_at", { ascending: true }),
  ]);

  return {
    groups: unwrapData("Failed to load study groups", groupsResponse) as StudyGroupRow[],
    profiles: unwrapData("Failed to load profiles", profilesResponse) as ProfileRow[],
    groupMembers: unwrapData("Failed to load group members", groupMembersResponse) as GroupMemberRow[],
    materials: unwrapData("Failed to load materials", materialsResponse) as MaterialRow[],
    planItems: unwrapData("Failed to load plan items", planItemsResponse) as PlanItemRow[],
    completions: unwrapData(
      "Failed to load plan completions",
      completionsResponse,
    ) as PlanItemCompletionRow[],
    chatMessages: unwrapData(
      "Failed to load chat messages",
      chatMessagesResponse,
    ) as ChatMessageRow[],
    chatSources: unwrapData(
      "Failed to load chat sources",
      chatSourcesResponse,
    ) as ChatMessageSourceRow[],
    planReferenceUploads: unwrapData(
      "Failed to load plan reference uploads",
      planReferenceUploadsResponse,
    ) as PlanReferenceUploadRow[],
    planReferenceUnits: unwrapData(
      "Failed to load plan reference units",
      planReferenceUnitsResponse,
    ) as PlanReferenceUnitRow[],
    roadmapItems: unwrapData(
      "Failed to load roadmap items",
      roadmapItemsResponse,
    ) as GroupRoadmapItemRow[],
    reviewCandidates: unwrapData(
      "Failed to load review candidates",
      reviewCandidatesResponse,
    ) as ReviewCandidateRow[],
    personalPlanItems: unwrapData(
      "Failed to load personal plan items",
      personalPlanItemsResponse,
    ) as PersonalPlanItemRow[],
    personalTaskLibraryItems: unwrapData(
      "Failed to load saved personal task items",
      personalTaskLibraryItemsResponse,
    ) as PersonalTaskLibraryItemRow[],
    planItemFeedbacks: unwrapData(
      "Failed to load plan item feedbacks",
      planItemFeedbacksResponse,
    ) as PlanItemFeedbackRow[],
  };
}

function rowsToGroups({
  groups,
  profiles,
  groupMembers,
  materials,
  planItems,
  completions,
  chatMessages,
  chatSources,
  planReferenceUploads,
  planReferenceUnits,
  roadmapItems,
  reviewCandidates,
  personalPlanItems,
  personalTaskLibraryItems,
  planItemFeedbacks,
}: FetchRows): StudyGroup[] {
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const groupMembersByGroup = new Map<string, GroupMemberRow[]>();
  const materialsByGroup = new Map<string, MaterialRow[]>();
  const planItemsByGroup = new Map<string, PlanItemRow[]>();
  const completionsByPlanItem = new Map<string, Set<string>>();
  const chatMessagesByGroupAndScope = new Map<string, ChatMessageRow[]>();
  const chatSourcesByMessage = new Map<string, ChatMessageSourceRow[]>();
  const planReferenceUploadsByGroup = new Map<string, PlanReferenceUploadRow[]>();
  const planReferenceUnitsByGroup = new Map<string, PlanReferenceUnitRow[]>();
  const roadmapItemsByGroup = new Map<string, GroupRoadmapItemRow[]>();
  const reviewCandidatesByGroup = new Map<string, ReviewCandidateRow[]>();
  const personalPlanItemsByGroup = new Map<string, PersonalPlanItemRow[]>();
  const personalTaskLibraryItemsByGroup = new Map<string, PersonalTaskLibraryItemRow[]>();
  const planItemFeedbacksByGroup = new Map<string, PlanItemFeedbackRow[]>();

  for (const membership of groupMembers) {
    const entries = groupMembersByGroup.get(membership.group_id) ?? [];
    entries.push(membership);
    groupMembersByGroup.set(membership.group_id, entries);
  }

  for (const material of materials) {
    const entries = materialsByGroup.get(material.group_id) ?? [];
    entries.push(material);
    materialsByGroup.set(material.group_id, entries);
  }

  for (const planItem of planItems) {
    const entries = planItemsByGroup.get(planItem.group_id) ?? [];
    entries.push(planItem);
    planItemsByGroup.set(planItem.group_id, entries);
  }

  for (const completion of completions) {
    const entries = completionsByPlanItem.get(completion.plan_item_id) ?? new Set<string>();
    entries.add(completion.member_id);
    completionsByPlanItem.set(completion.plan_item_id, entries);
  }

  for (const message of chatMessages) {
    const scopedKey = `${message.group_id}:${message.scope}`;
    const entries = chatMessagesByGroupAndScope.get(scopedKey) ?? [];
    entries.push(message);
    chatMessagesByGroupAndScope.set(scopedKey, entries);
  }

  for (const source of chatSources) {
    const entries = chatSourcesByMessage.get(source.message_id) ?? [];
    entries.push(source);
    chatSourcesByMessage.set(source.message_id, entries);
  }

  for (const upload of planReferenceUploads) {
    const entries = planReferenceUploadsByGroup.get(upload.group_id) ?? [];
    entries.push(upload);
    planReferenceUploadsByGroup.set(upload.group_id, entries);
  }

  for (const unit of planReferenceUnits) {
    const entries = planReferenceUnitsByGroup.get(unit.group_id) ?? [];
    entries.push(unit);
    planReferenceUnitsByGroup.set(unit.group_id, entries);
  }

  for (const item of roadmapItems) {
    const entries = roadmapItemsByGroup.get(item.group_id) ?? [];
    entries.push(item);
    roadmapItemsByGroup.set(item.group_id, entries);
  }

  for (const item of reviewCandidates) {
    const entries = reviewCandidatesByGroup.get(item.group_id) ?? [];
    entries.push(item);
    reviewCandidatesByGroup.set(item.group_id, entries);
  }

  for (const item of personalPlanItems) {
    const entries = personalPlanItemsByGroup.get(item.group_id) ?? [];
    entries.push(item);
    personalPlanItemsByGroup.set(item.group_id, entries);
  }

  for (const item of personalTaskLibraryItems) {
    const entries = personalTaskLibraryItemsByGroup.get(item.group_id) ?? [];
    entries.push(item);
    personalTaskLibraryItemsByGroup.set(item.group_id, entries);
  }

  const planItemGroupById = new Map(planItems.map((item) => [item.id, item.group_id]));

  for (const item of planItemFeedbacks) {
    const groupId = planItemGroupById.get(item.plan_item_id);

    if (!groupId) {
      continue;
    }

    const entries = planItemFeedbacksByGroup.get(groupId) ?? [];
    entries.push(item);
    planItemFeedbacksByGroup.set(groupId, entries);
  }

  return groups.map((group) => {
    const members = (groupMembersByGroup.get(group.id) ?? [])
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((membership) => {
        const profile = profilesById.get(membership.member_id);
        const role = toMemberRole(membership.member_role ?? profile?.role);

        return createMemberProfile({
          id: membership.member_id,
          name: getProfileDisplayName(profile, membership.member_id),
          role,
          focus: getProfileFocus(profile, role),
          bio: profile?.bio ?? undefined,
          avatarPreset: getProfileAvatarPreset(profile, membership.member_id),
        });
      });

    const memberIds = members.map((member) => member.id);
    const reviewIntervals = Object.fromEntries(
      (groupMembersByGroup.get(group.id) ?? []).map((membership) => [
        membership.member_id,
        membership.review_interval_days ?? null,
      ]),
    ) as Record<string, ReviewIntervalDays | null>;
    const groupMaterials = (materialsByGroup.get(group.id) ?? []).map((material) => ({
      id: material.id,
      title: material.title,
      summary: material.summary,
      uploadedBy: getProfileDisplayName(
        profilesById.get(material.uploaded_by_member_id),
        material.uploaded_by_member_id,
      ),
      uploadedByMemberId: material.uploaded_by_member_id,
      uploadedAt: material.uploaded_at,
      format: material.format,
      locationHint: material.location_hint,
      processingStatus: "ready" as const,
    }));

    const plan = (planItemsByGroup.get(group.id) ?? [])
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((item) => {
        const completedMembers = completionsByPlanItem.get(item.id) ?? new Set<string>();

        return {
          id: item.id,
          day: item.day,
          title: item.title,
          detail: item.detail,
          duration: item.duration,
          memberStatus: Object.fromEntries(
            memberIds.map((memberId) => [memberId, completedMembers.has(memberId)]),
          ),
          referenceUnitSequence: item.reference_unit_sequence,
        };
      });

    const chat = (chatMessagesByGroupAndScope.get(`${group.id}:materials`) ?? []).map((message) => ({
      id: message.id,
      role: message.role,
      text: message.text,
      createdAt: formatChatTimestamp(message.created_at),
      sources: (chatSourcesByMessage.get(message.id) ?? []).map((source) => ({
        id: source.id,
        title: source.title,
        locationHint: source.location_hint,
        summary: source.summary,
      })),
    }));

    const planAgentChat = (
      chatMessagesByGroupAndScope.get(`${group.id}:plan-agent`) ?? []
    ).map((message) => ({
      id: message.id,
      role: message.role,
      text: message.text,
      createdAt: formatChatTimestamp(message.created_at),
    }));

    const mappedPlanReferenceUploads = (
      planReferenceUploadsByGroup.get(group.id) ?? []
    ).map<PlanReferenceUpload>((upload) => ({
      id: upload.id,
      fileName: upload.file_name,
      mimeType: upload.mime_type,
      imageDataUrl: upload.image_data_url,
      uploadedAt: upload.created_at,
      uploadedBy: getProfileDisplayName(
        profilesById.get(upload.uploaded_by_member_id),
        upload.uploaded_by_member_id,
      ),
      summary: upload.summary,
    }));

    const mappedPlanReferenceUnits = (
      planReferenceUnitsByGroup.get(group.id) ?? []
    ).map<PlanReferenceUnit>((unit) => ({
      id: unit.id,
      uploadId: unit.upload_id,
      sequence: unit.sequence_number,
      label: unit.label,
      detail: unit.detail,
    }));

    const mappedRoadmap = (roadmapItemsByGroup.get(group.id) ?? []).map<RoadmapItem>(
      (item) => ({
        id: item.id,
        weekNumber: item.week_number,
        title: item.title,
        summary: item.summary,
        unitStartSequence: item.unit_start_sequence,
        unitEndSequence: item.unit_end_sequence,
      }),
    );

    const mappedReviewCandidates = (
      reviewCandidatesByGroup.get(group.id) ?? []
    ).map<ReviewCandidate>((item) => ({
      id: item.id,
      memberId: item.member_id,
      title: item.title,
      detail: item.detail,
      sourcePlanItemId: item.source_plan_item_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    const mappedPersonalPlanItems = (
      personalPlanItemsByGroup.get(group.id) ?? []
    ).map<PersonalPlanItem>((item) => ({
      id: item.id,
      memberId: item.member_id,
      title: item.title,
      detail: item.detail,
      completed: item.completed,
      sourcePlanItemId: item.source_plan_item_id,
    }));

    const mappedSavedPersonalTaskLibraryItems = (
      personalTaskLibraryItemsByGroup.get(group.id) ?? []
    ).map<SavedPersonalTaskItem>((item) => ({
      id: item.id,
      memberId: item.member_id,
      title: item.title,
      detail: item.detail,
      sourcePlanItemId: item.source_plan_item_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    const mappedPlanItemFeedbacks = (
      planItemFeedbacksByGroup.get(group.id) ?? []
    ).map<PlanItemFeedback>((item) => ({
      planItemId: item.plan_item_id,
      memberId: item.member_id,
      understandingLevel: item.understanding_level,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    return {
      id: group.id,
      name: group.name,
      subject: group.subject,
      status: group.status === "completed" ? "completed" : "active",
      examDate: group.exam_date,
      presentationDate: group.presentation_date ?? null,
      deadlineDate: group.deadline_date ?? null,
      weeklyGoal: group.weekly_goal,
      overallGoal: group.overall_goal && group.overall_goal.trim() ? group.overall_goal : group.weekly_goal,
      description: group.description,
      recentUpdate: group.recent_update,
      members,
      materials: groupMaterials,
      plan,
      chat,
      planAgentChat,
      uploadDraftCount: getUploadDraftCount(group.id, materialsByGroup.get(group.id) ?? []),
      reviewDays: group.review_days ?? [],
      reviewIntervals,
      planReferenceUploads: mappedPlanReferenceUploads,
      planReferenceUnits: mappedPlanReferenceUnits,
      roadmap: mappedRoadmap,
      reviewCandidates: mappedReviewCandidates,
      personalPlanItems: mappedPersonalPlanItems,
      savedPersonalTaskLibraryItems: mappedSavedPersonalTaskLibraryItems,
      planItemFeedbacks: mappedPlanItemFeedbacks,
    };
  });
}

async function seedInitialData() {
  const client = getSupabaseBrowserClient();
  const initialGroups = getInitialGroups();
  const baseTimestamp = new Date().toISOString();
  const bundles = initialGroups.map((group, index) =>
    bundleGroup(group, addMinutes(baseTimestamp, index)),
  );
  const merged = mergeBundles(bundles);

  ensureSuccess(
    "Failed to seed profiles",
    await client.from("profiles").upsert(merged.profiles),
  );
  ensureSuccess(
    "Failed to seed study groups",
    await client.from("study_groups").upsert(merged.groups),
  );
  ensureSuccess(
    "Failed to seed group memberships",
    await client
      .from("group_members")
      .upsert(merged.groupMembers, { onConflict: "group_id,member_id" }),
  );
  ensureSuccess(
    "Failed to seed materials",
    await client.from("materials").upsert(merged.materials),
  );
  ensureSuccess(
    "Failed to seed plan items",
    await client.from("plan_items").upsert(merged.planItems),
  );
  ensureSuccess(
    "Failed to seed plan completions",
    await client
      .from("plan_item_completions")
      .upsert(merged.completions, { onConflict: "plan_item_id,member_id" }),
  );
  ensureSuccess(
    "Failed to seed chat messages",
    await client.from("chat_messages").upsert(merged.chatMessages),
  );
  ensureSuccess(
    "Failed to seed chat sources",
    await client.from("chat_message_sources").upsert(merged.chatSources),
  );
  ensureSuccess(
    "Failed to seed plan reference uploads",
    await client.from("plan_reference_uploads").upsert(merged.planReferenceUploads),
  );
  ensureSuccess(
    "Failed to seed plan reference units",
    await client.from("plan_reference_units").upsert(merged.planReferenceUnits),
  );
  ensureSuccess(
    "Failed to seed roadmap items",
    await client.from("group_roadmap_items").upsert(merged.roadmapItems),
  );
  if (merged.reviewCandidates.length > 0) {
    ensureSuccess(
      "Failed to seed review candidates",
      await client
        .from("review_candidates")
        .upsert(merged.reviewCandidates, {
          onConflict: "group_id,member_id,source_plan_item_id",
        }),
    );
  }
  ensureSuccess(
    "Failed to seed personal plan items",
    await client.from("personal_plan_items").upsert(merged.personalPlanItems),
  );
  if (merged.personalTaskLibraryItems.length > 0) {
    ensureSuccess(
      "Failed to seed saved personal task items",
      await client
        .from("personal_task_library_items")
        .upsert(merged.personalTaskLibraryItems, {
          onConflict: "id",
        }),
    );
  }
  if (merged.planItemFeedbacks.length > 0) {
    ensureSuccess(
      "Failed to seed plan item feedbacks",
      await client
        .from("plan_item_feedbacks")
        .upsert(merged.planItemFeedbacks, { onConflict: "plan_item_id,member_id" }),
    );
  }
}

async function persistGroup(group: StudyGroup) {
  const client = getSupabaseBrowserClient();
  const bundle = bundleGroup(group, new Date().toISOString());

  try {
    ensureSuccess(
      "Failed to save profiles",
      await client.from("profiles").upsert(bundle.profiles),
    );
    ensureSuccess(
      "Failed to save study group",
      await client.from("study_groups").insert(bundle.group),
    );
    ensureSuccess(
      "Failed to save group memberships",
      await client.from("group_members").insert(bundle.groupMembers),
    );
    ensureSuccess(
      "Failed to save materials",
      await client.from("materials").insert(bundle.materials),
    );
    ensureSuccess(
      "Failed to save plan items",
      await client.from("plan_items").insert(bundle.planItems),
    );

    if (bundle.completions.length > 0) {
      ensureSuccess(
        "Failed to save plan completions",
        await client.from("plan_item_completions").insert(bundle.completions),
      );
    }

    ensureSuccess(
      "Failed to save chat messages",
      await client.from("chat_messages").insert(bundle.chatMessages),
    );

    if (bundle.chatSources.length > 0) {
      ensureSuccess(
        "Failed to save chat sources",
        await client.from("chat_message_sources").insert(bundle.chatSources),
      );
    }

    if (bundle.planReferenceUploads.length > 0) {
      ensureSuccess(
        "Failed to save plan reference uploads",
        await client.from("plan_reference_uploads").insert(bundle.planReferenceUploads),
      );
    }

    if (bundle.planReferenceUnits.length > 0) {
      ensureSuccess(
        "Failed to save plan reference units",
        await client.from("plan_reference_units").insert(bundle.planReferenceUnits),
      );
    }

    if (bundle.roadmapItems.length > 0) {
      ensureSuccess(
        "Failed to save roadmap items",
        await client.from("group_roadmap_items").insert(bundle.roadmapItems),
      );
    }

    if (bundle.reviewCandidates.length > 0) {
      ensureSuccess(
        "Failed to save review candidates",
        await client.from("review_candidates").insert(bundle.reviewCandidates),
      );
    }

    if (bundle.personalPlanItems.length > 0) {
      ensureSuccess(
        "Failed to save personal plan items",
        await client.from("personal_plan_items").insert(bundle.personalPlanItems),
      );
    }

    if (bundle.personalTaskLibraryItems.length > 0) {
      ensureSuccess(
        "Failed to save saved personal task items",
        await client.from("personal_task_library_items").insert(bundle.personalTaskLibraryItems),
      );
    }

    if (bundle.planItemFeedbacks.length > 0) {
      ensureSuccess(
        "Failed to save plan item feedbacks",
        await client.from("plan_item_feedbacks").insert(bundle.planItemFeedbacks),
      );
    }
  } catch (error) {
    await client.from("study_groups").delete().eq("id", group.id);
    throw error;
  }
}

export async function bootstrapPrototypeGroups() {
  const client = getSupabaseBrowserClient();
  const countResponse = await client
    .from("study_groups")
    .select("id", { count: "exact", head: true });

  if (countResponse.error) {
    throw new Error(`Failed to inspect study groups: ${countResponse.error.message}`);
  }

  if ((countResponse.count ?? 0) === 0) {
    await seedInitialData();
  }

  return listPrototypeGroups();
}

export async function listPrototypeGroups() {
  const rows = await fetchRows();
  return rowsToGroups(rows);
}

function toProfileRow(member: Member) {
  return {
    id: member.id,
    name: member.name,
    display_name: member.name,
    role: toStoredProfileRole(member.role),
    focus: member.focus,
    bio: member.bio,
    avatar_preset: member.avatarPreset,
  };
}

function normalizeRenewalInput(input: {
  examDate: string;
  overallGoal: string;
}) {
  const examDate = input.examDate;
  const overallGoal = input.overallGoal.trim();

  if (!examDate || !overallGoal) {
    throw new Error("새 시험일과 전체 목표를 모두 입력해 주세요.");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextExamDate = new Date(`${examDate}T00:00:00`);

  if (!Number.isFinite(nextExamDate.getTime()) || nextExamDate.getTime() <= today.getTime()) {
    throw new Error("새 시험일은 오늘 이후 날짜로 지정해 주세요.");
  }

  return {
    examDate,
    overallGoal,
  };
}

async function listGroupPlanItemIds(groupId: string) {
  const client = getSupabaseBrowserClient();
  const rows = unwrapData(
    "Failed to inspect group plan items",
    await client.from("plan_items").select("id").eq("group_id", groupId),
  ) as Array<{ id: string }>;

  return rows.map((row) => row.id);
}

export async function createPrototypeGroup(input: CreateGroupInput, creator?: Member) {
  const group = createGroupFromInput(input, creator);
  await persistGroup(group);
  return group.id;
}

export async function syncPrototypeProfile(member: Member) {
  const client = getSupabaseBrowserClient();

  ensureSuccess(
    "Failed to sync current user profile",
    await client.from("profiles").upsert(toProfileRow(member)),
  );
}

export async function ensurePrototypeGroupMembership(groupId: string, member: Member) {
  const client = getSupabaseBrowserClient();

  await syncPrototypeProfile(member);

  const existingMembership = await client
    .from("group_members")
    .select("group_id")
    .eq("group_id", groupId)
    .eq("member_id", member.id)
    .maybeSingle();

  const membership = unwrapNullableData(
    "Failed to inspect group membership",
    existingMembership,
  );

  if (membership) {
    return;
  }

  const memberRows = unwrapData(
    "Failed to inspect group members",
    await client.from("group_members").select("member_id").eq("group_id", groupId),
  ) as Array<{ member_id: string }>;

  ensureSuccess(
    "Failed to add current user to group members",
    await client.from("group_members").upsert(
      {
        group_id: groupId,
        member_id: member.id,
        sort_order: memberRows.length,
        review_interval_days: null,
        member_role: toStoredMembershipRole(member.role),
      },
      { onConflict: "group_id,member_id" },
    ),
  );
}

export async function updatePrototypeGroupDetails(groupId: string, updates: GroupDetailsInput) {
  const client = getSupabaseBrowserClient();
  const normalized = normalizeGroupDetailsInput(updates);

  ensureSuccess(
    "Failed to update study group details",
    await client
      .from("study_groups")
      .update({
        name: normalized.name,
        subject: normalized.subject,
        exam_date: normalized.examDate,
        presentation_date: normalized.presentationDate,
        deadline_date: normalized.deadlineDate,
        weekly_goal: normalized.weeklyGoal,
        overall_goal: normalized.overallGoal,
        description: buildGroupDescription(normalized.subject, normalized.overallGoal),
        recent_update: buildRecentUpdateFromGoal(normalized.weeklyGoal),
      })
      .eq("id", groupId),
  );
}

export async function completePrototypeGroup(groupId: string) {
  const client = getSupabaseBrowserClient();

  ensureSuccess(
    "Failed to mark study group as completed",
    await client.from("study_groups").update({ status: "completed" }).eq("id", groupId),
  );
}

export async function renewPrototypeGroupCycle(
  groupId: string,
  input: {
    examDate: string;
    overallGoal: string;
  },
) {
  const client = getSupabaseBrowserClient();
  const normalized = normalizeRenewalInput(input);

  const existingGroup = unwrapNullableData(
    "Failed to inspect study group before renewal",
    await client
      .from("study_groups")
      .select("subject, weekly_goal")
      .eq("id", groupId)
      .maybeSingle(),
  ) as { subject: string; weekly_goal: string } | null;

  if (!existingGroup) {
    throw new Error("갱신할 그룹 정보를 찾지 못했어요.");
  }

  ensureSuccess(
    "Failed to renew study group cycle",
    await client
      .from("study_groups")
      .update({
        status: "active",
        exam_date: normalized.examDate,
        weekly_goal: existingGroup.weekly_goal,
        overall_goal: normalized.overallGoal,
        description: buildGroupDescription(existingGroup.subject, normalized.overallGoal),
        recent_update: "새 시험 일정과 목표로 다음 스터디 주기를 시작했어요.",
      })
      .eq("id", groupId),
  );
}

export async function leavePrototypeGroup(groupId: string, memberId: string) {
  const client = getSupabaseBrowserClient();
  const planItemIds = await listGroupPlanItemIds(groupId);

  if (planItemIds.length > 0) {
    ensureSuccess(
      "Failed to remove plan completions for leaving member",
      await client
        .from("plan_item_completions")
        .delete()
        .eq("member_id", memberId)
        .in("plan_item_id", planItemIds),
    );

    ensureSuccess(
      "Failed to remove plan item feedback for leaving member",
      await client
        .from("plan_item_feedbacks")
        .delete()
        .eq("member_id", memberId)
        .in("plan_item_id", planItemIds),
    );
  }

  ensureSuccess(
    "Failed to remove review candidates for leaving member",
    await client
      .from("review_candidates")
      .delete()
      .eq("group_id", groupId)
      .eq("member_id", memberId),
  );

  ensureSuccess(
    "Failed to remove personal plan items for leaving member",
    await client
      .from("personal_plan_items")
      .delete()
      .eq("group_id", groupId)
      .eq("member_id", memberId),
  );

  ensureSuccess(
    "Failed to remove saved personal task items for leaving member",
    await client
      .from("personal_task_library_items")
      .delete()
      .eq("group_id", groupId)
      .eq("member_id", memberId),
  );

  ensureSuccess(
    "Failed to remove group membership",
    await client
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("member_id", memberId),
  );
}

export async function deletePrototypeGroup(groupId: string) {
  const client = getSupabaseBrowserClient();

  ensureSuccess(
    "Failed to delete study group",
    await client.from("study_groups").delete().eq("id", groupId),
  );
}

export async function transferPrototypeGroupLeadership(
  groupId: string,
  currentLeaderId: string,
  nextLeaderId: string,
) {
  if (currentLeaderId === nextLeaderId) {
    return;
  }

  const client = getSupabaseBrowserClient();
  const membership = unwrapNullableData(
    "Failed to inspect next leader membership",
    await client
      .from("group_members")
      .select("group_id")
      .eq("group_id", groupId)
      .eq("member_id", nextLeaderId)
      .maybeSingle(),
  );

  if (!membership) {
    throw new Error("다음 팀장은 현재 그룹에 속한 팀원이어야 해요.");
  }

  ensureSuccess(
    "Failed to update next leader membership role",
    await client
      .from("group_members")
      .update({ member_role: "leader" })
      .eq("group_id", groupId)
      .eq("member_id", nextLeaderId),
  );

  ensureSuccess(
    "Failed to update previous leader membership role",
    await client
      .from("group_members")
      .update({ member_role: "member" })
      .eq("group_id", groupId)
      .eq("member_id", currentLeaderId),
  );

  ensureSuccess(
    "Failed to update next leader profile",
    await client
      .from("profiles")
      .update({
        role: "leader",
        has_joined_group: true,
        joined_group_id: groupId,
      })
      .eq("id", nextLeaderId),
  );

  ensureSuccess(
    "Failed to update previous leader profile",
    await client
      .from("profiles")
      .update({
        role: "member",
      })
      .eq("id", currentLeaderId),
  );
}

export async function togglePrototypePlanItem(itemId: string, memberId = currentUserId) {
  const client = getSupabaseBrowserClient();
  const existing = await client
    .from("plan_item_completions")
    .select("plan_item_id")
    .eq("plan_item_id", itemId)
    .eq("member_id", memberId)
    .maybeSingle();

  const data = unwrapNullableData("Failed to inspect plan completion", existing);

  if (data) {
    ensureSuccess(
      "Failed to delete plan completion",
      await client
        .from("plan_item_completions")
        .delete()
        .eq("plan_item_id", itemId)
        .eq("member_id", memberId),
    );
    return;
  }

  ensureSuccess(
    "Failed to save plan completion",
    await client.from("plan_item_completions").insert({
      plan_item_id: itemId,
      member_id: memberId,
    }),
  );
}

export async function clearPrototypePlanItemCompletion(
  itemId: string,
  memberId = currentUserId,
) {
  const client = getSupabaseBrowserClient();

  ensureSuccess(
    "Failed to delete plan completion",
    await client
      .from("plan_item_completions")
      .delete()
      .eq("plan_item_id", itemId)
      .eq("member_id", memberId),
  );

  ensureSuccess(
    "Failed to delete plan item feedback",
    await client
      .from("plan_item_feedbacks")
      .delete()
      .eq("plan_item_id", itemId)
      .eq("member_id", memberId),
  );
}

export async function completePrototypePlanItemWithFeedback(
  group: StudyGroup,
  itemId: string,
  memberId: string,
  understandingLevel: UnderstandingLevel,
) {
  const client = getSupabaseBrowserClient();
  const targetItem = group.plan.find((item) => item.id === itemId);

  if (!targetItem) {
    throw new Error("Failed to find the selected plan item.");
  }

  const existingCompletion = await client
    .from("plan_item_completions")
    .select("plan_item_id")
    .eq("plan_item_id", itemId)
    .eq("member_id", memberId)
    .maybeSingle();

  const completionData = unwrapNullableData(
    "Failed to inspect plan completion",
    existingCompletion,
  );

  if (!completionData) {
    ensureSuccess(
      "Failed to save plan completion",
      await client.from("plan_item_completions").insert({
        plan_item_id: itemId,
        member_id: memberId,
      }),
    );
  }

  const now = new Date().toISOString();
  const existingFeedback = await client
    .from("plan_item_feedbacks")
    .select("created_at")
    .eq("plan_item_id", itemId)
    .eq("member_id", memberId)
    .maybeSingle();

  const feedbackData = unwrapNullableData(
    "Failed to inspect plan item feedback",
    existingFeedback,
  );

  ensureSuccess(
    "Failed to save plan item feedback",
    await client.from("plan_item_feedbacks").upsert(
      {
        plan_item_id: itemId,
        member_id: memberId,
        understanding_level: understandingLevel,
        created_at: feedbackData?.created_at ?? now,
        updated_at: now,
      },
      { onConflict: "plan_item_id,member_id" },
    ),
  );

  if (understandingLevel !== "low") {
    return;
  }

  const generatedTitle = `${targetItem.title} 다시 복습하기`;
  const generatedDetail = targetItem.detail.trim()
    ? `${targetItem.detail} 이해도가 낮아 복습 예정 항목으로 저장됐어요.`
    : "이해도가 낮아 복습 예정 항목으로 저장됐어요.";
  const existingReviewCandidate = await client
    .from("review_candidates")
    .select("id, created_at")
    .eq("group_id", group.id)
    .eq("member_id", memberId)
    .eq("source_plan_item_id", itemId)
    .maybeSingle();

  const reviewCandidateData = unwrapNullableData(
    "Failed to inspect review candidate",
    existingReviewCandidate,
  );

  if (reviewCandidateData) {
    ensureSuccess(
      "Failed to refresh review candidate",
      await client
        .from("review_candidates")
        .update({
          title: generatedTitle,
          detail: generatedDetail,
          updated_at: now,
        })
        .eq("id", reviewCandidateData.id),
    );
    return;
  }

  ensureSuccess(
    "Failed to create review candidate",
    await client.from("review_candidates").insert({
      id: createId("review-candidate"),
      group_id: group.id,
      member_id: memberId,
      title: generatedTitle,
      detail: generatedDetail,
      source_plan_item_id: itemId,
      created_at: now,
      updated_at: now,
    }),
  );
}

export async function updatePrototypePlanItem(itemId: string, updates: PlanItemDraft) {
  const client = getSupabaseBrowserClient();

  ensureSuccess(
    "Failed to update plan item",
    await client
      .from("plan_items")
      .update({
        day: updates.day,
        title: updates.title,
        detail: updates.detail,
        duration: updates.duration,
        reference_unit_sequence: updates.referenceUnitSequence ?? null,
      })
      .eq("id", itemId),
  );
}

export async function addPrototypePlanItem(group: StudyGroup, item: PlanItemDraft) {
  const client = getSupabaseBrowserClient();

  ensureSuccess(
    "Failed to create plan item",
    await client.from("plan_items").insert({
      id: createId("plan-custom"),
      group_id: group.id,
      day: item.day,
      title: item.title,
      detail: item.detail,
      duration: item.duration,
      reference_unit_sequence: item.referenceUnitSequence ?? null,
      sort_order: group.plan.length,
      created_at: new Date().toISOString(),
    }),
  );
}

export async function addPrototypeUpload(group: StudyGroup, memberId = currentUserId) {
  const client = getSupabaseBrowserClient();
  const nextCount = group.uploadDraftCount + 1;

  ensureSuccess(
    "Failed to add material",
    await client.from("materials").insert({
      id: createId(`${group.id}-upload`),
      group_id: group.id,
      title: `${group.subject} upload ${nextCount}.pdf`,
      summary: "Mock upload metadata stored in Supabase.",
      uploaded_by_member_id: memberId,
      uploaded_at: new Date().toISOString(),
      format: "PDF",
      location_hint: `Upload box #${nextCount}`,
    }),
  );

  ensureSuccess(
    "Failed to update group activity",
    await client
      .from("study_groups")
      .update({
        recent_update: `Mock material ${nextCount} added from the upload box.`,
      })
      .eq("id", group.id),
  );
}

export async function addPrototypeUploadedMaterial(
  groupId: string,
  material: Pick<
    Material,
    "id" | "title" | "summary" | "uploadedAt" | "format" | "locationHint"
  >,
  memberId: string,
) {
  const client = getSupabaseBrowserClient();

  ensureSuccess(
    "Failed to save uploaded material",
    await client.from("materials").insert({
      id: material.id,
      group_id: groupId,
      title: material.title,
      summary: material.summary,
      uploaded_by_member_id: memberId,
      uploaded_at: material.uploadedAt,
      format: material.format,
      location_hint: material.locationHint,
    }),
  );

  ensureSuccess(
    "Failed to update recent material activity",
    await client
      .from("study_groups")
      .update({
        recent_update: `${material.title} 자료가 업로드되었습니다.`,
      })
      .eq("id", groupId),
  );
}

export async function addPrototypePlanReferenceUpload(
  group: StudyGroup,
  upload: PlanReferenceUploadDraft,
  memberId = currentUserId,
) {
  const client = getSupabaseBrowserClient();
  const uploadId = createId(`${group.id}-plan-reference`);
  const fileName = upload.fileName.trim() || `${group.subject}-plan-reference.png`;
  const createdAt = new Date().toISOString();
  const units = buildMockPlanReferenceUnits({
    group,
    upload: { id: uploadId, fileName },
  });
  const summary =
    units.length > 0
      ? `${units[0]?.label}부터 ${units[units.length - 1]?.label}까지 ${units.length}개 진도 단위를 만들었습니다.`
      : "진도 단위를 아직 만들지 못했습니다.";

  ensureSuccess(
    "Failed to save plan reference upload",
    await client.from("plan_reference_uploads").insert({
      id: uploadId,
      group_id: group.id,
      uploaded_by_member_id: memberId,
      file_name: fileName,
      mime_type: upload.mimeType,
      image_data_url: upload.imageDataUrl,
      summary,
      created_at: createdAt,
    }),
  );

  if (units.length > 0) {
    ensureSuccess(
      "Failed to save plan reference units",
      await client.from("plan_reference_units").insert(
        units.map((unit, index) => ({
          id: unit.id,
          group_id: group.id,
          upload_id: uploadId,
          sequence_number: unit.sequence,
          label: unit.label,
          detail: unit.detail,
          sort_order: index,
        })),
      ),
    );
  }

  ensureSuccess(
    "Failed to update group activity",
    await client
      .from("study_groups")
      .update({
        recent_update: `${fileName} 진도표를 기준으로 새 계획 입력이 준비되었습니다.`,
      })
      .eq("id", group.id),
  );
}

export async function replacePrototypePlanReferenceUpload(
  group: StudyGroup,
  uploadId: string,
  upload: PlanReferenceUploadDraft,
  memberId = currentUserId,
) {
  const client = getSupabaseBrowserClient();
  const existingUpload = unwrapNullableData(
    "Failed to inspect plan reference upload",
    await client
      .from("plan_reference_uploads")
      .select("id")
      .eq("group_id", group.id)
      .eq("id", uploadId)
      .maybeSingle(),
  );

  if (!existingUpload) {
    throw new Error("바꿀 진도표 이미지를 찾지 못했어요.");
  }

  const fileName = upload.fileName.trim() || `${group.subject}-plan-reference.png`;
  const units = buildMockPlanReferenceUnits({
    group,
    upload: { id: uploadId, fileName },
  });
  const summary =
    units.length > 0
      ? `${units[0]?.label}부터 ${units[units.length - 1]?.label}까지 ${units.length}개 진도 단위를 만들었습니다.`
      : "진도 단위를 아직 만들지 못했습니다.";

  ensureSuccess(
    "Failed to remove previous plan reference units",
    await client.from("plan_reference_units").delete().eq("upload_id", uploadId),
  );

  ensureSuccess(
    "Failed to update plan reference upload",
    await client
      .from("plan_reference_uploads")
      .update({
        uploaded_by_member_id: memberId,
        file_name: fileName,
        mime_type: upload.mimeType,
        image_data_url: upload.imageDataUrl,
        summary,
      })
      .eq("id", uploadId)
      .eq("group_id", group.id),
  );

  if (units.length > 0) {
    ensureSuccess(
      "Failed to save replaced plan reference units",
      await client.from("plan_reference_units").insert(
        units.map((unit, index) => ({
          id: unit.id,
          group_id: group.id,
          upload_id: uploadId,
          sequence_number: unit.sequence,
          label: unit.label,
          detail: unit.detail,
          sort_order: index,
        })),
      ),
    );
  }

  ensureSuccess(
    "Failed to update group activity",
    await client
      .from("study_groups")
      .update({
        recent_update: `${fileName} 진도표로 이미지가 변경되었습니다.`,
      })
      .eq("id", group.id),
  );
}

export async function deletePrototypePlanReferenceUpload(groupId: string, uploadId: string) {
  const client = getSupabaseBrowserClient();

  ensureSuccess(
    "Failed to remove plan reference units",
    await client.from("plan_reference_units").delete().eq("upload_id", uploadId),
  );

  ensureSuccess(
    "Failed to remove plan reference upload",
    await client
      .from("plan_reference_uploads")
      .delete()
      .eq("group_id", groupId)
      .eq("id", uploadId),
  );

  ensureSuccess(
    "Failed to update group activity",
    await client
      .from("study_groups")
      .update({
        recent_update: "진도표 이미지가 삭제되었습니다.",
      })
      .eq("id", groupId),
  );
}

export async function updatePrototypeReviewDays(groupId: string, reviewDays: Weekday[]) {
  const client = getSupabaseBrowserClient();

  ensureSuccess(
    "Failed to update review days",
    await client.from("study_groups").update({ review_days: reviewDays }).eq("id", groupId),
  );
}

export async function updatePrototypeReviewInterval(
  groupId: string,
  memberId: string,
  reviewIntervalDays: ReviewIntervalDays | null,
) {
  const client = getSupabaseBrowserClient();

  ensureSuccess(
    "Failed to update review interval",
    await client
      .from("group_members")
      .update({ review_interval_days: reviewIntervalDays })
      .eq("group_id", groupId)
      .eq("member_id", memberId),
  );
}

export async function addPrototypeDueReviewCandidateTodos(groups: StudyGroup[]) {
  const client = getSupabaseBrowserClient();
  let createdCount = 0;

  for (const group of groups) {
    const groupCreatedCountsByMember = new Map<string, number>();
    const dueCandidates = group.reviewCandidates.filter((candidate) => {
      const alreadyAdded = group.personalPlanItems.some((item) => {
        return (
          item.memberId === candidate.memberId &&
          item.sourcePlanItemId === candidate.sourcePlanItemId
        );
      });

      return (
        !alreadyAdded &&
        isReviewCandidateDue(group, candidate, candidate.memberId)
      );
    });

    for (const candidate of dueCandidates) {
      const existingPersonalItem = await client
        .from("personal_plan_items")
        .select("id")
        .eq("group_id", group.id)
        .eq("member_id", candidate.memberId)
        .eq("source_plan_item_id", candidate.sourcePlanItemId)
        .maybeSingle();

      const personalItemData = unwrapNullableData(
        "Failed to inspect review personal todo",
        existingPersonalItem,
      );

      if (personalItemData) {
        continue;
      }

      const groupCreatedCount = groupCreatedCountsByMember.get(candidate.memberId) ?? 0;
      const currentItemCount =
        group.personalPlanItems.filter((item) => item.memberId === candidate.memberId).length +
        groupCreatedCount;

      ensureSuccess(
        "Failed to create review personal todo",
        await client.from("personal_plan_items").insert({
          id: createId("personal-review"),
          group_id: group.id,
          member_id: candidate.memberId,
          title: `[복습] ${candidate.title}`,
          detail: candidate.detail,
          completed: false,
          source_plan_item_id: candidate.sourcePlanItemId,
          sort_order: currentItemCount,
          created_at: new Date().toISOString(),
        }),
      );

      groupCreatedCountsByMember.set(candidate.memberId, groupCreatedCount + 1);
      createdCount += 1;
    }
  }

  return createdCount > 0;
}

export async function addPrototypePersonalPlanItem(
  groupId: string,
  memberId: string,
  item: PersonalPlanItemDraft,
  sortOrder: number,
) {
  const client = getSupabaseBrowserClient();

  ensureSuccess(
    "Failed to create personal plan item",
    await client.from("personal_plan_items").insert({
      id: createId("personal-plan"),
      group_id: groupId,
      member_id: memberId,
      title: item.title,
      detail: item.detail,
      completed: false,
      source_plan_item_id: null,
      sort_order: sortOrder,
      created_at: new Date().toISOString(),
    }),
  );
}

export async function savePrototypePersonalTaskLibraryItem(
  groupId: string,
  memberId: string,
  item: SavedPersonalTaskDraft,
  sortOrder: number,
  sourcePlanItemId: string | null = null,
) {
  const client = getSupabaseBrowserClient();
  const now = new Date().toISOString();

  ensureSuccess(
    "Failed to create saved personal task",
    await client.from("personal_task_library_items").insert({
      id: createId("saved-personal-task"),
      group_id: groupId,
      member_id: memberId,
      title: item.title,
      detail: item.detail,
      source_plan_item_id: sourcePlanItemId,
      sort_order: sortOrder,
      created_at: now,
      updated_at: now,
    }),
  );
}

export async function updatePrototypePersonalTaskLibraryItem(
  itemId: string,
  item: SavedPersonalTaskDraft,
) {
  const client = getSupabaseBrowserClient();

  ensureSuccess(
    "Failed to update saved personal task",
    await client
      .from("personal_task_library_items")
      .update({
        title: item.title,
        detail: item.detail,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId),
  );
}

export async function deletePrototypePersonalTaskLibraryItem(itemId: string) {
  const client = getSupabaseBrowserClient();

  ensureSuccess(
    "Failed to delete saved personal task",
    await client.from("personal_task_library_items").delete().eq("id", itemId),
  );
}

export async function addSavedTaskToPrototypePersonalPlan(
  groupId: string,
  memberId: string,
  savedTaskId: string,
  sortOrder: number,
) {
  const client = getSupabaseBrowserClient();
  const savedTaskResponse = await client
    .from("personal_task_library_items")
    .select("title, detail, source_plan_item_id")
    .eq("id", savedTaskId)
    .eq("group_id", groupId)
    .eq("member_id", memberId)
    .maybeSingle();

  const savedTask = unwrapNullableData(
    "Failed to inspect saved personal task",
    savedTaskResponse,
  );

  if (!savedTask) {
    throw new Error("Failed to find the selected saved personal task.");
  }

  if (savedTask.source_plan_item_id) {
    const existingPersonalItemResponse = await client
      .from("personal_plan_items")
      .select("id")
      .eq("group_id", groupId)
      .eq("member_id", memberId)
      .eq("source_plan_item_id", savedTask.source_plan_item_id)
      .maybeSingle();

    const existingPersonalItem = unwrapNullableData(
      "Failed to inspect active personal task",
      existingPersonalItemResponse,
    );

    if (existingPersonalItem) {
      ensureSuccess(
        "Failed to refresh active personal task",
        await client
          .from("personal_plan_items")
          .update({
            title: savedTask.title,
            detail: savedTask.detail,
            completed: false,
          })
          .eq("id", existingPersonalItem.id),
      );
      return;
    }
  }

  ensureSuccess(
    "Failed to create personal plan item from saved task",
    await client.from("personal_plan_items").insert({
      id: createId("personal-plan"),
      group_id: groupId,
      member_id: memberId,
      title: savedTask.title,
      detail: savedTask.detail,
      completed: false,
      source_plan_item_id: savedTask.source_plan_item_id,
      sort_order: sortOrder,
      created_at: new Date().toISOString(),
    }),
  );
}

export async function updatePrototypePersonalPlanItem(
  itemId: string,
  item: PersonalPlanItemDraft,
) {
  const client = getSupabaseBrowserClient();

  ensureSuccess(
    "Failed to update personal plan item",
    await client
      .from("personal_plan_items")
      .update({ title: item.title, detail: item.detail })
      .eq("id", itemId),
  );
}

export async function togglePrototypePersonalPlanItem(itemId: string, completed: boolean) {
  const client = getSupabaseBrowserClient();

  ensureSuccess(
    "Failed to toggle personal plan item",
    await client.from("personal_plan_items").update({ completed }).eq("id", itemId),
  );
}

export async function applyPrototypePlanAgentDraft(groupId: string, draft: PlanAgentDraft) {
  const client = getSupabaseBrowserClient();

  if (draft.scope === "both" || draft.scope === "weekly-plan") {
    const existingPlanItems = await client
      .from("plan_items")
      .select("id")
      .eq("group_id", groupId);

    const planItemIds = unwrapData(
      "Failed to inspect existing group plan items",
      existingPlanItems,
    ).map((row) => row.id);

    if (planItemIds.length > 0) {
      ensureSuccess(
        "Failed to delete existing plan completions",
        await client.from("plan_item_completions").delete().in("plan_item_id", planItemIds),
      );
    }

    ensureSuccess(
      "Failed to delete existing plan items",
      await client.from("plan_items").delete().eq("group_id", groupId),
    );

    if (draft.weeklyPlan.length > 0) {
      ensureSuccess(
        "Failed to save generated weekly plan",
        await client.from("plan_items").insert(
          draft.weeklyPlan.map((item, index) => ({
            id: createId("plan-agent"),
            group_id: groupId,
            day: item.day,
            title: item.title,
            detail: item.detail,
            duration: item.duration,
            reference_unit_sequence: item.referenceUnitSequence ?? null,
            sort_order: index,
            created_at: new Date().toISOString(),
          })),
        ),
      );
    }
  }

  if (draft.scope === "both" || draft.scope === "roadmap") {
    ensureSuccess(
      "Failed to delete existing roadmap items",
      await client.from("group_roadmap_items").delete().eq("group_id", groupId),
    );

    if (draft.roadmap.length > 0) {
      ensureSuccess(
        "Failed to save roadmap items",
        await client.from("group_roadmap_items").insert(
          draft.roadmap.map((item, index) => ({
            id: item.id,
            group_id: groupId,
            week_number: item.weekNumber,
            title: item.title,
            summary: item.summary,
            unit_start_sequence: item.unitStartSequence,
            unit_end_sequence: item.unitEndSequence,
            sort_order: index,
          })),
        ),
      );
    }
  }

  const groupUpdate: {
    recent_update: string;
    weekly_goal?: string;
  } = {
    recent_update: draft.recentUpdate,
  };

  if (draft.scope === "both" || draft.scope === "weekly-plan") {
    groupUpdate.weekly_goal = draft.weeklyGoal;
  }

  ensureSuccess(
    "Failed to update group summary after applying plan agent draft",
    await client.from("study_groups").update(groupUpdate).eq("id", groupId),
  );
}

export async function addPrototypeUserQuestion(
  groupId: string,
  question: string,
  scope: "materials" | "plan-agent" = "materials",
) {
  const client = getSupabaseBrowserClient();

  ensureSuccess(
    "Failed to save user question",
    await client.from("chat_messages").insert({
      id: createId("chat-user"),
      group_id: groupId,
      role: "user",
      scope,
      text: question,
      created_at: new Date().toISOString(),
    }),
  );
}

export async function addPrototypeAssistantAnswer(
  group: StudyGroup,
  question: string,
  scope: "materials" | "plan-agent" = "materials",
  answerTextOverride?: string,
) {
  const client = getSupabaseBrowserClient();
  const mockMaterialsAnswer = scope === "materials" ? buildMockAnswer(group, question) : null;
  const fallbackText =
    scope === "materials"
      ? mockMaterialsAnswer?.text ?? ""
      : buildPlanAgentAnswer(group, buildPlanAgentDraft(group, question), question).text;
  const messageId = createId("chat-assistant");
  const answerText = answerTextOverride?.trim() || fallbackText;

  ensureSuccess(
    "Failed to save assistant answer",
    await client.from("chat_messages").insert({
      id: messageId,
      group_id: group.id,
      role: "assistant",
      scope,
      text: answerText,
      created_at: new Date().toISOString(),
    }),
  );

  if (scope !== "materials") {
    return;
  }

  const sourceRows =
    mockMaterialsAnswer?.sources?.map((source, index) => ({
      id: `${messageId}-source-${index + 1}`,
      message_id: messageId,
      material_id: getSourceMaterialId(group, source),
      title: source.title,
      location_hint: source.locationHint,
      summary: source.summary,
      sort_order: index,
    })) ?? [];

  if (sourceRows.length === 0) {
    return;
  }

  try {
    ensureSuccess(
      "Failed to save assistant sources",
      await client.from("chat_message_sources").insert(sourceRows),
    );
  } catch (error) {
    await client.from("chat_messages").delete().eq("id", messageId);
    throw error;
  }
}
