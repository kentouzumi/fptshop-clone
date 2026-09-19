import { prisma } from "@/lib/prisma";
import { revalidateTag, unstable_cache } from "next/cache";

const CATEGORIES_TAG = "categories";

// Danh sách category công khai (menu trang chủ, chip lọc ở /products) hầu như
// không đổi giữa các lần admin thao tác — cache bằng unstable_cache (Next.js
// Data Cache, không cần Redis riêng) thay vì query lại DB mỗi request. Chỉ
// dùng cho phần PUBLIC (isActive:true); trang admin (getAllCategoriesForAdmin)
// vẫn query trực tiếp để luôn thấy dữ liệu mới nhất khi quản lý.
//
// CHỈ lấy category CẤP CAO NHẤT (parentId: null) — từ khi có category con
// (xem prisma/seed.ts: các danh mục gộp kiểu "Thiết bị bếp, Máy rửa bát,
// Máy hút mùi" giờ là 1 category cha chứa nhiều category con để mỗi tên
// chọn được riêng), nếu không lọc thì trang chủ/trang /products sẽ hiện
// LẪN cả ~50 category con vào lưới/chip vốn chỉ nên có 23 mục cấp cao.
export const getActiveCategories = unstable_cache(
  async () =>
    prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: "asc" },
    }),
  ["active-categories"],
  { tags: [CATEGORIES_TAG] }
);

// Dành riêng cho mega menu "Danh mục" ở Header: cần thêm category con của
// mỗi category cấp cao (nếu có) để hiện được từng tên tách riêng, mỗi tên
// vẫn là 1 <Link> chọn được độc lập — xem CategoryMegaMenu.tsx.
export const getActiveCategoriesWithChildren = unstable_cache(
  async () =>
    prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: "asc" },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
  ["active-categories-with-children"],
  { tags: [CATEGORIES_TAG] }
);

export interface CategoryInput {
  name: string;
  slug: string;
  parentId: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

export function parseCategoryInput(body: unknown): CategoryInput | null {
  const b = body as Record<string, unknown>;
  const name = typeof b?.name === "string" ? b.name.trim() : "";
  const slug = typeof b?.slug === "string" ? b.slug.trim() : "";
  const parentId = typeof b?.parentId === "string" && b.parentId ? b.parentId : null;
  const imageUrl = typeof b?.imageUrl === "string" && b.imageUrl.trim() ? b.imageUrl.trim() : null;
  const sortOrder = Number.isFinite(Number(b?.sortOrder)) ? Number(b.sortOrder) : 0;
  const isActive = b?.isActive !== false;

  if (name.length < 2 || !/^[a-z0-9-]+$/.test(slug)) {
    return null;
  }

  return { name, slug, parentId, imageUrl, sortOrder, isActive };
}

export async function getAllCategoriesForAdmin() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { parent: true, _count: { select: { products: true, children: true } } },
  });
}

export async function createCategory(input: CategoryInput) {
  const existing = await prisma.category.findUnique({ where: { slug: input.slug } });
  if (existing) {
    throw new Error("Slug này đã tồn tại.");
  }
  const category = await prisma.category.create({ data: input });
  revalidateTag(CATEGORIES_TAG, { expire: 0 });
  return category;
}

export async function updateCategory(id: string, input: CategoryInput) {
  if (input.parentId === id) {
    throw new Error("Danh mục không thể là danh mục cha của chính nó.");
  }
  const existing = await prisma.category.findFirst({
    where: { slug: input.slug, NOT: { id } },
  });
  if (existing) {
    throw new Error("Slug này đã tồn tại.");
  }
  const category = await prisma.category.update({ where: { id }, data: input });
  revalidateTag(CATEGORIES_TAG, { expire: 0 });
  return category;
}

export async function deleteCategory(id: string) {
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    throw new Error("Không thể xóa vì còn sản phẩm thuộc danh mục này.");
  }
  const childCount = await prisma.category.count({ where: { parentId: id } });
  if (childCount > 0) {
    throw new Error("Không thể xóa vì còn danh mục con bên trong danh mục này.");
  }
  await prisma.category.delete({ where: { id } });
  revalidateTag(CATEGORIES_TAG, { expire: 0 });
}
