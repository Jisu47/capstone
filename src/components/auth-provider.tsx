"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { type AvatarPreset, getAvatarPresetFromSeed } from "@/lib/mock-data";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export type UserRole = "member" | "leader";

export type AuthUser = {
  userId: string;
  email: string;
  displayName: string;
  bio: string;
  avatarPreset: AvatarPreset;
  role: UserRole | null;
  hasJoinedGroup: boolean;
  joinedGroupId: string | null;
};

type SignInInput = {
  email: string;
  password: string;
};

type SignUpInput = {
  email: string;
  password: string;
};

export type UpdateProfileInput = {
  displayName: string;
  bio: string;
  avatarPreset: AvatarPreset;
};

type AuthActionResult =
  | {
      ok: true;
      user: AuthUser;
    }
  | {
      ok: false;
      error: string;
    };

type AuthContextValue = {
  isAuthReady: boolean;
  sessionName: string | null;
  currentUser: AuthUser | null;
  signIn: (input: SignInInput) => Promise<AuthActionResult>;
  signUp: (input: SignUpInput) => Promise<AuthActionResult>;
  updateProfile: (input: UpdateProfileInput) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
  markGroupJoined: (groupId: string, role: UserRole) => Promise<AuthUser | null>;
  resolvePostAuthPath: (user: AuthUser) => "/";
};

type ProfileRow = {
  id: string;
  email: string | null;
  name: string | null;
  display_name: string | null;
  bio: string | null;
  focus: string | null;
  avatar_preset: string | null;
  role: string | null;
  has_joined_group: boolean | null;
  joined_group_id: string | null;
};

type ProfileOverrides = Partial<
  Pick<
    ProfileRow,
    | "email"
    | "name"
    | "display_name"
    | "bio"
    | "focus"
    | "avatar_preset"
    | "role"
    | "has_joined_group"
    | "joined_group_id"
  >
>;

const AuthContext = createContext<AuthContextValue | null>(null);
const profileSyncTimeoutMs = 8000;

function isAvatarPreset(value: string | null | undefined): value is AvatarPreset {
  return value === "sky" || value === "emerald" || value === "rose" || value === "amber";
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function deriveDisplayName(email: string) {
  const localPart = email.split("@")[0]?.trim();
  return localPart && localPart.length > 0 ? localPart : email;
}

function getDefaultBio(role: UserRole | null) {
  if (role === "leader") {
    return "스터디 방향을 정리하고 일정과 계획을 함께 관리하고 있어요.";
  }

  if (role === "member") {
    return "자료를 정리하고 질문을 모으며 스터디에 참여하고 있어요.";
  }

  return "함께 목표를 준비할 그룹을 찾고 있어요.";
}

function getDefaultFocus(role: UserRole | null) {
  if (role === "leader") {
    return "그룹 운영";
  }

  if (role === "member") {
    return "학습 정리";
  }

  return "학습 준비";
}

function normalizeRole(role: string | null | undefined): UserRole | null {
  if (role === "leader" || role === "member") {
    return role;
  }

  if (role === "팀장") {
    return "leader";
  }

  if (role === "팀원") {
    return "member";
  }

  return null;
}

function toStoredRole(role: UserRole | null) {
  return role;
}

function buildAuthUser(user: User, profile: ProfileRow | null): AuthUser {
  const email = profile?.email?.trim() || user.email?.trim() || "";
  const normalizedRole = normalizeRole(profile?.role);
  const displayName =
    profile?.display_name?.trim() ||
    profile?.name?.trim() ||
    deriveDisplayName(email || user.id);

  return {
    userId: user.id,
    email,
    displayName,
    bio: profile?.bio?.trim() || getDefaultBio(normalizedRole),
    avatarPreset: isAvatarPreset(profile?.avatar_preset)
      ? profile.avatar_preset
      : getAvatarPresetFromSeed(user.id),
    role: normalizedRole,
    hasJoinedGroup: profile?.has_joined_group ?? false,
    joinedGroupId: profile?.joined_group_id ?? null,
  };
}

function buildFallbackAuthUser(user: User): AuthUser {
  const email = user.email?.trim() || "";

  return {
    userId: user.id,
    email,
    displayName: deriveDisplayName(email || user.id),
    bio: getDefaultBio(null),
    avatarPreset: getAvatarPresetFromSeed(user.id),
    role: null,
    hasJoinedGroup: false,
    joinedGroupId: null,
  };
}

async function withTimeout<T>(promise: Promise<T>, label: string) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race<T>([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`${label} timed out.`));
        }, profileSyncTimeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function resolvePostAuthPath(user: AuthUser): "/" {
  void user;
  return "/";
}

