import { prisma } from "@/lib/prisma";
import { revalidateTag, unstable_cache } from "next/cache";
import { ProductStatus } from "@prisma/client";
import { PRODUCTS_TAG, mapProductToListItem, type ProductListItem } from "@/lib/products";
import { RELATION_TYPES, RELATION_TYPE_LABELS, isRelationType, type RelationType } from "@/lib/relationLabels";

export { RELATION_TYPES, RELATION_TYPE_LABELS, isRelationType };
export type { RelationType };

/**
 * Sản phẩm liên quan/phụ kiện mua kèm do ADMIN TỰ CHỌN — dùng model
 * `ProductRelation` đã có sẵn trong schema từ đầu dự án nhưng chưa một dòng
 * code nào dùng tới. Trước đó "sản phẩm liên quan" ở trang chi tiết chỉ là 4
 * sản phẩm bất kỳ cùng danh mục, không chọn tay được và không bao giờ vượt
 * được ra ngoài danh mục (nên không thể gợi ý MacBook khi khách xem iPhone).
 *
 * QUAN HỆ MỘT CHIỀU: thêm A -> B KHÔNG tự tạo B -> A. Đúng với thực tế bán
 * hàng (ốp lưng là phụ kiện của điện thoại, nhưng điện thoại không phải phụ
 * kiện của ốp lưng). Muốn hiện ở cả 2 phía thì admin thêm cả 2 chiều.
 */

/** Trần số liên kết mỗi sản phẩm — đủ cho vài section, đủ chặn nhập nhầm hàng loạt. */
export const MAX_RELATIONS_PER_PRODUCT = 12;

export function parseRelationType(value: unknown): RelationType | null {
  return isRelationType(value) ? value : null;
}

export interface AdminRelationItem {
  id: string;
  type: RelationType;
  relatedProduct: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    /** Hiện nhãn cảnh báo nếu sản phẩm đã ngừng bán — nó sẽ KHÔNG hiện cho khách. */
    discontinued: boolean;
  };
}

/**
 * ProductRelation KHÔNG có cột createdAt, nên sắp theo `id`: cuid() có tiền tố
 * timestamp base36 nên thứ tự chuỗi = thứ tự thêm vào. Nhờ vậy danh sách ở
 * admin và ở trang sản phẩm luôn cùng một thứ tự ổn định, không đảo lung tung
 * giữa các lần tải.
 */
export async function getRelationsForAdmin(productId: string): Promise<AdminRelationItem[]> {
  const rows = await prisma.productRelation.findMany({
    where: { baseProductId: productId },
    orderBy: { id: "asc" },
    include: {
      relatedProduct: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
        },
      },
    },
  });

  return rows.map((r) => ({
    // Giá trị lạ trong DB (cột là String tự do) vẫn hiện ra được thay vì làm vỡ
    // trang — coi như RELATED.
    id: r.id,
    type: isRelationType(r.type) ? r.type : "RELATED",
    relatedProduct: {
      id: r.relatedProduct.id,
      name: r.relatedProduct.name,
      slug: r.relatedProduct.slug,
      imageUrl: r.relatedProduct.images[0]?.url ?? null,
      discontinued: r.relatedProduct.status === ProductStatus.DISCONTINUED,
    },
  }));
}

