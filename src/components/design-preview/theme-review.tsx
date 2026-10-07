import { contrastRatio, themes, variantColors, type ThemeId } from "./preview-themes";
import styles from "./preview-document.module.css";

const tokenPurpose: Record<string, string> = {
  primary: "주요 동작 배경", "primary-hover": "주요 동작 hover", "primary-foreground": "주요 동작 글자",
  secondary: "보조 동작 배경", "secondary-foreground": "보조 동작 글자", surface: "콘텐츠 면",
  "surface-muted": "입력·보조 영역", background: "화면 바탕", "text-primary": "기본 텍스트",
  "text-secondary": "설명·보조 텍스트", border: "경계선", danger: "위험 동작 배경",
  "danger-hover": "위험 동작 hover", "danger-foreground": "위험 동작 글자", focus: "키보드 포커스", shadow: "그림자 후보",
};

export function ThemeControls({ value, onChange }: { value: ThemeId; onChange: (value: ThemeId) => void }) {
  return <section id="theme-selection" className="mt-4 pb-3">

    <fieldset className="mt-4 flex flex-wrap gap-2"><legend className="sr-only">프리뷰 색상 테마</legend>
      {(Object.keys(themes) as ThemeId[]).map((id) => <label key={id} className="flex cursor-pointer items-center gap-2 py-2 pr-5 text-sm">
        <input type="radio" name="preview-theme" value={id} checked={id === value} onChange={() => onChange(id)} style={{ accentColor: "var(--preview-primary)" }} />
        <span aria-hidden="true" className="h-4 w-4 rounded-full" style={{ background: themes[id].colors.primary }} />{themes[id].label}
      </label>)}
    </fieldset>
    <details className="mt-3 text-xs leading-5 text-[var(--preview-text-secondary)]"><summary>색상 적용 및 원본과의 차이</summary><p className="mt-2">원본 클래스는 출처로 유지하고 표본의 색상만 토큰에 매핑합니다. 테마 A도 원본 색상의 완전 복제가 아닙니다. 예: 기존 #79B895 + 흰 글자 대비 {contrastRatio("#79B895", "#FFFFFF").toFixed(2)}:1을 개선한 후보입니다.</p></details>
  </section>;
}

function ComparisonMock() {
  return <div data-theme-comparison-mock data-preview-mock className={styles.mockFrame}>
    <header className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-semibold">이번 주 학습</h4><button type="button" className={`h-9 rounded-xl px-3 ${variantColors.primary}`}>자료 업로드</button></header>
    <article className={styles.mockCard}>
      <h4 className="font-semibold">자료구조 핵심 정리</h4><p className="mt-2 text-sm text-[var(--preview-text-secondary)]">복습 예정 · 연습문제 5개</p>
      <label className="mt-4 block text-sm">학습 메모<input readOnly value="3장 핵심 개념 복습" className="mt-2 w-full rounded-lg border border-[var(--preview-border)] bg-[var(--preview-surface-muted)] px-3 py-2 text-[var(--preview-text-primary)]" /></label>
      <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" className={`h-10 rounded-[14px] px-4 ${variantColors.secondary}`}>취소</button><button type="button" className={`h-10 rounded-[14px] px-4 ${variantColors.primary}`}>확인</button></div>
      <button type="button" className={`mt-3 h-10 w-full rounded-[14px] px-4 ${variantColors.danger}`}>계획 삭제</button>
    </article>
  </div>;
}

export function ThemeReview({ mode, selectedTheme }: { mode: "comparison" | "tokens"; selectedTheme: ThemeId }) {
  return <section id={mode === "comparison" ? "theme-comparison" : "color-tokens"} className="scroll-mt-6 border-b border-[var(--preview-border)] py-8">
    <h2 className="text-xl font-semibold">{mode === "comparison" ? "Selected Theme / 적용 예시" : "Color Tokens"}</h2>
    <p className="mt-2 text-sm text-[var(--preview-text-secondary)]">{mode === "comparison" ? "현재 선택한 테마 하나만 표시합니다. 상단에서 테마를 바꾸면 동일한 구조의 색상만 전환됩니다." : "현재 테마의 토큰 이름 · 색상 · 실제 값 · 사용 목적입니다."}</p>
    <div className="mt-5">{[selectedTheme].map((id) => {
      const theme = themes[id], c = theme.colors;
      const checks = [
        ["Primary / 글자", c.primary, c["primary-foreground"]],
        ["Primary hover / 글자", c["primary-hover"], c["primary-foreground"]],
        ["Background / 글자", c.background, c["text-primary"]],
        ["Surface / 글자", c.surface, c["text-primary"]],
        ["Danger / 글자", c.danger, c["danger-foreground"]],
        ["Danger hover / 글자", c["danger-hover"], c["danger-foreground"]],
      ];
      return <article key={id} data-comparison-theme={mode === "comparison" ? id : undefined} className="min-w-0 text-[var(--preview-text-primary)]">
        <div className="bg-[var(--preview-background)] p-4"><h3 className="font-semibold">{theme.label}</h3><p className="mt-1 text-sm text-[var(--preview-text-secondary)]">{theme.description}</p></div>
        {mode === "comparison" && <ComparisonMock />}
        {mode === "tokens" && <div className="bg-[var(--preview-surface)] p-4">
          <h4 className="font-semibold">Semantic Palette</h4>
          <dl className="mt-3 grid gap-x-8 gap-y-2 md:grid-cols-2">{Object.entries(c).map(([token, hex]) => <div key={token} className="flex flex-wrap items-center gap-2 text-xs">
            <span aria-hidden="true" className="h-5 w-5 shrink-0 rounded border border-[var(--preview-border)]" style={{ backgroundColor: hex }} />
            <dt className="min-w-0 flex-1 break-all">--preview-{token}</dt><dd className="font-mono">{hex}</dd><dd className="w-full pl-7 text-[var(--preview-text-secondary)]">{tokenPurpose[token]}</dd>
          </div>)}</dl>
          <h4 className="mt-5 font-semibold">텍스트 대비 / sRGB 계산</h4>
          <ul className="mt-2 space-y-1 text-xs">{checks.map(([label, bg, fg]) => {
            const ratio = contrastRatio(bg, fg);
            return <li key={label}>{label}: {ratio.toFixed(2)}:1 · {ratio >= 4.5 ? "4.5:1 이상" : "추가 검토 필요"}</li>;
          })}</ul>
          <p className="mt-3 text-xs leading-5 text-[var(--preview-text-secondary)]">불투명 기본·hover 색상의 간단한 계산입니다. disabled 투명도, 포커스 표시, 경계선과 전체 접근성 적합성을 보증하지 않습니다.</p>
        </div>}
      </article>;
    })}</div>
  </section>;
}
