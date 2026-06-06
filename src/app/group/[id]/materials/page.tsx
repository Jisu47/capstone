import { MaterialsScreen } from "@/components/materials-screen";

export default async function MaterialsPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;

  return <MaterialsScreen groupId={id} />;
}
