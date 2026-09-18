import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAddress } from "@/lib/addresses";
import AddressForm from "../../AddressForm";

export default async function EditAddressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const address = await getAddress(user.id, id);
  if (!address) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Sửa địa chỉ</h1>
      <AddressForm
        initial={{
          id: address.id,
          recipientName: address.recipientName,
          phone: address.phone,
          province: address.province,
          district: address.district,
          ward: address.ward,
          streetDetail: address.streetDetail,
          label: address.label ?? "",
          isDefault: address.isDefault,
        }}
      />
    </div>
  );
}
