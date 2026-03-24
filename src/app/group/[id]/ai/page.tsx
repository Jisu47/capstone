import { AiScreen } from "@/components/prototype-screens";

export default async function AiPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;

  return <AiScreen groupId={id} />;
}
