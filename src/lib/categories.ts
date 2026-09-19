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

// Trả về DẠNG PHẲNG nhưng đúng thứ tự cha-rồi-tới-con (không sort chung 1
// mảng theo sortOrder/name như trước — với 52 category con mới thêm, sort
// phẳng khiến con của các cha khác nhau bị trộn lẫn ngẫu nhiên, rất khó
// quản lý). Mỗi dòng có thêm `depth` (0 = cấp cao nhất, 1 = con) để trang
// admin/categories thụt lề hiển thị đúng cây phân cấp.
export async function getAllCategoriesForAdmin() {
  const topLevel = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      parent: true,
      _count: { select: { products: true, children: true } },
      children: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: { parent: true, _count: { select: { products: true, children: true } } },
      },
    },
  });

  return topLevel.flatMap((top) => {
    const { children, ...topRow } = top;
    return [
      { ...topRow, depth: 0 as const },
      ...children.map((child) => ({ ...child, depth: 1 as const })),
    ];
  });
}

// Chỉ hỗ trợ tối đa 2 cấp cha/con (xem prisma/seed.ts + getProducts() ở
// lib/products.ts — cả 2 chỉ tra ĐÚNG 1 cấp children, không đệ quy nhiều
// cấp). Dropdown chọn cha ở admin đã lọc chỉ còn category cấp cao nhất
// (xem admin/categories/new,[id]/edit) nhưng vẫn tự kiểm tra lại ở đây
// (không tin dữ liệu client) phòng trường hợp gọi thẳng API — nếu không,
// tạo được cấp thứ 3 sẽ khiến category đó biến mất khỏi mega menu/kết quả
// duyệt theo danh mục cha dù vẫn tồn tại trong DB.
async function assertValidParent(parentId: string | null) {
  if (!parentId) return;
  const parent = await prisma.category.findUnique({
    where: { id: parentId },
    select: { parentId: true },
  });
  if (!parent) {
    throw new Error("Danh mục cha không tồn tại.");
  }
  if (parent.parentId) {
    throw new Error("Không thể chọn 1 danh mục con làm danh mục cha (chỉ hỗ trợ tối đa 2 cấp).");
  }
}

export async function createCategory(input: CategoryInput) {
  const existing = await prisma.category.findUnique({ where: { slug: input.slug } });
  if (existing) {
    throw new Error("Slug này đã tồn tại.");
  }
  await assertValidParent(input.parentId);
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
  await assertValidParent(input.parentId);
  if (input.parentId) {
    const childCount = await prisma.category.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new Error(
        "Danh mục này đang là cha của danh mục khác, không thể biến nó thành danh mục con."
      );
    }
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
