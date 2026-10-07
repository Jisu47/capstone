import Link from "next/link";

type ButtonSize = {
  key: "sm" | "md" | "lg";
  label: string;
  className: string;
  height: string;
  horizontalPadding: string;
  fontSize: string;
  fontWeight: string;
  radius: string;
};

type ButtonVariant = {
  key: "primary" | "secondary" | "ghost" | "danger";
  label: string;
  className: string;
  hoverClassName: string;
  disabledClassName: string;
};

type PreviewState = {
  key: "default" | "hover" | "disabled";
  label: string;
  description: string;
};

const baseButtonClass =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(121,184,149,0.36)] focus-visible:ring-offset-2";

const buttonSizes: ButtonSize[] = [
  {
    key: "sm",
    label: "sm",
    className: "h-8 px-3 text-xs font-semibold rounded-full",
    height: "32px",
    horizontalPadding: "12px",
    fontSize: "12px",
    fontWeight: "600",
    radius: "9999px",
  },
  {
    key: "md",
    label: "md",
    className: "h-11 px-4 text-sm font-semibold rounded-[14px]",
    height: "44px",
    horizontalPadding: "16px",
    fontSize: "14px",
    fontWeight: "600",
    radius: "14px",
  },
  {
    key: "lg",
    label: "lg",
    className: "h-[52px] px-5 text-base font-semibold rounded-[18px]",
    height: "52px",
    horizontalPadding: "20px",
    fontSize: "16px",
    fontWeight: "600",
    radius: "18px",
  },
];

const buttonVariants: ButtonVariant[] = [
  {
    key: "primary",
    label: "primary",
    className:
      "bg-[var(--brand)] text-white shadow-[0_12px_24px_rgba(121,184,149,0.20)] hover:brightness-[0.98]",
    hoverClassName: "brightness-[0.98] shadow-[0_14px_28px_rgba(121,184,149,0.26)]",
    disabledClassName: "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
  },
  {
    key: "secondary",
    label: "secondary",
    className:
      "border border-slate-200 bg-white text-slate-700 shadow-[0_6px_16px_rgba(15,23,42,0.05)] hover:bg-slate-50",
    hoverClassName: "bg-slate-50 border-slate-300",
    disabledClassName: "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
  },
  {
    key: "ghost",
    label: "ghost",
    className: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    hoverClassName: "bg-slate-100 text-slate-900",
    disabledClassName: "disabled:cursor-not-allowed disabled:opacity-45",
  },
  {
    key: "danger",
    label: "danger",
    className: "bg-rose-600 text-white shadow-[0_10px_22px_rgba(225,29,72,0.16)] hover:bg-rose-700",
    hoverClassName: "bg-rose-700 shadow-[0_12px_26px_rgba(225,29,72,0.22)]",
    disabledClassName: "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
  },
];

const previewStates: PreviewState[] = [
  {
    key: "default",
    label: "default",
    description: "기본 상태",
  },
  {
    key: "hover",
    label: "hover preview",
    description: "hover 효과를 강제로 입힌 비교용 상태",
  },
  {
    key: "disabled",
    label: "disabled",
    description: "비활성 상태",
  },
];

