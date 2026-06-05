"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell, LoadingState, SectionCard } from "@/components/mobile-shell";
import { ProfileAvatar } from "@/components/profile-avatar";
import {
  type AuthUser,
  type UpdateProfileInput,
  useAuth,
} from "@/components/auth-provider";
import { usePrototype } from "@/components/prototype-provider";
import { createGroupJoinCode } from "@/lib/group-join-code";
import type { AvatarPreset, Member, StudyGroup } from "@/lib/mock-data";

const avatarOptions: Array<{ value: AvatarPreset; label: string }> = [
  { value: "sky", label: "Sky" },
  { value: "emerald", label: "Emerald" },
  { value: "rose", label: "Rose" },
  { value: "amber", label: "Amber" },
];

type SaveProfileResult =
  | { ok: true }
  | { ok: false; error: string };

function getRoleLabel(role: "leader" | "member" | null) {
  if (role === "leader") {
    return "팀장";
  }

  if (role === "member") {
    return "팀원";
  }

  return "미정";
}

function MyPageHeader() {
  return (
    <div className="flex items-center justify-between gap-3">
      <Link
        href="/"
        aria-label="그룹 선택으로 돌아가기"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.04)] transition hover:bg-white"
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M15 6L9 12L15 18"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      </Link>

      <div className="flex-1 text-center">
        <p className="font-[family:var(--font-study-display)] text-[25px] leading-none tracking-[-0.05em] text-slate-950">
          마이페이지
        </p>
      </div>

      <div aria-hidden="true" className="h-10 w-10" />
    </div>
  );
}

