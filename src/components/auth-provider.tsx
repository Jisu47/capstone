"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";

export type UserRole = "member" | "leader";

export type AuthUser = {
  username: string;
  password: string;
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
  signOut: () => void;
  markGroupJoined: (groupId: string) => AuthUser | null;
  resolvePostAuthPath: (user: AuthUser) => "/group-setup" | "/mypage";
};

const sessionStorageKey = "study-flow-session-name";
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

function readSessionName() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(sessionStorageKey);
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

      return [
        {
          username: user.username,
          password: user.password,
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

function resolveCurrentUser(sessionName: string | null, usersStorageValue: string) {
  if (!sessionName) {
    return null;
  }

  const users = parseUsers(usersStorageValue);
  const user = users.find((entry) => entry.username === sessionName);

  if (user) {
    return user;
  }

  return {
    username: sessionName,
    password: "",
    role: "member" as const,
    hasJoinedGroup: true,
    joinedGroupId: null,
  };
}

function upsertUser(nextUser: AuthUser) {
  const users = readUsers();
  const filteredUsers = users.filter((entry) => entry.username !== nextUser.username);
  const nextUsers = [...filteredUsers, nextUser];

  writeUsers(nextUsers);
  window.localStorage.setItem(sessionStorageKey, nextUser.username);
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
  const sessionName = useSyncExternalStore(
    subscribeAuth,
    readSessionName,
    () => null,
  );
  const usersStorageValue = useSyncExternalStore(
    subscribeAuth,
    readUsersSnapshot,
    () => "[]",
  );
  const currentUser = useMemo(() => {
    return resolveCurrentUser(sessionName, usersStorageValue);
  }, [sessionName, usersStorageValue]);

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

    window.localStorage.setItem(sessionStorageKey, matchedUser.username);
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
      username: trimmedUsername,
      password: trimmedPassword,
      role,
      hasJoinedGroup: false,
      joinedGroupId: null,
    };

    return {
      ok: true,
      user: upsertUser(nextUser),
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

    const activeUser = resolveCurrentUser(
      readSessionName(),
      readUsersSnapshot(),
    );

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
