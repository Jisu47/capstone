"use client";

import { usePathname } from "next/navigation";
import { AuthProvider } from "./auth-provider";
import { PrototypeProvider } from "./prototype-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Static review tools must not initialize authentication or service data.
  if (pathname === "/design-preview/buttons") return children;
  return <AuthProvider><PrototypeProvider>{children}</PrototypeProvider></AuthProvider>;
}
