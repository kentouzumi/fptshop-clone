/**
 * Nhãn cho ProductRelation. Tách riêng khỏi lib/productRelations.ts vì
 * RelationsManager là CLIENT COMPONENT — import từ file có `prisma` sẽ kéo cả
 * Prisma vào bundle trình duyệt (cùng lý do đã tách lib/orderLabels.ts).
 */

/** 3 giá trị đúng theo comment trong schema.prisma (cột `type` là String, không phải enum). */
export const RELATION_TYPES = ["ACCESSORY", "UPSELL", "RELATED"] as const;

export type RelationType = (typeof RELATION_TYPES)[number];

/** Dùng cho CẢ nhãn trong admin LẪN tiêu đề section ở trang sản phẩm. */
export const RELATION_TYPE_LABELS: Record<RelationType, string> = {
  ACCESSORY: "Phụ kiện mua kèm",
  UPSELL: "Phiên bản nâng cấp",
  RELATED: "Sản phẩm liên quan",
};

export function isRelationType(value: unknown): value is RelationType {
  return typeof value === "string" && (RELATION_TYPES as readonly string[]).includes(value);
}
