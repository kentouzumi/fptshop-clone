"use client";

import { useRouter } from "next/navigation";

export default function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Xóa sản phẩm này? Hành động không thể hoàn tác.")) return;

    const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      alert("Xóa thất bại.");
    }
  }

  return (
    <button onClick={handleDelete} className="font-medium text-red-600 hover:underline">
      Xóa
    </button>
  );
}
