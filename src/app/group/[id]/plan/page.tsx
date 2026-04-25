import { PlanFlowScreen } from "@/components/plan-screen";

export default async function PlanPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;

  return <PlanFlowScreen groupId={id} />;
}
