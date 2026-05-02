"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { type AvatarPreset, getAvatarPresetFromSeed } from "@/lib/mock-data";

export type UserRole = "member" | "leader";

export type AuthUser = {
  userId: string;
  username: string;
  password: string;
  displayName: string;
  bio: string;
  avatarPreset: AvatarPreset;
  role: UserRole;
  hasJoinedGroup: boolean;
  joinedGroupId: string | null;
};

type SignInInput = {
  username: string;
  password: string;
};

type SignUpInput = {
  username: string;
  password: string;
  role: UserRole;
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
  signIn: (input: SignInInput) => AuthActionResult;
  signUp: (input: SignUpInput) => AuthActionResult;
  updateProfile: (input: UpdateProfileInput) => AuthActionResult;
  signOut: () => void;
  markGroupJoined: (groupId: string) => AuthUser | null;
  resolvePostAuthPath: (user: AuthUser) => "/group-setup" | "/mypage";
};

const sessionStorageKey = "study-flow-session-user-id";
const usersStorageKey = "study-flow-auth-users";
const authChangeEvent = "study-flow-auth-change";
const AuthContext = createContext<AuthContextValue | null>(null);

function subscribeAuth(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = () => callback();
  const handleAuthChange = () => callback();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(authChangeEvent, handleAuthChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(authChangeEvent, handleAuthChange);
  };
}

function dispatchAuthChange() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(authChangeEvent));
}

function readSessionUserId() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(sessionStorageKey);
}

function buildLegacyUserId(username: string) {
  return `legacy-${encodeURIComponent(username.trim().toLowerCase())}`;
}

