"use client";

import type { AvatarPreset } from "@/lib/mock-data";

const presetClassMap: Record<AvatarPreset, string> = {
  sky: "from-sky-400 to-cyan-300 text-sky-950",
  emerald: "from-emerald-400 to-lime-300 text-emerald-950",
  rose: "from-rose-300 to-fuchsia-200 text-rose-950",
  amber: "from-amber-300 to-orange-200 text-amber-950",
};

const sizeClassMap = {
  sm: "h-10 w-10 text-sm",
  md: "h-14 w-14 text-lg",
  lg: "h-20 w-20 text-2xl",
};

export function ProfileAvatar({
  name,
  avatarPreset,
  size = "md",
}: Readonly<{
  name: string;
  avatarPreset: AvatarPreset;
  size?: "sm" | "md" | "lg";
}>) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className={`inline-flex items-center justify-center rounded-[20px] bg-gradient-to-br font-semibold shadow-[0_10px_20px_rgba(15,23,42,0.10)] ${presetClassMap[avatarPreset]} ${sizeClassMap[size]}`}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}
