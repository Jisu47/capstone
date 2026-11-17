"use client";

import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { getGroupMembership } from "@/lib/group-membership";
import type { StudyGroup } from "@/lib/mock-data";
import type { LeaveGroupOptions } from "@/lib/prototype-repository";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function useHiddenStudyGroups(userId: string) {
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const pending = useRef(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result = await getSupabaseBrowserClient()
          .from("hidden_study_groups")
          .select("group_id")
          .eq("user_id", userId);
        if (result.error) throw result.error;
        if (!active) return;
        setHiddenIds(result.data.map((entry) => entry.group_id));
        setReady(true);
        setError(null);
      } catch {
        if (active) setError("숨긴 그룹을 불러오지 못했어요.");
      }
    }

    void load();
    return () => { active = false; };
  }, [userId, loadAttempt]);

  async function setHidden(groupId: string, hidden: boolean) {
    if (!ready || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(null);

    try {
      const entries = getSupabaseBrowserClient().from("hidden_study_groups");
      const result = hidden
        ? await entries.upsert({ user_id: userId, group_id: groupId }, {
            onConflict: "user_id,group_id",
            ignoreDuplicates: true,
          })
        : await entries.delete().eq("user_id", userId).eq("group_id", groupId);
      if (result.error) throw result.error;

      setHiddenIds((previous) => hidden
        ? [...new Set([...previous, groupId])]
        : previous.filter((id) => id !== groupId));
    } catch {
      setError("그룹의 표시 상태를 바꾸지 못했어요. 다시 시도해 주세요.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  function retry() {
    setError(null);
    setLoadAttempt((previous) => previous + 1);
  }

  return { hiddenIds, ready, busy, error, retry, setHidden };
}

export function GroupListMenu({
  title,
  groupName,
  onClick,
  disabled = false,
  destructive = false,
}: Readonly<{
  title: string;
  groupName: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative shrink-0"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (open && event.key === "Escape") {
          event.stopPropagation();
          setOpen(false);
          triggerRef.current?.focus();
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={`${groupName} 그룹 설정`}
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((previous) => !previous)}
        className="group grid size-10 cursor-pointer place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#27834F]"
      >
        <span className="grid size-7 place-items-center rounded-full bg-[#F3F6F3] text-[#536459] transition group-hover:bg-[#E8F2EA] group-aria-expanded:bg-[#E8F2EA] group-aria-expanded:text-[#205D40]">
          <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3h4l.6 2.5c.5.2 1 .5 1.4.8l2.5-.7 2 3.5-1.9 1.8a6 6 0 0 1 0 1.7l1.9 1.8-2 3.5-2.5-.7a7 7 0 0 1-1.4.8l-.6 2.5h-4l-.6-2.5a7 7 0 0 1-1.4-.8l-2.5.7-2-3.5 1.9-1.8a6 6 0 0 1 0-1.7L3.5 9.1l2-3.5 2.5.7c.4-.3.9-.6 1.4-.8L10 3Z" />
            <circle cx="12" cy="11.75" r="2.8" />
          </svg>
        </span>
      </button>
      {open && (
        <div id={menuId} className="absolute right-0 top-full z-20 w-max min-w-32 rounded-[12px] border border-[#E5E7E6] bg-white p-1 shadow-[0_6px_22px_rgba(32,54,42,0.12)]">
          <button
            type="button"
            aria-label={`${groupName} ${title}`}
            onClick={() => {
              triggerRef.current?.focus();
              setOpen(false);
              onClick();
            }}
            disabled={disabled}
            className={`min-h-9 w-full cursor-pointer rounded-[8px] px-3 text-left text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-offset-1 disabled:opacity-50 ${destructive ? "text-rose-700 hover:bg-rose-50" : "text-[#205D40] hover:bg-[#EEF7F1]"}`}
          >
            {title}
          </button>
        </div>
      )}
    </div>
  );
}

export function GroupLeaveDialog({
  group,
  userId,
  onClose,
  onLeave,
}: Readonly<{
  group: StudyGroup;
  userId: string;
  onClose: () => void;
  onLeave: (groupId: string, options?: LeaveGroupOptions) => Promise<void>;
}>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pending = useRef(false);
  const [nextLeaderId, setNextLeaderId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLeader = getGroupMembership(group, userId)?.role === "팀장";
  const others = group.members.filter((member) => member.id !== userId);
  const deleteIfSolo = isLeader && others.length === 0;
  const needsSuccessor = isLeader && !deleteIfSolo;

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || (needsSuccessor && !nextLeaderId)) return;
    pending.current = true;
    setBusy(true);
    setError(null);

    try {
      await onLeave(group.id, {
        nextLeaderId: needsSuccessor ? nextLeaderId : undefined,
        deleteIfSolo,
      });
      dialogRef.current?.close();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "다시 시도해 주세요.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="group-leave-title"
      aria-describedby="group-leave-description"
      onClose={(event) => { if (!event.currentTarget.open) onClose(); }}
      onCancel={(event) => { if (pending.current) event.preventDefault(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-[16px] border border-[#E5E7E6] bg-white p-6 text-[#242B27] backdrop:bg-black/35"
    >
      <form onSubmit={submit} className="space-y-4">
        <h2 id="group-leave-title" className="text-lg font-semibold">
          {deleteIfSolo ? "그룹을 삭제할까요?" : "그룹에서 탈퇴할까요?"}
        </h2>
        <p className="break-words text-sm font-semibold">{group.name}</p>
        <p id="group-leave-description" className="text-sm leading-6 text-[#535D56]">
          {deleteIfSolo
            ? "혼자 남은 팀장이 그룹을 삭제하면 이 그룹의 계획, 자료 기록, 초대 코드가 사라져요."
            : `${needsSuccessor ? "새 팀장을 지정해 주세요. " : ""}탈퇴하면 이 그룹에 접근할 수 없고, 이 그룹에서 작성한 개인 학습 기록이 사라져요.`}
        </p>
        {needsSuccessor && (
          <label className="block space-y-2 text-sm font-semibold">
            <span>새 팀장</span>
            <select
              value={nextLeaderId}
              onChange={(event) => setNextLeaderId(event.target.value)}
              required
              disabled={busy}
              className="block min-h-11 w-full rounded-[10px] border border-[#E5E7E6] bg-white px-3"
            >
              <option value="">팀원을 선택해 주세요</option>
              {others.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
            </select>
          </label>
        )}
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => dialogRef.current?.close()}
            className="min-h-11 rounded-[10px] border border-[#E5E7E6] px-2 text-sm font-semibold"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={busy || (needsSuccessor && !nextLeaderId)}
            className="min-h-11 rounded-[10px] bg-rose-700 px-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "처리 중" : deleteIfSolo ? "그룹 삭제" : "탈퇴하기"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
