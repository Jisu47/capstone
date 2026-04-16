import { GroupOverviewScreen } from "@/components/prototype-screens";

export default async function GroupPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;

  return <GroupOverviewScreen groupId={id} />;
}
