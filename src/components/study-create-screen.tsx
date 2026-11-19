"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useAuth } from "@/components/auth-provider";
import { AppShell } from "@/components/mobile-shell";
import { usePrototype } from "@/components/prototype-provider";
import { markGroupHomeTourPending } from "@/lib/group-home-tour";
import { type CreateGroupInput } from "@/lib/mock-data";
import styles from "./study-create-screen.module.css";

const initialForm: CreateGroupInput = {
  name: "",
  subject: "",
  examDate: "",
  overallGoal: "",
};

export function StudyCreateScreen() {
  const { isAuthReady, sessionName } = useAuth();
  const { createGroup, currentUserId, isLoading, isMutating, error } = usePrototype();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<CreateGroupInput>(initialForm);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isSubmitting = isPending || isMutating;

  function handleChange<Key extends keyof CreateGroupInput>(
    key: Key,
    value: CreateGroupInput[Key],
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
    setErrorMessage(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || isLoading) {
      return;
    }

    setErrorMessage(null);

    try {
      const groupId = await createGroup(form);
      markGroupHomeTourPending(currentUserId, groupId);

      startTransition(() => {
        router.push(`/group/${groupId}`);
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "그룹 생성 중 오류가 발생했어요.",
      );
    }
  }

  if (!isAuthReady || !sessionName) {
    return (
      <AppShell showNavigation={false} headerVariant="capsule" title="새 스터디 그룹">
        {null}
      </AppShell>
    );
  }

  return (
    <main className={styles.screen}>
      <div className={styles.background} aria-hidden="true" />
      <div className={styles.content}>
        <header className={styles.header}>
          <Link href="/" className={styles.brand}>STUDY FLOW</Link>
          <h1>새 스터디 그룹</h1>
        </header>

        <section className={styles.card} aria-labelledby="create-group-heading">
          <h2 id="create-group-heading">기본 정보 입력</h2>
          <form className={styles.form} onSubmit={handleSubmit} aria-busy={isSubmitting}>
            <label className={styles.field}>
              <span>모임명</span>
              <span className={styles.inputRow}>
                <input
                  required
                  value={form.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                  placeholder="예: 알고리즘 기말 대비"
                  autoComplete="off"
                />
              </span>
            </label>

            <label className={styles.field}>
              <span>과목/주제</span>
              <span className={styles.inputRow}>
                <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 6c-3-2.5-6.5-3-10-2v16c3.5-1 7-.5 10 2 3-2.5 6.5-3 10-2V4c-3.5-1-7-.5-10 2Zm0 0v16" />
                </svg>
                <input
                  required
                  value={form.subject}
                  onChange={(event) => handleChange("subject", event.target.value)}
                  placeholder="예: 알고리즘"
                />
              </span>
            </label>

            <label className={styles.field}>
              <span>목표 날짜</span>
              <span className={styles.inputRow}>
                <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M7 2v6m10-6v6M3 10h18m-13 4h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
                </svg>
                <input
                  required
                  type="date"
                  value={form.examDate}
                  onChange={(event) => handleChange("examDate", event.target.value)}
                />
              </span>
            </label>

            <label className={styles.field}>
              <span>전체 목표</span>
              <span className={`${styles.inputRow} ${styles.goalRow}`}>
                <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.2 10.3a8.5 8.5 0 1 1-6.5-6.5M16.5 11a4.5 4.5 0 1 1-3.5-3.5M12 12l8-8m-4 0h4v4" />
                </svg>
                <textarea
                  required
                  rows={4}
                  value={form.overallGoal}
                  onChange={(event) => handleChange("overallGoal", event.target.value)}
                  placeholder="예: 기말고사 전까지 팀 전체가 핵심 문제를 안정적으로 설명하고 해결할 수 있는 상태 만들기"
                />
              </span>
            </label>

            {errorMessage || error ? (
              <p className={styles.error} role="alert">
                {errorMessage || error}
              </p>
            ) : null}

            {isLoading ? (
              <p className={styles.status} role="status">정보를 불러오고 있어요.</p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className={styles.submit}
            >
              {isSubmitting ? "모임 생성 중..." : "모임 생성하기"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
