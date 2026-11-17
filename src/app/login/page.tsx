"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import styles from "./login.module.css";

function Sprout({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 44 38"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M25 36c-2.6-5.7-4.1-11.4-4.3-17.6M20.8 22.6C14 29 6.9 27.3 2.4 18.5c8.4-4.6 14.9-3 18.4 4.1ZM21.4 22.1C20.6 10 28.7 2.9 40.8 1.5c-.1 11.3-7.5 19.9-19.4 20.6Z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const {
    isAuthReady,
    currentUser,
    signIn,
    signOut,
    resolvePostAuthPath,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signIn({
        email,
        password,
      });

      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }

      setErrorMessage(null);
      router.replace(resolvePostAuthPath(result.user));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUseAnotherAccount() {
    setErrorMessage(null);
    setEmail("");
    setPassword("");
    setShowPassword(false);
    await signOut();
  }

  return (
    <main className={styles.screen}>
      <Sprout className={styles.bottomSprout} />
      <div className={styles.stage}>
        <div className={styles.orbit} aria-hidden="true" />
        <div className={styles.rays} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <section className={styles.card} aria-labelledby="login-title">
          <Sprout className={styles.cardSprout} />
          <header className={styles.header}>
            <span className={styles.badge} lang="en">LOGIN</span>
            <h1 id="login-title">로그인</h1>
            <p>이메일과 비밀번호를 직접 확인한 뒤 들어가도록 로그인 흐름을 정리했어요.</p>
          </header>

          {!isAuthReady ? (
            <p className={styles.status} role="status">로그인 상태를 확인하고 있어요.</p>
          ) : currentUser ? (
            <div className="space-y-4">
              <div className="rounded-[20px] border border-[rgba(121,184,149,0.16)] bg-[linear-gradient(180deg,#ffffff,#f7fbf8)] p-5">
                <p className="text-sm font-semibold text-slate-900">
                  현재 {currentUser.displayName} 계정으로 로그인되어 있어요.
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  그대로 계속하거나, 다른 계정으로 로그인하려면 먼저 이 세션을 바꿔주세요.
                </p>
                <p className="mt-3 rounded-[14px] bg-white px-4 py-3 text-sm text-slate-500">
                  {currentUser.email}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => router.replace(resolvePostAuthPath(currentUser))}
                  className={styles.primary}
                >
                  계속하기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleUseAnotherAccount();
                  }}
                  className={styles.secondary}
                >
                  계정 바꾸기
                </button>
              </div>
            </div>
          ) : (
            <>
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.field}>
                  <label htmlFor="login-email">이메일</label>
                  <div className={styles.inputRow}>
                    <svg className={styles.fieldIcon} aria-hidden="true" viewBox="0 0 24 24">
                      <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
                      <path d="m3 7 9 7 9-7" />
                    </svg>
                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setErrorMessage(null);
                      }}
                      autoComplete="email"
                      required
                      placeholder="이메일을 입력해 주세요"
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label htmlFor="login-password">비밀번호</label>
                  <div className={styles.inputRow}>
                    <svg className={styles.fieldIcon} aria-hidden="true" viewBox="0 0 24 24">
                      <rect x="4.5" y="10" width="15" height="11" rx="2" />
                      <path d="M8 10V7a4 4 0 1 1 8 0v3m-4 4v3" />
                    </svg>
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setErrorMessage(null);
                      }}
                      autoComplete="current-password"
                      required
                      placeholder="비밀번호를 입력해 주세요"
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
                      onClick={() => setShowPassword((visible) => !visible)}
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="2.6" />
                        {!showPassword && <path d="m3 3 18 18" />}
                      </svg>
                    </button>
                  </div>
                </div>

                {errorMessage ? (
                  <p className={styles.error} role="alert">
                    {errorMessage}
                  </p>
                ) : null}

                <button
                  type="submit"
                  className={styles.primary}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "로그인 중.." : "로그인"}
                  <span aria-hidden="true">→</span>
                </button>
              </form>

              <p className={styles.signup}>
                아직 회원이 아니신가요?{" "}
                <Link href="/signup">회원가입</Link>
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
