import path from "node:path";
import { logMaterialStep } from "@/lib/server/material-diagnostics";
import type { Material } from "@/lib/mock-data";

export const studyMaterialsBucket = "study-materials";

export const supportedMaterialUploadMimeTypes = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
];

export function inferMaterialFormat(fileName: string): Material["format"] {
  const extension = path.extname(fileName).toLowerCase();

  if (extension === ".pdf") {
    return "PDF";
  }

  if (extension === ".md" || extension === ".markdown") {
    return "MD";
  }

  if (extension === ".txt" || extension === ".csv" || extension === ".json") {
    return "TXT";
  }

  return "DOC";
}

export function inferMaterialMimeType(fileName: string, fallbackMimeType: string) {
  if (fallbackMimeType.trim()) {
    return fallbackMimeType;
  }

  const extension = path.extname(fileName).toLowerCase();

  switch (extension) {
    case ".pdf":
      return "application/pdf";
    case ".md":
    case ".markdown":
      return "text/markdown";
    case ".csv":
      return "text/csv";
    case ".json":
      return "application/json";
    case ".txt":
      return "text/plain";
    default:
      return "application/octet-stream";
  }
}

export function isSupportedMaterialUpload(fileName: string, mimeType: string) {
  const extension = path.extname(fileName).toLowerCase();

  return (
    extension === ".pdf" ||
    extension === ".txt" ||
    extension === ".md" ||
    extension === ".markdown" ||
    extension === ".csv" ||
    extension === ".json" ||
    mimeType.startsWith("text/")
  );
}

export function buildMaterialStoragePath(groupId: string, userId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
  return `${groupId}/${userId}/${Date.now()}-${safeName}`;
}

function normalizeText(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\u0000/g, "").trim();
}

function summarizeText(title: string, text: string) {
  const normalized = normalizeText(text);

  if (!normalized) {
    return `${title}에서 텍스트를 추출하지 못했습니다.`;
  }

  const firstParagraph = normalized.split("\n\n")[0] ?? normalized;
  return firstParagraph.slice(0, 120).trim();
}

function buildLocationHint(fileName: string, chunkIndex: number) {
  return path.extname(fileName).toLowerCase() === ".pdf"
    ? `추출 문단 ${chunkIndex + 1}`
    : `본문 ${chunkIndex + 1}`;
}

function chunkText(fileName: string, text: string) {
  const normalized = normalizeText(text);

  if (!normalized) {
    return [] as Array<{ text: string; locationHint: string }>;
  }

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const chunks: Array<{ text: string; locationHint: string }> = [];
  let buffer = "";

  for (const paragraph of paragraphs) {
    if (`${buffer}\n\n${paragraph}`.trim().length > 700 && buffer) {
      chunks.push({
        text: buffer.trim(),
        locationHint: buildLocationHint(fileName, chunks.length),
      });
      buffer = paragraph;
      continue;
    }

    buffer = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
  }

  if (buffer.trim()) {
    chunks.push({
      text: buffer.trim(),
      locationHint: buildLocationHint(fileName, chunks.length),
    });
  }

  if (chunks.length === 0) {
    chunks.push({
      text: normalized.slice(0, 700),
      locationHint: buildLocationHint(fileName, 0),
    });
  }

  return chunks.slice(0, 8);
}

async function extractPdfText(buffer: Buffer) {
  let stage = "upload_pdf_module";
  try {
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    stage = "upload_pdf_open";
    const loadingTask = getDocument({ data: new Uint8Array(buffer), useSystemFonts: true, isEvalSupported: false });
    try {
      const document = await loadingTask.promise;
      stage = "upload_pdf_text";
      const page = await document.getPage(1);
      const content = await page.getTextContent();
      const text = content.items.map(item => "str" in item ? item.str : "").join(" ").trim();
      if (text) logMaterialStep(stage, "ok");
      else logMaterialStep(stage, "error", new Error("텍스트를 추출하지 못했어요"));
      return text;
    } finally {
      await loadingTask.destroy();
    }
  } catch (error) {
    logMaterialStep(stage, "error", error);
    throw error;
  }
}

async function extractTextFromFile(fileName: string, mimeType: string, buffer: Buffer) {
  const extension = path.extname(fileName).toLowerCase();

  if (extension === ".pdf" || mimeType.includes("pdf")) {
    return extractPdfText(buffer);
  }

  return buffer.toString("utf8");
}

export async function extractMaterialSummary(
  fileName: string,
  mimeType: string,
  buffer: Buffer,
) {
  try {
    const extractedText = await extractTextFromFile(fileName, mimeType, buffer);
    const chunks = chunkText(fileName, extractedText);

    return {
      summary: extractedText
        ? summarizeText(fileName, extractedText)
        : mimeType.includes("pdf") || path.extname(fileName).toLowerCase() === ".pdf"
          ? "첫 페이지에서 텍스트를 찾지 못했어요. 원본 내용을 확인해 주세요."
          : `${fileName}에서 텍스트를 추출하지 못했습니다.`,
      locationHint: chunks[0]?.locationHint ?? "본문 1",
    };
  } catch (error) {
    if (path.extname(fileName).toLowerCase() !== ".pdf" && !mimeType.includes("pdf")) {
      logMaterialStep("upload_text_extract", "error", error);
    }
    const isPdf = path.extname(fileName).toLowerCase() === ".pdf" || mimeType.includes("pdf");
    return isPdf
      ? { summary: "PDF 미리보기 텍스트를 추출하지 못했어요. 질문할 때 저장된 원본을 사용합니다.", locationHint: "미리보기 없음" }
      : { summary: "문서 텍스트를 추출하지 못했습니다. 다른 자료를 업로드해 주세요.", locationHint: "처리 실패" };
  }
}
