"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";

export default function SignupPage() {
  const router = useRouter();
  const { isAuthReady, currentUser, signUp, resolvePostAuthPath } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passwordMismatch =
    passwordConfirm.trim().length > 0 && password !== passwordConfirm;

  useEffect(() => {
    if (isAuthReady && currentUser) {
      router.replace(resolvePostAuthPath(currentUser));
    }
  }, [currentUser, isAuthReady, resolvePostAuthPath, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password || !passwordConfirm) {
      setErrorMessage("모든 항목을 입력해 주세요.");
      return;
    }

    if (password !== passwordConfirm) {
      setErrorMessage("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    const result = await signUp({
      email,
      password,
    });

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    setErrorMessage(null);
    router.replace("/group-setup");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-[28px] border border-[var(--line)] bg-white/92 p-7 shadow-[0_18px_48px_rgba(18,35,61,0.12)] backdrop-blur">
        <div className="mb-8 space-y-3">
          <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Sign Up
          </span>
          <div className="space-y-2">
            <h1 className="font-[family:var(--font-study-display)] text-[32px] leading-none tracking-[-0.05em] text-slate-950">
              회원가입
            </h1>
            <p className="text-sm leading-6 text-slate-600">
              이메일로 계정을 만들면 다음 단계에서 그룹을 만들거나 참여할 수 있어요.
            </p>
          </div>
        </div>

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
              className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
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
              autoComplete="new-password"
              required
              placeholder="비밀번호를 입력해 주세요"
              className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">비밀번호 확인</span>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(event) => {
                setPasswordConfirm(event.target.value);
                setErrorMessage(null);
              }}
              autoComplete="new-password"
              required
              aria-invalid={passwordMismatch}
              placeholder="비밀번호를 다시 입력해 주세요"
              className={`w-full rounded-[16px] border bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                passwordMismatch
                  ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
                  : "border-slate-200 focus:border-sky-500 focus:ring-sky-100"
              }`}
            />
          </label>

          {passwordMismatch ? (
            <p className="text-sm font-medium text-rose-600">
              비밀번호와 비밀번호 확인이 일치하지 않습니다.
            </p>
          ) : null}

          {errorMessage ? (
            <p className="rounded-[14px] bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-[18px] bg-sky-600 px-4 py-4 text-base font-semibold text-white shadow-[0_14px_28px_rgba(2,132,199,0.22)] transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-sky-300 disabled:shadow-none"
            disabled={passwordMismatch}
          >
            회원가입
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          이미 계정이 있으신가요?{" "}
          <Link
            href="/login"
            className="font-semibold text-sky-700 transition hover:text-sky-800"
          >
            로그인
          </Link>
        </p>
      </div>
    </main>
  );
}
