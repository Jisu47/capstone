"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type RoleOption = "member" | "leader";

const roleOptions: Array<{
  value: RoleOption;
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [role, setRole] = useState<RoleOption>("member");
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);

  const passwordMismatch =
    passwordConfirm.trim().length > 0 && password !== passwordConfirm;

  function resetFeedback() {
    setFeedback(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedUsername = username.trim();

    if (!trimmedUsername || !password || !passwordConfirm) {
      setFeedback({
        type: "error",
        message: "모든 항목을 입력해 주세요.",
      });
      return;
    }

    if (password !== passwordConfirm) {
      setFeedback({
        type: "error",
        message: "비밀번호와 비밀번호 확인이 일치하지 않습니다.",
      });
      return;
    }

    setFeedback({
      type: "success",
      message: `${role === "leader" ? "팀장" : "팀원"} 계정 정보가 확인되었어요. 실제 회원가입 연동은 다음 단계에서 연결할 수 있어요.`,
    });
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
              스터디에 바로 참여할 수 있도록 계정 정보와 역할을 입력해 주세요.
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
                resetFeedback();
              }}
              autoComplete="username"
              required
              placeholder="아이디를 입력해 주세요"
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
                resetFeedback();
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
                resetFeedback();
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
                        ? "border-sky-500 bg-sky-50 shadow-[0_8px_20px_rgba(14,165,233,0.08)]"
                        : "border-slate-200 bg-white hover:border-sky-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={option.value}
                      checked={checked}
                      onChange={() => {
                        setRole(option.value);
                        resetFeedback();
                      }}
                      className="mt-1 h-4 w-4 border-slate-300 text-sky-600 focus:ring-sky-400"
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

          {feedback ? (
            <p
              className={`rounded-[14px] px-4 py-3 text-sm font-medium ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {feedback.message}
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
