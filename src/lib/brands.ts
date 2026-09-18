import { prisma } from "@/lib/prisma";

export interface BrandInput {
  name: string;
  slug: string;
  logoUrl: string | null;
  isActive: boolean;
}

export function parseBrandInput(body: unknown): BrandInput | null {
  const b = body as Record<string, unknown>;
  const name = typeof b?.name === "string" ? b.name.trim() : "";
  const slug = typeof b?.slug === "string" ? b.slug.trim() : "";
  const logoUrl = typeof b?.logoUrl === "string" && b.logoUrl.trim() ? b.logoUrl.trim() : null;
  const isActive = b?.isActive !== false;

  if (name.length < 2 || !/^[a-z0-9-]+$/.test(slug)) {
    return null;
  }

  return { name, slug, logoUrl, isActive };
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
  return prisma.brand.create({ data: input });
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
  return prisma.brand.update({ where: { id }, data: input });
}

export async function deleteBrand(id: string) {
  const productCount = await prisma.product.count({ where: { brandId: id } });
  if (productCount > 0) {
    throw new Error("Không thể xóa vì còn sản phẩm thuộc thương hiệu này.");
  }
  await prisma.brand.delete({ where: { id } });
}