async function fetchProfile(userId: string) {
  const client = getSupabaseBrowserClient();
  const response = await client.from("profiles").select("*").eq("id", userId).maybeSingle();

  if (response.error) {
    throw new Error(`Failed to load profile: ${response.error.message}`);
  }

  return (response.data ?? null) as ProfileRow | null;
}

async function upsertProfile(user: User, overrides: ProfileOverrides = {}) {
  const client = getSupabaseBrowserClient();
  const existingProfile = await fetchProfile(user.id);
  const email = overrides.email?.trim() || existingProfile?.email?.trim() || user.email?.trim() || "";
  const role = normalizeRole(overrides.role ?? existingProfile?.role);
  const displayName =
    overrides.display_name?.trim() ||
    overrides.name?.trim() ||
    existingProfile?.display_name?.trim() ||
    existingProfile?.name?.trim() ||
    deriveDisplayName(email || user.id);
  const bio = overrides.bio?.trim() || existingProfile?.bio?.trim() || getDefaultBio(role);
  const focus = overrides.focus?.trim() || existingProfile?.focus?.trim() || getDefaultFocus(role);
  const avatarPreset = isAvatarPreset(overrides.avatar_preset)
    ? overrides.avatar_preset
    : isAvatarPreset(existingProfile?.avatar_preset)
      ? existingProfile.avatar_preset
      : getAvatarPresetFromSeed(user.id);

  const payload: ProfileRow = {
    id: user.id,
    email,
    name: displayName,
    display_name: displayName,
    bio,
    focus,
    avatar_preset: avatarPreset,
    role: toStoredRole(role),
    has_joined_group: overrides.has_joined_group ?? existingProfile?.has_joined_group ?? false,
    joined_group_id:
      overrides.joined_group_id !== undefined
        ? overrides.joined_group_id
        : existingProfile?.joined_group_id ?? null,
  };

  const response = await client.from("profiles").upsert(payload).select("*").single();

  if (response.error) {
    throw new Error(`Failed to save profile: ${response.error.message}`);
  }

  return response.data as ProfileRow;
}

