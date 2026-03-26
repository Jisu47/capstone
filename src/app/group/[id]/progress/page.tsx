import { redirect } from "next/navigation";

export default async function ProgressPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;

  redirect(`/group/${id}`);
}
