import { notFound } from "next/navigation";
import { PresentationPreviewScreen } from "@/components/presentation-preview/presentation-preview-screen";
const screens = ["plan", "materials", "todo", "review", "group"] as const;
export default async function Page({ params }: { params: Promise<{ screen: string }> }) {
  const { screen } = await params;
  if (!screens.includes(screen as typeof screens[number])) notFound();
  return <PresentationPreviewScreen screen={screen as typeof screens[number]} />;
}
