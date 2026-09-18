import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BrandForm from "../../BrandForm";

export default async function EditBrandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const brand = await prisma.brand.findUnique({ where: { id } });
  if (!brand) notFound();

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Sửa thương hiệu</h1>
      <BrandForm
        initial={{
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          logoUrl: brand.logoUrl ?? "",
          isActive: brand.isActive,
        }}
      />
    </div>
  );
}
