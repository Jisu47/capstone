import type { CSSProperties } from "react";

export const themes = {
  default: {
    label: "Theme A / Default", description: "기존 녹색 분위기 · 흰 글자 대비를 위해 primary를 진하게 조정",
    colors: {
      primary: "#28734F", "primary-hover": "#205D40", "primary-foreground": "#FFFFFF",
      secondary: "#E6F3EB", "secondary-foreground": "#244F39",
      surface: "#FFFFFF", "surface-muted": "#EEF5F0", background: "#FFFFFF",
      "text-primary": "#12233D", "text-secondary": "#52665B", border: "#E2E8F0",
      danger: "#BE123C", "danger-hover": "#9F1239", "danger-foreground": "#FFFFFF",
      focus: "#28734F", shadow: "#0F172A0A",
    },
  },
  alternative: {
    label: "Theme B / Alternative", description: "청색 포인트 · 중립 회색 바탕의 차분한 비교 후보",
    colors: {
      primary: "#245DC1", "primary-hover": "#1C4896", "primary-foreground": "#FFFFFF",
      secondary: "#E8EEFA", "secondary-foreground": "#294574",
      surface: "#FFFFFF", "surface-muted": "#EDF0F5", background: "#F6F7FA",
      "text-primary": "#202939", "text-secondary": "#566174", border: "#DBE1EA",
      danger: "#B42332", "danger-hover": "#921B28", "danger-foreground": "#FFFFFF",
      focus: "#245DC1", shadow: "#1E33500A",
    },
  },
} as const;
export type ThemeId = keyof typeof themes;

export function themeStyle(id: ThemeId): CSSProperties {
  return Object.fromEntries(Object.entries(themes[id].colors).map(([key, value]) => [`--preview-${key}`, value])) as CSSProperties;
}

export function contrastRatio(first: string, second: string) {
  const luminance = (hex: string) => {
    const rgb = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
      .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const a = luminance(first), b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// A color-only adapter for the frozen source specimens. Geometry stays intact.
export function specimenColors(classes: string, role: string) {
  const color = role === "primary" || role === "강조 / dark" ? "primary"
    : role === "danger" ? "danger" : role.includes("ghost") || role === "ghost" ? "ghost" : "secondary";
  const geometry = classes.split(" ").filter((item) => !/^(?:(?:hover|focus-visible|disabled):)*(?:bg-|text-(?:slate|white|rose|\[var)|border-(?:slate|rose|\[var)|brightness-|ring-\[)/.test(item)).join(" ");
  const colors = role === "danger / ghost"
    ? "bg-transparent text-[var(--preview-danger)] hover:bg-[var(--preview-surface-muted)] hover:text-[var(--preview-danger-hover)]"
    : variantColors[color].replace(/^border /, "");
  return `${geometry} ${colors} border-[var(--preview-border)] shadow-[color:var(--preview-shadow)] focus-visible:outline-[var(--preview-focus)]`;
}

export const variantColors = {
  primary: "bg-[var(--preview-primary)] text-[var(--preview-primary-foreground)] hover:bg-[var(--preview-primary-hover)]",
  secondary: "border border-[var(--preview-border)] bg-[var(--preview-secondary)] text-[var(--preview-secondary-foreground)] hover:bg-[var(--preview-surface-muted)]",
  ghost: "bg-transparent text-[var(--preview-text-secondary)] hover:bg-[var(--preview-surface-muted)]",
  danger: "bg-[var(--preview-danger)] text-[var(--preview-danger-foreground)] hover:bg-[var(--preview-danger-hover)]",
} as const;
