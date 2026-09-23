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
  /** Nhiều slug thương hiệu cùng lúc (OR với nhau) — bộ lọc "Hãng sản xuất" ở
   * sidebar /products giờ cho chọn nhiều checkbox cùng lúc thay vì chỉ 1. */
  brandSlugs?: string[];
  /** Lọc theo thông số kỹ thuật (ProductAttribute): key là attrName THẬT
   * (vd "RAM", "Hệ điều hành"), value là danh sách giá trị được chọn — OR
   * trong CÙNG 1 attrName, AND giữa CÁC attrName khác nhau. Xem
   * getAttributeFacets() ngay bên dưới để biết attrName nào tồn tại theo
   * từng danh mục. */
  attributeFilters?: Record<string, string[]>;
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

  // Category cấp cao (vd "tivi-may-lanh-dieu-hoa") giờ chỉ là nhóm hiển thị
  // cho mega menu — bản thân nó KHÔNG còn được gán sản phẩm trực tiếp nữa
  // (xem prisma/seed.ts, mỗi tên tách thành 1 category con riêng: "Tivi",
  // "Máy lạnh - Điều hòa"...). Nếu chỉ lọc đúng categoryId của category
  // được truyền vào, bấm vào link category cấp cao ở lưới trang chủ (vẫn
  // trỏ tới slug cấp cao như trước) sẽ luôn ra rỗng dù có sản phẩm ở các
  // category con — nên khi lọc theo categorySlug, MỞ RỘNG thêm luôn id của
  // mọi category con (nếu có) để trang /products?category=<slug-cha> hiện
  // đúng TOÀN BỘ sản phẩm thuộc các nhóm con, giống hành vi duyệt danh mục
  // thông thường (danh mục cha = union sản phẩm của các danh mục con).
  let categoryIds: string[] | undefined;
  if (params.categorySlug) {
    const category = await prisma.category.findUnique({
      where: { slug: params.categorySlug },
      select: { id: true, children: { select: { id: true } } },
    });
    categoryIds = category ? [category.id, ...category.children.map((c) => c.id)] : [];
  }

  // Mỗi attrName được chọn là 1 điều kiện `attributes.some` RIÊNG kết hợp
  // bằng AND (vd RAM=8GB VÀ Hệ điều hành=Android) — không gộp chung 1 khóa
  // `attributes` vì object literal chỉ giữ được key cuối cùng nếu ghi đè
  // nhiều lần, phải dùng mảng `AND` để Prisma AND đúng nhiều điều kiện trên
  // CÙNG 1 quan hệ. Trong CÙNG 1 attrName, nhiều giá trị được chọn là OR
  // (attrValue: { in: [...] }).
  const attributeConditions: Prisma.ProductWhereInput[] = Object.entries(
    params.attributeFilters ?? {}
  ).map(([attrName, values]) => ({
    attributes: { some: { attrName, attrValue: { in: values } } },
  }));

  const where: Prisma.ProductWhereInput = {
    status: ProductStatus.ACTIVE,
    ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
    ...(params.brandSlugs?.length ? { brand: { slug: { in: params.brandSlugs } } } : {}),
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
    ...(attributeConditions.length > 0 ? { AND: attributeConditions } : {}),
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

export interface CategoryBrandItem {
  name: string;
  slug: string;
}

// Dùng cho mega menu "Danh mục" ở Header: brand hiện dưới mỗi danh mục PHẢI
// là brand THẬT SỰ có sản phẩm active trong danh mục đó (vd Dell chỉ hiện ở
// Laptop, không hiện ở Điện thoại) — suy ra trực tiếp từ Product thay vì
// dùng nguyên danh sách Brand toàn hệ thống (sai thực tế, brand nào cũng
// hiện dưới mọi danh mục). Cache chung PRODUCTS_TAG vì phụ thuộc dữ liệu
// Product (categoryId+brandId) — mọi chỗ đã tự revalidateTag(PRODUCTS_TAG)
// khi tạo/sửa/xóa sản phẩm nên không cần thêm tag riêng.
export const getBrandsByCategory = unstable_cache(
  async (): Promise<Record<string, CategoryBrandItem[]>> => {
    const rows = await prisma.product.findMany({
      where: { status: ProductStatus.ACTIVE, brandId: { not: null } },
      select: {
        category: { select: { slug: true } },
        brand: { select: { name: true, slug: true } },
      },
    });

    const result: Record<string, Map<string, CategoryBrandItem>> = {};
    for (const row of rows) {
      if (!row.brand) continue;
      const catSlug = row.category.slug;
      const brandMap = result[catSlug] ?? (result[catSlug] = new Map());
      brandMap.set(row.brand.slug, row.brand);
    }

    const sorted: Record<string, CategoryBrandItem[]> = {};
    for (const [catSlug, brandMap] of Object.entries(result)) {
      sorted[catSlug] = [...brandMap.values()].sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  },
  ["brands-by-category"],
  { tags: [PRODUCTS_TAG], revalidate: 60 }
);

function slugifyAttr(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export interface AttributeFacetValue {
  value: string;
  slug: string;
  count: number;
}

export interface AttributeFacet {
  attrName: string;
  slug: string;
  values: AttributeFacetValue[];
}

// Bộ lọc theo thông số kỹ thuật RIÊNG cho từng danh mục: mỗi danh mục khai
// báo tường minh những thông số nào được dùng làm bộ lọc, theo ĐÚNG thứ tự
// hiển thị trong sidebar. Trước đây danh sách này được suy ra tự động từ dữ
// liệu ProductAttribute thật — hợp lý khi danh mục còn là nhóm tổng gộp
// nhiều loại thiết bị khác hẳn nhau, nhưng giờ mỗi danh mục chỉ còn đúng 1
// loại sản phẩm nên khai báo tường minh tốt hơn: thứ tự bộ lọc do mình quyết
// định (không phải xếp theo bảng chữ cái), và các thông số chỉ để THAM KHẢO
// ở trang chi tiết (camera, trọng lượng, cổng kết nối...) không lẫn vào
// sidebar dù chúng cũng nằm trong ProductAttribute.
//
// Giá trị trong `attrName` phải khớp CHÍNH XÁC attrName trong DB (xem
// prisma/seed.ts) — sai một chữ thì bộ lọc đó không có giá trị nào để chọn.
export const CATEGORY_FILTER_SPECS: Record<string, string[]> = {
  "dien-thoai": ["Hiệu năng và Pin", "Dung lượng ROM", "RAM", "Tần số quét"],
  laptop: ["CPU", "RAM", "Card đồ họa", "Ổ cứng", "Kích thước màn hình", "Tần số quét"],
  tivi: ["Loại tivi", "Kích thước màn hình", "Độ phân giải", "Tần số quét"],
};

export const getAttributeFacets = unstable_cache(
  async (categorySlug: string): Promise<AttributeFacet[]> => {
    const specNames = CATEGORY_FILTER_SPECS[categorySlug];
    if (!specNames) return [];

    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
      select: { id: true, children: { select: { id: true } } },
    });
    if (!category) return [];
    const categoryIds = [category.id, ...category.children.map((c) => c.id)];

    const rows = await prisma.productAttribute.findMany({
      where: {
        attrName: { in: specNames },
        product: { categoryId: { in: categoryIds }, status: ProductStatus.ACTIVE },
      },
      select: { productId: true, attrName: true, attrValue: true },
    });

    // Đếm theo SỐ SẢN PHẨM (Set productId) chứ không phải số dòng thuộc tính:
    // 1 sản phẩm có thể có nhiều dòng cùng attrName (vd máy bán cả bản 128GB
    // lẫn 256GB, hoặc nhiều nhãn "Hiệu năng và Pin"), đếm dòng sẽ ra số lớn
    // hơn số sản phẩm thực sự hiện ra sau khi lọc.
    const byAttrName = new Map<string, Map<string, Set<string>>>();
    for (const row of rows) {
      const values = byAttrName.get(row.attrName) ?? new Map<string, Set<string>>();
      const productIds = values.get(row.attrValue) ?? new Set<string>();
      productIds.add(row.productId);
      values.set(row.attrValue, productIds);
      byAttrName.set(row.attrName, values);
    }

    // So sánh có nhận biết SỐ (numeric: true) để "8GB" đứng trước "12GB" và
    // "43 inch" trước "50 inch" — so sánh chuỗi thuần sẽ xếp "12GB" lên trước.
    const collator = new Intl.Collator("vi", { numeric: true });

    return specNames
      .map((attrName) => ({
        attrName,
        slug: slugifyAttr(attrName),
        values: [...(byAttrName.get(attrName) ?? new Map()).entries()]
          .map(([value, productIds]) => ({
            value,
            slug: slugifyAttr(value),
            count: productIds.size,
          }))
          .sort((a, b) => collator.compare(a.value, b.value)),
      }))
      .filter((facet) => facet.values.length > 0);
  },
  ["attribute-facets"],
  { tags: [PRODUCTS_TAG], revalidate: 60 }
);

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
