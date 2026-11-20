import type { ReactNode } from "react";
import "./preview.css";
export const metadata = { title: "StudyFlow · Presentation Preview" };
export default function PreviewLayout({ children }: { children: ReactNode }) {
  return <html lang="ko"><body>{children}</body></html>;
}
