import Link from "next/link";
import { SectionCard } from "@/components/mobile-shell";
import { formatExamDate, type StudyGroup } from "@/lib/mock-data";

export function CompletedGroupNotice({ group }: Readonly<{ group: StudyGroup }>) {
  return (
    <SectionCard title="운영이 종료된 그룹이에요">
      <p className="text-lg font-semibold text-slate-950">{group.name}</p>
      <p className="text-sm text-slate-500">마지막 목표 날짜 {formatExamDate(group.examDate)}</p>
      <p className="text-sm leading-6 text-slate-600">
        이 그룹은 보관되어 있어요. 그룹 목록의 ‘내 목록에서 숨기기’로 정리할 수 있어요.
        숨겨도 다른 팀원의 목록과 자료는 유지됩니다.
      </p>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center rounded-full bg-[var(--brand-soft)] px-4 text-sm font-semibold text-[var(--brand)]"
      >
        그룹 목록으로 돌아가기
      </Link>
    </SectionCard>
  );
}
