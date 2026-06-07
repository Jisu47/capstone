"use client";

import { useMemo, useState } from "react";

type StudyRulesModalProps = {
  canEdit: boolean;
  isOpen: boolean;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (rules: string[]) => Promise<void> | void;
  startInEditMode?: boolean;
  studyRules: string[];
};

function normalizeDraftLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6);
}

export function StudyRulesModal({
  canEdit,
  isOpen,
  isSaving = false,
  onClose,
  onSave,
  startInEditMode = false,
  studyRules,
}: Readonly<StudyRulesModalProps>) {
  const normalizedRules = useMemo(
    () => studyRules.map((rule) => rule.trim()).filter(Boolean),
    [studyRules],
  );
  const [isEditMode, setIsEditMode] = useState(startInEditMode);
  const [draftText, setDraftText] = useState(normalizedRules.join("\n"));

  if (!isOpen) {
    return null;
  }

  async function handleSave() {
    const nextRules = normalizeDraftLines(draftText);
    if (nextRules.length === 0) {
      return;
    }

    await onSave(nextRules);
    setIsEditMode(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/24 px-6">
      <div className="w-full max-w-[360px] rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_16px_34px_rgba(15,23,42,0.12)]">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-base font-semibold text-slate-900">스터디 규칙</p>
            <p className="text-sm leading-6 text-slate-500">
              함께 공부할 때 계속 지키고 싶은 기준을 정리해둘 수 있어요.
            </p>
          </div>
          {canEdit && !isEditMode ? (
            <button
              type="button"
              onClick={() => setIsEditMode(true)}
              className="shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-[13px] font-semibold text-[var(--brand)]"
            >
              수정하기
            </button>
          ) : null}
        </div>

        {isEditMode ? (
          <div className="mt-4 space-y-3">
            <textarea
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
              rows={6}
              className="w-full rounded-[14px] border border-slate-200 px-4 py-3 text-[13px] leading-6 text-slate-900 outline-none transition focus:border-[var(--brand)]"
              placeholder={"규칙을 한 줄에 하나씩 입력해 주세요."}
            />
            <p className="text-[11px] text-slate-400">최대 6개까지 저장할 수 있어요.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-2.5">
            {normalizedRules.map((rule, index) => (
              <div key={`${rule}-${index + 1}`} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EAF7EE] text-[#48A96D]">
                  <svg aria-hidden="true" className="h-3 w-3" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M5 12.5L9.5 17L19 7.5"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </span>
                <p className="text-[13px] leading-6 text-slate-700">{rule}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => {
              setIsEditMode(false);
              onClose();
            }}
            className="flex-1 rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
          >
            닫기
          </button>
          {canEdit && isEditMode ? (
            <button
              type="button"
              onClick={() => {
                void handleSave();
              }}
              disabled={isSaving || normalizeDraftLines(draftText).length === 0}
              className="flex-1 rounded-[14px] bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
            >
              {isSaving ? "저장 중..." : "저장하기"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
