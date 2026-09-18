import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AddressForm from "../AddressForm";

export default async function NewAddressPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Thêm địa chỉ mới</h1>
      <AddressForm />
    </div>
  );
}
