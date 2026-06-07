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
  summary,
  isOpen,
  onClose,
}: Readonly<PlanReferenceViewerDialogProps>) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/42 px-4">
      <div className="w-full max-w-[520px] overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-950">{fileName}</p>
            {summary ? (
              <p className="mt-1 text-sm leading-6 text-slate-500">{summary}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
          >
            닫기
          </button>
        </div>

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
