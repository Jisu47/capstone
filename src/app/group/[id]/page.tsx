import { GroupHomeScreen } from "@/components/group-home-screen";

export default async function GroupHomePage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;

  return <GroupHomeScreen groupId={id} />;
}
