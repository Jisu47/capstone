import { PlanAgentScreen } from "@/components/plan-agent-screen";

export default async function PlanAgentPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;

  return <PlanAgentScreen groupId={id} />;
}
