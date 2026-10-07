"use client";

import { useEffect } from "react";
import styles from "./preview-document.module.css";
import { groups, samples } from "./button-samples";
import { themes, variantColors, type ThemeId } from "./preview-themes";

const compact = groups[0], regular = groups[1], spacious = groups[2], tall = groups[3];
export type Size = { height: number; px: number; font: number; r: number };
export type ButtonChoices = Record<string, number | undefined>;
const letters = ["A", "B", "C"] as const;
const situations = [
  { id: "header", title: "상단 / 작은 액션", label: "자료 업로드", reference: "upload", variant: "primary", sizes: [{ ...compact, height: 32 }, compact, regular],
    uses: ["밀도 높은 헤더", "헤더 우측의 보조 액션", "빈번한 업로드·추가"],
    pros: ["세로 공간을 가장 적게 사용", "작은 크기와 읽기 편의의 절충", "일반 액션과 크기를 공유"],
    cautions: ["터치 영역이 작아 별도 검토 필요", "32px보다 헤더가 높아짐", "좁은 헤더에서 제목 공간 감소"] },
  { id: "general", title: "일반 액션", label: "보기", reference: "edit", variant: "secondary", sizes: [compact, regular, spacious],
    uses: ["카드의 간단한 보기·수정", "확인·이전 등 반복 동작", "여유 있는 모달 하단"],
    pros: ["정보 밀도를 유지", "작은 액션과 CTA 사이의 중간 크기", "누르기 편한 높이"],
    cautions: ["긴 라벨·터치 편의 검토", "주요 CTA와 역할 구분 필요", "목록에 반복되면 공간 소모"] },
  { id: "cta", title: "주요 CTA", label: "개인 할 일 추가", reference: "task", variant: "primary", sizes: [regular, spacious, tall],
    uses: ["짧은 인라인 폼", "개인 할 일·저장 폼 하단", "독립적인 주요 완료 화면"],
    pros: ["간결한 폼 구성", "현재 할 일 추가 높이와 일치", "가장 큰 시각적 강조"],
    cautions: ["일반 버튼과 크기 차이가 없음", "full width 여부는 따로 결정", "일반 폼에서 과하게 클 수 있음"] },
  { id: "danger", title: "위험 액션", label: "나가기", reference: "leave", variant: "danger", sizes: [compact, regular, spacious],
    uses: ["항목별 삭제 액션", "일반 확인 모달", "그룹 나가기 최종 확인"],
    pros: ["주변 정보 공간 확보", "취소 버튼과 균형", "중요한 동작을 명확히 표시"],
    cautions: ["색상 외에 명확한 문구 필요", "실서비스에서는 확인 흐름 별도 필요", "크기만으로 위험도를 표현하지 않음"] },
] as const;
type Situation = (typeof situations)[number];

function describe(size: Size) {
  return `H ${size.height}px / PX ${size.px}px / Font ${size.font}px / Weight 600 / Radius ${size.r}px`;
}

// This local specimen shares the existing candidate values, not a production API.
function ChoiceButton({ size, variant, label, full = false, onClick }: { size: Size; variant: keyof typeof variantColors; label: string; full?: boolean; onClick?: () => void }) {
  return <button type="button" data-decision-button
    onClick={onClick}
    style={{ height: size.height, paddingInline: size.px, fontSize: size.font, fontWeight: 600, lineHeight: "20px", borderRadius: size.r }}
    className={`inline-flex shrink-0 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--preview-focus)] ${variantColors[variant]} ${full ? "w-full" : ""}`}>{label}</button>;
}

function SituationMock({ situation, size, choices }: { situation: Situation; size: Size; choices: ButtonChoices }) {
  const action = <ChoiceButton size={size} variant={situation.variant} label={situation.label} full={situation.id === "cta" && choices.width !== 2} />;
  return <div data-preview-mock data-situation-mock={situation.id} className={styles.liveMock} style={choices.distinction === 1 ? { "--preview-secondary": "var(--preview-surface)" } as React.CSSProperties : undefined}>
    {situation.id === "header" ? <header className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-semibold">학습 자료</h4>{action}</header>
      : situation.id === "general" ? <><h4 className="font-semibold">이번 주 학습</h4><p className="mt-1 text-xs text-[var(--preview-text-secondary)]">자료구조 · 복습 예정</p><div className="mt-4 flex flex-wrap justify-end gap-2">{action}<ChoiceButton size={size} variant="secondary" label="수정" /></div></>
        : situation.id === "cta" ? <><label className="block text-sm">할 일<input readOnly value="3장 복습" className="mt-2 w-full rounded-lg border border-[var(--preview-border)] bg-[var(--preview-surface)] px-3 py-2" /></label><div className="mt-4">{action}</div></>
          : <><h4 className="font-semibold">그룹에서 나갈까요?</h4><p className="mt-1 text-xs text-[var(--preview-text-secondary)]">참여 상태가 변경됩니다.</p><div className="mt-4 flex flex-wrap justify-end gap-2"><ChoiceButton size={size} variant="secondary" label="취소" />{action}</div></>}
  </div>;
}

