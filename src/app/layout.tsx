import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-provider";
import { PrototypeProvider } from "@/components/prototype-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Study Flow Prototype",
  description: "AI 기반 스터디 모임 모바일 웹 프로토타입",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <PrototypeProvider>{children}</PrototypeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
