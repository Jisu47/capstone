import type { ReactNode } from "react";
import { groups } from "./button-samples";
import { variantColors } from "./preview-themes";
import styles from "./preview-document.module.css";
import { decisionSize, type ButtonChoices, type Size } from "./button-decision-guide";

// Local review specimens, not a service Button component or finalized size API.
function MockButton({ size, candidate: selectedCandidate, secondary = false, danger = false, full = false, children }: {
  size: "compact" | "regular" | "form";
  secondary?: boolean;
  danger?: boolean;
  full?: boolean;
  children: ReactNode;
  candidate?: Size;
}) {
  const candidate = selectedCandidate ?? groups.find((group) => group.id === size)!;
  return <button type="button" data-mock-size={size}
    style={{ height: candidate.height, paddingInline: candidate.px, fontSize: candidate.font, fontWeight: 600, lineHeight: "20px", borderRadius: candidate.r }}
    className={`inline-flex shrink-0 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--preview-focus)] ${full ? "w-full" : ""} ${danger ? variantColors.danger : secondary ? variantColors.secondary : variantColors.primary}`}>
    {children}
  </button>;
}

function MobileExample({ title, note, children, separateCards = false }: { title: string; note: string; children: ReactNode; separateCards?: boolean }) {
  return <article className="min-w-0">
    <h3 className="text-base font-semibold">{title}</h3>
    <p className="mt-1 mb-4 text-xs leading-5 text-[var(--preview-text-secondary)]">{note}</p>
    <div data-mock-frame data-preview-mock className={styles.mockFrame}>
      {separateCards ? children : <div className={styles.mockCard}>{children}</div>}
    </div>
  </article>;
}