const widthChoices = ["폼 하단 CTA만 full width", "폼 CTA와 모달 action에 full width", "기본 content width, 화면별 개별 결정"];
const distinctionChoices = ["현재 방식: primary 채움 / secondary 연한 채움", "강한 구분: primary 채움 / secondary 테두리", "화면별 결정: 공통 강도는 보류"];

export function decisionSize(choices: ButtonChoices, situationId: string): Size {
  const situation = situations.find(item => item.id === situationId)!;
  return situation.sizes[choices[situationId] ?? 1];
}

export function ButtonDecisionGuide({ theme, choices, onChoose: choose, onSummary }: { theme: ThemeId; choices: ButtonChoices; onChoose: (key: string, index: number | undefined) => void; onSummary: (value: string) => void }) {
  const defaults = [compact, regular, spacious];
  const summary = [
    "Study Flow 버튼 검토 / 개인 의견 초안 (팀 확정 아님)",
    `검토 테마: ${themes[theme].label}`,
    ...situations.map(s => { const n = choices[s.id]; return `${s.title}: ${n === undefined ? "미선택" : `${letters[n]}안 / ${describe(s.sizes[n])} / ${s.variant}`}`; }),
    `기본 버튼 크기: ${choices.default === undefined ? "미선택" : `${letters[choices.default]}안 / ${describe(defaults[choices.default])}`}`,
    `Full width: ${choices.width === undefined ? "미선택" : widthChoices[choices.width]}`,
    `Primary / Secondary: ${choices.distinction === undefined ? "미선택" : distinctionChoices[choices.distinction]}`,
    "A/B/C는 상황별 후보 번호입니다. size와 variant는 별도 축이며 icon-only 규칙은 별도 검토합니다.",
  ].join("\n");
  const brief = ["Button / 개인 의견 (미확정)", ...situations.map(s => {
    const index = choices[s.id];
    return `${s.title}: ${index === undefined ? "미선택" : `${letters[index]}안 · ${s.sizes[index].height}px · ${s.variant}`}`;
  }), `기본 크기: ${choices.default === undefined ? "미선택" : `${letters[choices.default]}안 · ${defaults[choices.default].height}px`}`,
  `Full width: ${choices.width === undefined ? "미선택" : widthChoices[choices.width]}`,
  `Primary / Secondary: ${choices.distinction === undefined ? "미선택" : distinctionChoices[choices.distinction]}`].join("\n");
  useEffect(() => { onSummary(brief); }, [brief, onSummary]);

  function radios(key: string, labels: string[]) {
    return <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
      {labels.map((label, index) => <label key={label} className="inline-flex items-start gap-2 text-sm"><input className="mt-1" type="radio" name={`guide-${key}`} checked={choices[key] === index} onChange={() => choose(key, index)} />{label}</label>)}
      <label className="inline-flex items-start gap-2 text-sm"><input className="mt-1" type="radio" name={`guide-${key}`} checked={choices[key] === undefined} onChange={() => choose(key, undefined)} />미선택</label>
    </div>;
  }

  return <section id="decision-options" className="scroll-mt-6 border-t border-[var(--preview-border)] py-8">
    <h2>Button Candidates / 상황별 선택</h2>
    <p className="mt-3 text-sm leading-6 text-[var(--preview-text-secondary)]">A/B/C는 각 상황 안의 후보 번호입니다. 크기와 역할을 고정된 관계로 확정하지 않습니다. 모든 후보는 동일한 문구로 비교하며, 32px 상단 액션은 기존 36px 후보에서 높이만 줄인 실험안입니다. 선택은 이 탭의 메모리에만 남고 새로고침하면 초기화됩니다.</p>
    {situations.map(situation => {
      const reference = samples.find(sample => sample.id === situation.reference)!;
      return <section key={situation.id} id={`decision-${situation.id}`} className={styles.situationBlock}>
        <div className={styles.situationHeading}><h3>{situation.title}</h3><span>{choices[situation.id] === undefined ? "미선택" : `${letters[choices[situation.id]!]}안 선택됨`}{choices[situation.id] !== undefined && <button type="button" className="ml-3 underline underline-offset-2" onClick={() => choose(situation.id, undefined)}>선택 해제</button>}</span></div>
        <p className="mt-2 text-xs text-[var(--preview-text-secondary)]">공통 variant: {situation.variant} · 크기만 비교 · 화면 예시는 가상 데이터</p>
        <fieldset className={styles.candidateGrid}><legend className="sr-only">{situation.title} 후보 선택</legend>{situation.sizes.map((size, index) => <div key={index} className={styles.candidateItem}>
          <label className={styles.candidateLabel}><input type="radio" name={`candidate-${situation.id}`} checked={choices[situation.id] === index} onChange={() => choose(situation.id, index)} /><span>{letters[index]}안</span><span className="ml-auto text-xs">{choices[situation.id] === index ? "선택됨" : "선택"}</span></label>
          <div className="flex h-20 items-center justify-center"><ChoiceButton size={size} variant={situation.variant} label={situation.label} onClick={() => choose(situation.id, index)} /></div>
          <p className="text-xs leading-5 text-[var(--preview-text-secondary)]">{describe(size)}</p>
          <dl className="mt-4 grid grid-cols-[48px_minmax(0,1fr)] gap-2 text-sm leading-6"><dt>추천</dt><dd>{situation.uses[index]}</dd><dt>장점</dt><dd>{situation.pros[index]}</dd><dt>주의</dt><dd>{situation.cautions[index]}</dd></dl>
        </div>)}</fieldset>
        <p className={styles.itemNote}>Reference: {reference.label} · {reference.location} · <span className="[overflow-wrap:anywhere]">{reference.source}</span></p>
        <div className={styles.liveContext}><p className={styles.itemNote}>{choices[situation.id] === undefined ? "미선택 · B안을 배치 예시로 표시합니다. 결정 결과에는 포함하지 않습니다." : `${letters[choices[situation.id]!]}안 적용 예시 · ${decisionSize(choices, situation.id).height}px`}</p><SituationMock situation={situation} size={decisionSize(choices, situation.id)} choices={choices} /></div>
      </section>;
    })}

    <section id="decision-guide" className={styles.decisionArea}>
      <h2>Team Decision / Buttons</h2>
      <p className="mt-2 text-sm text-[var(--preview-text-secondary)]">위 후보 선택과 아래 항목은 서로 연동됩니다. 선택 내용은 팀 합의를 위한 개인 의견이며 서버에 저장하지 않습니다.</p>
      <div className="mt-5 space-y-6"><dl className={styles.decisionStatus}>{situations.map(s => <div key={s.id}><dt><a href={`#decision-${s.id}`}>{s.title}</a></dt><dd>{choices[s.id] === undefined ? "미선택" : `${letters[choices[s.id]!]}안 · ${decisionSize(choices, s.id).height}px · ${s.variant}`}</dd></div>)}</dl>
        <fieldset><legend className="font-semibold">평상시 기본 버튼 크기</legend>{radios("default", defaults.map((size, i) => `${letters[i]}안 · ${size.height}px`))}</fieldset>
        <fieldset><legend className="font-semibold">Full width 사용 범위</legend>{radios("width", [...widthChoices])}</fieldset>
        <fieldset><legend className="font-semibold">Primary / Secondary 구분 강도</legend>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">{[false, true].map(outline => <div key={String(outline)}><p className="mb-2 text-xs">{outline ? "테두리형 secondary 후보" : "현재 연한 채움 secondary"}</p><div className="flex flex-wrap gap-2"><ChoiceButton size={regular} variant="primary" label="확인" /><span style={outline ? { "--preview-secondary": "var(--preview-surface)" } as React.CSSProperties : undefined}><ChoiceButton size={regular} variant="secondary" label="취소" /></span></div></div>)}</div>
          {radios("distinction", [...distinctionChoices])}
        </fieldset>
      </div>
      <label className="mt-8 block font-semibold">선택 결과 요약<textarea readOnly value={summary} onFocus={event => event.currentTarget.select()} rows={14} className="mt-3 block w-full resize-y rounded-lg border border-[var(--preview-border)] bg-[var(--preview-surface)] p-4 text-[var(--preview-text-primary)]" /></label>
      <p className="mt-2 text-xs text-[var(--preview-text-secondary)]">요약을 선택하면 전체 텍스트가 선택됩니다. 복사하여 팀 회의 기록에 첨부할 수 있습니다. 이 페이지는 투표 수집 또는 최종 확정 기능이 아닙니다.</p>
    </section>
  </section>;
}
