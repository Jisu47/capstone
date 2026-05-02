"use client";

import type { AvatarPreset, Member, StudyGroup } from "@/lib/mock-data";

const analyticsStorageKey = "study-flow-material-analytics";

type MaterialViewEntry = {
  memberId: string;
  materialId: string;
  title: string;
  locationHint: string;
  durationMs: number;
  recordedAt: string;
};

type MaterialQuestionEntry = {
  memberId: string;
  question: string;
  materialId: string | null;
  title: string | null;
  locationHint: string | null;
  recordedAt: string;
};

type GroupAnalyticsRecord = {
  views: MaterialViewEntry[];
  questions: MaterialQuestionEntry[];
};

type AnalyticsStore = Record<string, GroupAnalyticsRecord>;

export type MemberWeaknessInsight = {
  memberId: string;
  memberName: string;
  role: string;
  bio: string;
  avatarPreset: AvatarPreset;
  keyTopics: string[];
  longestStayLabel: string | null;
  frequentQuestionLabel: string | null;
  totalViewMinutes: number;
  questionCount: number;
  incompleteCount: number;
  summary: string;
};

type RecordMaterialViewInput = {
  groupId: string;
  memberId: string;
  materialId: string;
  title: string;
  locationHint: string;
  durationMs: number;
};

type RecordMaterialQuestionInput = {
  groupId: string;
  memberId: string;
  question: string;
  materialId?: string | null;
  title?: string | null;
  locationHint?: string | null;
};

function readStore(): AnalyticsStore {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = window.localStorage.getItem(analyticsStorageKey);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as AnalyticsStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: AnalyticsStore) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(analyticsStorageKey, JSON.stringify(store));
}

function ensureGroupRecord(store: AnalyticsStore, groupId: string) {
  if (!store[groupId]) {
    store[groupId] = {
      views: [],
      questions: [],
    };
  }

  return store[groupId];
}

