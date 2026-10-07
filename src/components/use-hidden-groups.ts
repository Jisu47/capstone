"use client";

import { useEffect, useRef, useState } from "react";
import { loadHiddenGroupIds, saveGroupHidden } from "@/lib/hidden-groups";

export function useHiddenGroups(userId: string) {
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const savingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void loadHiddenGroupIds(userId).then(
      (ids) => {
        if (cancelled) return;
        setHiddenIds(ids);
        setIsReady(true);
        setError(null);
      },
      (reason: unknown) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "숨긴 그룹을 불러오지 못했어요.");
        }
      },
    );
    return () => { cancelled = true; };
  }, [userId, reloadVersion]);

  function reload() {
    if (savingRef.current) return;
    setError(null);
    setIsReady(false);
    setReloadVersion((version) => version + 1);
  }

  async function setHidden(groupId: string, hidden: boolean) {
    if (!isReady || savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      const ids = await saveGroupHidden(userId, groupId, hidden);
      setHiddenIds(ids);
      setNotice(hidden ? "내 목록에서 숨겼어요. 숨긴 그룹에서 다시 표시할 수 있어요." : "그룹을 다시 표시했어요.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "그룹 표시 설정을 저장하지 못했어요.");
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }

  return { hiddenIds, isReady, isSaving, error, notice, reload, setHidden };
}
