"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { usePrototype } from "@/components/prototype-provider";
import {
  currentUserId,
  type GroupDetailsInput,
  type StudyGroup,
  formatExamDate,
  getCompletedCount,
  getDaysLeft,
  getGroupProgress,
  getMemberProgress,
} from "@/lib/mock-data";

type StudyHubProps = {
  group: StudyGroup;
  groups: StudyGroup[];
};

function getRelativeExamText(dateString: string) {
  const daysLeft = getDaysLeft(dateString);
  return daysLeft === 0 ? "D-day" : `D-${daysLeft}`;
}

function formatOptionalDate(dateString: string | null) {
  return dateString ? formatExamDate(dateString) : "미정";
}

function createFormState(group: StudyGroup): GroupDetailsInput {
  return {
    name: group.name,
    subject: group.subject,
    examDate: group.examDate,
    presentationDate: group.presentationDate ?? "",
    deadlineDate: group.deadlineDate ?? "",
    weeklyGoal: group.weeklyGoal,
    overallGoal: group.overallGoal,
  };
}

function Panel({
  title,
  action,
  children,
}: Readonly<{
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}>) {
  return (
    <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_18px_60px_rgba(28,64,120,0.08)] backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-slate-900">{title}</h2>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  helper,
}: Readonly<{
  label: string;
  value: string;
  helper: string;
}>) {
  return (
    <div className="rounded-[24px] border border-white/70 bg-white/80 p-3">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-950">{value}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">{helper}</p>
    </div>
  );
}

function InfoCard({
  label,
  value,
  helper,
}: Readonly<{
  label: string;
  value: string;
  helper?: string;
}>) {
  return (
    <div className="rounded-[24px] border border-white/70 bg-white/80 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{value}</p>
      {helper ? <p className="mt-2 text-xs leading-5 text-[var(--ink-soft)]">{helper}</p> : null}
    </div>
  );
}

