import { ProductStatus } from "@prisma/client";

export interface ProductAttributeInput {
  groupName: string;
  attrName: string;
  attrValue: string;
}

function parseImages(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseAttributes(raw: unknown): ProductAttributeInput[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const r = item as Record<string, unknown>;
      return {
        groupName: typeof r?.groupName === "string" ? r.groupName.trim() : "",
        attrName: typeof r?.attrName === "string" ? r.attrName.trim() : "",
        attrValue: typeof r?.attrValue === "string" ? r.attrValue.trim() : "",
      };
    })
    .filter((a) => a.groupName && a.attrName && a.attrValue);
}

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
  const images = parseImages(b?.images);
  const attributes = parseAttributes(b?.attributes);

  const isValid =
    name.length >= 2 &&
    /^[a-z0-9-]+$/.test(slug) &&
    description.length > 0 &&
    categoryId.length > 0 &&
    Number.isFinite(basePrice) &&
    basePrice >= 0;

  return {
    isValid,
    values: { name, slug, description, categoryId, brandId, basePrice, status, isFeatured, images, attributes },
  };
}
