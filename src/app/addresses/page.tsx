import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAddressesForUser } from "@/lib/addresses";
import DeleteAddressButton from "./DeleteAddressButton";
import SetDefaultButton from "./SetDefaultButton";

export default async function AddressesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const addresses = await getAddressesForUser(user.id);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sổ địa chỉ</h1>
        <Link href="/addresses/new" className="rounded-lg bg-black px-4 py-2 text-sm text-white">
          + Thêm địa chỉ mới
        </Link>
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 p-8 text-center text-zinc-500">
          Bạn chưa có địa chỉ nào.
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((a) => (
            <div key={a.id} className="rounded-lg border border-zinc-200 p-4">
              <div className="mb-1 flex items-center gap-2">
                <span className="font-medium">{a.recipientName}</span>
                <span className="text-zinc-400">|</span>
                <span className="text-zinc-600">{a.phone}</span>
                {a.label && (
                  <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">{a.label}</span>
                )}
                {a.isDefault && (
                  <span className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-700">
                    Mặc định
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-700">
                {a.streetDetail}, {a.ward}, {a.district}, {a.province}
              </p>
              <div className="mt-3 flex gap-4">
                <Link href={`/addresses/${a.id}/edit`} className="text-sm text-blue-600 underline">
                  Sửa
                </Link>
                {!a.isDefault && <SetDefaultButton addressId={a.id} />}
                <DeleteAddressButton addressId={a.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
