"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CouponType = "PERCENT" | "FIXED_AMOUNT" | "FREE_SHIPPING";

/** Trạng thái hiệu lực, tính ở server (xem resolveStatus trong page.tsx). */
export type CouponStatus = "running" | "disabled" | "expired" | "scheduled" | "exhausted";

const STATUS_LABELS: Record<CouponStatus, { text: string; className: string }> = {
  running: { text: "Đang chạy", className: "text-green-600" },
  disabled: { text: "Đã tắt", className: "text-zinc-400" },
  expired: { text: "Hết hạn", className: "text-zinc-400" },
  scheduled: { text: "Chưa tới hạn", className: "text-blue-600" },
  exhausted: { text: "Hết lượt", className: "text-zinc-400" },
};

interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrderValue: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  isPublic: boolean;
  status: CouponStatus;
  /** Số đơn đã dùng mã này — mã đã có đơn thì không xóa được, chỉ tắt. */
  orderCount: number;
}

interface FormState {
  code: string;
  type: CouponType;
  value: string;
  minOrderValue: string;
  maxDiscount: string;
  usageLimit: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  isPublic: boolean;
}

const TYPE_LABELS: Record<CouponType, string> = {
  PERCENT: "Giảm theo phần trăm",
  FIXED_AMOUNT: "Giảm số tiền cố định",
  FREE_SHIPPING: "Miễn phí vận chuyển",
};

const INPUT = "bg-white text-zinc-900 w-full rounded border border-zinc-300 px-2 py-1 text-sm";

function toLocalInput(iso: string) {
  return iso ? iso.slice(0, 16) : "";
}

function formatVnd(value: number) {
  return `${value.toLocaleString("vi-VN")}₫`;
}

/** Mô tả ưu đãi giống hệt cách khách thấy ở /checkout, để admin biết mình đang tạo gì. */
function describe(c: Pick<Coupon, "type" | "value" | "maxDiscount">) {
  if (c.type === "FREE_SHIPPING") return "Miễn phí vận chuyển";
  if (c.type === "FIXED_AMOUNT") return `Giảm ${formatVnd(c.value)}`;
  return `Giảm ${c.value}%${c.maxDiscount !== null ? ` (tối đa ${formatVnd(c.maxDiscount)})` : ""}`;
}

function defaultRange() {
  const start = new Date();
  const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return { startsAt: toLocalInput(start.toISOString()), endsAt: toLocalInput(end.toISOString()) };
}

const EMPTY: FormState = {
  code: "",
  type: "PERCENT",
  value: "",
  minOrderValue: "0",
  maxDiscount: "",
  usageLimit: "",
  ...defaultRange(),
  isActive: true,
  isPublic: true,
};

