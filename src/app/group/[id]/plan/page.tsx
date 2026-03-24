import { PlanScreen } from "@/components/prototype-screens";

export default async function PlanPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;

  return <PlanScreen groupId={id} />;
}
