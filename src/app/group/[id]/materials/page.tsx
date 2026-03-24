import { MaterialsScreen } from "@/components/prototype-screens";

export default async function MaterialsPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;

  return <MaterialsScreen groupId={id} />;
}
