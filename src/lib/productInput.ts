import { ProductStatus } from "@prisma/client";

export interface ProductAttributeInput {
  groupName: string;
  attrName: string;
  attrValue: string;
}

export function parseImages(raw: unknown): string[] {
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
  // metaTitle/metaDesc: tiêu đề + mô tả hiện trong kết quả Google. Để trống
  // (null) thì trang sản phẩm tự dùng tên/mô tả sản phẩm làm dự phòng — xem
  // generateMetadata ở products/[slug]/page.tsx. Cắt bớt theo đúng giới hạn
  // Google thường hiển thị để admin không nhập 1 đoạn dài rồi bị cắt giữa chữ.
  const metaTitle =
    typeof b?.metaTitle === "string" && b.metaTitle.trim() ? b.metaTitle.trim().slice(0, 70) : null;
  const metaDesc =
    typeof b?.metaDesc === "string" && b.metaDesc.trim() ? b.metaDesc.trim().slice(0, 160) : null;
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
    values: {
      name,
      slug,
      description,
      categoryId,
      brandId,
      basePrice,
      status,
      isFeatured,
      metaTitle,
      metaDesc,
      images,
      attributes,
    },
  };
}
