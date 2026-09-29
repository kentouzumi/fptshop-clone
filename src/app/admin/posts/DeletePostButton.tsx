"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeletePostButton({ postId, title }: { postId: string; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (!confirm(`Xóa hẳn bài viết "${title}"? Thao tác này không hoàn tác được.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Xóa bài viết thất bại.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="text-xs text-red-600 hover:underline disabled:opacity-40"
    >
      {busy ? "Đang xóa..." : "Xóa"}
    </button>
  );
}
