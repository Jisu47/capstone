import "server-only";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { createPreviewFontCatalog, type PreviewFontCatalog } from "../preview-fonts";

export async function readPreviewFonts(): Promise<PreviewFontCatalog> {
  const directory = path.join(process.cwd(), "public", "fonts", "preview");
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];
    const warnings: string[] = [];
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      if (!entry.isFile()) {
        warnings.push(`${entry.name}: 하위 폴더와 심볼릭 링크는 탐색하지 않습니다.`);
        continue;
      }
      try {
        const info = await stat(path.join(directory, entry.name));
        files.push({ name: entry.name, version: `${info.mtimeMs}-${info.size}` });
      } catch {
        warnings.push(`${entry.name}: 읽을 수 없습니다. 복사를 마친 뒤 새로고침하세요.`);
      }
    }
    const catalog = createPreviewFontCatalog(files);
    catalog.warnings.push(...warnings);
    return catalog;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { fonts: [], warnings: [] };
    return { fonts: [], warnings: ["폰트 폴더를 읽지 못했습니다. public/fonts/preview의 접근 권한을 확인하세요."] };
  }
}
