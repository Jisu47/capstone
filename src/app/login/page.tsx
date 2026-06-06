"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { useAuth } from "@/components/auth-provider";

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
    await signOut();
  }

  if (!isAuthReady) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(121,184,149,0.12),_transparent_28%),linear-gradient(180deg,rgba(251,253,251,0.98),rgba(248,252,249,0.94))] px-4 py-12">
        <div className="w-full max-w-md rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-7 shadow-[0_18px_48px_rgba(121,184,149,0.12)] backdrop-blur">
          <p className="text-sm font-medium text-slate-600">로그인 상태를 확인하고 있어요.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(121,184,149,0.12),_transparent_28%),linear-gradient(180deg,rgba(251,253,251,0.98),rgba(248,252,249,0.94))] px-4 py-12">
      <div className="w-full max-w-md rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-7 shadow-[0_18px_48px_rgba(121,184,149,0.12)] backdrop-blur">
        <div className="mb-8 space-y-3">
          <span className="inline-flex rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
            Login
          </span>
          <div className="space-y-2">
            <h1 className="font-[family:var(--font-study-display)] text-[32px] leading-none tracking-[-0.05em] text-slate-950">
              로그인
            </h1>
            <p className="text-sm leading-6 text-slate-600">
              이메일과 비밀번호를 직접 확인한 뒤 들어가도록 로그인 흐름을 정리했어요.
            </p>
          </div>
        </div>

        {currentUser ? (
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
                className="inline-flex items-center justify-center rounded-[18px] bg-[var(--brand)] px-4 py-4 text-base font-semibold text-white shadow-[0_14px_28px_rgba(121,184,149,0.22)] transition hover:brightness-[0.98]"
              >
                계속하기
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleUseAnotherAccount();
                }}
                className="inline-flex items-center justify-center rounded-[18px] border border-slate-200 bg-white px-4 py-4 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                계정 바꾸기
              </button>
            </div>
          </div>
        ) : (
          <>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-800">이메일</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setErrorMessage(null);
                  }}
                  autoComplete="email"
                  required
                  placeholder="이메일을 입력해 주세요"
                  className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(121,184,149,0.16)]"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-800">비밀번호</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setErrorMessage(null);
                  }}
                  autoComplete="current-password"
                  required
                  placeholder="비밀번호를 입력해 주세요"
                  className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(121,184,149,0.16)]"
                />
              </label>

              {errorMessage ? (
                <p className="rounded-[14px] bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-[18px] bg-[var(--brand)] px-4 py-4 text-base font-semibold text-white shadow-[0_14px_28px_rgba(121,184,149,0.22)] transition hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[rgba(121,184,149,0.55)] disabled:shadow-none"
                disabled={isSubmitting}
              >
                {isSubmitting ? "로그인 중.." : "로그인"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              아직 회원이 아니신가요?{" "}
              <Link
                href="/signup"
                className="font-semibold text-[var(--brand)] transition hover:brightness-90"
              >
                회원가입
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