export async function addProductRelation(
  baseProductId: string,
  relatedProductId: string,
  type: RelationType
) {
  if (baseProductId === relatedProductId) {
    throw new Error("Không thể liên kết sản phẩm với chính nó.");
  }

  const [base, related, count] = await Promise.all([
    prisma.product.findUnique({ where: { id: baseProductId }, select: { id: true } }),
    prisma.product.findUnique({
      where: { id: relatedProductId },
      select: { id: true, status: true },
    }),
    prisma.productRelation.count({ where: { baseProductId } }),
  ]);

  if (!base) throw new Error("Không tìm thấy sản phẩm gốc.");
  if (!related) throw new Error("Không tìm thấy sản phẩm được liên kết.");
  if (related.status === ProductStatus.DISCONTINUED) {
    // Chặn ngay từ đầu thay vì để admin thêm xong rồi thắc mắc vì sao khách
    // không thấy gì (getRelatedProductGroups lọc bỏ sản phẩm ngừng bán).
    throw new Error("Sản phẩm này đã ngừng bán, liên kết sẽ không hiện cho khách.");
  }
  if (count >= MAX_RELATIONS_PER_PRODUCT) {
    throw new Error(`Mỗi sản phẩm chỉ liên kết tối đa ${MAX_RELATIONS_PER_PRODUCT} sản phẩm khác.`);
  }

  // @@unique([baseProductId, relatedProductId]) — tự kiểm tra trước để trả
  // thông báo tiếng Việt thay vì để lỗi P2002 thô của Postgres lọt ra.
  const existing = await prisma.productRelation.findUnique({
    where: { baseProductId_relatedProductId: { baseProductId, relatedProductId } },
  });
  if (existing) {
    throw new Error("Sản phẩm này đã có trong danh sách liên kết.");
  }

  const created = await prisma.productRelation.create({
    data: { baseProductId, relatedProductId, type },
  });
  revalidateTag(PRODUCTS_TAG, { expire: 0 });
  return created;
}

export async function deleteProductRelation(id: string) {
  const existing = await prisma.productRelation.findUnique({ where: { id } });
  if (!existing) throw new Error("Không tìm thấy liên kết.");

  await prisma.productRelation.delete({ where: { id } });
  revalidateTag(PRODUCTS_TAG, { expire: 0 });
}

export interface RelatedProductGroup {
  type: RelationType;
  label: string;
  products: ProductListItem[];
}

/**
 * Dữ liệu cho trang chi tiết sản phẩm, gom theo loại liên kết.
 * Cache chung PRODUCTS_TAG (không tạo tag riêng): mọi chỗ sửa sản phẩm/biến
 * thể đã tự revalidateTag(PRODUCTS_TAG), và add/deleteProductRelation ở trên
 * cũng gọi đúng tag đó. `revalidate` bắt buộc phải có bên cạnh `tags` —
 * Data Cache của Vercel sống qua các lần deploy, thiếu nó là kẹt vĩnh viễn
 * khi dữ liệu bị sửa bằng script (xem mục Lưu ý quan trọng trong CLAUDE.md).
 */
export const getRelatedProductGroups = unstable_cache(
  async (productId: string): Promise<RelatedProductGroup[]> => {
    const rows = await prisma.productRelation.findMany({
      where: {
        baseProductId: productId,
        // Sản phẩm ngừng bán/đã ẩn thì không hiện cho khách. Không xóa liên
        // kết — admin có thể mở bán lại sau.
        relatedProduct: { status: ProductStatus.ACTIVE },
      },
      orderBy: { id: "asc" },
      include: {
        relatedProduct: {
          include: {
            brand: { select: { name: true } },
            category: { select: { name: true, slug: true } },
            images: { orderBy: { sortOrder: "asc" }, take: 1 },
            variants: { where: { isActive: true }, select: { price: true, compareAtPrice: true } },
            reviews: { where: { isVisible: true }, select: { rating: true } },
          },
        },
      },
    });

    // Thứ tự section cố định theo RELATION_TYPES (phụ kiện -> nâng cấp -> liên
    // quan), không theo thứ tự admin thêm vào.
    return RELATION_TYPES.map((type) => ({
      type,
      label: RELATION_TYPE_LABELS[type],
      products: rows
        .filter((r) => (isRelationType(r.type) ? r.type : "RELATED") === type)
        .map((r) => mapProductToListItem(r.relatedProduct)),
    })).filter((group) => group.products.length > 0);
  },
  ["product-relations"],
  { tags: [PRODUCTS_TAG], revalidate: 60 }
);
