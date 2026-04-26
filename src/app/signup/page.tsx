import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-[28px] border border-[var(--line)] bg-white/92 p-7 shadow-[0_18px_48px_rgba(18,35,61,0.12)] backdrop-blur">
        <span className="inline-flex rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Signup
        </span>

        <div className="mt-4 space-y-2">
          <h1 className="font-[family:var(--font-study-display)] text-[32px] leading-none tracking-[-0.05em] text-slate-950">
            회원가입 준비 중
          </h1>
          <p className="text-sm leading-6 text-slate-600">
            회원가입 기능은 곧 연결될 예정입니다. 지금은 로그인 화면으로 돌아가서
            프로토타입 흐름을 먼저 확인해 보세요.
          </p>
        </div>

        <div className="mt-6">
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-[18px] bg-slate-900 px-4 py-4 text-base font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
          >
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}