function ProfileEditorSection({
  currentUser,
  isMutating,
  onSaveProfile,
}: Readonly<{
  currentUser: AuthUser;
  isMutating: boolean;
  onSaveProfile: (input: UpdateProfileInput) => Promise<SaveProfileResult>;
}>) {
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [bio, setBio] = useState(currentUser.bio);
  const [avatarPreset, setAvatarPreset] = useState<AvatarPreset>(currentUser.avatarPreset);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSaveProfile() {
    const result = await onSaveProfile({
      displayName,
      bio,
      avatarPreset,
    });

    if (!result.ok) {
      setFeedback(null);
      setErrorMessage(result.error);
      return;
    }

    setErrorMessage(null);
    setFeedback("프로필이 저장됐어요.");
  }

  return (
    <SectionCard title="내 프로필 수정">
      <div className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-800">닉네임</span>
          <input
            value={displayName}
            onChange={(event) => {
              setDisplayName(event.target.value);
              setFeedback(null);
              setErrorMessage(null);
            }}
            className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(121,184,149,0.16)]"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-800">자기소개</span>
          <textarea
            rows={4}
            value={bio}
            onChange={(event) => {
              setBio(event.target.value);
              setFeedback(null);
              setErrorMessage(null);
            }}
            className="w-full rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[rgba(121,184,149,0.16)]"
          />
        </label>

        <div className="space-y-2">
          <span className="text-sm font-semibold text-slate-800">아바타 프리셋</span>
          <div className="grid grid-cols-2 gap-3">
            {avatarOptions.map((option) => {
              const selected = avatarPreset === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setAvatarPreset(option.value);
                    setFeedback(null);
                    setErrorMessage(null);
                  }}
                  className={`flex items-center gap-3 rounded-[16px] border px-4 py-3 text-left transition ${
                    selected
                      ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <ProfileAvatar
                    name={displayName || currentUser.displayName}
                    avatarPreset={option.value}
                    size="sm"
                  />
                  <span className="text-sm font-semibold text-slate-800">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {feedback ? (
          <p className="rounded-[14px] bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {feedback}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="rounded-[14px] bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => {
            void handleSaveProfile();
          }}
          disabled={isMutating}
          className="inline-flex w-full items-center justify-center rounded-[18px] bg-[var(--brand)] px-4 py-4 text-base font-semibold text-white shadow-[0_14px_28px_rgba(121,184,149,0.22)] transition hover:brightness-[0.98] disabled:opacity-70"
        >
          {isMutating ? "저장 중..." : "프로필 저장"}
        </button>
      </div>
    </SectionCard>
  );
}

function findJoinedGroup(groups: StudyGroup[], joinedGroupId: string | null) {
  if (!joinedGroupId) {
    return null;
  }

  return groups.find((group) => group.id === joinedGroupId) ?? null;
}

function findTeammates(joinedGroup: StudyGroup | null, currentUserId: string) {
  if (!joinedGroup) {
    return [];
  }

  return joinedGroup.members.filter((member) => member.id !== currentUserId);
}

export default function MyPage() {
  const router = useRouter();
  const { isAuthReady, currentUser, updateProfile, signOut } = useAuth();
  const { groups, isMutating } = usePrototype();

  useEffect(() => {
    if (isAuthReady && !currentUser) {
      router.replace("/login");
      return;
    }

    if (currentUser && !currentUser.hasJoinedGroup) {
      router.replace("/");
    }
  }, [currentUser, isAuthReady, router]);

  const joinedGroup = useMemo(() => {
    return findJoinedGroup(groups, currentUser?.joinedGroupId ?? null);
  }, [currentUser, groups]);
  const teammateProfiles = useMemo(() => {
    return currentUser ? findTeammates(joinedGroup, currentUser.userId) : [];
  }, [currentUser, joinedGroup]);

  async function handleSaveProfile(input: UpdateProfileInput): Promise<SaveProfileResult> {
    const result = await updateProfile(input);

    if (!result.ok) {
      return {
        ok: false,
        error: result.error,
      };
    }

    return { ok: true };
  }

  if (!isAuthReady || !currentUser) {
    return (
      <AppShell
        requireAuth={false}
        showNavigation={false}
        headerContent={<MyPageHeader />}
        title="마이페이지"
        subtitle="사용자 정보를 준비하고 있어요."
      >
        <LoadingState message="마이페이지를 불러오는 중입니다." />
      </AppShell>
    );
  }

  return (
    <AppShell
      requireAuth={false}
      showNavigation={false}
      headerContent={<MyPageHeader />}
      title="마이페이지"
      subtitle="역할, 그룹 상태, 내 프로필과 팀원 정보를 한눈에 확인해 보세요."
    >
      <SectionCard
        title={`${currentUser.displayName}님`}
        action={
          <button
            type="button"
            onClick={() => {
              void signOut().finally(() => {
                router.replace("/");
              });
            }}
            className="text-sm font-semibold text-[var(--brand)]"
          >
            로그아웃
          </button>
        }
      >
        <div className="flex items-center gap-4 rounded-[18px] border border-slate-200 bg-white px-4 py-4">
          <ProfileAvatar
            name={currentUser.displayName}
            avatarPreset={currentUser.avatarPreset}
            size="lg"
          />
          <div className="min-w-0">
            <p className="text-base font-semibold text-slate-950">{currentUser.displayName}</p>
            <p className="mt-1 text-sm text-slate-500">{currentUser.email}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{currentUser.bio}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              역할
            </p>
            <p className="mt-2 text-base font-semibold text-slate-950">
              {getRoleLabel(currentUser.role)}
            </p>
          </div>
          <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              그룹 상태
            </p>
            <p className="mt-2 text-base font-semibold text-slate-950">
              {currentUser.hasJoinedGroup ? "가입 완료" : "미가입"}
            </p>
          </div>
        </div>
      </SectionCard>

      <ProfileEditorSection
        key={currentUser.userId}
        currentUser={currentUser}
        isMutating={isMutating}
        onSaveProfile={handleSaveProfile}
      />

      <SectionCard title="내 그룹">
        {joinedGroup ? (
          <div className="space-y-4">
            <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-5 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {joinedGroup.subject}
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                {joinedGroup.name}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                현재 연결된 그룹입니다. 그룹 홈으로 이동하거나 그룹 선택 화면에서 다른 스터디 흐름도
                이어볼 수 있어요.
              </p>
            </div>

            {currentUser.role === "leader" ? (
              <div className="rounded-[18px] border border-slate-200 bg-[var(--brand-soft)] px-4 py-4">
                <p className="text-sm font-semibold text-slate-900">팀원 초대 코드</p>
                <p className="mt-2 text-lg font-semibold tracking-[0.08em] text-[var(--brand)]">
                  {createGroupJoinCode(joinedGroup.id)}
                </p>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => router.push(`/group/${joinedGroup.id}`)}
                className="inline-flex items-center justify-center rounded-[18px] bg-[var(--brand)] px-4 py-4 text-base font-semibold text-white shadow-[0_14px_28px_rgba(121,184,149,0.22)] transition hover:brightness-[0.98]"
              >
                그룹 홈으로 이동
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-[18px] border border-slate-200 bg-white px-4 py-4 text-base font-semibold text-slate-800 transition hover:border-slate-300"
              >
                그룹 선택으로 이동
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm leading-6 text-slate-600">
              연결된 그룹 정보를 아직 찾지 못했어요. 그룹 선택 화면으로 돌아가서 다시 확인해 주세요.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-[18px] bg-[var(--brand)] px-4 py-4 text-base font-semibold text-white shadow-[0_14px_28px_rgba(121,184,149,0.22)] transition hover:brightness-[0.98]"
            >
              그룹 선택으로 이동
            </Link>
          </div>
        )}
      </SectionCard>

      <SectionCard title="우리 팀원 프로필">
        {teammateProfiles.length > 0 ? (
          <div className="space-y-3">
            {teammateProfiles.map((member: Member) => (
              <article
                key={member.id}
                className="rounded-[18px] border border-slate-200 bg-white px-4 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-start gap-4">
                  <ProfileAvatar
                    name={member.name}
                    avatarPreset={member.avatarPreset}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-base font-semibold text-slate-950">{member.name}</p>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {member.role}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-600">{member.focus}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{member.bio}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-6 text-slate-600">
            같은 그룹의 팀원 프로필이 아직 없어요.
          </p>
        )}
      </SectionCard>
    </AppShell>
  );
}
