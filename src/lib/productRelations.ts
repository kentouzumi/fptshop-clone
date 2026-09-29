import { prisma } from "@/lib/prisma";
import { revalidateTag, unstable_cache } from "next/cache";
import { ProductStatus, OrderStatus } from "@prisma/client";
import { PRODUCTS_TAG, mapProductToListItem, type ProductListItem } from "@/lib/products";
import type { Prisma } from "@prisma/client";
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
  sortOrder: number;
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
 * Sắp theo `sortOrder` (admin tự đổi được bằng nút lên/xuống), rồi tới `id` làm
 * mốc phụ cho các dòng cùng sortOrder — ProductRelation KHÔNG có cột createdAt,
 * nhưng cuid() có tiền tố timestamp base36 nên thứ tự chuỗi = thứ tự thêm vào.
 * Admin và trang khách dùng CHUNG thứ tự này.
 */
export const RELATION_ORDER_BY = [{ sortOrder: "asc" as const }, { id: "asc" as const }];

export async function getRelationsForAdmin(productId: string): Promise<AdminRelationItem[]> {
  const rows = await prisma.productRelation.findMany({
    where: { baseProductId: productId },
    orderBy: RELATION_ORDER_BY,
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
    sortOrder: r.sortOrder,
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

  // Xếp cuối NHÓM CÙNG LOẠI (không phải cuối toàn bộ danh sách) — mỗi loại là
  // 1 section riêng ở trang sản phẩm nên thứ tự chỉ có nghĩa trong nội bộ loại.
  const last = await prisma.productRelation.findFirst({
    where: { baseProductId, type },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const created = await prisma.productRelation.create({
    data: { baseProductId, relatedProductId, type, sortOrder: (last?.sortOrder ?? 0) + 1 },
  });
  revalidateTag(PRODUCTS_TAG, { expire: 0 });
  return created;
}

/**
 * Đổi thứ tự bằng cách HOÁN ĐỔI sortOrder với hàng xóm liền kề TRONG CÙNG LOẠI
 * (nút lên/xuống, không kéo-thả — không cần thêm thư viện nào).
 * Hoán đổi 2 dòng nằm trong 1 transaction để không bao giờ có trạng thái giữa
 * chừng 2 dòng cùng sortOrder.
 */
export async function moveProductRelation(id: string, direction: "up" | "down") {
  const current = await prisma.productRelation.findUnique({ where: { id } });
  if (!current) throw new Error("Không tìm thấy liên kết.");

  const neighbour = await prisma.productRelation.findFirst({
    where: {
      baseProductId: current.baseProductId,
      type: current.type,
      // So sánh theo CẶP (sortOrder, id) chứ không chỉ sortOrder: các dòng cũ
      // tạo trước khi có cột này đều mang sortOrder = 0, chỉ so sortOrder sẽ
      // không tìm ra hàng xóm nào và nút bấm không có tác dụng.
      ...(direction === "up"
        ? {
            OR: [
              { sortOrder: { lt: current.sortOrder } },
              { sortOrder: current.sortOrder, id: { lt: current.id } },
            ],
          }
        : {
            OR: [
              { sortOrder: { gt: current.sortOrder } },
              { sortOrder: current.sortOrder, id: { gt: current.id } },
            ],
          }),
    },
    orderBy:
      direction === "up"
        ? [{ sortOrder: "desc" }, { id: "desc" }]
        : [{ sortOrder: "asc" }, { id: "asc" }],
  });

  // Đã ở đầu/cuối nhóm: không phải lỗi, chỉ là không có gì để đổi.
  if (!neighbour) return false;

  await prisma.$transaction([
    prisma.productRelation.update({
      where: { id: current.id },
      data: { sortOrder: neighbour.sortOrder },
    }),
    prisma.productRelation.update({
      where: { id: neighbour.id },
      data: { sortOrder: current.sortOrder },
    }),
  ]);
  // 2 dòng cũ cùng sortOrder = 0 thì hoán đổi không đổi được gì — ép lại theo
  // vị trí mong muốn để nút bấm luôn có tác dụng thấy được.
  if (current.sortOrder === neighbour.sortOrder) {
    await prisma.productRelation.update({
      where: { id: current.id },
      data: { sortOrder: direction === "up" ? current.sortOrder - 1 : current.sortOrder + 1 },
    });
  }

  revalidateTag(PRODUCTS_TAG, { expire: 0 });
  return true;
}

export async function deleteProductRelation(id: string) {
  const existing = await prisma.productRelation.findUnique({ where: { id } });
  if (!existing) throw new Error("Không tìm thấy liên kết.");

  await prisma.productRelation.delete({ where: { id } });
  revalidateTag(PRODUCTS_TAG, { expire: 0 });
}

/** Card sản phẩm + biến thể mặc định để nút "mua cả combo" có cái mà bỏ vào giỏ. */
export interface RelatedProductItem extends ProductListItem {
  /** Biến thể RẺ NHẤT đang bán — đúng biến thể ứng với `minPrice` card đang hiện.
   *  null khi sản phẩm chưa có biến thể nào (không mua kèm được). */
  defaultVariantId: string | null;
}

export interface RelatedProductGroup {
  type: RelationType;
  label: string;
  products: RelatedProductItem[];
}

/** Nhận `variants` qua tham số RIÊNG thay vì giao (&) vào kiểu của `p`: giao 2
 *  kiểu mảng khác nhau làm TypeScript suy ra phần tử thành giao của cả 2, khiến
 *  chính mảng truyền vào không còn hợp lệ. */
function toRelatedItem(
  p: Parameters<typeof mapProductToListItem>[0],
  variants: { id: string; price: Prisma.Decimal }[]
): RelatedProductItem {
  const cheapest = variants.reduce<(typeof variants)[number] | null>(
    (best, v) => (best === null || Number(v.price) < Number(best.price) ? v : best),
    null
  );
  return { ...mapProductToListItem(p), defaultVariantId: cheapest?.id ?? null };
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
      orderBy: RELATION_ORDER_BY,
      include: {
        relatedProduct: {
          include: {
            brand: { select: { name: true } },
            category: { select: { name: true, slug: true } },
            images: { orderBy: { sortOrder: "asc" }, take: 1 },
            variants: {
              where: { isActive: true },
              select: { id: true, price: true, compareAtPrice: true },
            },
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
        .map((r) => toRelatedItem(r.relatedProduct, r.relatedProduct.variants)),
    })).filter((group) => group.products.length > 0);
  },
  ["product-relations"],
  { tags: [PRODUCTS_TAG], revalidate: 60 }
);

/**
 * "Khách mua sản phẩm này cũng mua" — suy TỪ ĐƠN HÀNG THẬT (OrderItem), không
 * phải admin chọn tay như phần trên. Bổ sung cho liên kết thủ công chứ không
 * thay thế: admin không phải đoán trước mọi cặp sản phẩm hay bán chung.
 *
 * Bỏ qua đơn ĐÃ HỦY và ĐÃ TRẢ — hàng trả lại không phải bằng chứng mua chung
 * (cùng cách loại 2 trạng thái này khỏi doanh thu ở lib/dashboard.ts).
 *
 * CACHE: tag PRODUCTS_TAG nhưng KHÔNG có chỗ nào revalidate khi có đơn mới
 * (đặt hàng không đụng tới sản phẩm) — nên `revalidate: 600` mới là giới hạn
 * độ tươi thật sự. Chấp nhận được: thống kê mua chung vốn chỉ đổi đáng kể sau
 * hàng chục đơn, không phải sau từng đơn.
 */
export const getFrequentlyBoughtTogether = unstable_cache(
  async (productId: string, limit = 4): Promise<ProductListItem[]> => {
    const orderRows = await prisma.orderItem.findMany({
      where: {
        variant: { productId },
        order: { status: { notIn: [OrderStatus.CANCELLED, OrderStatus.RETURNED] } },
      },
      select: { orderId: true },
      distinct: ["orderId"],
      // Trần để 1 sản phẩm bán chạy không kéo theo truy vấn khổng lồ; các đơn
      // gần nhất là đại diện tốt nhất cho thói quen mua hiện tại.
      orderBy: { orderId: "desc" },
      take: 300,
    });
    if (orderRows.length === 0) return [];

    const siblings = await prisma.orderItem.findMany({
      where: {
        orderId: { in: orderRows.map((r) => r.orderId) },
        variant: { productId: { not: productId } },
      },
      select: { orderId: true, variant: { select: { productId: true } } },
    });

    // Đếm theo SỐ ĐƠN chứa sản phẩm đó, không phải số dòng OrderItem: 1 đơn mua
    // 3 cái cùng lúc vẫn chỉ là 1 lần "mua chung".
    const ordersByProduct = new Map<string, Set<string>>();
    for (const row of siblings) {
      const set = ordersByProduct.get(row.variant.productId) ?? new Set<string>();
      set.add(row.orderId);
      ordersByProduct.set(row.variant.productId, set);
    }
    if (ordersByProduct.size === 0) return [];

    const ranked = [...ordersByProduct.entries()]
      .sort((a, b) => b[1].size - a[1].size)
      .slice(0, limit)
      .map(([id]) => id);

    const rows = await prisma.product.findMany({
      where: { id: { in: ranked }, status: ProductStatus.ACTIVE },
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true, slug: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        variants: { where: { isActive: true }, select: { price: true, compareAtPrice: true } },
        reviews: { where: { isVisible: true }, select: { rating: true } },
      },
    });

    // Giữ đúng thứ hạng đã tính (findMany trả về theo thứ tự DB, không theo `in`).
    const byId = new Map(rows.map((r) => [r.id, r]));
    return ranked
      .map((id) => byId.get(id))
      .filter((r): r is NonNullable<typeof r> => Boolean(r))
      .map(mapProductToListItem);
  },
  ["frequently-bought-together"],
  { tags: [PRODUCTS_TAG], revalidate: 600 }
);
