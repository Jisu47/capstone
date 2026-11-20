import type { CSSProperties } from "react";

// Service sources: globals.css (--brand, --brand-soft, --background, --ink-soft)
// and login/create controls. Service CTA still uses #79B895; the approved dark
// frame is promoted to preview Primary, while service green becomes Accent.
export const colors = {
  primary: "#4B6C57",
  "primary-hover": "#405C4A",
  "primary-foreground": "#FFFFFF",
  background: "#FFFFFF",
  accent: "#79B895",
  surface: "#FFFFFF",
  "surface-subtle": "#E6F3EB",
  border: "#E0E4E2",
  "text-primary": "#38423D",
  "text-secondary": "#66786F",
  "text-muted": "#7D8C85",
  "icon-primary": "#79B895",
  "icon-muted": "#66786F",
  "disabled-background": "#E6F3EB",
  "disabled-text": "#7D8C85",
  focus: "rgba(121, 184, 149, 0.42)",
  frame: "#4B6C57",
  "on-frame": "#FFFFFF",
  "on-frame-secondary": "rgba(255, 255, 255, 0.76)",
  "on-frame-menu": "rgba(255, 255, 255, 0.86)",
  "frame-hover": "rgba(255, 255, 255, 0.10)",
  "frame-border": "rgba(255, 255, 255, 0.24)",
} as const;

export const colorStyle = Object.fromEntries(
  Object.entries(colors).map(([name, value]) => [`--v2-${name}`, value]),
) as CSSProperties;

export const colorSwatches = [
  ["Primary", colors.primary, `Text Primary ${colors["text-primary"]}; Text Secondary ${colors["text-secondary"]}`],
  ["Primary Hover", colors["primary-hover"], `Foreground ${colors["primary-foreground"]}; Disabled ${colors["disabled-background"]} / ${colors["disabled-text"]}`],
  ["Accent", colors.accent, `Soft Accent ${colors["surface-subtle"]}; Icon ${colors["icon-primary"]}`],
  ["Background", colors.background, `Surface ${colors.surface}; Border ${colors.border}`],
] as const;
