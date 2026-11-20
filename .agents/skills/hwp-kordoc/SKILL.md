---
name: hwp-kordoc
description: Use KORDOC for Korean HWP/HWPX/HWPML document parsing, Markdown or JSON extraction, document comparison, form-field extraction, and Markdown to HWPX generation.
license: MIT
metadata:
  category: documents
  locale: ko-KR
  tools: kordoc
---

# HWP KORDOC

Use this skill whenever the user asks to read, convert, inspect, summarize, compare, or generate Korean Hangul Office documents: `.hwp`, `.hwpx`, or `.hwpml`.

The default engine is `kordoc`. Prefer KORDOC over ad hoc ZIP/XML parsing unless the task is explicitly about low-level HWPX repair.

## Scope

Use this skill for:

- HWP/HWPX/HWPML to Markdown.
- HWP/HWPX/HWPML to JSON with structured blocks and metadata.
- Batch conversion of folders or globs.
- Page-range extraction.
- Korean public-document table and form structure extraction.
- Comparing two document versions.
- Extracting HWPX form fields.
- Generating HWPX from Markdown.

Do not use this skill as the primary path for:

- Live GUI automation of Hancom Hangul.
- Direct binary `.hwp` text insertion, deletion, or table editing.
- Layout debugging that requires page SVG thumbnails, IR dumps, or renderer internals.
- OCR-heavy image PDFs when no OCR provider/runtime is available.

For risky edits, preserve the original file, write a new output file, and verify the result before reporting success.

## Runtime

KORDOC is distributed as a Node package. Use one-shot `npx` commands when the project should not receive new dependencies:

```bash
npx --yes --package kordoc --package pdfjs-dist kordoc --help
```

Use a local or global install only when the user approves persistent installation:

```bash
npm install -g kordoc pdfjs-dist
```

Some KORDOC releases load `pdfjs-dist` at startup, so include `pdfjs-dist` even for HWP-only commands.

## Common Commands

Convert one document to Markdown:

```bash
npx --yes --package kordoc --package pdfjs-dist kordoc "문서.hwp" -o "문서.md"
```

Convert one document to JSON:

```bash
npx --yes --package kordoc --package pdfjs-dist kordoc "문서.hwpx" --format json -o "문서.json"
```

Convert several documents into a directory:

```bash
npx --yes --package kordoc --package pdfjs-dist kordoc "./문서함/*" -d "./변환결과"
```

Extract selected pages:

```bash
npx --yes --package kordoc --package pdfjs-dist kordoc "보고서.hwp" --pages 1-3 -o "보고서-pages-1-3.md"
```

Watch a folder:

```bash
npx --yes --package kordoc --package pdfjs-dist kordoc watch "./문서함"
```

## Node API Path

Use a local Node project for ESM examples when CLI output is not enough:

```bash
npm install kordoc pdfjs-dist
```

Parse a document:

```javascript
import { parse } from "kordoc";

const result = await parse("문서.hwpx");
if (!result.success) {
  throw new Error(result.error);
}

console.log(result.markdown);
console.log(result.blocks);
console.log(result.metadata);
```

Extract form fields:

```javascript
import { extractFormFields, parse } from "kordoc";

const result = await parse("신청서.hwpx");
if (!result.success) {
  throw new Error(result.error);
}

const fields = extractFormFields(result.blocks);
console.log(JSON.stringify(fields, null, 2));
```

Generate HWPX from Markdown:

```javascript
import { markdownToHwpx } from "kordoc";
import { writeFile } from "node:fs/promises";

const hwpx = await markdownToHwpx("# 제목\n\n본문\n\n| 항목 | 값 |\n| --- | --- |\n| 성명 | 홍길동 |");
await writeFile("출력.hwpx", Buffer.from(hwpx));
```

Compare two documents:

```javascript
import { compare } from "kordoc";
import { readFile } from "node:fs/promises";

const before = await readFile("이전버전.hwp");
const after = await readFile("최신버전.hwpx");
const diff = await compare(before, after);
console.log(diff.stats);
```

## Verification

After every conversion or generation:

- Confirm the output file exists and is non-empty.
- For Markdown, inspect that headings, body text, and tables are present.
- For JSON, check `success: true`, `blocks`, and `metadata`.
- For tables, inspect table blocks rather than trusting plain Markdown alignment.
- For generated HWPX, ask the user to open it in Hancom Hangul when exact rendering matters.
- For comparisons, report `added`, `removed`, and `modified` counts when available.

## Notes

- KORDOC can also parse PDF, Office, and image formats, but this skill should be invoked for Korean HWP-family documents first.
- HWPX is ZIP/XML-based and easier to repair manually than legacy binary HWP. For direct HWPX editing, prefer a dedicated HWPX-editing workflow and keep raw entries untouched when repacking.
- Encrypted, damaged, or distribution-restricted documents may parse partially or fail.