function MemberProgressBar({ value }: Readonly<{ value: number }>) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,#2f6ee5,#73a3ff)] transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function StudyHub({ group, groups }: Readonly<StudyHubProps>) {
  const { updateGroupDetails, isMutating } = usePrototype();
  const [form, setForm] = useState<GroupDetailsInput>(() => createFormState(group));
  const [isEditing, setIsEditing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const myRemainingCount = group.plan.filter((item) => !item.memberStatus[currentUserId]).length;
  const myProgress = getMemberProgress(group, currentUserId);
  const groupProgress = getGroupProgress(group);
  const daysLeft = getDaysLeft(group.examDate);
  const inviteLink = `/group/${group.id}`;

  function focusEditor() {
    setForm(createFormState(group));
    setIsEditing(true);
    setLocalError(null);
    setCopied(false);

    window.setTimeout(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function handleChange<Key extends keyof GroupDetailsInput>(
    key: Key,
    value: GroupDetailsInput[Key],
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim() || !form.subject.trim() || !form.examDate || !form.weeklyGoal.trim() || !form.overallGoal.trim()) {
      setLocalError("모임명, 과목/주제, 시험일, 이번 주 목표, 전체 목표는 필수입니다.");
      return;
    }

    try {
      await updateGroupDetails(group.id, form);
      setLocalError(null);
      setIsEditing(false);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "스터디 정보를 저장하지 못했습니다.");
    }
  }

  async function handleCopyInvite() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/group/${group.id}`);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 1600);
    } catch {
      setLocalError("초대 링크를 복사하지 못했습니다. 브라우저 권한을 확인해주세요.");
    }
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[32px] bg-[linear-gradient(145deg,#fdfefe_0%,#eef4ff_48%,#d8e6ff_100%)] p-5 shadow-[0_20px_80px_rgba(17,50,99,0.12)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
                Study Hub
              </span>
              <span className="rounded-full bg-[var(--brand)] px-3 py-1 text-xs font-semibold text-white">
                {getRelativeExamText(group.examDate)}
              </span>
            </div>
            <h2 className="mt-3 text-[26px] font-semibold tracking-[-0.05em] text-slate-950">
              {group.name}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
              {group.subject} · 시험일까지 {daysLeft === 0 ? "오늘" : `${daysLeft}일`} 남았습니다.
            </p>
          </div>

          <Link
            href="/create"
            className="inline-flex shrink-0 rounded-2xl border border-white/80 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm"
          >
            새 모임 만들기
          </Link>
        </div>

        {groups.length > 1 ? (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {groups.map((candidate) => {
              const active = candidate.id === group.id;

              return (
                <Link
                  key={candidate.id}
                  href={`/group/${candidate.id}/study`}
                  className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition ${
                    active
                      ? "bg-[var(--brand)] text-white shadow-[0_12px_28px_rgba(47,110,229,0.24)]"
                      : "bg-white/80 text-slate-600"
                  }`}
                >
                  {candidate.name}
                </Link>
              );
            })}
          </div>
        ) : null}
      </section>

      <Panel title="모임 개요">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="팀원 수"
            value={`${group.members.length}명`}
            helper="공동 목표와 일정 기준으로 함께 움직이는 인원"
          />
          <MetricCard
            label="전체 진행률"
            value={`${groupProgress}%`}
            helper="계획 항목 완료 체크 기준"
          />
          <MetricCard
            label="내 진행률"
            value={`${myProgress}%`}
            helper={`${getCompletedCount(group, currentUserId)}개 완료`}
          />
          <MetricCard
            label="남은 할 일"
            value={`${myRemainingCount}개`}
            helper="계획 탭에서 이어서 체크 가능"
          />
        </div>

        <div className="rounded-[24px] border border-white/70 bg-white/75 p-4">
          <div className="grid gap-3 text-sm text-slate-700">
            <div className="flex items-start justify-between gap-3">
              <span className="text-slate-500">모임명</span>
              <span className="text-right font-semibold text-slate-900">{group.name}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-slate-500">과목/주제</span>
              <span className="text-right font-semibold text-slate-900">{group.subject}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-slate-500">시험일</span>
              <span className="text-right font-semibold text-slate-900">{formatExamDate(group.examDate)}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-slate-500">발표 일정</span>
              <span className="text-right font-semibold text-slate-900">
                {formatOptionalDate(group.presentationDate)}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-slate-500">마감일</span>
              <span className="text-right font-semibold text-slate-900">
                {formatOptionalDate(group.deadlineDate)}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-slate-500">최근 업데이트</span>
              <span className="text-right font-semibold text-slate-900">{group.recentUpdate}</span>
            </div>
          </div>
        </div>
      </Panel>

      <Panel
        title="일정 및 목표"
        action={
          <button
            type="button"
            onClick={focusEditor}
            className="text-sm font-semibold text-[var(--brand)]"
          >
            수정
          </button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoCard
            label="시험 일정"
            value={formatExamDate(group.examDate)}
            helper="계획 탭의 주간 우선순위와 D-day 기준으로 사용됩니다."
          />
          <InfoCard
            label="발표 일정"
            value={formatOptionalDate(group.presentationDate)}
            helper="발표형 스터디라면 마감 전 체크 포인트로 연결됩니다."
          />
          <InfoCard
            label="마감 일정"
            value={formatOptionalDate(group.deadlineDate)}
            helper="발제문, 팀 과제, 제출 일정과 자연스럽게 연결됩니다."
          />
          <InfoCard
            label="이번 주 목표"
            value={group.weeklyGoal}
            helper="이번 주 체크할 학습 범위와 완료 흐름의 기준입니다."
          />
          <InfoCard
            label="전체 목표"
            value={group.overallGoal}
            helper="스터디가 시험일까지 어떤 상태를 만들지 정의합니다."
          />
        </div>

        <div className="rounded-[24px] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(233,241,255,0.68),rgba(255,255,255,0.92))] p-4">
          <p className="text-sm font-semibold text-slate-900">계획 탭 연동 기준</p>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
            시험일, 이번 주 목표, 전체 목표는 이후 계획 생성과 주간 체크 흐름의 기준 데이터입니다.
          </p>
        </div>

        <div ref={editorRef} className="rounded-[26px] border border-dashed border-[var(--brand)] bg-white/85 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">스터디 정보 수정</p>
              <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">
                수정된 값은 Supabase `study_groups`에 바로 저장됩니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setForm(createFormState(group));
                setIsEditing(false);
                setLocalError(null);
              }}
              className="text-xs font-semibold text-slate-500"
            >
              초기화
            </button>
          </div>

          {localError ? (
            <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {localError}
            </div>
          ) : null}

          {!isEditing ? (
            <button
              type="button"
              onClick={focusEditor}
              className="w-full rounded-2xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(47,110,229,0.24)]"
            >
              일정과 목표 수정 열기
            </button>
          ) : (
            <form className="space-y-3" onSubmit={handleSubmit}>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-800">모임명</span>
                <input
                  required
                  value={form.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-800">과목/주제</span>
                <input
                  required
                  value={form.subject}
                  onChange={(event) => handleChange("subject", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-800">시험일</span>
                  <input
                    required
                    type="date"
                    value={form.examDate}
                    onChange={(event) => handleChange("examDate", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-800">발표 일정</span>
                  <input
                    type="date"
                    value={form.presentationDate}
                    onChange={(event) => handleChange("presentationDate", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-800">마감일</span>
                <input
                  type="date"
                  value={form.deadlineDate}
                  onChange={(event) => handleChange("deadlineDate", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-800">이번 주 목표</span>
                <textarea
                  required
                  rows={3}
                  value={form.weeklyGoal}
                  onChange={(event) => handleChange("weeklyGoal", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-800">전체 목표</span>
                <textarea
                  required
                  rows={3}
                  value={form.overallGoal}
                  onChange={(event) => handleChange("overallGoal", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)]"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setForm(createFormState(group));
                    setIsEditing(false);
                    setLocalError(null);
                  }}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isMutating}
                  className="rounded-2xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(47,110,229,0.24)] disabled:opacity-70"
                >
                  {isMutating ? "저장 중..." : "변경 저장"}
                </button>
              </div>
            </form>
          )}
        </div>
      </Panel>

      <Panel title="팀원 관리" action={<span className="text-xs text-slate-500">요약 보기</span>}>
        {group.members.map((member) => {
          const progress = getMemberProgress(group, member.id);
          const completedCount = getCompletedCount(group, member.id);
          const isCurrentUser = member.id === currentUserId;

          return (
            <div key={member.id} className="rounded-[24px] border border-white/70 bg-white/80 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700">
                    {member.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {member.name}
                      {isCurrentUser ? (
                        <span className="ml-2 rounded-full bg-[var(--brand-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--brand)]">
                          나
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">
                      {member.role} · {member.focus}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-[var(--brand)]">{progress}%</p>
                  <p className="text-[11px] text-slate-500">
                    {completedCount}/{group.plan.length} 완료
                  </p>
                </div>
              </div>

              <MemberProgressBar value={progress} />
            </div>
          );
        })}

        <div className="rounded-[24px] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(233,241,255,0.72),rgba(255,255,255,0.92))] p-4">
          <p className="text-sm font-semibold text-slate-900">초대 링크</p>
          <p className="mt-2 break-all text-xs leading-5 text-[var(--ink-soft)]">{inviteLink}</p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={handleCopyInvite}
              className="flex-1 rounded-2xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(47,110,229,0.24)]"
            >
              {copied ? "복사 완료" : "초대 링크 복사"}
            </button>
            <Link
              href={`/group/${group.id}/plan`}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700"
            >
              계획 탭 보기
            </Link>
          </div>
        </div>
      </Panel>

      <Panel title="빠른 액션">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={focusEditor}
            className="rounded-[24px] border border-white/70 bg-white/80 px-4 py-4 text-left transition hover:bg-white"
          >
            <p className="text-sm font-semibold text-slate-900">시험 일정 수정</p>
            <p className="mt-2 text-xs leading-5 text-[var(--ink-soft)]">
              계획 생성 기준이 되는 날짜를 바로 업데이트합니다.
            </p>
          </button>

          <button
            type="button"
            onClick={focusEditor}
            className="rounded-[24px] border border-white/70 bg-white/80 px-4 py-4 text-left transition hover:bg-white"
          >
            <p className="text-sm font-semibold text-slate-900">목표 수정</p>
            <p className="mt-2 text-xs leading-5 text-[var(--ink-soft)]">
              이번 주 목표와 전체 목표를 함께 조정합니다.
            </p>
          </button>

          <button
            type="button"
            onClick={handleCopyInvite}
            className="rounded-[24px] border border-white/70 bg-white/80 px-4 py-4 text-left transition hover:bg-white"
          >
            <p className="text-sm font-semibold text-slate-900">팀원 초대</p>
            <p className="mt-2 text-xs leading-5 text-[var(--ink-soft)]">
              현재 모임 링크를 복사해 팀원에게 바로 공유합니다.
            </p>
          </button>

          <Link
            href={`/group/${group.id}/plan`}
            className="rounded-[24px] border border-[var(--brand)] bg-[linear-gradient(180deg,rgba(233,241,255,0.72),rgba(255,255,255,0.92))] px-4 py-4 text-left transition hover:bg-white"
          >
            <p className="text-sm font-semibold text-slate-900">계획 보러 가기</p>
            <p className="mt-2 text-xs leading-5 text-[var(--ink-soft)]">
              일정과 목표를 반영한 주간 계획 화면으로 이동합니다.
            </p>
          </Link>
        </div>
      </Panel>
    </div>
  );
}
