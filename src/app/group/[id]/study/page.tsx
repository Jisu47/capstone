import { StudyOverviewScreen } from "@/components/study-overview-screen";

export default async function GroupStudyPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;

  return <StudyOverviewScreen groupId={id} />;
}
