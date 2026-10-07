import { ButtonInventoryScreen } from "@/components/design-preview/button-inventory-screen";
import { connection } from "next/server";
import { readPreviewFonts } from "@/lib/server/preview-fonts";

export const metadata = { title: "Button Inventory | 개발용 디자인 검토" };

export default async function Page() {
  await connection();
  return <ButtonInventoryScreen fontCatalog={await readPreviewFonts()} />;
}
