import {
  currentUserId,
  type ChatMessage,
  type PersonalPlanItem,
  type PlanReferenceUnit,
  type PlanReferenceUpload,
  type ReviewCandidate,
  type ReviewIntervalDays,
  type RoadmapItem,
  type StudyGroup,
  type Weekday,
  type WeeklyPlanItem,
} from "@/lib/mock-data";

export type PlanAgentDraftScope = "roadmap" | "weekly-plan" | "both";

export type PlanAgentDraft = {
  scope: PlanAgentDraftScope;
  weeklyGoal: string;
  recentUpdate: string;
  roadmap: RoadmapItem[];
  weeklyPlan: WeeklyPlanItem[];
};

export const planAgentDraftMarker = "<<PLAN_AGENT_DRAFT>>";

export type PlanReferenceUploadDraft = {
  fileName: string;
  mimeType: string;
  imageDataUrl: string;
};

export type PlanReferenceAnalysisUnit = {
  label: string;
  detail: string;
};

export type PlanReferenceAnalysisResult = {
  summary: string;
  units: PlanReferenceAnalysisUnit[];
};

export type PersonalPlanItemDraft = {
  title: string;
  detail: string;
};

export type SavedPersonalTaskDraft = {
  title: string;
  detail: string;
};

export const orderedWeekdays: Weekday[] = ["월", "화", "수", "목", "금", "토", "일"];

function normalizeWeekdayValue(value: string): Weekday | null {
  const normalized = value.replace(/\s+/g, "").toLowerCase();

  if (!normalized) {
    return null;
  }

  const directMatch = orderedWeekdays.find(
    (day) => normalized === day.replace(/\s+/g, "").toLowerCase(),
  );

  if (directMatch) {
    return directMatch;
  }

  const weekdayAliases: Array<{ day: Weekday; pattern: RegExp }> = [
    { day: "월", pattern: /월|mon/ },
    { day: "화", pattern: /화|tue/ },
    { day: "수", pattern: /수|wed/ },
    { day: "목", pattern: /목|thu/ },
    { day: "금", pattern: /금|fri/ },
    { day: "토", pattern: /토|sat/ },
    { day: "일", pattern: /일|sun/ },
  ];

  for (const alias of weekdayAliases) {
    if (alias.pattern.test(normalized)) {
      return alias.day;
    }
  }

  return null;
}

function normalizeDurationValue(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return "60분";
  }

  if (/\d+\s*분/.test(normalized)) {
    return normalized.replace(/\s+/g, "");
  }

  const matched = normalized.match(/(\d+)/);

  if (matched?.[1]) {
    return `${matched[1]}분`;
  }

  return "60분";
}

export const reviewIntervalOptions: Array<{
  label: string;
  days: ReviewIntervalDays;
}> = [
  { label: "3일", days: 3 },
  { label: "1주일", days: 7 },
  { label: "2주", days: 14 },
  { label: "4주", days: 28 },
];

const subjectUnitCatalogs: Array<{
  match: RegExp;
  units: string[];
}> = [
  {
    match: /운영체제|os/i,
    units: [
      "프로세스와 스레드",
      "CPU 스케줄링",
      "동기화와 교착 상태",
      "메모리 관리",
      "가상 메모리",
      "파일 시스템",
      "입출력 관리",
      "보호와 보안",
      "멀티코어 환경",
      "기출 문제 정리",
    ],
  },
  {
    match: /데이터통신|네트워크|network/i,
    units: [
      "OSI 7계층",
      "데이터링크 계층",
      "오류 제어",
      "흐름 제어",
      "라우팅",
      "전송 계층",
      "응용 계층",
      "혼잡 제어",
      "무선 통신 개요",
      "예상 문제 정리",
    ],
  },
];

function hashLabelSeed(value: string) {
  return [...value].reduce((total, character, index) => {
    return total + character.charCodeAt(0) * (index + 1);
  }, 0);
}

function getSubjectUnits(subject: string) {
  const matched = subjectUnitCatalogs.find((entry) => entry.match.test(subject));

  if (matched) {
    return matched.units;
  }

  return [
    `${subject} 핵심 개념 1`,
    `${subject} 핵심 개념 2`,
    `${subject} 핵심 개념 3`,
    `${subject} 적용 문제 1`,
    `${subject} 적용 문제 2`,
    `${subject} 요약 정리`,
    `${subject} 취약 파트 점검`,
    `${subject} 서술형 대비`,
  ];
}

function createDraftId(prefix: string, index: number) {
  return `${prefix}-${index + 1}`;
}

