"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { previewFontCss, weightNames, type PreviewFont, type PreviewFontCatalog } from "@/lib/preview-fonts";
import { groups } from "./button-samples";
import { variantColors } from "./preview-themes";
import styles from "./preview-document.module.css";

const sentences = ["스터디 계획을 추가해보세요.", "오늘의 학습 자료를 확인하세요.", "함께 공부할 그룹을 선택하세요."];
const labels = ["자료 업로드", "개인 할 일 추가", "저장", "수정", "완료"];
const fieldClass = "mt-2 block max-w-full rounded border border-[var(--preview-border)] bg-[var(--preview-surface)] p-2 text-sm";
export type LoadState = Record<string, "ready" | "error">;
const keyFor = (font: PreviewFont, weight: number) => font.faces.find(face => face.weight === weight)?.url ?? "";

function fontStyle(font: PreviewFont, weight: number): CSSProperties {
  return { fontFamily: `"${font.family}", sans-serif`, fontWeight: weight, fontSynthesis: "none", letterSpacing: 0 };
}

function FontButton({ font, weight, size, label }: { font: PreviewFont; weight: number; size: number; label: string }) {
  const group = groups[size];
  return <button type="button" data-font-button={group.id} style={{ ...fontStyle(font, weight), height: group.height, paddingInline: group.px, fontSize: group.font, lineHeight: "20px", borderRadius: group.r, width: 208, maxWidth: "100%", borderWidth: 1 }} className={`inline-flex items-center justify-center ${variantColors.primary}`}>{label}</button>;
}

function FontMock({ font, weight }: { font: PreviewFont; weight: number }) {
  return <div data-font-mock data-preview-mock style={{ ...fontStyle(font, weight), fontSize: 14, lineHeight: "24px" }} className={`${styles.mockCard} mt-5 max-w-[430px]`}>
    <header className="border-b border-[var(--preview-border)] pb-5">
      <h4 style={{ fontWeight: "inherit", fontSize: 22, lineHeight: "32px" }}>나의 학습 자료</h4>
      <p className="my-3 text-[var(--preview-text-secondary)]">오늘의 학습 자료를 확인하세요.</p>
      <FontButton font={font} weight={weight} size={0} label="자료 업로드" />
    </header>
    <div className="border-b border-[var(--preview-border)] py-5">
      <h4 style={{ fontWeight: "inherit", fontSize: 18, lineHeight: "28px" }}>이번 주 복습</h4>
      <p className="mt-2">스터디 계획을 추가해보세요.</p>
      <p style={{ fontSize: 12, lineHeight: "20px" }} className="my-3 text-[var(--preview-text-secondary)]">자료구조 · 학습 예정</p>
      <FontButton font={font} weight={weight} size={1} label="수정" />
    </div>
    <div className="pt-5"><FontButton font={font} weight={weight} size={2} label="개인 할 일 추가" /></div>
  </div>;
}

function FontDecisions({ fonts, status, onSummary }: { fonts: PreviewFont[]; status: LoadState; onSummary: (value: string) => void }) {
  const [decisions, setDecisions] = useState<Record<string, { family: string; weight: string }>>({});
  const roles = [["ui", "기본 UI"], ["heading", "Heading"], ["body", "Body"], ["button", "Button Label"]];
  const summary = ["Typography 검토 / 개인 의견 (미확정)", ...roles.map(([id, label]) => {
    const selection = decisions[id];
    const font = fonts.find(f => f.family === selection?.family);
    return `${label}: ${font?.name ?? "미선택"}${id !== "ui" ? ` / weight ${selection?.weight || "미선택"}` : ""}`;
  }), "파일명에 선언된 weight 기준. 한글 포함 여부와 사용 라이선스는 별도 확인 필요."].join("\n");
  useEffect(() => { onSummary(summary); }, [summary, onSummary]);
  return <section id="font-decision" className={styles.decisionArea}>
    <h3 className="text-lg font-semibold">Team Decision / Typography</h3>
    <p className="mt-2 text-sm">선택은 이 페이지의 로컬 상태에만 남습니다. 새로고침하면 초기화됩니다.</p>
    <div className="mt-5 grid gap-5 sm:grid-cols-2">{roles.map(([id, label]) => {
      const selection = decisions[id] ?? { family: "", weight: "" };
      const font = fonts.find(f => f.family === selection.family);
      return <fieldset key={id} className="min-w-0"><legend className="font-semibold">{label}</legend>
        <label className="mt-2 block text-sm">{label} 폰트<select className={fieldClass} value={selection.family} onChange={event => setDecisions(previous => ({ ...previous, [id]: { family: event.target.value, weight: "" } }))}><option value="">미선택</option>{fonts.map(f => <option key={f.family} value={f.family} disabled={!f.faces.some(face => status[face.url] === "ready")}>{f.name}</option>)}</select></label>
        {id !== "ui" && <label className="mt-3 block text-sm">{label} weight<select className={fieldClass} value={selection.weight} disabled={!font} onChange={event => setDecisions(previous => ({ ...previous, [id]: { ...selection, weight: event.target.value } }))}><option value="">미선택</option>{font?.faces.map(face => <option key={face.weight} value={face.weight} disabled={status[face.url] !== "ready"}>{face.weight} {weightNames[face.weight]}</option>)}</select></label>}
      </fieldset>;
    })}</div>
    <label className="mt-6 block font-semibold">폰트 선택 결과<textarea className={`${fieldClass} w-full`} readOnly rows={7} value={summary} onFocus={event => event.currentTarget.select()} /></label>
    <p className="mt-2 text-xs text-[var(--preview-text-secondary)]">결과를 선택해 복사한 뒤 팀 회의 기록에 첨부할 수 있습니다.</p>
  </section>;
}

