import { ProductStatus } from "@prisma/client";

export function parseProductInput(body: unknown) {
  const b = body as Record<string, unknown>;
  const name = typeof b?.name === "string" ? b.name.trim() : "";
  const slug = typeof b?.slug === "string" ? b.slug.trim() : "";
  const description = typeof b?.description === "string" ? b.description.trim() : "";
  const categoryId = typeof b?.categoryId === "string" ? b.categoryId : "";
  const brandId = typeof b?.brandId === "string" && b.brandId ? b.brandId : null;
  const basePrice = Number(b?.basePrice);
  const status = Object.values(ProductStatus).includes(b?.status as ProductStatus)
    ? (b.status as ProductStatus)
    : ProductStatus.DRAFT;
  const isFeatured = Boolean(b?.isFeatured);
  const imageUrl = typeof b?.imageUrl === "string" ? b.imageUrl.trim() : "";

  const isValid =
    name.length >= 2 &&
    /^[a-z0-9-]+$/.test(slug) &&
    description.length > 0 &&
    categoryId.length > 0 &&
    Number.isFinite(basePrice) &&
    basePrice >= 0;

  return {
    isValid,
    values: { name, slug, description, categoryId, brandId, basePrice, status, isFeatured, imageUrl },
  };
}
