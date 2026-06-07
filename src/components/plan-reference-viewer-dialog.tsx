"use client";

import Image from "next/image";

type PlanReferenceViewerDialogProps = {
  fileName: string;
  imageDataUrl: string;
  summary?: string;
  isOpen: boolean;
  onClose: () => void;
};

export function PlanReferenceViewerDialog({
  fileName,
  imageDataUrl,
  isOpen,
  onClose,
}: Readonly<PlanReferenceViewerDialogProps>) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/42 px-4">
      <div className="relative w-full max-w-[520px] overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="진도표 보기 닫기"
          className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/92 text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.08)] backdrop-blur-sm"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
            <path
              d="M6 6L18 18M18 6L6 18"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.8"
            />
          </svg>
        </button>

        <div className="bg-slate-50 px-4 py-4">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] border border-slate-200 bg-white">
            <Image
              fill
              unoptimized
              alt={fileName}
              className="object-contain"
              src={imageDataUrl}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
