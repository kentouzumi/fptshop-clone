"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface ComboItem {
  id: string;
  name: string;
  price: number;
  /** Biến thể rẻ nhất đang bán. null = chưa có biến thể nào, không mua kèm được. */
  variantId: string | null;
  outOfStock: boolean;
}

function formatPrice(value: number) {
  return value.toLocaleString("vi-VN") + "₫";
}

/**
 * "Mua kèm cùng lúc": tick các món rồi thêm hết vào giỏ trong 1 lần bấm.
 *
 * CỐ Ý KHÔNG gồm chính sản phẩm đang xem: biến thể (màu/dung lượng) khách đang
 * chọn nằm trong state của ProductGalleryAndBuy ở phía trên trang, khối này
 * không thấy được — thêm đại biến thể rẻ nhất sẽ bỏ vào giỏ đúng thứ khách
 * KHÔNG chọn. Nút "Thêm vào giỏ hàng" ở trên vẫn là nơi mua sản phẩm chính.
 */
export default function ComboBuyBox({ items }: { items: ComboItem[] }) {
  const router = useRouter();

  const buyable = items.filter((i) => i.variantId && !i.outOfStock);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(buyable.map((i) => i.id))
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (buyable.length === 0) return null;

  const chosen = buyable.filter((i) => selected.has(i.id));
  const total = chosen.reduce((sum, i) => sum + i.price, 0);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAddAll() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/cart/items/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantIds: chosen.map((i) => i.variantId) }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Không thêm được vào giỏ hàng.");
        return;
      }
      // Route trả về từng lỗi riêng lẻ: thêm được 2/3 món thì vẫn báo thành công
      // nhưng nói rõ còn 1 món chưa vào giỏ.
      setMessage(
        data.errors?.length
          ? `Đã thêm ${data.added} sản phẩm. ${data.errors.length} sản phẩm không thêm được.`
          : `Đã thêm ${data.added} sản phẩm vào giỏ hàng.`
      );
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card mt-4 p-4">
      <p className="mb-3 text-sm font-medium">Mua kèm cùng lúc</p>

      <ul className="mb-3 space-y-2">
        {buyable.map((item) => (
          <li key={item.id} className="flex items-center gap-2 text-sm">
            <input
              id={`combo-${item.id}`}
              type="checkbox"
              checked={selected.has(item.id)}
              onChange={() => toggle(item.id)}
              className="h-4 w-4"
            />
            <label htmlFor={`combo-${item.id}`} className="flex-1 cursor-pointer">
              {item.name}
            </label>
            <span className="text-accent">{formatPrice(item.price)}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-3">
        <span className="text-sm text-zinc-600">
          Tổng {chosen.length} sản phẩm:{" "}
          <span className="font-semibold text-accent">{formatPrice(total)}</span>
        </span>
        <button
          type="button"
          onClick={handleAddAll}
          disabled={saving || chosen.length === 0}
          className="btn-primary text-sm disabled:opacity-50"
        >
          {saving ? "Đang thêm..." : "Thêm tất cả vào giỏ"}
        </button>
      </div>

      {message && <p className="mt-2 text-xs text-green-600">{message}</p>}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
