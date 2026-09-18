import { getAllPromotionsForAdmin } from "@/lib/promotions";
import PromotionsManager from "./PromotionsManager";

export default async function AdminPromotionsPage() {
  const promotions = await getAllPromotionsForAdmin();
  return (
    <PromotionsManager
      promotions={promotions.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        bannerUrl: p.bannerUrl,
        linkUrl: p.linkUrl,
        startsAt: p.startsAt.toISOString(),
        endsAt: p.endsAt.toISOString(),
        isActive: p.isActive,
        sortOrder: p.sortOrder,
      }))}
    />
  );
}