export function TypographyComparison({ catalog, selected, mockWeight, onSelect, onSummary, onStatus }: { catalog: PreviewFontCatalog; selected: string; mockWeight: number; onSelect: (value: string) => void; onSummary: (value: string) => void; onStatus: (value: LoadState) => void }) {
  const { fonts, warnings } = catalog;
  const weights = [...new Set(fonts.flatMap(font => font.faces.map(face => face.weight)))].sort((a, b) => a - b);
  const [weight, setWeight] = useState(weights.includes(400) ? 400 : weights[0] ?? 400);
  const [status, setStatus] = useState<LoadState>({});
  const active = fonts.find(font => font.family === selected);
  const css = previewFontCss(fonts);
  useEffect(() => { onStatus(status); }, [status, onStatus]);

  useEffect(() => {
    let cancelled = false;
    for (const font of fonts) for (const face of font.faces) {
      document.fonts.load(`${face.weight} 16px "${font.family}"`, sentences.join(" ")).then(loaded => {
        if (!cancelled) setStatus(previous => ({ ...previous, [face.url]: loaded.length ? "ready" : "error" }));
      }).catch(() => {
        if (!cancelled) setStatus(previous => ({ ...previous, [face.url]: "error" }));
      });
    }
    return () => { cancelled = true; };
  }, [fonts]);

  function unavailable(font: PreviewFont, requestedWeight = weight) {
    const key = keyFor(font, requestedWeight);
    return !key ? `${requestedWeight}: 미지원 (가까운 굵기로 대체하지 않음)` : status[key] === "error" ? "폰트 로딩 실패: 파일 손상 또는 제공 경로를 확인하세요." : status[key] !== "ready" ? "폰트 로딩 중…" : null;
  }

  return <section id="typography" className="scroll-mt-6 border-t border-[var(--preview-border)] py-8">
    <style>{css}</style>
    <h2>Typography Comparison</h2>
    <p className="mt-3 text-sm leading-6 text-[var(--preview-text-secondary)]">로컬 폰트 후보를 동일 조건에서 비교합니다. 상단에서 고른 폰트는 프리뷰의 전체 mock UI에 적용되며, 실제 서비스 폰트는 바뀌지 않습니다.</p>
    <details className="my-5 text-sm leading-7"><summary>폰트 추가 방법과 비교 조건</summary>
      <p><code>public/fonts/preview</code> 바로 아래에 <code>Family--400.woff2</code> 형식으로 파일을 넣고 페이지를 새로고침하세요. 예: <code>Pretendard--400.woff2</code>, <code>Pretendard--700.woff2</code>.</p>
      <p>family는 대소문자를 구분합니다. 한글·공백도 지원하지만 영문/숫자/하이픈 이름을 권장합니다. 같은 family 이름을 정확하게 반복하세요. 100~900의 100 단위 고정 굵기만 지원합니다. 가변 폰트는 범위를 자동 인식하지 않으므로 이번 비교에서는 고정 굵기 파일을 권장합니다.</p>
      <p>동일 family/weight에서는 woff2가 woff보다 우선합니다. 하위 폴더·심볼릭 링크·ttf는 비교 대상이 아닙니다. 파일명은 선언값이며 내부 굵기와 한글 글리프 포함 여부를 검증하지 않습니다. 한글 미포함 파일은 대체 글꼴이 표시될 수 있으므로 배포처와 라이선스를 확인하세요.</p>
      <p>개발 모드에서는 보통 새로고침만 필요합니다. 운영 빌드·호스팅에서는 추가 파일을 포함해 다시 빌드/배포해야 합니다. 파일 교체 후 보이지 않으면 강력 새로고침, 개발 서버 재시작 순으로 확인하세요.</p>
    </details>
    {warnings.length > 0 && <aside className="my-5 border-l-2 border-[var(--preview-border)] p-4"><h3 className="font-semibold">파일명·파일 확인 필요</h3><ul className="mt-2 list-disc pl-5 text-sm leading-7 [overflow-wrap:anywhere]">{warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></aside>}
    {!fonts.length ? <div id="font-decision" className={styles.emptyState}><p>아직 비교할 폰트가 없습니다. <code>public/fonts/preview</code>에 지정된 파일명 규칙으로 .woff2 폰트를 추가하면 자동으로 여기에 표시됩니다.</p><p>예: <code>Pretendard--400.woff2</code> / <code>Pretendard--700.woff2</code></p></div> : <>
      <label className="block text-sm font-semibold">공통 비교 weight<select className={fieldClass} value={weight} onChange={event => setWeight(Number(event.target.value))}>{weights.map(w => <option key={w} value={w}>{w} {weightNames[w]}</option>)}</select></label>
      <p className="mt-3 text-sm leading-6">문장·UI 문구: 16px / line-height 28px / letter-spacing 0 / weight {weight}. 해당 weight가 없는 후보는 비교 문구를 표시하지 않습니다. 인위적인 굵기 합성은 끕니다.</p>
      <div className={styles.fontGrid}>{fonts.map(font => <article key={font.family} className={styles.fontItem}>
        <h3 className="break-words text-lg font-semibold">{font.name}</h3>
        <p className="mt-2 text-xs text-[var(--preview-text-secondary)]">등록 weight: {font.faces.map(face => face.weight).join(" / ")}</p>
        <div className="my-5 min-h-40 border-y border-[var(--preview-border)] py-4">{unavailable(font) ? <p role="status" className="text-sm">{unavailable(font)}</p> : <div data-font-sentences style={{ ...fontStyle(font, weight), fontSize: 16, lineHeight: "28px" }}>{sentences.map(sentence => <p key={sentence}>{sentence}</p>)}<p className="mt-4">개인 할 일 추가 · 자료 업로드 · 수정 · 삭제 · 저장 · 완료</p></div>}</div>
        {!unavailable(font) && <dl className={styles.typeRoles}>{[["Heading", 22, 32], ["Body", 16, 28], ["Caption", 12, 20], ["Button Label", 14, 20]].map(([role, size, line]) => <div key={role}><dt>{role} · {size}px / {line}px</dt><dd style={{ ...fontStyle(font, weight), fontSize: Number(size), lineHeight: `${line}px` }}>{role === "Button Label" ? "개인 할 일 추가" : "오늘의 학습 자료를 확인하세요."}</dd></div>)}</dl>}
        <h4 className="text-sm font-semibold">등록된 굵기별 표본</h4>
        {font.faces.map(face => <div key={face.weight} className="mt-3 border-b border-[var(--preview-border)] pb-3"><p className="text-xs">{face.weight} {weightNames[face.weight]} · {status[face.url] === "ready" ? "로딩 완료" : status[face.url] === "error" ? "로딩 실패: 파일 확인 필요" : "로딩 중"}</p>{status[face.url] === "ready" && <p style={{ ...fontStyle(font, face.weight), fontSize: 16, lineHeight: "28px" }}>함께 공부할 그룹을 선택하세요.</p>}</div>)}
        {!unavailable(font) && <details className={styles.details}><summary>Small / Medium / Large 버튼 표본</summary><div className="mt-5 space-y-5">{groups.slice(0, 3).map((group, index) => <div key={group.id}><p className="mb-3 text-xs">{["Small / Compact", "Medium / Regular", "Large / Spacious"][index]} · H {group.height} · PX {group.px} · Font {group.font} · R {group.r} · W 208px</p><div className="flex flex-wrap gap-2">{labels.map(label => <FontButton key={label} font={font} weight={weight} size={index} label={label} />)}</div></div>)}</div></details>}
      </article>)}</div>
      <section className="mt-10 border-t border-[var(--preview-border)] pt-8"><h3 className="text-lg font-semibold">Mock UI / family만 전환</h3>
        <label className="mt-4 block text-sm">Mock UI 폰트<select className={fieldClass} value={selected} onChange={event => onSelect(event.target.value)}><option value="">기존 프로젝트 폰트</option>{fonts.map(font => <option key={font.family} value={font.family}>{font.name}</option>)}</select></label>
        <p className="mt-3 text-sm leading-6">선택은 상단과 연결되어 모든 mock UI에 적용됩니다. Mock 공통 weight {mockWeight}는 상단에서 선택하며, 해당 폰트에 없으면 등록된 첫 굵기를 표시합니다. 후보별 문장 비교 weight는 별도로 유지합니다. 크기·여백·radius는 변경하지 않습니다.</p>
        {!active ? <p className="mt-5">기존 프로젝트 폰트는 아래 Applied Examples에서 확인하세요.</p> : unavailable(active, mockWeight) ? <p className="mt-5" role="status">{unavailable(active, mockWeight)}</p> : <FontMock font={active} weight={mockWeight} />}
      </section>
      <FontDecisions fonts={fonts} status={status} onSummary={onSummary} />
    </>}
  </section>;
}