export function ButtonContextMocks({ choices }: { choices: ButtonChoices }) {
  const header = decisionSize(choices, "header");
  const general = decisionSize(choices, "general");
  const cta = decisionSize(choices, "cta");
  const danger = decisionSize(choices, "danger");
  const defaultSize = groups[choices.default ?? 1];
  return <section id="context-mocks" className="scroll-mt-6 border-b border-[var(--preview-border)] py-8">
    <h2 className="text-xl font-semibold">Applied Examples</h2>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--preview-text-secondary)]">상황별 선택이 아래 화면에 즉시 반영됩니다. 미선택 상황은 B안을 배치 예시로만 표시합니다. 서비스와 같은 최대 430px 폭에서 자료·할 일·폼·확인 액션을 비교하며, 모든 내용은 가상 데이터입니다.</p>
    <div className="mt-6 grid items-start gap-x-6 gap-y-5 lg:grid-cols-2" style={choices.distinction === 1 ? { "--preview-secondary": "var(--preview-surface)" } as React.CSSProperties : undefined}>
      <MobileExample title="01. 페이지 헤더" note={`상단 액션 · ${header.height}px · content width`} separateCards>
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--preview-border)] pb-5">
          <div className="min-w-0"><h4 className="text-[18px] font-semibold">자료</h4><p className="mt-1 text-xs text-[var(--preview-text-secondary)]">이번 주에 함께 읽을 자료</p></div>
          <MockButton size="compact" candidate={header}>자료 업로드</MockButton>
        </header>
        <p className="mt-5 text-sm text-[var(--preview-text-secondary)]">자료 3개 · 최근 업데이트 오늘</p>
      </MobileExample>

      <MobileExample title="02. 자료 카드 / 일반 액션" note={`일반 액션 · ${general.height}px · 제목·업로드 정보·하단 버튼`} separateCards>
        <article className={`${styles.mockCard} ${styles.materialCard}`}>
          <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-semibold">자료구조 핵심 정리</h4><span className="text-xs text-[var(--preview-secondary-foreground)]">복습 예정</span></div>
          <p className="mt-2 text-sm text-[var(--preview-text-secondary)]">PDF · 12쪽 · 이번 주 학습 자료</p>
          <div className="mt-4 flex flex-wrap justify-end gap-2"><MockButton size="regular" candidate={general} secondary>수정</MockButton><MockButton size="regular" candidate={general}>자료 보기</MockButton></div>
        </article>
      </MobileExample>

      <MobileExample title="03. 오늘 할 일 / 기본 크기" note={`평상시 기본 버튼 · ${defaultSize.height}px · 제목 우측과 항목 하단`}>
        <div className="flex items-center justify-between gap-3"><h4 className="text-[14px] font-semibold">오늘 할 일</h4><MockButton size="regular" candidate={defaultSize} secondary>추가</MockButton></div>
        <p className="mt-3 text-[13px]">자료구조 3장 연습문제</p><p className="mt-1 text-[11px] text-[var(--preview-text-secondary)]">개인 학습 · 오늘까지</p>
        <div className="mt-3 flex justify-end"><MockButton size="regular" candidate={defaultSize}>완료</MockButton></div>
      </MobileExample>

      {(["full", "content"] as const).map((width) => <MobileExample key={width} title={`04. 개인 할 일 폼 / ${width} width`} note={`주요 CTA · ${cta.height}px · ${choices.width === undefined ? "너비 정책 미선택" : (choices.width === 2 ? width === "content" : width === "full") ? "선택한 너비 정책 예시" : "대조용 너비 예시"}`}>
        <h4 className="text-lg font-semibold">개인 할 일</h4>
        <p className="mt-1 text-sm text-[var(--preview-text-secondary)]">이번 주에 마칠 학습 내용을 정리해요.</p>
        <div role="group" aria-label={`개인 할 일 ${width} 예시`} className="mt-5 space-y-4">
          <label className="block"><span className="mb-2 block text-sm">할 일 제목</span><input readOnly value="자료구조 3장 복습" className="w-full rounded-[14px] border border-[var(--preview-border)] bg-[var(--preview-surface)] px-3.5 py-2.5" /></label>
          <label className="block"><span className="mb-2 block text-sm">메모</span><textarea readOnly rows={2} value="핵심 개념을 정리하고 연습문제 5개 풀기" className="w-full resize-none rounded-[14px] border border-[var(--preview-border)] bg-[var(--preview-surface)] px-3.5 py-2.5" /></label>
          <p className="text-xs text-[var(--preview-text-secondary)]">작은 단위로 나누면 계획을 확인하기 쉬워요.</p>
          <div className="flex justify-end border-t border-[var(--preview-border)] pt-4"><MockButton size="form" candidate={cta} full={width === "full"}>개인 할 일 추가</MockButton></div>
        </div>
      </MobileExample>)}

      <MobileExample title="05. 확인 패널 / 균등 너비" note={`일반 액션 · ${general.height}px · ${choices.width === 1 ? "선택한 너비 정책 예시" : "균등 너비 대조 예시"}`} separateCards>
        <div className={`${styles.mockCard} mx-auto max-w-[360px]`}>
          <h4 className="text-lg font-semibold">학습 계획 저장</h4><p className="mt-3 text-sm leading-6 text-[var(--preview-text-secondary)]">작성한 내용을 이번 주 학습 계획으로 저장할까요?</p>
          <div className="mt-6 grid grid-cols-2 gap-2"><MockButton size="regular" candidate={general} secondary full>취소</MockButton><MockButton size="regular" candidate={general} full>확인</MockButton></div>
        </div>
      </MobileExample>
      <MobileExample title="05. 확인 패널 / content width" note={`일반 액션 · ${general.height}px · ${choices.width !== undefined && choices.width !== 1 ? "선택한 너비 정책 예시" : "content width 대조 예시"}`} separateCards>
        <div className={`${styles.mockCard} mx-auto max-w-[360px]`}>
          <h4 className="text-lg font-semibold">학습 계획 저장</h4><p className="mt-3 text-sm leading-6 text-[var(--preview-text-secondary)]">작성한 내용을 이번 주 학습 계획으로 저장할까요?</p>
          <div className="mt-6 flex flex-wrap justify-end gap-2"><MockButton size="regular" candidate={general} secondary>취소</MockButton><MockButton size="regular" candidate={general}>확인</MockButton></div>
        </div>
      </MobileExample>
      <MobileExample title="06. 위험한 작업" note={`위험 액션 · ${danger.height}px · 실제 삭제 없음`}>
        <h4 className="text-lg font-semibold">학습 계획 삭제</h4>
        <p className="my-3 text-sm leading-6 text-[var(--preview-text-secondary)]">선택한 계획을 목록에서 삭제합니다. 삭제 전 내용을 확인하세요.</p>
        <div className="flex flex-wrap justify-end gap-2"><MockButton size="regular" candidate={danger} secondary>취소</MockButton><MockButton size="regular" candidate={danger} danger>계획 삭제</MockButton></div>
      </MobileExample>
    </div>
  </section>;
}
