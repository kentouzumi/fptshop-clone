import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getVariantsForProduct } from "@/lib/variants";
import ProductForm from "../../ProductForm";
import VariantsManager from "./VariantsManager";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, categories, brands, variants] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { where: { variantId: null }, orderBy: { sortOrder: "asc" } },
        attributes: { orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    getVariantsForProduct(id),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Sửa sản phẩm</h2>
      <ProductForm
        categories={categories}
        brands={brands}
        initial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          categoryId: product.categoryId,
          brandId: product.brandId ?? "",
          basePrice: String(product.basePrice),
          status: product.status,
          isFeatured: product.isFeatured,
          images: product.images.map((img) => img.url),
          attributes: product.attributes.map((a) => ({
            groupName: a.groupName,
            attrName: a.attrName,
            attrValue: a.attrValue,
          })),
        }}
      />

      <div className="mt-10">
        <VariantsManager
          productId={product.id}
          variants={variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            color: v.color,
            storage: v.storage,
            price: Number(v.price),
            compareAtPrice: v.compareAtPrice !== null ? Number(v.compareAtPrice) : null,
            weightGram: v.weightGram,
            barcode: v.barcode,
            isActive: v.isActive,
            images: v.images.map((img) => img.url),
          }))}
        />
      </div>
    </div>
  );
}
