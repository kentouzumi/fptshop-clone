"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SHIPMENT_STATUS_LABELS } from "@/lib/orderLabels";

const INPUT = "bg-white text-zinc-900 w-full rounded border border-zinc-300 px-2 py-1 text-sm";

export interface ShipmentValues {
  carrier: string;
  trackingCode: string;
  status: string;
  /** Dạng "yyyy-MM-dd" cho input type="date", rỗng nếu chưa đặt. */
  estimatedDate: string;
  deliveredAt: string | null;
}

export default function ShipmentForm({
  orderId,
  initial,
  carrierSuggestions,
  settableStatuses,
}: {
  orderId: string;
  initial: ShipmentValues;
  carrierSuggestions: string[];
  settableStatuses: string[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Đơn đã giao xong: vận đơn chốt ở DELIVERED, chỉ còn xem (xem lib/shipments.ts).
  const locked = initial.deliveredAt !== null;

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carrier: form.carrier,
          trackingCode: form.trackingCode,
          status: form.status,
          estimatedDate: form.estimatedDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Lưu thất bại.");
        return;
      }
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (locked) {
    return (
      <p className="text-sm text-zinc-600">
        Đã giao xong lúc {new Date(initial.deliveredAt!).toLocaleString("vi-VN")}. Vận đơn không sửa
        được nữa.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-zinc-500">Đơn vị vận chuyển</label>
          {/* datalist: gợi ý các hãng phổ biến nhưng vẫn cho gõ tên khác. */}
          <input
            className={INPUT}
            list="carrier-suggestions"
            placeholder="VD: Giao Hàng Nhanh (GHN)"
            value={form.carrier}
            onChange={(e) => setForm({ ...form, carrier: e.target.value })}
          />
          <datalist id="carrier-suggestions">
            {carrierSuggestions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">Mã vận đơn</label>
          <input
            className={`${INPUT} font-mono`}
            placeholder="Mã do đơn vị vận chuyển cấp"
            value={form.trackingCode}
            onChange={(e) => setForm({ ...form, trackingCode: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-zinc-500">Trạng thái vận chuyển</label>
          <select
            className={INPUT}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {settableStatuses.map((s) => (
              <option key={s} value={s}>
                {SHIPMENT_STATUS_LABELS[s] ?? s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">Ngày giao dự kiến</label>
          <input
            type="date"
            className={INPUT}
            value={form.estimatedDate}
            onChange={(e) => setForm({ ...form, estimatedDate: e.target.value })}
          />
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        &quot;Đã giao&quot; không đặt ở đây — trạng thái đó tự được ghi khi bạn chuyển đơn hàng sang
        &quot;Đã giao&quot; ở khối bên dưới.
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-fit rounded bg-black px-3 py-1.5 text-xs text-white disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : "Lưu vận đơn"}
        </button>
        {saved && <span className="text-xs text-green-600">Đã lưu</span>}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
