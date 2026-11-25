import "server-only";

// Never log error messages, filenames, paths, document contents or credentials.
export function logMaterialStep(stage: string, status: "ok" | "error", error?: unknown) {
  let type = "unknown";
  if (status === "error" && error instanceof Error) {
    if (/텍스트를 추출하지 못했어요/.test(error.message)) type = "empty_text";
    else if (/worker/i.test(error.message)) type = "pdf_worker";
    else if (error.name === "PasswordException") type = "password_protected";
    else if (error.name === "InvalidPDFException") type = "invalid_pdf";
    else if (error.name === "AbortError" || error.name === "TimeoutError") type = "timeout";
    else if (error.name === "TypeError") type = "type_error";
    else type = "error";
  }
  const entry = { stage, status, ...(status === "error" ? { type } : {}) };
  if (status === "error") console.error("[material-diagnostics]", entry);
  else console.info("[material-diagnostics]", entry);
}
