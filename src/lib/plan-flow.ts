import {
  currentUserId,
  type ChatMessage,
  type PersonalPlanItem,
  type PlanReferenceUnit,
  type PlanReferenceUpload,
  type ReviewIntervalDays,
  type RoadmapItem,
  type StudyGroup,
  type Weekday,
  type WeeklyPlanItem,
} from "@/lib/mock-data";

export type ReviewCard = {
  id: string;
  day: Weekday;
  title: string;
  detail: string;
  referenceSequence: number;
};

export type PlanAgentDraft = {
  weeklyGoal: string;
  recentUpdate: string;
  roadmap: RoadmapItem[];
  weeklyPlan: WeeklyPlanItem[];
};

export type PlanReferenceUploadDraft = {
  fileName: string;
  mimeType: string;
  imageDataUrl: string;
};

export type PersonalPlanItemDraft = {
  title: string;
  detail: string;
};

export const orderedWeekdays: Weekday[] = ["월", "화", "수", "목", "금"];

export const reviewIntervalOptions: Array<{
  label: string;
  days: ReviewIntervalDays;
}> = [
  { label: "3일", days: 3 },
  { label: "1주일", days: 7 },
  { label: "2주", days: 14 },
  { label: "한달", days: 28 },
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
      "기출 서술형 대비",
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
      "예상 문제 풀이",
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
    `${subject} 응용 문제 1`,
    `${subject} 응용 문제 2`,
    `${subject} 요약 정리`,
    `${subject} 취약 파트 점검`,
    `${subject} 서술형 대비`,
  ];
}

function createDraftId(prefix: string, index: number) {
  return `${prefix}-${index + 1}`;
}

function getLastPlanAgentQuestion(messages: ChatMessage[]) {
  const lastUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");

  return lastUserMessage?.text.trim() ?? "";
}

export function isLeader(group: StudyGroup, memberId = currentUserId) {
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

export function summarizeUnits(units: PlanReferenceUnit[]) {
  if (units.length === 0) {
    return "아직 추출된 진도 단위가 없습니다.";
  }

  return `${units[0]?.label}부터 ${units[units.length - 1]?.label}까지 ${units.length}개 단위를 추출했습니다.`;
}

export function buildRoadmapFromUnits(group: StudyGroup, units: PlanReferenceUnit[]) {
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

  const roadmap = buildRoadmapFromUnits(group, units);
  const focusUnits = units.slice(0, orderedWeekdays.length);
  const lastQuestion = latestQuestionOverride?.trim() || getLastPlanAgentQuestion(group.planAgentChat);
  const detailSuffix = lastQuestion
    ? `요청사항 반영: ${lastQuestion}`
    : `${group.subject} 기본 진도 흐름으로 배치했습니다.`;

  const weeklyPlan = focusUnits.map<WeeklyPlanItem>((unit, index) => ({
    id: createDraftId(`${group.id}-weekly-plan`, index),
    day: orderedWeekdays[index] ?? "금",
    title: `${unit.label} 학습`,
    detail: `${unit.detail} ${detailSuffix}`,
    duration: `${40 + index * 5}분`,
    memberStatus: Object.fromEntries(
      group.members.map((member) => [member.id, false]),
    ),
    referenceUnitSequence: unit.sequence,
  }));

  const weeklyGoal = focusUnits.map((unit) => unit.label).join(", ");

  return {
    weeklyGoal,
    recentUpdate: `${focusUnits[0]?.label ?? group.subject} 기준으로 계획 에이전트 초안을 만들었습니다.`,
    roadmap,
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
      text: "진도표 이미지가 아직 없어 총 계획 초안을 만들지 못했습니다. 먼저 계획 탭에서 진도표를 업로드해 주세요.",
    };
  }

  const firstRoadmap = draft.roadmap[0];
  const firstPlan = draft.weeklyPlan[0];

  return {
    text: [
      `${group.subject} 기준으로 주차별 로드맵 초안을 만들었습니다.`,
      firstRoadmap
        ? `총 계획 시작은 "${firstRoadmap.title}"로 두고 ${draft.roadmap.length}주 흐름으로 정리했습니다.`
        : "총 계획 카드 초안을 준비했습니다.",
      firstPlan
        ? `이번주 계획은 "${firstPlan.title}"부터 시작하도록 맞췄습니다.`
        : "이번주 계획 초안도 함께 준비했습니다.",
      latestQuestion ? `반영한 요청: ${latestQuestion}` : null,
      "미리보기에서 확인한 뒤 적용하면 공식 계획으로 반영됩니다.",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export function buildReviewCards(group: StudyGroup, memberId = currentUserId) {
  const reviewInterval = group.reviewIntervals[memberId] ?? null;

  if (!reviewInterval || group.reviewDays.length === 0) {
    return [] as ReviewCard[];
  }

  const unitsBySequence = new Map(
    group.planReferenceUnits.map((unit) => [unit.sequence, unit]),
  );
  const seen = new Set<string>();

  return [...group.plan]
    .sort((left, right) => orderedWeekdays.indexOf(left.day) - orderedWeekdays.indexOf(right.day))
    .flatMap((item) => {
      if (!group.reviewDays.includes(item.day)) {
        return [];
      }

      if (!item.referenceUnitSequence) {
        return [];
      }

      const targetSequence = item.referenceUnitSequence - reviewInterval;
      const targetUnit = unitsBySequence.get(targetSequence);

      if (!targetUnit) {
        return [];
      }

      const dedupeKey = `${item.day}:${targetSequence}`;

      if (seen.has(dedupeKey)) {
        return [];
      }

      seen.add(dedupeKey);

      return [
        {
          id: `${item.id}-review-${targetSequence}`,
          day: item.day,
          title: "복습 계획",
          detail: `${getReviewIntervalLabel(reviewInterval)} 전 진도인 "${targetUnit.label}" 범위를 다시 확인합니다.`,
          referenceSequence: targetSequence,
        },
      ] satisfies ReviewCard[];
    });
}

export function getCurrentUserPersonalPlanItems(group: StudyGroup, memberId = currentUserId) {
  return group.personalPlanItems.filter((item) => item.memberId === memberId);
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
  };
}
