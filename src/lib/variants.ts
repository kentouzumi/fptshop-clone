import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import { PRODUCTS_TAG } from "@/lib/products";

export interface VariantInput {
  sku: string;
  color: string | null;
  storage: string | null;
  price: number;
  compareAtPrice: number | null;
  weightGram: number | null;
  barcode: string | null;
  isActive: boolean;
}

export function parseVariantInput(body: unknown): VariantInput | null {
  const b = body as Record<string, unknown>;
  const sku = typeof b?.sku === "string" ? b.sku.trim() : "";
  const color = typeof b?.color === "string" && b.color.trim() ? b.color.trim() : null;
  const storage = typeof b?.storage === "string" && b.storage.trim() ? b.storage.trim() : null;
  const price = Number(b?.price);
  const compareAtPrice =
    b?.compareAtPrice !== undefined && b?.compareAtPrice !== null && b.compareAtPrice !== ""
      ? Number(b.compareAtPrice)
      : null;
  const weightGram =
    b?.weightGram !== undefined && b?.weightGram !== null && b.weightGram !== ""
      ? Number(b.weightGram)
      : null;
  const barcode = typeof b?.barcode === "string" && b.barcode.trim() ? b.barcode.trim() : null;
  const isActive = b?.isActive !== false;

  const isValid =
    sku.length > 0 &&
    Number.isFinite(price) &&
    price >= 0 &&
    (compareAtPrice === null || (Number.isFinite(compareAtPrice) && compareAtPrice >= 0)) &&
    (weightGram === null || (Number.isInteger(weightGram) && weightGram >= 0));

  if (!isValid) return null;

  return { sku, color, storage, price, compareAtPrice, weightGram, barcode, isActive };
}

export async function getVariantsForProduct(productId: string) {
  return prisma.productVariant.findMany({
    where: { productId },
    orderBy: { sku: "asc" },
  });
}

export async function createVariant(productId: string, input: VariantInput) {
  const existing = await prisma.productVariant.findUnique({ where: { sku: input.sku } });
  if (existing) {
    throw new Error("SKU này đã tồn tại.");
  }
  const variant = await prisma.productVariant.create({ data: { ...input, productId } });
  revalidateTag(PRODUCTS_TAG, { expire: 0 });
  return variant;
}

export async function updateVariant(id: string, input: VariantInput) {
  const existing = await prisma.productVariant.findFirst({
    where: { sku: input.sku, NOT: { id } },
  });
  if (existing) {
    throw new Error("SKU này đã tồn tại.");
  }
  const variant = await prisma.productVariant.update({ where: { id }, data: input });
  revalidateTag(PRODUCTS_TAG, { expire: 0 });
  return variant;
}

export async function deleteVariant(id: string) {
  const orderItemCount = await prisma.orderItem.count({ where: { variantId: id } });
  if (orderItemCount > 0) {
    throw new Error("Không thể xóa vì biến thể này đã có trong đơn hàng.");
  }

  // CartItem.variantId là quan hệ bắt buộc nên xóa thẳng sẽ bị chặn bởi ràng buộc
  // khóa ngoại - dọn giỏ hàng trước (không phải dữ liệu lịch sử nên an toàn để xóa)
  await prisma.cartItem.deleteMany({ where: { variantId: id } });
  await prisma.productVariant.delete({ where: { id } });
  revalidateTag(PRODUCTS_TAG, { expire: 0 });
}
