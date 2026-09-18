import { prisma } from "@/lib/prisma";

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
  return prisma.category.create({ data: input });
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
  return prisma.category.update({ where: { id }, data: input });
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
}
