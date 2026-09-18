import { prisma } from "@/lib/prisma";
import ProductForm from "../ProductForm";

export default async function NewProductPage() {
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Thêm sản phẩm mới</h2>
      <ProductForm categories={categories} brands={brands} />
    </div>
  );
}
