"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthReady, currentUser, signIn, resolvePostAuthPath } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthReady && currentUser) {
      router.replace(resolvePostAuthPath(currentUser));
    }
  }, [currentUser, isAuthReady, resolvePostAuthPath, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-[28px] border border-[var(--line)] bg-white/92 p-7 shadow-[0_18px_48px_rgba(18,35,61,0.12)] backdrop-blur">
        <div className="mb-8 space-y-3">
          <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Login
          </span>
          <div className="space-y-2">
            <h1 className="font-[family:var(--font-study-display)] text-[32px] leading-none tracking-[-0.05em] text-slate-950">
              로그인
            </h1>
            <p className="text-sm leading-6 text-slate-600">
              가입한 이메일과 비밀번호를 입력하고 바로 내 페이지로 이동해 보세요.
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
              autoComplete="current-password"
              required
              placeholder="비밀번호를 입력해 주세요"
              className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            />
          </label>

          {errorMessage ? (
            <p className="rounded-[14px] bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-[18px] bg-sky-600 px-4 py-4 text-base font-semibold text-white shadow-[0_14px_28px_rgba(2,132,199,0.22)] transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
          >
            로그인
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          아직 회원이 아니신가요?{" "}
          <Link
            href="/signup"
            className="font-semibold text-sky-700 transition hover:text-sky-800"
          >
            회원가입
          </Link>
        </p>
      </div>
    </main>
  );
}
