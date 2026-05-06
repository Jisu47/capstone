"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthReady, currentUser, signIn, resolvePostAuthPath } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthReady && currentUser) {
      router.replace(resolvePostAuthPath(currentUser));
    }
  }, [currentUser, isAuthReady, resolvePostAuthPath, router]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = signIn({
      username,
      password,
    });

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    setErrorMessage(null);
    router.replace(resolvePostAuthPath(result.user));
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
              가입한 아이디와 비밀번호를 입력하고 바로 내 페이지로 이동해 보세요.
            </p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">아이디</span>
            <input
              type="text"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setErrorMessage(null);
              }}
              autoComplete="username"
              required
              placeholder="아이디를 입력해 주세요"
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
            className="inline-flex w-full items-center justify-center rounded-[18px] bg-[var(--brand)] px-4 py-4 text-base font-semibold text-white shadow-[0_14px_28px_rgba(121,184,149,0.22)] transition hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
          >
            로그인
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
      </div>
    </main>
  );
}