function parseWeekNumberFromText(value: string) {
  const matched = value.match(/(\d+)\s*주차/i);

  if (!matched) {
    return null;
  }

  const parsed = Number.parseInt(matched[1] ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function getLastPlanAgentQuestion(messages: ChatMessage[]) {
  const lastUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");

  return lastUserMessage?.text.trim() ?? "";
}

function getPlanAgentDraftScope(question: string): PlanAgentDraftScope {
  void question;
  return "weekly-plan";
}

function getRequestedWeekNumber(question: string, roadmapLength: number) {
  const match = question.match(/(\d+)\s*주차/i);

  if (!match) {
    return null;
  }

  const requestedWeekNumber = Number.parseInt(match[1] ?? "", 10);

  if (!Number.isFinite(requestedWeekNumber) || requestedWeekNumber < 1) {
    return null;
  }

  return Math.min(requestedWeekNumber, Math.max(roadmapLength, 1));
}

function getWeeklyFocusUnits(
  units: PlanReferenceUnit[],
  roadmap: RoadmapItem[],
  requestedWeekNumber: number | null,
) {
  if (!requestedWeekNumber) {
    return units.slice(0, orderedWeekdays.length);
  }

  const targetRoadmapItem =
    roadmap.find((item) => item.weekNumber === requestedWeekNumber) ?? roadmap[0];

  if (!targetRoadmapItem) {
    return units.slice(0, orderedWeekdays.length);
  }

  const targetedUnits = units.filter((unit) => {
    return (
      unit.sequence >= targetRoadmapItem.unitStartSequence &&
      unit.sequence <= targetRoadmapItem.unitEndSequence
    );
  });

  return targetedUnits.length > 0 ? targetedUnits : units.slice(0, orderedWeekdays.length);
}

export function normalizePlanAgentDraftPayload(payload: unknown): PlanAgentDraft | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const maybeDraft = payload as {
    scope?: unknown;
    weeklyGoal?: unknown;
    recentUpdate?: unknown;
    weeklyPlan?: unknown;
  };

  const weeklyPlan: WeeklyPlanItem[] = Array.isArray(maybeDraft.weeklyPlan)
    ? maybeDraft.weeklyPlan.reduce<WeeklyPlanItem[]>((items, item, index) => {
        if (!item || typeof item !== "object") {
          return items;
        }

        const maybeItem = item as {
          id?: unknown;
          day?: unknown;
          title?: unknown;
          detail?: unknown;
          duration?: unknown;
          referenceUnitSequence?: unknown;
        };
        const day = normalizeWeekdayValue(typeof maybeItem.day === "string" ? maybeItem.day : "");
        const title = typeof maybeItem.title === "string" ? maybeItem.title.trim() : "";
        const detail = typeof maybeItem.detail === "string" ? maybeItem.detail.trim() : "";
        const duration = normalizeDurationValue(
          typeof maybeItem.duration === "string" ? maybeItem.duration : "",
        );
        const referenceUnitSequence =
          typeof maybeItem.referenceUnitSequence === "number" &&
          Number.isFinite(maybeItem.referenceUnitSequence)
            ? maybeItem.referenceUnitSequence
            : null;

        if (!day || !title) {
          return items;
        }

        items.push({
          id:
            typeof maybeItem.id === "string" && maybeItem.id.trim()
              ? maybeItem.id.trim()
              : createDraftId("plan-agent-draft", index),
          day,
          title,
          detail,
          duration,
          memberStatus: {},
          referenceUnitSequence,
        });

        return items;
      }, [])
    : [];

  if (weeklyPlan.length === 0) {
    return null;
  }

  return {
    scope:
      maybeDraft.scope === "roadmap" || maybeDraft.scope === "both" || maybeDraft.scope === "weekly-plan"
        ? maybeDraft.scope
        : "weekly-plan",
    weeklyGoal:
      typeof maybeDraft.weeklyGoal === "string" && maybeDraft.weeklyGoal.trim()
        ? maybeDraft.weeklyGoal.trim()
        : weeklyPlan.map((item) => item.title).join(", "),
    recentUpdate:
      typeof maybeDraft.recentUpdate === "string" && maybeDraft.recentUpdate.trim()
        ? maybeDraft.recentUpdate.trim()
        : `${weeklyPlan[0]?.title ?? "이번 주 계획"} 기준으로 주간 계획을 정리했습니다.`,
    roadmap: [],
    weeklyPlan,
  };
}

export function buildStoredPlanAgentMessage(text: string, draft: PlanAgentDraft | null) {
  const visibleText = text.trim();

  if (!draft) {
    return visibleText;
  }

  return `${visibleText}\n${planAgentDraftMarker}\n${JSON.stringify(draft)}`;
}

export function parseStoredPlanAgentMessage(text: string) {
  const marker = `\n${planAgentDraftMarker}\n`;
  const markerIndex = text.lastIndexOf(marker);

  if (markerIndex < 0) {
    return {
      visibleText: text.trim(),
      draft: null as PlanAgentDraft | null,
    };
  }

  const visibleText = text.slice(0, markerIndex).trim();
  const payloadText = text.slice(markerIndex + marker.length).trim();

  try {
    return {
      visibleText,
      draft: normalizePlanAgentDraftPayload(JSON.parse(payloadText)),
    };
  } catch {
    return {
      visibleText,
      draft: null as PlanAgentDraft | null,
    };
  }
}

export function isLeader(group: StudyGroup, memberId?: string | null) {
  if (!memberId) {
    return false;
  }

  return group.members.find((member) => member.id === memberId)?.role === "팀장";
}

export function getReviewIntervalLabel(days: ReviewIntervalDays | null) {
  return reviewIntervalOptions.find((option) => option.days === days)?.label ?? "선택 안 함";
}

export function buildMockPlanReferenceUnits({
  group,
  upload,
}: Readonly<{
  group: StudyGroup;
  upload: Pick<PlanReferenceUpload, "id" | "fileName">;
}>) {
  const units = getSubjectUnits(group.subject);
  const seed = hashLabelSeed(`${group.subject}:${upload.fileName}`);
  const offset = units.length === 0 ? 0 : seed % units.length;
  const rotatedUnits = units
    .map((_, index) => units[(index + offset) % units.length])
    .slice(0, Math.max(6, Math.min(10, units.length)));

  return rotatedUnits.map<PlanReferenceUnit>((label, index) => ({
    id: `${upload.id}-unit-${index + 1}`,
    uploadId: upload.id,
    sequence: index + 1,
    label,
    detail: `${upload.fileName} 기준 ${label} 범위를 순서대로 학습합니다.`,
  }));
}

export function buildPlanReferenceUnitsFromAnalysis({
  uploadId,
  analysis,
}: Readonly<{
  uploadId: string;
  analysis: PlanReferenceAnalysisResult;
}>) {
  return analysis.units.map<PlanReferenceUnit>((unit, index) => ({
    id: `${uploadId}-unit-${index + 1}`,
    uploadId,
    sequence: index + 1,
    label: unit.label.trim(),
    detail: unit.detail.trim(),
  }));
}

export function summarizeUnits(units: PlanReferenceUnit[]) {
  if (units.length === 0) {
    return "아직 추출된 진도 단위가 없습니다.";
  }

  return `${units[0]?.label}부터 ${units[units.length - 1]?.label}까지 ${units.length}개 단위를 추출했습니다.`;
}

export function buildRoadmapFromUnits(group: StudyGroup, units: PlanReferenceUnit[]) {
  const weekNumberMatches = units
    .map((unit) => parseWeekNumberFromText(`${unit.label} ${unit.detail}`))
    .filter((value): value is number => value !== null);

  if (weekNumberMatches.length >= Math.max(2, Math.ceil(units.length / 2))) {
    return units.map<RoadmapItem>((unit, index) => ({
      id: createDraftId(`${group.id}-roadmap`, index),
      weekNumber: parseWeekNumberFromText(`${unit.label} ${unit.detail}`) ?? index + 1,
      title: unit.label,
      summary: unit.detail,
      unitStartSequence: unit.sequence,
      unitEndSequence: unit.sequence,
    }));
  }

  const chunkSize = 3;
  const chunks: RoadmapItem[] = [];

  for (let index = 0; index < units.length; index += chunkSize) {
    const slice = units.slice(index, index + chunkSize);
    const weekNumber = chunks.length + 1;
    const first = slice[0];
    const last = slice[slice.length - 1];

    if (!first || !last) {
      continue;
    }

    chunks.push({
      id: createDraftId(`${group.id}-roadmap`, weekNumber - 1),
      weekNumber,
      title: `${weekNumber}주차 · ${first.label}`,
      summary: `${slice.map((unit) => unit.label).join(", ")}를 중심으로 ${group.subject} 진도를 정리합니다.`,
      unitStartSequence: first.sequence,
      unitEndSequence: last.sequence,
    });
  }

  return chunks;
}

export function buildPlanAgentDraft(
  group: StudyGroup,
  latestQuestionOverride?: string,
): PlanAgentDraft | null {
  const units = [...group.planReferenceUnits].sort((left, right) => left.sequence - right.sequence);

  if (units.length === 0) {
    return null;
  }

  const lastQuestion = latestQuestionOverride?.trim() || getLastPlanAgentQuestion(group.planAgentChat);
  const scope = getPlanAgentDraftScope(lastQuestion);
  const fullRoadmap = buildRoadmapFromUnits(group, units);
  const requestedWeekNumber = getRequestedWeekNumber(lastQuestion, fullRoadmap.length);
  const focusUnits = getWeeklyFocusUnits(units, fullRoadmap, requestedWeekNumber);
  const detailSuffix = lastQuestion
    ? `요청사항 반영: ${lastQuestion}`
    : `${group.subject} 기본 진도 흐름으로 배치했습니다.`;

  const weeklyPlan = focusUnits.map<WeeklyPlanItem>((unit, index) => ({
    id: createDraftId(`${group.id}-weekly-plan`, index),
    day: orderedWeekdays[index] ?? orderedWeekdays.at(-1) ?? "일",
    title: `${unit.label} 학습`,
    detail: `${unit.detail} ${detailSuffix}`,
    duration: `${40 + index * 5}분`,
    memberStatus: Object.fromEntries(group.members.map((member) => [member.id, false])),
    referenceUnitSequence: unit.sequence,
  }));

  const weeklyGoal =
    focusUnits.length > 0
      ? focusUnits.map((unit) => unit.label).join(", ")
      : group.weeklyGoal;
  const recentUpdate =
    `${focusUnits[0]?.label ?? group.subject} 기준으로 이번 주 계획 미리보기를 만들었습니다.`;

  return {
    scope,
    weeklyGoal,
    recentUpdate,
    roadmap: [],
    weeklyPlan,
  };
}

export function buildPlanAgentAnswer(
  group: StudyGroup,
  draft: PlanAgentDraft | null,
  latestQuestion?: string,
) {
  if (!draft) {
    return {
      text: "진도표 이미지가 아직 없어 계획 초안을 만들지 못했습니다. 먼저 계획 탭에서 진도표를 업로드해 주세요.",
    };
  }

  const firstPlan = draft.weeklyPlan[0];
  const preparedWeeklyPlan = draft.weeklyPlan.length > 0;

  return {
    text: [
      `${group.subject} 기준으로 이번 주 계획을 준비했습니다.`,
      preparedWeeklyPlan && firstPlan
        ? `주간 계획은 "${firstPlan.title}"부터 시작하도록 맞췄습니다.`
        : null,
      latestQuestion ? `반영한 요청: ${latestQuestion}` : null,
      "채팅 아래의 계획 반영 버튼으로 미리보기에 넣고, 미리보기의 계획 적용하기를 눌러 최종 반영할 수 있습니다.",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export function getCurrentUserPersonalPlanItems(group: StudyGroup, memberId = currentUserId) {
  return group.personalPlanItems.filter((item) => item.memberId === memberId);
}

export function getCurrentUserSavedPersonalTaskItems(
  group: StudyGroup,
  memberId = currentUserId,
) {
  return group.savedPersonalTaskLibraryItems.filter((item) => item.memberId === memberId);
}

export function getCurrentUserReviewCandidates(group: StudyGroup, memberId = currentUserId) {
  return group.reviewCandidates.filter((item) => item.memberId === memberId);
}

export function getPendingReviewCandidates(group: StudyGroup, memberId = currentUserId) {
  const addedSourcePlanItemIds = new Set(
    group.personalPlanItems
      .filter((item) => item.memberId === memberId && item.sourcePlanItemId)
      .map((item) => item.sourcePlanItemId),
  );

  return getCurrentUserReviewCandidates(group, memberId).filter(
    (item) => !addedSourcePlanItemIds.has(item.sourcePlanItemId),
  );
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

export function getReviewCandidateScheduledDate(
  group: StudyGroup,
  candidate: ReviewCandidate,
  memberId = currentUserId,
) {
  const reviewInterval = group.reviewIntervals[memberId] ?? null;

  if (!reviewInterval) {
    return null;
  }

  return startOfDay(addDays(new Date(candidate.createdAt), reviewInterval));
}

export function isReviewCandidateDue(
  group: StudyGroup,
  candidate: ReviewCandidate,
  memberId = currentUserId,
  now = new Date(),
) {
  const scheduledDate = getReviewCandidateScheduledDate(group, candidate, memberId);

  if (!scheduledDate) {
    return false;
  }

  return startOfDay(now).getTime() >= scheduledDate.getTime();
}

export function getNextPendingReviewDate(group: StudyGroup, memberId = currentUserId) {
  const scheduledTimes = getPendingReviewCandidates(group, memberId)
    .map((candidate) => getReviewCandidateScheduledDate(group, candidate, memberId))
    .filter((date): date is Date => Boolean(date))
    .map((date) => date.getTime())
    .sort((left, right) => left - right);

  if (scheduledTimes.length === 0) {
    return null;
  }

  return new Date(scheduledTimes[0]);
}

export function createPersonalPlanItemPreview(
  group: StudyGroup,
  input: PersonalPlanItemDraft,
  memberId = currentUserId,
): PersonalPlanItem {
  return {
    id: `${group.id}-personal-preview`,
    memberId,
    title: input.title.trim(),
    detail: input.detail.trim(),
    completed: false,
    sourcePlanItemId: null,
  };
}
