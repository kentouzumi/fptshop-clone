import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StoreForm from "../../StoreForm";

export default async function EditStorePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = await prisma.store.findUnique({ where: { id } });
  if (!store) notFound();

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Sửa cửa hàng</h1>
      <StoreForm
        initial={{
          id: store.id,
          name: store.name,
          province: store.province,
          district: store.district,
          address: store.address,
          phone: store.phone ?? "",
          openHours: store.openHours ?? "",
          isActive: store.isActive,
        }}
      />
    </div>
  );
}
