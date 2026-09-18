"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = ["QUOTED", "CONFIRMED", "RECEIVED", "COMPLETED", "CANCELLED"];
const LABELS: Record<string, string> = {
  QUOTED: "Chờ/đã báo giá",
  CONFIRMED: "Đã xác nhận giá",
  RECEIVED: "Đã nhận máy",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

export default function TradeInAdminRow({
  id,
  quotedPrice,
  status,
}: {
  id: string;
  quotedPrice: number;
  status: string;
}) {
  const router = useRouter();
  const [price, setPrice] = useState(String(quotedPrice));
  const [statusValue, setStatusValue] = useState(status);
  const [saving, setSaving] = useState(false);

  async function handleSavePrice() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/trade-in/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quotedPrice: Number(price) }),
      });
      if (!res.ok) {
        alert("Cập nhật giá thất bại.");
        return;
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    setStatusValue(newStatus);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/trade-in/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setStatusValue(status);
        alert(data?.error ?? "Cập nhật trạng thái thất bại.");
        return;
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="number"
        min={0}
        className="bg-white text-zinc-900 w-32 rounded border border-zinc-300 px-2 py-1 text-sm"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        disabled={saving}
      />
      <button
        type="button"
        onClick={handleSavePrice}
        disabled={saving}
        className="rounded bg-black px-2 py-1 text-xs text-white disabled:opacity-50"
      >
        Lưu giá
      </button>
      <select
        value={statusValue}
        disabled={saving}
        onChange={(e) => handleStatusChange(e.target.value)}
        className="bg-white text-zinc-900 rounded border border-zinc-300 px-2 py-1 text-sm disabled:opacity-50"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {LABELS[s]}
          </option>
        ))}
      </select>
    </div>
  );
}
