import { getAllFaqItems } from "@/lib/content";
import FaqManager from "./FaqManager";

export default async function AdminFaqPage() {
  const items = await getAllFaqItems();
  return <FaqManager items={items} />;
}
