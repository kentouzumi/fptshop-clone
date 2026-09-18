"use client";

import { useRouter } from "next/navigation";

export default function DeleteStoreButton({ storeId }: { storeId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Xóa cửa hàng này?")) return;
    const res = await fetch(`/api/admin/stores/${storeId}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (res.ok) {
      router.refresh();
    } else {
      alert(data?.error ?? "Xóa thất bại.");
    }
  }

  return (
    <button onClick={handleDelete} className="text-red-600 underline">
      Xóa
    </button>
  );
}
