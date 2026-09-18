import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CategoryForm from "../../CategoryForm";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [category, parentOptions] = await Promise.all([
    prisma.category.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!category) notFound();

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Sửa danh mục</h1>
      <CategoryForm
        parentOptions={parentOptions}
        initial={{
          id: category.id,
          name: category.name,
          slug: category.slug,
          parentId: category.parentId ?? "",
          imageUrl: category.imageUrl ?? "",
          sortOrder: String(category.sortOrder),
          isActive: category.isActive,
        }}
      />
    </div>
  );
}
