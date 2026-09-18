import { prisma } from "@/lib/prisma";
import CategoryForm from "../CategoryForm";

export default async function NewCategoryPage() {
  const parentOptions = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Thêm danh mục mới</h1>
      <CategoryForm parentOptions={parentOptions} />
    </div>
  );
}
