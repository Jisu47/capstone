"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth, type UserRole } from "@/components/auth-provider";

const roleOptions: Array<{
  value: UserRole;
  label: string;
  description: string;
}> = [
  {
    value: "member",
    label: "팀원",
    description: "스터디에 참여하고 자료와 진도를 함께 정리해요.",
  },
  {
    value: "leader",
    label: "팀장",
    description: "스터디를 만들고 일정과 계획을 주도해요.",
  },
];

export default function SignupPage() {
  const router = useRouter();
  const { isAuthReady, currentUser, signUp, resolvePostAuthPath } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passwordMismatch =
    passwordConfirm.trim().length > 0 && password !== passwordConfirm;

  useEffect(() => {
    if (isAuthReady && currentUser) {
      router.replace(resolvePostAuthPath(currentUser));
    }
  }, [currentUser, isAuthReady, resolvePostAuthPath, router]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!username.trim() || !password || !passwordConfirm) {
      setErrorMessage("모든 항목을 입력해 주세요.");
      return;
    }

    if (password !== passwordConfirm) {
      setErrorMessage("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    const result = signUp({
      username,
      password,
      role,
    });

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    setErrorMessage(null);
    router.replace("/group-setup");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(121,184,149,0.12),_transparent_28%),linear-gradient(180deg,rgba(251,253,251,0.98),rgba(248,252,249,0.94))] px-4 py-12">
      <div className="w-full max-w-md rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-7 shadow-[0_18px_48px_rgba(121,184,149,0.12)] backdrop-blur">
        <div className="mb-8 space-y-3">
          <span className="inline-flex rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
            Sign Up
          </span>
          <div className="space-y-2">
            <h1 className="font-[family:var(--font-study-display)] text-[32px] leading-none tracking-[-0.05em] text-slate-950">
              회원가입
            </h1>
            <p className="text-sm leading-6 text-slate-600">
              역할을 선택하고 계정을 만들면 다음 단계에서 그룹 설정으로 이동해요.
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
              autoComplete="new-password"
              required
              placeholder="비밀번호를 입력해 주세요"
              className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(121,184,149,0.16)]"
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
                  : "border-slate-200 focus:border-[var(--brand)] focus:ring-[rgba(121,184,149,0.16)]"
              }`}
            />
          </label>

          {passwordMismatch ? (
            <p className="text-sm font-medium text-rose-600">
              비밀번호와 비밀번호 확인이 일치하지 않습니다.
            </p>
          ) : null}

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-slate-800">역할 선택</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {roleOptions.map((option) => {
                const checked = role === option.value;

                return (
                  <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-[18px] border px-4 py-4 transition ${
                    checked
                      ? "border-[var(--brand)] bg-[var(--brand-soft)] shadow-[0_8px_20px_rgba(121,184,149,0.10)]"
                      : "border-slate-200 bg-white hover:border-[rgba(121,184,149,0.34)]"
                  }`}
                >
                    <input
                      type="radio"
                      name="role"
                      value={option.value}
                      checked={checked}
                      onChange={() => {
                        setRole(option.value);
                        setErrorMessage(null);
                      }}
                      className="mt-1 h-4 w-4 border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]"
                    />
                    <span className="space-y-1">
                      <span className="block text-sm font-semibold text-slate-900">
                        {option.label}
                      </span>
                      <span className="block text-xs leading-5 text-slate-500">
                        {option.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {errorMessage ? (
            <p className="rounded-[14px] bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-[18px] bg-[var(--brand)] px-4 py-4 text-base font-semibold text-white shadow-[0_14px_28px_rgba(121,184,149,0.22)] transition hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[rgba(121,184,149,0.55)] disabled:shadow-none"
            disabled={passwordMismatch}
          >
            회원가입
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          이미 계정이 있으신가요?{" "}
          <Link
            href="/login"
            className="font-semibold text-[var(--brand)] transition hover:brightness-90"
          >
            로그인
          </Link>
        </p>
      </div>
    </main>
  );
}
