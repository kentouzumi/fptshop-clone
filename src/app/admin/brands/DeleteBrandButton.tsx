"use client";

import { useRouter } from "next/navigation";

export default function DeleteBrandButton({ brandId }: { brandId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Xóa thương hiệu này? Hành động không thể hoàn tác.")) return;

    const res = await fetch(`/api/admin/brands/${brandId}`, { method: "DELETE" });
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
