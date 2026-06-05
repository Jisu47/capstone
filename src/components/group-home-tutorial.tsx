"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type TutorialSlide = {
  id: string;
  section: string;
  title: string;
  points: string[];
};

const baseSlides: TutorialSlide[] = [
  {
    id: "home",
    section: "홈",
    title: "그룹 정보와 진행 현황을 한눈에 확인할 수 있어요.",
    points: [
      "그룹명, 과목, 시험일 같은 기본 정보를 빠르게 확인할 수 있어요.",
      "팀원 전체 진행도와 개인별 진행 현황을 함께 볼 수 있어요.",
    ],
  },
  {
    id: "study",
    section: "스터디",
    title: "실제로 공부를 진행하는 화면이에요.",
    points: [
      "타이머로 공부 시간을 측정할 수 있어요.",
      "지금 공부 중인 팀원을 바로 확인할 수 있어요.",
      "투두를 체크할 때 이해도를 남기고, 낮음으로 체크한 내용은 복습 흐름에 반영돼요.",
    ],
  },
  {
    id: "plan",
    section: "계획",
    title: "그룹 계획과 개인 복습을 함께 관리할 수 있어요.",
    points: [
      "전체 계획과 이번 주 해야 할 일을 확인할 수 있어요.",
      "개인 복습 간격을 설정하고 예정된 복습을 관리할 수 있어요.",
      "계획 에이전트로 계획 초안을 만들고 적용할 수 있어요.",
    ],
  },
  {
    id: "materials",
    section: "자료",
    title: "공용 자료를 바탕으로 AI와 질문을 주고받을 수 있어요.",
    points: [
      "공용 자료를 올리고 같은 그룹 자료 기준으로 AI 챗봇에 질문할 수 있어요.",
      "자료가 쌓일수록 답변과 계획 생성의 근거가 더 풍부해져요.",
    ],
  },
];

function Dot({
  active,
}: Readonly<{
  active: boolean;
}>) {
  return (
    <span
      className={`h-2 w-2 rounded-full transition ${
        active ? "bg-[var(--brand)]" : "bg-slate-200"
      }`}
    />
  );
}

export function GroupHomeTutorial({
  open,
  groupId,
  hasMaterials,
  hasPlanReferenceUploads,
  onClose,
}: Readonly<{
  open: boolean;
  groupId: string;
  hasMaterials: boolean;
  hasPlanReferenceUploads: boolean;
  onClose: () => void;
}>) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides = useMemo(() => {
    return [
      ...baseSlides,
      {
        id: "finish",
        section: "시작하기",
        title: "자료와 진도표가 쌓일수록 계획을 더 정교하게 만들 수 있어요.",
        points: [
          "공용 자료가 많을수록 더 자세한 계획 생성이 가능해서 자료를 먼저 올리는 것을 권장해요.",
          "자료가 있다면 자료 탭에서 AI 질문을 바로 시작하고, 진도표가 있다면 계획 탭에서 전체 계획을 정리해 보세요.",
          hasMaterials
            ? "현재 이 그룹에는 이미 자료가 있어서 바로 자료 탭으로 이어갈 수 있어요."
            : "아직 등록된 자료가 없으니 자료 탭부터 시작하면 흐름이 자연스러워요.",
          hasPlanReferenceUploads
            ? "진도표가 이미 등록되어 있어서 계획 탭에서 전체 계획을 바로 이어서 볼 수 있어요."
            : "진도표가 있다면 계획 탭에서 업로드하고 전체 계획을 구성해 보세요.",
        ],
      },
    ];
  }, [hasMaterials, hasPlanReferenceUploads]);

  if (!open) {
    return null;
  }

  const currentSlide = slides[currentIndex];
  const isLastSlide = currentIndex === slides.length - 1;

  function moveToMaterials() {
    onClose();
    router.push(`/group/${groupId}/materials`);
  }

  function moveToPlan() {
    onClose();
    router.push(`/group/${groupId}/plan`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/30 px-4 pb-6 pt-10 sm:items-center">
      <div className="absolute inset-0" aria-hidden="true" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[420px] rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_24px_48px_rgba(15,23,42,0.16)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              {currentSlide.section}
            </p>
            <h3 className="mt-2 text-[20px] font-semibold tracking-[-0.04em] text-slate-950">
              {currentSlide.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
            aria-label="튜토리얼 닫기"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
              <path
                d="M6 6L18 18M18 6L6 18"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </button>
        </div>

        <div className="mt-4 space-y-3 rounded-[18px] bg-slate-50 px-4 py-4">
          {currentSlide.points.map((point) => (
            <div key={point} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
              <p>{point}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {slides.map((slide, index) => (
              <Dot key={slide.id} active={index === currentIndex} />
            ))}
          </div>
          <p className="text-xs font-medium text-slate-500">
            {currentIndex + 1} / {slides.length}
          </p>
        </div>

        {isLastSlide ? (
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={moveToMaterials}
              className="inline-flex items-center justify-center rounded-[16px] bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(121,184,149,0.22)] transition hover:brightness-[0.98]"
            >
              자료 탭으로 이동
            </button>
            <button
              type="button"
              onClick={moveToPlan}
              className="inline-flex items-center justify-center rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300"
            >
              계획 탭으로 이동
            </button>
          </div>
        ) : (
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
            >
              건너뛰기
            </button>
            <button
              type="button"
              onClick={() => setCurrentIndex((value) => Math.min(slides.length - 1, value + 1))}
              className="flex-1 rounded-[16px] bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(121,184,149,0.22)] transition hover:brightness-[0.98]"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