export function AuthProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const client = useMemo(() => getSupabaseBrowserClient(), []);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  async function syncAuthState(nextUser: User | null) {
    if (!nextUser) {
      setSessionUser(null);
      setCurrentUser(null);
      return;
    }

    setSessionUser(nextUser);

    try {
      const profile = await withTimeout(
        upsertProfile(nextUser),
        "Profile sync during auth state change",
      );
      setCurrentUser(buildAuthUser(nextUser, profile));
    } catch {
      setCurrentUser(buildFallbackAuthUser(nextUser));
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const { data, error } = await client.auth.getSession();

        if (error) {
          throw error;
        }

        if (!cancelled) {
          await syncAuthState(data.session?.user ?? null);
        }
      } catch {
        if (!cancelled) {
          setSessionUser(null);
          setCurrentUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsAuthReady(true);
        }
      }
    }

    void bootstrap();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      void syncAuthState(session?.user ?? null).finally(() => {
        setIsAuthReady(true);
      });
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [client]);

  const sessionName = currentUser?.displayName ?? (currentUser?.email ? deriveDisplayName(currentUser.email) : null);

  async function signIn({ email, password }: SignInInput): Promise<AuthActionResult> {
    const normalizedEmail = normalizeEmail(email);
    const trimmedPassword = password.trim();

    if (!normalizedEmail || !trimmedPassword) {
      return {
        ok: false,
        error: "이메일과 비밀번호를 모두 입력해 주세요.",
      };
    }

    const { data, error } = await client.auth.signInWithPassword({
      email: normalizedEmail,
      password: trimmedPassword,
    });

    if (error || !data.user) {
      return {
        ok: false,
        error: error?.message ?? "로그인에 실패했어요.",
      };
    }

    setSessionUser(data.user);

    let user: AuthUser;

    try {
      const profile = await withTimeout(
        upsertProfile(data.user, { email: normalizedEmail }),
        "Profile sync during sign in",
      );
      user = buildAuthUser(data.user, profile);
    } catch {
      user = buildFallbackAuthUser(data.user);
    }

    setCurrentUser(user);

    return {
      ok: true,
      user,
    };
  }

  async function signUp({ email, password }: SignUpInput): Promise<AuthActionResult> {
    const normalizedEmail = normalizeEmail(email);
    const trimmedPassword = password.trim();

    if (!normalizedEmail || !trimmedPassword) {
      return {
        ok: false,
        error: "이메일과 비밀번호를 모두 입력해 주세요.",
      };
    }

    const signUpResult = await client.auth.signUp({
      email: normalizedEmail,
      password: trimmedPassword,
    });

    if (signUpResult.error || !signUpResult.data.user) {
      return {
        ok: false,
        error: signUpResult.error?.message ?? "회원가입에 실패했어요.",
      };
    }

    let activeUser = signUpResult.data.user;

    if (!signUpResult.data.session) {
      const signInResult = await client.auth.signInWithPassword({
        email: normalizedEmail,
        password: trimmedPassword,
      });

      if (signInResult.error || !signInResult.data.user) {
        return {
          ok: false,
          error:
            signInResult.error?.message ??
            "계정은 생성됐지만 바로 로그인하지 못했어요. 다시 로그인해 주세요.",
        };
      }

      activeUser = signInResult.data.user;
    }

    let user: AuthUser;

    try {
      const createdProfile = await withTimeout(
        upsertProfile(signUpResult.data.user, {
          email: normalizedEmail,
          role: null,
          has_joined_group: false,
          joined_group_id: null,
        }),
        "Profile sync during sign up",
      );
      user = buildAuthUser(activeUser, createdProfile);
    } catch {
      user = buildFallbackAuthUser(activeUser);
    }

    setSessionUser(activeUser);
    setCurrentUser(user);

    return {
      ok: true,
      user,
    };
  }

  async function updateProfile({
    displayName,
    bio,
    avatarPreset,
  }: UpdateProfileInput): Promise<AuthActionResult> {
    const activeUser = sessionUser;

    if (!activeUser) {
      return {
        ok: false,
        error: "로그인 상태를 다시 확인해 주세요.",
      };
    }

    const normalizedDisplayName = displayName.trim();

    if (!normalizedDisplayName) {
      return {
        ok: false,
        error: "닉네임을 입력해 주세요.",
      };
    }

    const nextProfile = await upsertProfile(activeUser, {
      display_name: normalizedDisplayName,
      name: normalizedDisplayName,
      bio,
      avatar_preset: avatarPreset,
    });
    const user = buildAuthUser(activeUser, nextProfile);
    setCurrentUser(user);

    return {
      ok: true,
      user,
    };
  }

  async function signOut() {
    await client.auth.signOut();
    setSessionUser(null);
    setCurrentUser(null);
  }

  async function markGroupJoined(groupId: string, role: UserRole) {
    if (!sessionUser) {
      return null;
    }

    const nextProfile = await upsertProfile(sessionUser, {
      role,
      has_joined_group: true,
      joined_group_id: groupId,
      focus: getDefaultFocus(role),
      bio: currentUser?.bio?.trim() || getDefaultBio(role),
    });
    const user = buildAuthUser(sessionUser, nextProfile);
    setCurrentUser(user);
    return user;
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthReady,
        sessionName,
        currentUser,
        signIn,
        signUp,
        updateProfile,
        signOut,
        markGroupJoined,
        resolvePostAuthPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
