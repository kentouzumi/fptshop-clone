// Chia sẻ giữa client (CompareProvider, localStorage) và server (API route so sánh)
// nên KHÔNG được đánh dấu "use client" — chỉ chứa type/constant thuần, không có logic.

export const MAX_COMPARE_ITEMS = 4;

export interface CompareItem {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  price: number;
  categorySlug: string;
  categoryName: string;
}