function combineClasses(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getPreviewClassName(size: ButtonSize, variant: ButtonVariant, state: PreviewState) {
  return combineClasses(
    baseButtonClass,
    size.className,
    variant.className,
    variant.disabledClassName,
    state.key === "hover" && variant.hoverClassName,
  );
}

function ButtonPreview({
  size,
  variant,
  state,
}: Readonly<{
  size: ButtonSize;
  variant: ButtonVariant;
  state: PreviewState;
}>) {
  const className = getPreviewClassName(size, variant, state);
  const isDisabled = state.key === "disabled";

  return (
    <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
      <div className="flex min-h-[76px] items-center justify-center rounded-[14px] bg-slate-50/70 px-3 py-4">
        <button type="button" disabled={isDisabled} className={className}>
          버튼 미리보기
        </button>
      </div>
      <div className="mt-4 space-y-2 text-[12px] leading-5 text-slate-600">
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold text-slate-950">
            {size.label} / {variant.label}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-500">
            {state.label}
          </span>
        </div>
        <p className="text-slate-500">{state.description}</p>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
          <dt className="text-slate-400">height</dt>
          <dd className="font-medium text-slate-700">{size.height}</dd>
          <dt className="text-slate-400">horizontal padding</dt>
          <dd className="font-medium text-slate-700">{size.horizontalPadding}</dd>
          <dt className="text-slate-400">font size</dt>
          <dd className="font-medium text-slate-700">{size.fontSize}</dd>
          <dt className="text-slate-400">font weight</dt>
          <dd className="font-medium text-slate-700">{size.fontWeight}</dd>
          <dt className="text-slate-400">border radius</dt>
          <dd className="font-medium text-slate-700">{size.radius}</dd>
        </dl>
        <div className="rounded-[12px] bg-slate-950 px-3 py-2 font-mono text-[11px] leading-5 text-slate-100">
          {combineClasses(size.className, variant.className)}
        </div>
      </div>
    </div>
  );
}

export default function DesignPreviewPage() {
  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,#fbfdfb_0%,#f8fcf9_45%,#f4faf6_100%)] px-4 py-8 text-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="rounded-[28px] border border-[var(--line)] bg-white/86 px-5 py-6 shadow-[0_18px_46px_rgba(15,23,42,0.07)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
            Development Preview
          </p>
          <h1 className="mt-3 text-[30px] font-semibold tracking-[-0.04em] text-slate-950">
            Button 후보 디자인 비교
          </h1>
          <Link href="/design-preview/buttons" className="mt-4 inline-block text-sm underline underline-offset-4">현재 디자인 검토 화면 열기: 버튼 · 폰트 · 테마</Link>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            이 페이지는 디자인 확정용이 아니라, 현재 프로젝트에서 조사한 버튼 size와 variant 후보를
            같은 Tailwind CSS, 폰트, 전역 스타일 환경에서 비교하기 위한 임시 개발 도구입니다.
            실제 서비스 기능과 연결하지 않았고 기존 화면에도 적용하지 않았습니다.
          </p>
        </header>

        <section className="rounded-[24px] border border-slate-200 bg-white/88 p-5 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--brand)]">Button Size 비교</p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                동일한 텍스트로 보는 sm / md / lg
              </h2>
            </div>
            <p className="text-sm text-slate-500">Primary variant 기준</p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {buttonSizes.map((size) => (
              <ButtonPreview
                key={size.key}
                size={size}
                variant={buttonVariants[0]}
                state={previewStates[0]}
              />
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white/88 p-5 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
          <div>
            <p className="text-sm font-semibold text-[var(--brand)]">Button Variant 비교</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950">
              size별 primary / secondary / ghost / danger 후보
            </h2>
          </div>

          <div className="mt-6 space-y-8">
            {buttonSizes.map((size) => (
              <div key={size.key} className="space-y-3">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
                  <h3 className="text-base font-semibold text-slate-950">{size.label}</h3>
                  <p className="text-xs font-medium text-slate-500">
                    {size.height} / {size.horizontalPadding} horizontal padding
                  </p>
                </div>
                <div className="grid gap-4 lg:grid-cols-4">
                  {buttonVariants.map((variant) => (
                    <ButtonPreview
                      key={`${size.key}-${variant.key}`}
                      size={size}
                      variant={variant}
                      state={previewStates[0]}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white/88 p-5 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
          <div>
            <p className="text-sm font-semibold text-[var(--brand)]">상태 비교</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950">
              default / hover preview / disabled
            </h2>
          </div>

          <div className="mt-6 space-y-8">
            {buttonSizes.map((size) => (
              <div key={size.key} className="space-y-3">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
                  <h3 className="text-base font-semibold text-slate-950">{size.label}</h3>
                  <p className="text-xs font-medium text-slate-500">Primary variant 상태 비교</p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {previewStates.map((state) => (
                    <ButtonPreview
                      key={`${size.key}-primary-${state.key}`}
                      size={size}
                      variant={buttonVariants[0]}
                      state={state}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-dashed border-[rgba(121,184,149,0.42)] bg-[var(--brand-soft)]/55 p-5">
          <h2 className="text-base font-semibold text-slate-950">검토 메모</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            <li>`size`는 높이, 좌우 padding, font size, radius만 비교합니다.</li>
            <li>`width`는 button size가 아니라 화면 레이아웃에서 결정하는 후보로 둡니다.</li>
            <li>이 페이지의 후보값은 공통 Button 컴포넌트 확정 전 시각 비교용입니다.</li>
            <li>실제 서비스 화면, 기존 버튼, 전역 스타일, 라우팅 네비게이션은 변경하지 않았습니다.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