function createUserId() {
  return `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getDefaultBio(role: UserRole) {
  return role === "leader"
    ? "스터디 흐름을 정리하고 일정과 계획을 함께 챙기고 있어요."
    : "자료를 정리하고 질문을 모으며 스터디에 참여하고 있어요.";
}

function normalizeDisplayName(displayName: string, username: string) {
  const trimmed = displayName.trim();
  return trimmed.length > 0 ? trimmed : username.trim();
}

function parseUsers(storedUsers: string | null): AuthUser[] {
  if (!storedUsers) {
    return [];
  }

  try {
    const parsed = JSON.parse(storedUsers) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((entry) => {
      if (!entry || typeof entry !== "object") {
        return [];
      }

      const user = entry as Partial<AuthUser>;

      if (
        typeof user.username !== "string" ||
        typeof user.password !== "string" ||
        (user.role !== "member" && user.role !== "leader") ||
        typeof user.hasJoinedGroup !== "boolean"
      ) {
        return [];
      }

      const username = user.username.trim();

      if (!username) {
        return [];
      }

      const userId =
        typeof user.userId === "string" && user.userId.trim()
          ? user.userId
          : buildLegacyUserId(username);
      const displayName = normalizeDisplayName(user.displayName ?? "", username);
      const avatarPreset =
        user.avatarPreset && ["sky", "emerald", "rose", "amber"].includes(user.avatarPreset)
          ? user.avatarPreset
          : getAvatarPresetFromSeed(userId);

      return [
        {
          userId,
          username,
          password: user.password,
          displayName,
          bio: typeof user.bio === "string" && user.bio.trim() ? user.bio : getDefaultBio(user.role),
          avatarPreset,
          role: user.role,
          hasJoinedGroup: user.hasJoinedGroup,
          joinedGroupId:
            typeof user.joinedGroupId === "string" ? user.joinedGroupId : null,
        },
      ];
    });
  } catch {
    return [];
  }
}

function readUsers() {
  if (typeof window === "undefined") {
    return [];
  }

  return parseUsers(window.localStorage.getItem(usersStorageKey));
}

function readUsersSnapshot() {
  if (typeof window === "undefined") {
    return "[]";
  }

  return window.localStorage.getItem(usersStorageKey) ?? "[]";
}

function writeUsers(users: AuthUser[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(usersStorageKey, JSON.stringify(users));
}

function resolveCurrentUser(sessionUserId: string | null, usersStorageValue: string) {
  if (!sessionUserId) {
    return null;
  }

  const users = parseUsers(usersStorageValue);
  const user = users.find(
    (entry) => entry.userId === sessionUserId || entry.username === sessionUserId,
  );

  if (user) {
    return user;
  }

  return {
    userId: buildLegacyUserId(sessionUserId),
    username: sessionUserId,
    password: "",
    displayName: sessionUserId,
    bio: getDefaultBio("member"),
    avatarPreset: getAvatarPresetFromSeed(sessionUserId),
    role: "member" as const,
    hasJoinedGroup: true,
    joinedGroupId: null,
  };
}

function upsertUser(nextUser: AuthUser) {
  const users = readUsers();
  const filteredUsers = users.filter((entry) => entry.userId !== nextUser.userId);
  const nextUsers = [...filteredUsers, nextUser];

  writeUsers(nextUsers);
  window.localStorage.setItem(sessionStorageKey, nextUser.userId);
  dispatchAuthChange();

  return nextUser;
}

function resolvePostAuthPath(user: AuthUser) {
  return user.hasJoinedGroup ? "/mypage" : "/group-setup";
}

export function AuthProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isAuthReady = useSyncExternalStore(
    subscribeAuth,
    () => true,
    () => false,
  );
  const sessionUserId = useSyncExternalStore(
    subscribeAuth,
    readSessionUserId,
    () => null,
  );
  const usersStorageValue = useSyncExternalStore(
    subscribeAuth,
    readUsersSnapshot,
    () => "[]",
  );
  const currentUser = useMemo(() => {
    return resolveCurrentUser(sessionUserId, usersStorageValue);
  }, [sessionUserId, usersStorageValue]);
  const sessionName = currentUser?.displayName ?? currentUser?.username ?? null;

  function signIn({ username, password }: SignInInput): AuthActionResult {
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword || typeof window === "undefined") {
      return {
        ok: false,
        error: "아이디와 비밀번호를 모두 입력해 주세요.",
      };
    }

    const users = readUsers();
    const matchedUser = users.find((entry) => entry.username === trimmedUsername);

    if (!matchedUser) {
      return {
        ok: false,
        error: "가입된 계정을 찾을 수 없습니다.",
      };
    }

    if (matchedUser.password !== trimmedPassword) {
      return {
        ok: false,
        error: "비밀번호가 일치하지 않습니다.",
      };
    }

    window.localStorage.setItem(sessionStorageKey, matchedUser.userId);
    dispatchAuthChange();

    return {
      ok: true,
      user: matchedUser,
    };
  }

  function signUp({ username, password, role }: SignUpInput): AuthActionResult {
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword || typeof window === "undefined") {
      return {
        ok: false,
        error: "아이디와 비밀번호를 모두 입력해 주세요.",
      };
    }

    const users = readUsers();
    const hasDuplicate = users.some((entry) => entry.username === trimmedUsername);

    if (hasDuplicate) {
      return {
        ok: false,
        error: "이미 사용 중인 아이디입니다.",
      };
    }

    const nextUser: AuthUser = {
      userId: createUserId(),
      username: trimmedUsername,
      password: trimmedPassword,
      displayName: trimmedUsername,
      bio: getDefaultBio(role),
      avatarPreset: getAvatarPresetFromSeed(trimmedUsername),
      role,
      hasJoinedGroup: false,
      joinedGroupId: null,
    };

    return {
      ok: true,
      user: upsertUser(nextUser),
    };
  }

  function updateProfile({
    displayName,
    bio,
    avatarPreset,
  }: UpdateProfileInput): AuthActionResult {
    if (typeof window === "undefined") {
      return {
        ok: false,
        error: "프로필을 저장할 수 없습니다.",
      };
    }

    const activeUser = resolveCurrentUser(readSessionUserId(), readUsersSnapshot());

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

    return {
      ok: true,
      user: upsertUser({
        ...activeUser,
        displayName: normalizedDisplayName,
        bio: bio.trim() || getDefaultBio(activeUser.role),
        avatarPreset,
      }),
    };
  }

  function signOut() {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(sessionStorageKey);
    dispatchAuthChange();
  }

  function markGroupJoined(groupId: string) {
    if (typeof window === "undefined") {
      return null;
    }

    const activeUser = resolveCurrentUser(readSessionUserId(), readUsersSnapshot());

    if (!activeUser) {
      return null;
    }

    return upsertUser({
      ...activeUser,
      hasJoinedGroup: true,
      joinedGroupId: groupId,
    });
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
