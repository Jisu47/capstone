import type { Metadata } from "next";
import { DesignPreviewV2Screen } from "@/components/design-preview-v2/design-preview-v2-screen";

export const metadata: Metadata = {
  title: "Design System · Study Flow",
  description: "Study Flow의 공식 디자인 시스템 · Foundations와 Components",
};

export default function DesignPreviewV2Page() {
  return <DesignPreviewV2Screen />;
}
