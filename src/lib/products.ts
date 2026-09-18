import { prisma } from "@/lib/prisma";
import { ProductStatus, Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

export const PRODUCTS_TAG = "products";

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  category: string;
  categorySlug: string;
  imageUrl: string | null;
  minPrice: number;
  maxPrice: number;
  isFeatured: boolean;
  averageRating: number;
  reviewCount: number;
}

export type ProductSort = "newest" | "price_asc" | "price_desc";

export interface GetProductsParams {
  categorySlug?: string;
  brandSlug?: string;
  search?: string;
  featuredOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  page?: number;
  limit?: number;
}

export interface GetProductsResult {
  products: ProductListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ProductRowForMapping {
  id: string;
  name: string;
  slug: string;
  basePrice: Prisma.Decimal;
  isFeatured: boolean;
  brand: { name: string } | null;
  category: { name: string; slug: string };
  images: { url: string }[];
  variants: { price: Prisma.Decimal }[];
  reviews: { rating: number }[];
}

export function mapProductToListItem(p: ProductRowForMapping): ProductListItem {
  const prices = p.variants.map((v) => Number(v.price));
  const minPrice = prices.length ? Math.min(...prices) : Number(p.basePrice);
  const maxPrice = prices.length ? Math.max(...prices) : Number(p.basePrice);
  const reviewCount = p.reviews.length;
  const averageRating = reviewCount
    ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : 0;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand?.name ?? null,
    category: p.category.name,
    categorySlug: p.category.slug,
    imageUrl: p.images[0]?.url ?? null,
    minPrice,
    maxPrice,
    isFeatured: p.isFeatured,
    averageRating,
    reviewCount,
  };
}

export interface ProductSuggestion {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  basePrice: number;
}

export async function searchSuggestions(query: string, limit = 6): Promise<ProductSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const rows = await prisma.product.findMany({
    where: { status: ProductStatus.ACTIVE, name: { contains: q, mode: "insensitive" } },
    orderBy: { name: "asc" },
    take: limit,
    select: {
      id: true,
      name: true,
      slug: true,
      basePrice: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
    },
  });

  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    imageUrl: p.images[0]?.url ?? null,
    basePrice: Number(p.basePrice),
  }));
}

// Danh sách sản phẩm không phụ thuộc user hiện tại (giỏ hàng/wishlist được
// ghép riêng ở tầng gọi, xem trang chủ/trang /products) nên cache được toàn
// bộ kết quả theo params. revalidate: 60 để chấp nhận độ trễ tối đa 1 phút
// khi admin vừa sửa sản phẩm/giá hoặc có review mới làm đổi điểm đánh giá —
// đủ nhanh để cảm nhận là "cập nhật gần như ngay" mà vẫn giảm mạnh số lần
// query DB cho các trang được xem nhiều nhất (trang chủ, trang /products với
// filter phổ biến). revalidateTag(PRODUCTS_TAG) được gọi thêm ở các API tạo/
// sửa/xóa sản phẩm và biến thể để admin thấy thay đổi của chính mình ngay,
// không phải đợi hết 60 giây.
export const getProducts = unstable_cache(
  getProductsUncached,
  ["get-products"],
  { tags: [PRODUCTS_TAG], revalidate: 60 }
);

async function getProductsUncached(
  params: GetProductsParams = {}
): Promise<GetProductsResult> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(48, Math.max(1, params.limit ?? 12));

  const where: Prisma.ProductWhereInput = {
    status: ProductStatus.ACTIVE,
    ...(params.categorySlug ? { category: { slug: params.categorySlug } } : {}),
    ...(params.brandSlug ? { brand: { slug: params.brandSlug } } : {}),
    ...(params.search
      ? { name: { contains: params.search, mode: "insensitive" } }
      : {}),
    ...(params.featuredOnly ? { isFeatured: true } : {}),
    ...(params.minPrice !== undefined || params.maxPrice !== undefined
      ? {
          basePrice: {
            ...(params.minPrice !== undefined ? { gte: params.minPrice } : {}),
            ...(params.maxPrice !== undefined ? { lte: params.maxPrice } : {}),
          },
        }
      : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    params.sort === "price_asc"
      ? { basePrice: "asc" }
      : params.sort === "price_desc"
        ? { basePrice: "desc" }
        : { createdAt: "desc" };

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true, slug: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        variants: { select: { price: true }, where: { isActive: true } },
        reviews: { where: { isVisible: true }, select: { rating: true } },
      },
    }),
  ]);

  const products: ProductListItem[] = rows.map(mapProductToListItem);

  return {
    products,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export interface CompareAttributeGroup {
  groupName: string;
  attrs: { name: string; value: string }[];
}

export interface CompareProductDetail {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  brand: string | null;
  category: string;
  categorySlug: string;
  minPrice: number;
  maxPrice: number;
  averageRating: number;
  reviewCount: number;
  attributeGroups: CompareAttributeGroup[];
}

// Nhận tối đa MAX_COMPARE_ITEMS id (chặn ở tầng API route), trả về đúng thứ tự user đã
// chọn (không phải thứ tự DB trả về) để bảng so sánh không tự đảo cột khi user reload.
export async function getProductsForCompare(ids: string[]): Promise<CompareProductDetail[]> {
  if (ids.length === 0) return [];

  const rows = await prisma.product.findMany({
    where: { id: { in: ids }, status: { not: ProductStatus.DISCONTINUED } },
    include: {
      brand: { select: { name: true } },
      category: { select: { name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      variants: { select: { price: true }, where: { isActive: true } },
      reviews: { where: { isVisible: true }, select: { rating: true } },
      attributes: { orderBy: { sortOrder: "asc" } },
    },
  });

  const byId = new Map(rows.map((r) => [r.id, r]));

  return ids
    .map((id) => byId.get(id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map((p) => {
      const listItem = mapProductToListItem(p);

      const groups = new Map<string, { name: string; value: string }[]>();
      for (const attr of p.attributes) {
        const list = groups.get(attr.groupName) ?? [];
        list.push({ name: attr.attrName, value: attr.attrValue });
        groups.set(attr.groupName, list);
      }

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        imageUrl: listItem.imageUrl,
        brand: listItem.brand,
        category: listItem.category,
        categorySlug: listItem.categorySlug,
        minPrice: listItem.minPrice,
        maxPrice: listItem.maxPrice,
        averageRating: listItem.averageRating,
        reviewCount: listItem.reviewCount,
        attributeGroups: [...groups.entries()].map(([groupName, attrs]) => ({ groupName, attrs })),
      };
    });
}
