import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import { PRODUCTS_TAG } from "@/lib/products";
import { parseImages } from "@/lib/productInput";

export { parseImages };

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

// SKU để trống là hợp lệ (khác trước đây bắt buộc) — createVariant()/
// updateVariant() sẽ tự sinh 1 mã nếu rỗng, xem generateSku() bên dưới.
// Admin không cần biết SKU là gì để vẫn tạo được biến thể.
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
    Number.isFinite(price) &&
    price >= 0 &&
    (compareAtPrice === null || (Number.isFinite(compareAtPrice) && compareAtPrice >= 0)) &&
    (weightGram === null || (Number.isInteger(weightGram) && weightGram >= 0));

  if (!isValid) return null;

  return { sku, color, storage, price, compareAtPrice, weightGram, barcode, isActive };
}

function skuPart(text: string, maxLen: number): string {
  const cleaned = text
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/Đ/g, "D")
    .replace(/[^A-Z0-9]+/g, "");
  return cleaned.slice(0, maxLen);
}

// Sinh SKU từ tên/màu/dung lượng sản phẩm + 5 ký tự ngẫu nhiên để đảm bảo
// không trùng (SKU là unique toàn hệ thống) — dùng khi admin để trống ô SKU
// vì không biết/không cần quan tâm khái niệm này.
function generateSku(productName: string, color: string | null, storage: string | null): string {
  const parts = [skuPart(productName, 16) || "SP"];
  if (color) parts.push(skuPart(color, 8));
  if (storage) parts.push(skuPart(storage, 8));
  parts.push(Math.random().toString(36).slice(2, 7).toUpperCase());
  return parts.join("-");
}

async function resolveSku(
  sku: string,
  productName: string,
  color: string | null,
  storage: string | null,
  excludeId?: string
): Promise<string> {
  if (sku) return sku;
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateSku(productName, color, storage);
    const existing = await prisma.productVariant.findFirst({
      where: { sku: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    });
    if (!existing) return candidate;
  }
  throw new Error("Không thể tự sinh SKU, vui lòng thử lại.");
}

export async function getVariantsForProduct(productId: string) {
  return prisma.productVariant.findMany({
    where: { productId },
    include: { images: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sku: "asc" },
  });
}

export async function createVariant(productId: string, input: VariantInput, images: string[] = []) {
  if (input.sku) {
    const existing = await prisma.productVariant.findUnique({ where: { sku: input.sku } });
    if (existing) {
      throw new Error("SKU này đã tồn tại.");
    }
  }

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { name: true } });
  const sku = await resolveSku(input.sku, product?.name ?? "", input.color, input.storage);

  const variant = await prisma.productVariant.create({
    data: {
      ...input,
      sku,
      productId,
      images: images.length
        ? { create: images.map((url, i) => ({ productId, url, sortOrder: i })) }
        : undefined,
    },
  });
  revalidateTag(PRODUCTS_TAG, { expire: 0 });
  return variant;
}

// `images` optional: undefined = giữ nguyên ảnh hiện có (chỉ sửa các field
// khác), mảng (kể cả rỗng) = THAY THẾ toàn bộ ảnh riêng của biến thể này —
// giống hệt cách lib/productInput.ts xử lý ảnh cấp sản phẩm.
export async function updateVariant(id: string, input: VariantInput, images?: string[]) {
  if (input.sku) {
    const existing = await prisma.productVariant.findFirst({
      where: { sku: input.sku, NOT: { id } },
    });
    if (existing) {
      throw new Error("SKU này đã tồn tại.");
    }
  }

  const current = await prisma.productVariant.findUnique({
    where: { id },
    select: { product: { select: { name: true } } },
  });
  const sku = await resolveSku(input.sku, current?.product.name ?? "", input.color, input.storage, id);

  const variant = await prisma.productVariant.update({ where: { id }, data: { ...input, sku } });

  if (images !== undefined) {
    await prisma.productImage.deleteMany({ where: { variantId: id } });
    if (images.length) {
      await prisma.productImage.createMany({
        data: images.map((url, i) => ({ productId: variant.productId, variantId: id, url, sortOrder: i })),
      });
    }
  }

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