function getScore(seed: string) {
  return [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function buildBaselineViewEntries(group: StudyGroup, member: Member) {
  if (group.materials.length === 0) {
    return [];
  }

  const incompleteCount = group.plan.filter((item) => !item.memberStatus[member.id]).length;
  const material = group.materials[getScore(member.id) % group.materials.length];
  const durationMs = (incompleteCount + 1) * 4 * 60 * 1000;

  return [
    {
      memberId: member.id,
      materialId: material.id,
      title: material.title,
      locationHint: material.locationHint,
      durationMs,
      recordedAt: material.uploadedAt,
    },
  ];
}

function buildBaselineQuestionEntries(group: StudyGroup, member: Member) {
  if (group.materials.length === 0) {
    return [];
  }

  const incompleteItems = group.plan.filter((item) => !item.memberStatus[member.id]);
  const firstIncomplete = incompleteItems[0];

  if (!firstIncomplete) {
    return [];
  }

  const material = group.materials[(getScore(member.id) + 1) % group.materials.length];

  return [
    {
      memberId: member.id,
      question: `${firstIncomplete.title} 관련 질문`,
      materialId: material.id,
      title: material.title,
      locationHint: firstIncomplete.title,
      recordedAt: material.uploadedAt,
    },
  ];
}

function uniqueTopics(values: Array<string | null | undefined>) {
  return values.filter((value, index, array): value is string => {
    return Boolean(value) && array.indexOf(value) === index;
  });
}

function buildSummary(
  memberName: string,
  keyTopics: string[],
  incompleteCount: number,
  questionCount: number,
  totalViewMinutes: number,
) {
  const primaryTopic = keyTopics[0] ?? "핵심 개념";

  if (questionCount > 0 && incompleteCount > 0) {
    return `${memberName}님은 ${primaryTopic} 관련 질문이 많고 미완료 일정 ${incompleteCount}개가 남아 있어요.`;
  }

  if (totalViewMinutes >= 10) {
    return `${memberName}님은 ${primaryTopic} 구간에 오래 머물러 복습 보강이 필요해 보여요.`;
  }

  if (incompleteCount > 0) {
    return `${memberName}님은 남은 일정 ${incompleteCount}개를 중심으로 우선순위 정리가 필요해요.`;
  }

  return `${memberName}님은 현재 흐름이 안정적이지만 자주 보는 구간을 한 번 더 점검하면 좋아요.`;
}

export function recordMaterialView(input: RecordMaterialViewInput) {
  if (typeof window === "undefined") {
    return;
  }

  if (input.durationMs < 1000) {
    return;
  }

  const store = readStore();
  const groupRecord = ensureGroupRecord(store, input.groupId);

  groupRecord.views.push({
    memberId: input.memberId,
    materialId: input.materialId,
    title: input.title,
    locationHint: input.locationHint,
    durationMs: input.durationMs,
    recordedAt: new Date().toISOString(),
  });

  writeStore(store);
}

export function recordMaterialQuestion(input: RecordMaterialQuestionInput) {
  if (typeof window === "undefined") {
    return;
  }

  const trimmedQuestion = input.question.trim();

  if (!trimmedQuestion) {
    return;
  }

  const store = readStore();
  const groupRecord = ensureGroupRecord(store, input.groupId);

  groupRecord.questions.push({
    memberId: input.memberId,
    question: trimmedQuestion,
    materialId: input.materialId ?? null,
    title: input.title ?? null,
    locationHint: input.locationHint ?? null,
    recordedAt: new Date().toISOString(),
  });

  writeStore(store);
}

export function buildMemberWeaknessInsights(
  group: StudyGroup,
  currentUserId: string,
): MemberWeaknessInsight[] {
  const store = readStore();
  const groupRecord = store[group.id] ?? { views: [], questions: [] };

  return group.members
    .map((member) => {
      const views = [
        ...buildBaselineViewEntries(group, member),
        ...groupRecord.views.filter((entry) => entry.memberId === member.id),
      ];
      const questions = [
        ...buildBaselineQuestionEntries(group, member),
        ...groupRecord.questions.filter((entry) => entry.memberId === member.id),
      ];
      const incompleteCount = group.plan.filter((item) => !item.memberStatus[member.id]).length;
      const longestStay = views.reduce<MaterialViewEntry | null>((selected, entry) => {
        if (!selected || entry.durationMs > selected.durationMs) {
          return entry;
        }

        return selected;
      }, null);
      const questionCounts = questions.reduce<Record<string, number>>((counts, entry) => {
        const label = entry.locationHint ?? entry.title ?? "";

        if (!label) {
          return counts;
        }

        counts[label] = (counts[label] ?? 0) + 1;
        return counts;
      }, {});
      const frequentQuestionLabel =
        Object.entries(questionCounts).sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
      const totalViewMinutes = Math.round(
        views.reduce((sum, entry) => sum + entry.durationMs, 0) / 60000,
      );
      const keyTopics = uniqueTopics([
        longestStay?.locationHint,
        frequentQuestionLabel,
        group.plan.find((item) => !item.memberStatus[member.id])?.title,
      ]).slice(0, 2);

      return {
        memberId: member.id,
        memberName: member.name,
        role: member.role,
        bio: member.bio,
        avatarPreset: member.avatarPreset,
        keyTopics,
        longestStayLabel: longestStay?.locationHint ?? null,
        frequentQuestionLabel,
        totalViewMinutes,
        questionCount: questions.length,
        incompleteCount,
        summary: buildSummary(
          member.name,
          keyTopics,
          incompleteCount,
          questions.length,
          totalViewMinutes,
        ),
      };
    })
    .sort((left, right) => {
      if (left.memberId === currentUserId) {
        return -1;
      }

      if (right.memberId === currentUserId) {
        return 1;
      }

      return (
        right.incompleteCount - left.incompleteCount ||
        right.questionCount - left.questionCount ||
        right.totalViewMinutes - left.totalViewMinutes
      );
    });
}
