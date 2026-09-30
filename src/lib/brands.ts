import { prisma } from "@/lib/prisma";
import { PRODUCTS_TAG } from "@/lib/products";
import { ProductStatus } from "@prisma/client";
import { revalidateTag, unstable_cache } from "next/cache";

const BRANDS_TAG = "brands";

export const getActiveBrands = unstable_cache(
  async () =>
    prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ["active-brands"],
  { tags: [BRANDS_TAG], revalidate: 300 }
);

export interface BrandWithCount {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  productCount: number;
}

/**
 * Danh sách thương hiệu cho trang /thuong-hieu.
 *
 * CHỈ trả thương hiệu đang có sản phẩm ACTIVE: bảng Brand còn giữ lại những
 * hãng đã gỡ hết hàng (đồ gia dụng/phụ kiện bỏ bán ở đợt thu gọn danh mục),
 * liệt kê chúng ra thì bấm vào chỉ ra trang rỗng — cùng lý do bộ lọc hãng ở
 * /products suy từ sản phẩm thật chứ không đọc nguyên bảng Brand.
 *
 * Cache 2 tag: BRANDS_TAG (admin sửa tên/logo) và PRODUCTS_TAG (số sản phẩm
 * và việc hãng còn hàng hay không phụ thuộc dữ liệu Product).
 */
export const getBrandsWithProductCount = unstable_cache(
  async (): Promise<BrandWithCount[]> => {
    const rows = await prisma.brand.findMany({
      where: { isActive: true, products: { some: { status: ProductStatus.ACTIVE } } },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        _count: { select: { products: { where: { status: ProductStatus.ACTIVE } } } },
      },
    });
    return rows.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logoUrl: b.logoUrl,
      productCount: b._count.products,
    }));
  },
  ["brands-with-count"],
  { tags: [BRANDS_TAG, PRODUCTS_TAG], revalidate: 300 }
);

export interface BrandPageData {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  /** Danh mục CẤP CAO mà hãng này thật sự có hàng, kèm số sản phẩm. */
  categories: { name: string; slug: string; productCount: number }[];
  productCount: number;
}

/**
 * Dữ liệu trang thương hiệu /thuong-hieu/[slug].
 *
 * Hàng chip danh mục gom về danh mục CẤP CAO (qua `parent`) thay vì danh mục
 * con: một hãng như Apple có hàng ở "iPhone 15 Series" và "MacBook" — hiện
 * 2 chip đó thì lẫn 2 cấp với nhau, gom lên "Điện thoại"/"Laptop" mới đúng
 * là phân loại lớn mà người xem trang hãng cần.
 */
export const getBrandPageData = unstable_cache(
  async (slug: string): Promise<BrandPageData | null> => {
    const brand = await prisma.brand.findFirst({
      where: { slug, isActive: true },
      select: { id: true, name: true, slug: true, logoUrl: true, description: true },
    });
    if (!brand) return null;

    const products = await prisma.product.findMany({
      where: { brandId: brand.id, status: ProductStatus.ACTIVE },
      select: {
        category: {
          select: { name: true, slug: true, parent: { select: { name: true, slug: true } } },
        },
      },
    });

    const byCategory = new Map<string, { name: string; slug: string; productCount: number }>();
    for (const p of products) {
      const top = p.category.parent ?? p.category;
      const entry = byCategory.get(top.slug) ?? { name: top.name, slug: top.slug, productCount: 0 };
      entry.productCount += 1;
      byCategory.set(top.slug, entry);
    }

    // Hãng không còn sản phẩm ACTIVE nào -> coi như KHÔNG TỒN TẠI trang (404),
    // đúng cùng điều kiện mà getBrandsWithProductCount dùng để liệt kê. Nếu
    // trả về bình thường thì URL đó mở ra một trang chỉ có tên hãng và dòng
    // "không có sản phẩm nào" — nội dung mỏng, lại đang ở trạng thái được
    // index, trong khi chính trang danh sách thương hiệu đã cố tình ẩn nó.
    // Bảng Brand vẫn giữ nguyên bản ghi (admin quản lý/dùng lại được), chỉ
    // là không có trang công khai khi chưa có hàng.
    if (products.length === 0) return null;

    return {
      ...brand,
      productCount: products.length,
      categories: [...byCategory.values()].sort((a, b) => b.productCount - a.productCount),
    };
  },
  ["brand-page-data"],
  { tags: [BRANDS_TAG, PRODUCTS_TAG], revalidate: 300 }
);

/** Slug của mọi thương hiệu còn hàng — dùng cho sitemap.xml. */
export const getBrandSlugsForSitemap = unstable_cache(
  async () =>
    prisma.brand.findMany({
      where: { isActive: true, products: { some: { status: ProductStatus.ACTIVE } } },
      orderBy: { name: "asc" },
      select: { slug: true },
    }),
  ["brand-slugs-sitemap"],
  { tags: [BRANDS_TAG, PRODUCTS_TAG], revalidate: 3600 }
);

export interface BrandInput {
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  isActive: boolean;
}

export function parseBrandInput(body: unknown): BrandInput | null {
  const b = body as Record<string, unknown>;
  const name = typeof b?.name === "string" ? b.name.trim() : "";
  const slug = typeof b?.slug === "string" ? b.slug.trim() : "";
  const logoUrl = typeof b?.logoUrl === "string" && b.logoUrl.trim() ? b.logoUrl.trim() : null;
  const description =
    typeof b?.description === "string" && b.description.trim() ? b.description.trim() : null;
  const isActive = b?.isActive !== false;

  if (name.length < 2 || !/^[a-z0-9-]+$/.test(slug)) {
    return null;
  }

  return { name, slug, logoUrl, description, isActive };
}

export async function getAllBrandsForAdmin() {
  return prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

export async function createBrand(input: BrandInput) {
  const existingSlug = await prisma.brand.findUnique({ where: { slug: input.slug } });
  if (existingSlug) {
    throw new Error("Slug này đã tồn tại.");
  }
  const existingName = await prisma.brand.findUnique({ where: { name: input.name } });
  if (existingName) {
    throw new Error("Tên thương hiệu này đã tồn tại.");
  }
  const brand = await prisma.brand.create({ data: input });
  revalidateTag(BRANDS_TAG, { expire: 0 });
  return brand;
}

export async function updateBrand(id: string, input: BrandInput) {
  const existingSlug = await prisma.brand.findFirst({ where: { slug: input.slug, NOT: { id } } });
  if (existingSlug) {
    throw new Error("Slug này đã tồn tại.");
  }
  const existingName = await prisma.brand.findFirst({ where: { name: input.name, NOT: { id } } });
  if (existingName) {
    throw new Error("Tên thương hiệu này đã tồn tại.");
  }
  const brand = await prisma.brand.update({ where: { id }, data: input });
  revalidateTag(BRANDS_TAG, { expire: 0 });
  return brand;
}

export async function deleteBrand(id: string) {
  const productCount = await prisma.product.count({ where: { brandId: id } });
  if (productCount > 0) {
    throw new Error("Không thể xóa vì còn sản phẩm thuộc thương hiệu này.");
  }
  await prisma.brand.delete({ where: { id } });
  revalidateTag(BRANDS_TAG, { expire: 0 });
}
