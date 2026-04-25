import type { Metadata } from "next";
import { Noto_Sans_KR, Space_Grotesk } from "next/font/google";
import { PrototypeProvider } from "@/components/prototype-provider";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-study-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-study-display",
  subsets: ["latin"],
});

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
    <html
      lang="ko"
      className={`${notoSansKr.variable} ${spaceGrotesk.variable} h-dvh antialiased`}
    >
      <body className="flex h-dvh flex-col overflow-hidden">
        <PrototypeProvider>{children}</PrototypeProvider>
      </body>
    </html>
  );
}
