"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { groups, samples, type Sample } from "./button-samples";
import { ButtonContextMocks } from "./button-context-mocks";
import { specimenColors, themeStyle, variantColors, themes, type ThemeId } from "./preview-themes";
import { ThemeControls, ThemeReview } from "./theme-review";
import styles from "./preview-document.module.css";
import { ButtonDecisionGuide, type ButtonChoices } from "./button-decision-guide";
import { TypographyComparison, type LoadState } from "./typography-comparison";
import type { PreviewFontCatalog } from "@/lib/preview-fonts";

const variants = variantColors;

// Copies of the existing materials screen icons, scoped to this disposable preview.
function SampleIcon({ icon }: { icon: Sample["icon"] }) {
  if (icon === "dots") return <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path d="M4.75 10a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z" /><path d="M10 10a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z" /><path d="M15.25 10a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z" /></svg>;
  return <svg aria-hidden="true" className={icon === "send" ? "h-5 w-5" : "h-4 w-4"} fill="none" viewBox="0 0 24 24"><path d={icon === "send" ? "m5 12 13-7-3.5 7L18 19l-13-7Zm0 0h9.5" : "m6 6 12 12M18 6 6 18"} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}

function Specimen({ sample, disabled }: { sample: Sample; disabled: boolean }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [metrics, setMetrics] = useState<string[]>([]);
  useEffect(() => {
    const button = ref.current;
    if (!button) return;
    const measure = () => {
      const s = getComputedStyle(button);
      const bounds = button.getBoundingClientRect();
      setMetrics([
        `${Math.round(bounds.height * 100) / 100}px / ${Math.round(bounds.width * 100) / 100}px`,
        `${s.paddingLeft} / ${s.paddingTop}`,
        `${s.fontSize} / ${s.fontWeight} / ${s.lineHeight}`,
        `${s.borderRadius} / ${s.borderTopWidth}`,
      ]);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(button);
    return () => observer.disconnect();
  }, []);

  return <article className="min-w-0 rounded-lg border border-[var(--preview-border)] bg-[var(--preview-surface)] p-4">
    <div className="flex items-start justify-between gap-3 text-sm">
      <h3 className="font-semibold">{sample.label}</h3><span className="text-xs text-[var(--preview-text-secondary)]">{sample.role}</span>
    </div>
    <div className="my-4 flex min-h-24 items-center border-y border-dashed border-[var(--preview-border)] py-4 text-base leading-6 font-normal">
      <button ref={ref} type="button" data-sample={sample.id} disabled={disabled} className={specimenColors(sample.className, sample.role)} aria-label={sample.icon ? sample.label : undefined} title={sample.label}>
        {sample.icon ? <SampleIcon icon={sample.icon} /> : sample.label}
      </button>
    </div>
    <dl className="grid grid-cols-[100px_minmax(0,1fr)] gap-x-2 gap-y-2 text-xs leading-5 text-[var(--preview-text-secondary)]">
      <dt>height / width</dt><dd>{metrics[0] ?? "측정 중"}</dd>
      <dt>padding x / y</dt><dd>{metrics[1] ?? "측정 중"}</dd>
      <dt>font / weight / lh</dt><dd>{metrics[2] ?? "측정 중"}</dd>
      <dt>radius / border</dt><dd>{metrics[3] ?? "측정 중"}</dd>
      <dt>클래스 선언</dt><dd>{sample.declaredFont}</dd>
      <dt>너비 방식</dt><dd>{sample.width}</dd>
      <dt>아이콘</dt><dd>{sample.icon ? "icon-only" : sample.id === "upload" ? "+ 문자 포함 (별도 아이콘 없음)" : "없음 / text-only"}</dd>
      <dt>사용 위치</dt><dd>{sample.location}</dd>
    </dl>
    <p className="mt-4 text-xs leading-5 text-[var(--preview-text-secondary)] [overflow-wrap:anywhere]">Reference: {sample.source}</p>
    <details className="mt-3 text-xs text-[var(--preview-text-secondary)]"><summary className="cursor-pointer py-1">원본 Tailwind class</summary><code className="mt-2 block whitespace-normal bg-[var(--preview-surface-muted)] p-2 leading-5 [overflow-wrap:anywhere]">{sample.className}</code></details>
  </article>;
}

function ReferenceButton({ id }: { id: string }) {
  const sample = samples.find((item) => item.id === id)!;
  return <button type="button" className={specimenColors(sample.className, sample.role)} aria-label={sample.icon ? sample.label : undefined} title={sample.label}>{sample.icon ? <SampleIcon icon={sample.icon} /> : sample.label}</button>;
}

function MockContext({ group }: { group: (typeof groups)[number] }) {
  return <div className="mt-6 max-w-xl">
    <h3 className="mb-3 text-sm font-semibold">사용 맥락 / 원본 크기 + 테마 색상</h3>
    <div data-preview-mock className={styles.mockCard}>
      {group.id === "compact" ? <div className="flex flex-wrap items-center justify-between gap-3"><span>오늘의 개인 할 일</span><ReferenceButton id="edit" /></div>
        : group.id === "regular" ? <div className="flex flex-wrap items-center justify-between gap-3"><span>자료</span><ReferenceButton id="upload" /></div>
          : group.id === "form" ? <><p className="mb-3">개인 할 일</p><div className="mb-4 border-b border-[var(--preview-border)] py-3 text-[var(--preview-text-secondary)]">알고리즘 3장 복습</div><ReferenceButton id="task" /><div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-[var(--preview-border)] pt-4"><ReferenceButton id="cancel" /><ReferenceButton id="save" /></div></>
            : <><p className="mb-4">로그인</p><div className="mb-4 border-b border-[var(--preview-border)] py-3 text-[var(--preview-text-secondary)]">study@example.com</div><ReferenceButton id="login" /></>}
    </div>
  </div>;
}

export function ButtonInventoryScreen({ fontCatalog }: { fontCatalog: PreviewFontCatalog }) {
  const [theme, setTheme] = useState<ThemeId>("default");
  const [selectedFont, setSelectedFont] = useState(fontCatalog.fonts[0]?.family ?? "");
  const [fontStatus, setFontStatus] = useState<LoadState>({});
  const [mockWeight, setMockWeight] = useState(400);
  const activeFont = fontCatalog.fonts.find(font => font.family === selectedFont);
  const activeFace = activeFont?.faces.find(face => face.weight === mockWeight) ?? activeFont?.faces[0];
  const fontReady = Boolean(activeFace && fontStatus[activeFace.url] === "ready");
  const mockFontStyle = (fontReady && activeFont && activeFace ? { "--preview-mock-font": `"${activeFont.family}", sans-serif`, "--preview-mock-weight": activeFace.weight } : {}) as CSSProperties;
  const [fontSummary, setFontSummary] = useState("Typography: 폰트 후보 없음");
  const [buttonSummary, setButtonSummary] = useState("");
  const [buttonChoices, setButtonChoices] = useState<ButtonChoices>({});
  const chooseButton = (key: string, index: number | undefined) => setButtonChoices(previous => ({ ...previous, [key]: index }));
  const [disabled, setDisabled] = useState(false);
  const [widthGroup, setWidthGroup] = useState("form");
  const chosen = groups.find((group) => group.id === widthGroup)!;
  const candidateStyle = (group: (typeof groups)[number]) => ({ height: group.height, paddingInline: group.px, fontSize: group.font, fontWeight: 600, lineHeight: "20px", borderRadius: group.r });
  const candidateClass = "inline-flex shrink-0 items-center justify-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--preview-focus)] disabled:opacity-50 disabled:cursor-not-allowed";

  return <main data-preview-theme={theme} data-mock-font-active={fontReady ? "true" : "false"} style={{ ...themeStyle(theme), ...mockFontStyle }} className={`${styles.document} min-h-dvh bg-[var(--preview-background)] text-[var(--preview-text-primary)]`}>
    <div className="mx-auto max-w-7xl">
      <header className="border-b border-[var(--preview-border)] pb-6">
        <h1 className="font-semibold">디자인 후보 검토</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--preview-text-secondary)]">버튼, 폰트, 색상 및 UI 후보를 비교하고 팀 기준을 결정하기 위한 개발용 프리뷰입니다. 모든 후보는 미확정이며 실제 서비스에는 적용되지 않습니다.</p>
        <dl className={styles.headerMeta}><div><dt>현재 테마</dt><dd>{themes[theme].label}</dd></div><div><dt>폰트 mock 선택</dt><dd>{activeFont?.name ?? "기존 프로젝트 폰트"}</dd></div></dl>
        <ThemeControls value={theme} onChange={setTheme} />
        <div className="mb-4 flex flex-wrap items-end gap-4 text-sm">
          <label>전체 mock 폰트<select className="mt-2 block max-w-full rounded border border-[var(--preview-border)] bg-[var(--preview-surface)] p-2" value={selectedFont} onChange={event => setSelectedFont(event.target.value)}><option value="">기존 프로젝트 폰트</option>{fontCatalog.fonts.map(font => <option key={font.family} value={font.family}>{font.name}</option>)}</select></label>
          {activeFont && <label>Mock 공통 weight<select className="mt-2 block rounded border border-[var(--preview-border)] bg-[var(--preview-surface)] p-2" value={activeFace?.weight} onChange={event => setMockWeight(Number(event.target.value))}>{activeFont.faces.map(face => <option key={face.weight} value={face.weight}>{face.weight}</option>)}</select></label>}
          <p className="text-xs leading-5 text-[var(--preview-text-secondary)]" role="status">{activeFont ? fontReady ? `전체 mock에 ${activeFont.name} / ${activeFace?.weight} 적용. 등록된 굵기만 사용합니다.` : fontStatus[activeFace?.url ?? ""] === "error" ? "폰트 로딩 실패: mock은 기존 폰트로 표시됩니다." : "폰트 로딩 중: mock은 기존 폰트로 표시됩니다." : "기존 프로젝트 폰트 · 후보별 Typography 비교는 별도 유지"}</p>
        </div>
        <details className="mb-4 text-xs leading-6 text-[var(--preview-text-secondary)]"><summary>실제 화면에서 참고한 대표값</summary><p>MobileShell: 흰 배경, 최대 430px, 모바일 좌우 14px, 블록 간 12px. SectionCard: radius 16px, padding 14px, border 1px, shadow 0 6px 16px / 4%. 계획 카드 14~16px, 자료 카드 22~24px 중 공통 SectionCard를 대표로 재현했습니다. 비교 문서는 넓게 유지하고 mock 화면만 모바일 폭을 사용합니다. 테마 B는 같은 구조에 색상만 변경합니다.</p></details>
        <nav aria-label="문서 목차" className={styles.navigation}>
          <a href="#decision-options">상황별 선택</a><a href="#button-size">크기·규격</a><a href="#candidates">Variants</a><a href="#context-mocks">적용 예시</a><a href="#typography">폰트</a><a href="#color-tokens">색상 토큰</a><a href="#team-summary">선택 요약</a>
        </nav>
      </header>
      <ButtonDecisionGuide theme={theme} choices={buttonChoices} onChoose={chooseButton} onSummary={setButtonSummary} />



      <section id="button-size" className="scroll-mt-6 border-b border-[var(--preview-border)] py-8">
        <h2>Buttons / Size</h2>
        <p className={styles.description}>원본 관찰 범위와 통일 후보를 구분합니다. 같은 문구와 primary variant로 크기 차이를 비교합니다.</p>
        <div className={styles.sizeGrid}>{groups.map(group => <article key={group.id} className={styles.sizeItem}>
          <h3>{group.name.split(" / ")[1]}</h3>
          <p className="mt-1 text-xs text-[var(--preview-text-secondary)]">원본 관찰 {group.range}</p>
          <div className={styles.specimenStage}><button type="button" disabled={disabled} style={candidateStyle(group)} className={`${candidateClass} ${variants.primary}`}>동작 실행</button></div>
          <dl className={styles.metrics}><dt>Height</dt><dd>{group.height}px</dd><dt>Padding X</dt><dd>{group.px}px</dd><dt>Font / Weight</dt><dd>{group.font}px / 600</dd><dt>Radius</dt><dd>{group.r}px</dd></dl>
          <p className={styles.itemNote}>{group.use}</p>
          <p className={styles.itemNote}>Reference: {samples.filter(sample => sample.group === group.id).slice(0, 2).map(sample => sample.label).join(" · ")}</p>
        </article>)}</div>
        <label className="mt-5 inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={disabled} onChange={event => setDisabled(event.target.checked)} />disabled 상태 비교</label>
        <details className={styles.details}><summary>측정 환경과 원본 표본 19개</summary>
      <aside className="my-6 border-l-4 border-[var(--preview-border)] bg-[var(--preview-surface-muted)] p-4 text-sm leading-6 text-[var(--preview-text-primary)]">
        <strong>클래스 선언과 실제 적용값이 다릅니다.</strong>
        <p><code>globals.css</code>의 비레이어 <code>button &#123; font: inherit &#125;</code>가 Tailwind의 글꼴 유틸리티보다 우선합니다. 아래 재현 표본은 부모 16px / 400 / line-height 24px 기준입니다. 원본 화면의 부모 글꼴이 다르면 다시 측정해야 합니다. 높이는 고정 h가 없는 경우 line-height + padding-y × 2 + border입니다.</p>
        <p>글꼴과 전역 스타일은 수정하지 않았습니다. 값은 이 프리뷰에서 실시간 측정하며, width는 프리뷰 컨테이너에 따라 달라집니다. pill은 계산값이 매우 큰 px로 표시될 수 있습니다.</p>
      </aside>



      {groups.map((group) => <section key={group.id} id={group.id} className="scroll-mt-6 border-b border-[var(--preview-border)] py-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3"><h2 className="text-xl font-semibold">{group.name}</h2><span className="font-mono text-sm">{group.range}</span></div>
        <p className="mt-2 text-sm text-[var(--preview-text-secondary)]">{group.reason}</p>
        <p className="mt-2 text-xs leading-6 text-[var(--preview-text-secondary)]">현재 표본: {group.padding} · radius {group.radius} · 일반 텍스트 실측 16px / 400 · 주요 용도: {group.use}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{samples.filter((sample) => sample.group === group.id).map((sample) => <Specimen key={sample.id} sample={sample} disabled={disabled} />)}</div>
        <MockContext group={group} />
      </section>)}
        </details>
      </section>

      <section id="candidates" className="scroll-mt-6 border-b border-[var(--preview-border)] py-8">
        <h2 className="text-xl font-semibold">Buttons / Variants</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--preview-text-secondary)]">같은 크기에서 primary · secondary · ghost · danger를 비교합니다. 모든 조합은 검토 후보이며 서비스 적용 여부와는 구분됩니다.</p>
        <div className="mt-5 space-y-6">{groups.map((group) => <div key={group.id}>
          <h3 className="text-sm font-semibold">{group.name} 후보 · H {group.height} / PX {group.px} / Font {group.font} / Weight 600 / Radius {group.r}px</h3>
          <p className="mt-1 text-xs text-[var(--preview-text-secondary)]">고정 높이에서 중앙 정렬 · line-height 20px · 세로 여백은 높이 안에서 결정</p>
          <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">{Object.entries(variants).map(([name, className]) => <div key={name} className="min-w-0"><p className="mb-2 text-xs text-[var(--preview-text-secondary)]">{name}</p><button type="button" disabled={disabled} style={candidateStyle(group)} className={`${candidateClass} ${className}`}>동작 실행</button></div>)}</div>
        </div>)}</div>
      </section>

      <section aria-label="Width 비교" id="width" className="scroll-mt-6 border-b border-[var(--preview-border)] py-8">
        <h2 className="text-xl font-semibold">Width / 같은 크기, 다른 레이아웃</h2>
        <label className="mt-4 flex items-center gap-3 text-sm">비교 크기<select value={widthGroup} onChange={(event) => setWidthGroup(event.target.value)} className="rounded border border-[var(--preview-border)] bg-[var(--preview-surface)] p-2">{groups.map((group) => <option key={group.id} value={group.id}>{group.name} ({group.height}px)</option>)}</select></label>
        <div className="mt-5 grid gap-6 lg:grid-cols-3">{["content", "full", "header"].map((width) => <div key={width} className="min-w-0">
          <h3 className="mb-3 text-sm font-semibold">{width === "content" ? "모달 / content width" : width === "full" ? "폼 / full width" : "좁은 헤더 / content + shrink-0"}</h3>
          <div className={`flex min-h-28 items-center gap-2 border-y border-dashed border-[var(--preview-border)] py-4 ${width === "header" ? "max-w-64" : ""}`}>
            {width === "header" && <span className="min-w-0 flex-1 truncate text-sm" title="이번 주 개인 학습 계획">이번 주 개인 학습 계획</span>}
            <button type="button" data-width-example={width} disabled={disabled} style={candidateStyle(chosen)} className={`${candidateClass} ${variants.primary} ${width === "full" ? "w-full" : ""}`}>저장</button>
          </div>
        </div>)}</div>
        <p className="mt-3 text-sm leading-6 text-[var(--preview-text-secondary)]">size는 높이·내부 여백·글꼴을, variant는 색상·테두리·상태를 담당하는 방향을 권장합니다. width는 부모 레이아웃 또는 별도 fullWidth 옵션으로 관리합니다. 좁은 헤더는 버튼을 축소하지 않고 제목을 줄입니다.</p>
      </section>

      <ButtonContextMocks choices={buttonChoices} />
      <TypographyComparison catalog={fontCatalog} selected={selectedFont} mockWeight={activeFace?.weight ?? 400} onSelect={setSelectedFont} onSummary={setFontSummary} onStatus={setFontStatus} />
      <ThemeReview mode="comparison" selectedTheme={theme} />
      <ThemeReview mode="tokens" selectedTheme={theme} />

      <details className="py-8 text-sm leading-7 text-[var(--preview-text-secondary)]">
        <summary className="cursor-pointer text-base font-semibold">검토 범위 및 팀 결정 사항</summary>
        <ul className="list-disc space-y-2 pl-5">
          <li>관찰된 4개 구간을 유지할지, Tall을 로그인 전용 예외로 두고 3개 size로 정리할지 결정합니다. 우선 4개 구간을 비교하고 사용 빈도가 낮은 Tall만 통합 검토하는 것을 권장합니다.</li>
          <li>자료 업로드는 현재 Regular 40px, 개인 할 일 추가는 Spacious 48px입니다. 클래스만 보고 32px / 44px로 분류하면 현재 화면과 어긋납니다.</li>
          <li>전역 font 상속을 유지할지 먼저 결정해야 합니다. 후보 13 / 14 / 14 / 16px, weight 600은 확정값이 아닙니다.</li>
          <li>pill과 12–18px radius를 size에 묶을지, 별도 shape로 둘지 결정합니다. #4CAF7A와 --brand의 primary 색상 차이, 흰 글자 대비도 별도 검증이 필요합니다.</li>
          <li>테두리 유무로 생기는 2px 높이 차이를 고정 높이로 흡수할지, 작은 icon-only 버튼의 터치 영역을 별도로 확보할지 결정합니다.</li>
          <li>이 표본은 주요 액션 19개를 선정한 조사입니다. 링크형 CTA, 탭, 체크리스트 행, 구형 prototype 화면까지 모두 세어 얻은 전체 통계는 아닙니다.</li>
        </ul>
        <p className="mt-5 text-xs">출처는 현재 작업 트리 기준 스냅샷입니다. 이 경로는 기존 폰트·전역 스타일만 상속하고 인증·데이터 Provider를 마운트하지 않습니다. 개발용 표기만 있으며 프로덕션 접근 차단은 설정하지 않았습니다.</p>
      </details>
      <section id="team-summary" className={styles.teamSummary}>
        <h2>Team Decision / 전체 요약</h2>
        <p className={styles.description}>버튼·폰트 선택과 현재 검토 테마를 한 번에 기록합니다. 서버에 저장하지 않으며 새로고침하면 선택이 초기화됩니다.</p>
        <div className="my-4 flex flex-wrap gap-5 text-sm underline underline-offset-4"><a href="#decision-guide">버튼 선택</a><a href="#font-decision">폰트 선택</a><a href="#theme-selection">테마 선택</a></div>
        <label className="block text-sm">팀 검토 결과<textarea readOnly rows={16} value={[buttonSummary, "", fontSummary, "", `Theme: ${themes[theme].label} (현재 검토 테마, 팀 확정 아님)`].join("\n")} onFocus={event => event.currentTarget.select()} className="mt-3 w-full resize-y border border-[var(--preview-border)] bg-[var(--preview-surface)] p-4 text-sm leading-6" /></label>
      </section>
    </div>
  </main>;
}
