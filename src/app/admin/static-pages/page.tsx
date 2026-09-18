import { getAllStaticPagesForAdmin } from "@/lib/content";
import StaticPagesManager from "./StaticPagesManager";

export default async function AdminStaticPagesPage() {
  const pages = await getAllStaticPagesForAdmin();
  return <StaticPagesManager pages={pages} />;
}
