"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OrderStatusUpdateForm({
  orderId,
  nextStatuses,
  statusLabels,
}: {
  orderId: string;
  nextStatuses: string[];
  statusLabels: Record<string, string>;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(nextStatuses[0] ?? "");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (nextStatuses.length === 0) {
    return <p className="text-sm text-zinc-500">Đơn hàng đã ở trạng thái cuối cùng.</p>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note: note.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Có lỗi xảy ra.");
        return;
      }
      setNote("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label className="mb-1 block text-sm font-medium text-zinc-700">Chuyển sang trạng thái</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="input !py-2"
        >
          {nextStatuses.map((s) => (
            <option key={s} value={s}>
              {statusLabels[s] ?? s}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <label className="mb-1 block text-sm font-medium text-zinc-700">Ghi chú (tùy chọn)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="input !py-2"
          placeholder="VD: đã liên hệ khách xác nhận"
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary !px-4 !py-2 text-sm">
        {loading ? "Đang cập nhật..." : "Cập nhật"}
      </button>
      {error && <p className="text-sm text-red-600 sm:ml-3">{error}</p>}
    </form>
  );
}