export default function CouponsManager({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function startAdd() {
    setEditingId("__new__");
    setForm({ ...EMPTY, ...defaultRange() });
    setError(null);
  }

  function startEdit(c: Coupon) {
    setEditingId(c.id);
    setForm({
      code: c.code,
      type: c.type,
      value: String(c.value),
      minOrderValue: String(c.minOrderValue),
      maxDiscount: c.maxDiscount === null ? "" : String(c.maxDiscount),
      usageLimit: c.usageLimit === null ? "" : String(c.usageLimit),
      startsAt: toLocalInput(c.startsAt),
      endsAt: toLocalInput(c.endsAt),
      isActive: c.isActive,
      isPublic: c.isPublic,
    });
    setError(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const isNew = editingId === "__new__";
      const payload = {
        code: form.code,
        type: form.type,
        value: form.type === "FREE_SHIPPING" ? 0 : Number(form.value),
        minOrderValue: Number(form.minOrderValue || 0),
        maxDiscount: form.type === "PERCENT" && form.maxDiscount ? Number(form.maxDiscount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        startsAt: form.startsAt,
        endsAt: form.endsAt,
        isActive: form.isActive,
        isPublic: form.isPublic,
      };
      const res = await fetch(isNew ? "/api/admin/coupons" : `/api/admin/coupons/${editingId}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Lưu thất bại.");
        return;
      }
      setEditingId(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: Coupon) {
    if (!confirm(`Xóa mã ${c.code}?`)) return;
    const res = await fetch(`/api/admin/coupons/${c.id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
      return;
    }
    const data = await res.json().catch(() => null);
    alert(data?.error ?? "Xóa thất bại.");
  }

  function FormFields() {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-100 p-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Mã giảm giá</label>
            <input
              className={`${INPUT} font-mono uppercase`}
              placeholder="VD: FPT10"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Loại ưu đãi</label>
            <select
              className={INPUT}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as CouponType })}
            >
              {(Object.keys(TYPE_LABELS) as CouponType[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mỗi loại dùng field khác nhau nên chỉ hiện đúng ô có ý nghĩa, tránh
            admin điền "tối đa" cho mã giảm tiền cố định rồi tưởng nó có tác dụng. */}
        {form.type !== "FREE_SHIPPING" && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">
                {form.type === "PERCENT" ? "Phần trăm giảm (1-100)" : "Số tiền giảm (đ)"}
              </label>
              <input
                type="number"
                className={INPUT}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
            </div>
            {form.type === "PERCENT" && (
              <div>
                <label className="mb-1 block text-xs text-zinc-500">
                  Giảm tối đa (đ, để trống = không giới hạn)
                </label>
                <input
                  type="number"
                  className={INPUT}
                  value={form.maxDiscount}
                  onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                />
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Giá trị đơn tối thiểu (đ)</label>
            <input
              type="number"
              className={INPUT}
              value={form.minOrderValue}
              onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">
              Giới hạn lượt dùng (để trống = không giới hạn)
            </label>
            <input
              type="number"
              className={INPUT}
              value={form.usageLimit}
              onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Bắt đầu</label>
            <input
              type="datetime-local"
              className={INPUT}
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Kết thúc</label>
            <input
              type="datetime-local"
              className={INPUT}
              value={form.endsAt}
              onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Đang hoạt động
          </label>
          <label className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
            />
            Hiện công khai cho khách ở trang thanh toán
          </label>
          <p className="text-xs text-zinc-500">
            Bỏ chọn nếu đây là mã riêng gửi cho một khách cụ thể — mã vẫn dùng được bình thường
            nhưng không xuất hiện trong danh sách gợi ý.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-black px-3 py-1.5 text-xs text-white disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setError(null);
            }}
            className="rounded border border-zinc-300 px-3 py-1.5 text-xs"
          >
            Hủy
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mã giảm giá</h1>
        {editingId === null && (
          <button
            type="button"
            onClick={startAdd}
            className="rounded-lg bg-black px-4 py-2 text-sm text-white"
          >
            + Thêm mã giảm giá
          </button>
        )}
      </div>

      <p className="mb-4 rounded-lg border border-zinc-200 bg-zinc-100 p-3 text-xs text-zinc-600">
        Mã <b>đang hoạt động</b>, còn trong thời hạn và được đánh dấu <b>công khai</b> sẽ hiện sẵn
        cho mọi khách ở trang thanh toán. Mã riêng gửi cho một người thì bỏ chọn ô công khai —
        khách vẫn nhập mã dùng được, chỉ là không ai khác nhìn thấy.
      </p>

      {editingId === "__new__" && <div className="mb-4">{FormFields()}</div>}

      <div className="space-y-3">
        {coupons.map((c) =>
          editingId === c.id ? (
            <div key={c.id}>{FormFields()}</div>
          ) : (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 p-3"
            >
              <div>
                <p className="font-mono font-medium">{c.code}</p>
                <p className="text-xs text-zinc-500">
                  {describe(c)}
                  {c.minOrderValue > 0 && ` · Đơn từ ${formatVnd(c.minOrderValue)}`}
                  {" · "}
                  {new Date(c.startsAt).toLocaleDateString("vi-VN")} -{" "}
                  {new Date(c.endsAt).toLocaleDateString("vi-VN")}
                </p>
                <p className="text-xs text-zinc-500">
                  Đã dùng {c.usedCount}
                  {c.usageLimit !== null ? `/${c.usageLimit}` : ""} lượt
                  {" · "}
                  <span className={STATUS_LABELS[c.status].className}>
                    {STATUS_LABELS[c.status].text}
                  </span>
                  {!c.isPublic && <span className="text-zinc-400"> · Mã riêng</span>}
                </p>
              </div>
              <div className="flex gap-3 text-sm">
                <button
                  onClick={() => startEdit(c)}
                  disabled={editingId !== null}
                  className="text-blue-600 underline disabled:opacity-50"
                >
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(c)}
                  disabled={editingId !== null || c.orderCount > 0}
                  title={
                    c.orderCount > 0
                      ? `Đã có ${c.orderCount} đơn dùng mã này — hãy tắt thay vì xóa`
                      : undefined
                  }
                  className="text-red-600 underline disabled:opacity-50"
                >
                  Xóa
                </button>
              </div>
            </div>
          )
        )}
        {coupons.length === 0 && editingId === null && (
          <p className="text-center text-zinc-500">Chưa có mã giảm giá nào.</p>
        )}
      </div>
    </div>
  );
}
