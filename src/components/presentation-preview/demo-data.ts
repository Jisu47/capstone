import { getInitialGroups, type StudyGroup } from "@/lib/mock-data";
import { buildStoredPlanAgentMessage, type PlanAgentDraft } from "@/lib/plan-flow";

export const demoGroupId = "presentation-demo";
export const demoCurrentUserId = "presentation-user";
const currentUserId = demoCurrentUserId;
export function createDemoGroup(): StudyGroup {
  const group = getInitialGroups()[0];
  const members: StudyGroup["members"] = [
    { id: currentUserId, name: "사용자", role: "팀장", focus: "머신러닝 정리", bio: "공동 학습 계획을 정리해요.", avatarPreset: "emerald" },
    { id: "presentation-member-a", name: "팀원 A", role: "팀원", focus: "앙상블 학습", bio: "개념을 비교하며 공부해요.", avatarPreset: "sky" },
    { id: "presentation-member-b", name: "팀원 B", role: "팀원", focus: "AdaBoost 복습", bio: "실습과 복습을 함께 해요.", avatarPreset: "amber" }
  ];
  const titles = ["머신러닝 정의 정리", "배깅 / 부스팅 비교", "의사결정나무 개념 정리", "AdaBoost 가중치 갱신", "전이학습 적용 사례", "앙상블 학습 요약", "주간 학습 내용 복습"];
  const plan = (["월", "화", "수", "목", "금", "토", "일"] as const).map((day, i) => ({
    id: `demo-plan-${i}`, day, title: titles[i], detail: "강의자료를 참고해 핵심 개념을 정리하고 스터디에서 함께 확인합니다.", duration: "60분", referenceUnitSequence: i % 3 + 1,
    memberStatus: { [currentUserId]: i < 2, "presentation-member-a": i < 1, "presentation-member-b": i < 3 }
  }));
  const draft: PlanAgentDraft = { scope: "weekly-plan", weeklyGoal: "앙상블 학습 원리를 이해하고 AdaBoost를 설명하기", recentUpdate: "진도표를 기준으로 주간 학습 초안을 정리했어요.", roadmap: [], weeklyPlan: plan };
  const image = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="340"><rect width="760" height="340" fill="white"/><g font-family="sans-serif" fill="#242b27"><text x="32" y="55" font-size="28">머신러닝 학습 진도표</text><text x="32" y="125" font-size="24">1주차   머신러닝 기본 개념</text><text x="32" y="195" font-size="24">2주차   배깅 · 부스팅 · 앙상블</text><text x="32" y="265" font-size="24">3주차   AdaBoost · 전이학습</text></g></svg>`;
  return { ...group, id: demoGroupId, name: "캡스톤 스터디", subject: "머신러닝", status: "active", examDate: "2026-12-10", overallGoal: "머신러닝 중간고사 준비", weeklyGoal: draft.weeklyGoal,
    description: "같은 진도표와 자료로 학습 계획을 세우고 개인별 수행·복습을 관리합니다.", recentUpdate: draft.recentUpdate, members, plan,
    planReferenceUploads: [{ id: "demo-reference", fileName: "머신러닝_학습진도표.svg", mimeType: "image/svg+xml", imageDataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(image)}`, uploadedAt: "2026-11-12T00:00:00Z", uploadedBy: "사용자", summary: "기본 개념, 앙상블, AdaBoost와 전이학습을 학습하는 3주 진도표" }],
    planReferenceUnits: ["머신러닝 기본 개념", "앙상블 학습", "AdaBoost / 전이학습"].map((label, i) => ({ id: `demo-unit-${i}`, uploadId: "demo-reference", sequence: i + 1, label, detail: `${i + 1}주차 학습 범위` })),
    roadmap: ["머신러닝 기본 개념", "앙상블 학습", "AdaBoost / 전이학습"].map((title, i) => ({ id: `demo-week-${i}`, weekNumber: i + 1, title, summary: "핵심 개념 정리와 문제 풀이", unitStartSequence: i + 1, unitEndSequence: i + 1 })),
    materials: [
      { id: "demo-pdf", title: "머신러닝 강의자료.pdf", summary: "머신러닝의 정의와 지도·비지도 학습, 앙상블 기본 개념을 정리한 강의자료입니다.", uploadedBy: "사용자", uploadedByMemberId: currentUserId, uploadedAt: "2026-11-12T00:00:00Z", storagePath: "", mimeType: "application/pdf", format: "PDF", locationHint: "자료 요약", processingStatus: "ready" },
      { id: "demo-md", title: "앙상블 정리.md", summary: "배깅은 독립 모델 결과를 결합하고, 부스팅은 이전 모델의 오류를 보완하는 모델을 순차 학습합니다.", uploadedBy: "팀원 A", uploadedByMemberId: "presentation-member-a", uploadedAt: "2026-11-11T00:00:00Z", storagePath: "", mimeType: "text/markdown", format: "MD", locationHint: "자료 요약", processingStatus: "ready" }
    ],
    chat: [
      { id: "demo-question", role: "user", text: "배깅과 부스팅의 차이를 정리해 줘.", createdAt: "2026-11-12T01:00:00Z" },
      { id: "demo-answer", role: "assistant", text: "공유된 자료 요약에 따르면, 배깅은 여러 모델을 독립적으로 학습해 결과를 결합하고 부스팅은 이전 모델의 오류를 보완하도록 순차 학습합니다. 두 방식의 차이를 표로 정리한 뒤 계획의 비교 항목을 복습해 보세요.", createdAt: "2026-11-12T01:01:00Z", sources: [{ id: "demo-source", materialId: "demo-md", title: "앙상블 정리.md", summary: "배깅과 부스팅의 학습 방식 비교", locationHint: "자료 요약" }] }
    ],
    planAgentChat: [
      { id: "demo-plan-q", role: "user", text: "진도표를 참고해서 이번 주 계획을 정리해 줘.", createdAt: "2026-11-12T01:00:00Z" },
      { id: "demo-plan-a", role: "assistant", text: buildStoredPlanAgentMessage("진도표에서 학습 단위를 확인했어요. 기본 개념부터 앙상블 비교와 AdaBoost 복습까지 주간 계획 초안을 준비했습니다. 미리보기에서 분량을 조정한 뒤 공동 계획에 적용할 수 있어요.", draft), createdAt: "2026-11-12T01:01:00Z" }
    ],
    personalPlanItems: [
      { id: "demo-personal-1", memberId: currentUserId, title: "배깅 / 부스팅 비교표 완성", detail: "두 방법의 학습 순서와 결합 방식을 비교하기", completed: true, sourcePlanItemId: null },
      { id: "demo-personal-2", memberId: currentUserId, title: "AdaBoost 다시 복습하기", detail: "이해도가 낮았던 가중치 갱신 과정을 예제로 확인", completed: false, sourcePlanItemId: "demo-plan-3" }
    ],
    reviewCandidates: [{ id: "demo-review", memberId: currentUserId, title: "전이학습 다시 복습하기", detail: "사전 학습 모델의 활용 방식을 정리하기", sourcePlanItemId: "demo-plan-4", createdAt: "2026-11-12T00:00:00Z", updatedAt: "2026-11-12T00:00:00Z" }],
    reviewIntervals: { [currentUserId]: 7 }, reviewDays: ["목"], savedPersonalTaskLibraryItems: [], planItemFeedbacks: [{ planItemId: "demo-plan-3", memberId: currentUserId, understandingLevel: "low", createdAt: "2026-11-12T00:00:00Z", updatedAt: "2026-11-12T00:00:00Z" }]
  };
}
