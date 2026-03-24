import { ProgressScreen } from "@/components/prototype-screens";

export default async function ProgressPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;

  return <ProgressScreen groupId={id} />;
}
