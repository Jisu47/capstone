"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
} from "react";

type AuthContextValue = {
  isAuthReady: boolean;
  sessionName: string | null;
  signIn: (name: string) => void;
  signOut: () => void;
};

const sessionStorageKey = "study-flow-session-name";
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

function getSessionSnapshot() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(sessionStorageKey);
}

function dispatchAuthChange() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(authChangeEvent));
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
    getSessionSnapshot,
    () => null,
  );

  function signIn(name: string) {
    const trimmedName = name.trim();

    if (!trimmedName || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(sessionStorageKey, trimmedName);
    dispatchAuthChange();
  }

  function signOut() {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(sessionStorageKey);
    dispatchAuthChange();
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthReady,
        sessionName,
        signIn,
        signOut,
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
