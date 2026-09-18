"use client";

import { useRouter } from "next/navigation";

export default function DeleteAddressButton({ addressId }: { addressId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Xóa địa chỉ này?")) return;

    const res = await fetch(`/api/addresses/${addressId}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (res.ok) {
      router.refresh();
    } else {
      alert(data?.error ?? "Xóa thất bại.");
    }
  }

  return (
    <button onClick={handleDelete} className="text-sm text-red-600 underline">
      Xóa
    </button>
  );
}
