export type PreviewFontFace = { weight: number; url: string; file: string; format: "woff2" | "woff" };
export type PreviewFont = { name: string; family: string; faces: PreviewFontFace[] };
export type PreviewFontCatalog = { fonts: PreviewFont[]; warnings: string[] };

// File names are metadata supplied by the team, not a claim about binary glyph coverage.
export function createPreviewFontCatalog(files: { name: string; version: string }[]): PreviewFontCatalog {
  const catalog: PreviewFontCatalog = { fonts: [], warnings: [] };
  const families = new Map<string, PreviewFont>();
  for (const file of [...files].sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
    if (file.name.startsWith(".")) continue;
    const match = /^([\p{L}\p{N}][\p{L}\p{N} _-]*)--([1-9]00)\.(woff2|woff)$/u.exec(file.name);
    if (!match || match[1].trim() !== match[1] || match[1].includes("--")) {
      catalog.warnings.push(`${file.name}: 파일명 규칙 확인 필요. Family--400.woff2 또는 .woff (100~900, 100 단위)`);
      continue;
    }
    const name = match[1].normalize("NFC");
    let font = families.get(name);
    if (!font) {
      // Only safe ASCII aliases enter CSS; display names never become CSS source.
      font = { name, family: `preview-font-${Array.from(name).map(c => c.codePointAt(0)!.toString(16)).join("-")}`, faces: [] };
      families.set(name, font);
    }
    const face: PreviewFontFace = { weight: Number(match[2]), format: match[3] as PreviewFontFace["format"], file: file.name, url: `/fonts/preview/${encodeURIComponent(file.name)}?v=${encodeURIComponent(file.version)}` };
    const existing = font.faces.find(f => f.weight === face.weight);
    if (existing) {
      const preferNew = existing.format === "woff" && face.format === "woff2";
      catalog.warnings.push(`${preferNew ? existing.file : face.file}: 같은 family/weight 중복. ${preferNew ? face.file : existing.file} 우선 사용`);
      if (preferNew) font.faces[font.faces.indexOf(existing)] = face;
    } else font.faces.push(face);
  }
  catalog.fonts = [...families.values()].map(font => ({ ...font, faces: font.faces.sort((a, b) => a.weight - b.weight) }));
  return catalog;
}

export function previewFontCss(fonts: PreviewFont[]) {
  return fonts.flatMap(font => font.faces.map(face => `@font-face{font-family:"${font.family}";src:url("${face.url}") format("${face.format}");font-weight:${face.weight};font-style:normal;font-display:swap;}`)).join("\n");
}

export const weightNames: Record<number, string> = { 100: "Thin", 200: "ExtraLight", 300: "Light", 400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold", 800: "ExtraBold", 900: "Black" };
