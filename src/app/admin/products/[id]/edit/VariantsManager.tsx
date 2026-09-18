"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Variant {
  id: string;
  sku: string;
  color: string | null;
  storage: string | null;
  price: number;
  compareAtPrice: number | null;
  weightGram: number | null;
  barcode: string | null;
  isActive: boolean;
}

interface FormState {
  sku: string;
  color: string;
  storage: string;
  price: string;
  compareAtPrice: string;
  weightGram: string;
  barcode: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  sku: "",
  color: "",
  storage: "",
  price: "",
  compareAtPrice: "",
  weightGram: "",
  barcode: "",
  isActive: true,
};

function variantToForm(v: Variant): FormState {
  return {
    sku: v.sku,
    color: v.color ?? "",
    storage: v.storage ?? "",
    price: String(v.price),
    compareAtPrice: v.compareAtPrice !== null ? String(v.compareAtPrice) : "",
    weightGram: v.weightGram !== null ? String(v.weightGram) : "",
    barcode: v.barcode ?? "",
    isActive: v.isActive,
  };
}

function formatPrice(v: number) {
  return v.toLocaleString("vi-VN") + "đ";
}

function VariantEditRow({
  form,
  setForm,
  onSave,
  onCancel,
  saving,
  error,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
}) {
  return (
    <tr className="border-t border-zinc-100 bg-zinc-100">
      <td colSpan={7} className="p-3">
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-zinc-500">SKU</label>
            <input
              className="bg-white text-zinc-900 w-32 rounded border border-zinc-300 px-2 py-1 text-sm"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Màu</label>
            <input
              className="bg-white text-zinc-900 w-24 rounded border border-zinc-300 px-2 py-1 text-sm"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Dung lượng</label>
            <input
              className="bg-white text-zinc-900 w-24 rounded border border-zinc-300 px-2 py-1 text-sm"
              value={form.storage}
              onChange={(e) => setForm({ ...form, storage: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Giá</label>
            <input
              type="number"
              min={0}
              className="bg-white text-zinc-900 w-28 rounded border border-zinc-300 px-2 py-1 text-sm"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Giá gạch (tùy chọn)</label>
            <input
              type="number"
              min={0}
              className="bg-white text-zinc-900 w-28 rounded border border-zinc-300 px-2 py-1 text-sm"
              value={form.compareAtPrice}
              onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Khối lượng (g)</label>
            <input
              type="number"
              min={0}
              className="bg-white text-zinc-900 w-24 rounded border border-zinc-300 px-2 py-1 text-sm"
              value={form.weightGram}
              onChange={(e) => setForm({ ...form, weightGram: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Barcode</label>
            <input
              className="bg-white text-zinc-900 w-28 rounded border border-zinc-300 px-2 py-1 text-sm"
              value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-1 pb-1.5 text-xs">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Đang bán
          </label>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded bg-black px-3 py-1.5 text-xs text-white disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
          <button type="button" onClick={onCancel} className="rounded border border-zinc-300 px-3 py-1.5 text-xs">
            Hủy
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </td>
    </tr>
  );
}

export default function VariantsManager({
  productId,
  variants,
}: {
  productId: string;
  variants: Variant[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null); // "__new__" khi đang thêm mới
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function startAdd() {
    setEditingId("__new__");
    setForm(EMPTY_FORM);
    setError(null);
  }

  function startEdit(v: Variant) {
    setEditingId(v.id);
    setForm(variantToForm(v));
    setError(null);
  }

  function cancel() {
    setEditingId(null);
    setError(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        sku: form.sku,
        color: form.color || null,
        storage: form.storage || null,
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
        weightGram: form.weightGram ? Number(form.weightGram) : null,
        barcode: form.barcode || null,
        isActive: form.isActive,
      };
      const isNew = editingId === "__new__";
      const res = await fetch(
        isNew ? `/api/admin/products/${productId}/variants` : `/api/admin/variants/${editingId}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
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

  async function handleDelete(id: string) {
    if (!confirm("Xóa biến thể này? Hành động không thể hoàn tác.")) return;
    const res = await fetch(`/api/admin/variants/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (res.ok) {
      router.refresh();
    } else {
      alert(data?.error ?? "Xóa thất bại.");
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Biến thể (màu / dung lượng / SKU)</h3>
        {editingId === null && (
          <button
            type="button"
            onClick={startAdd}
            className="rounded-lg bg-black px-3 py-1.5 text-xs text-white"
          >
            + Thêm biến thể
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 text-left text-zinc-500">
            <tr>
              <th className="px-3 py-2">SKU</th>
              <th className="px-3 py-2">Màu</th>
              <th className="px-3 py-2">Dung lượng</th>
              <th className="px-3 py-2">Giá</th>
              <th className="px-3 py-2">Giá gạch</th>
              <th className="px-3 py-2">Trạng thái</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v) =>
              editingId === v.id ? (
                <VariantEditRow
                  key={v.id}
                  form={form}
                  setForm={setForm}
                  onSave={handleSave}
                  onCancel={cancel}
                  saving={saving}
                  error={error}
                />
              ) : (
                <tr key={v.id} className="border-t border-zinc-100">
                  <td className="px-3 py-2 font-mono text-xs">{v.sku}</td>
                  <td className="px-3 py-2">{v.color ?? "-"}</td>
                  <td className="px-3 py-2">{v.storage ?? "-"}</td>
                  <td className="px-3 py-2">{formatPrice(v.price)}</td>
                  <td className="px-3 py-2">{v.compareAtPrice ? formatPrice(v.compareAtPrice) : "-"}</td>
                  <td className="px-3 py-2">
                    {v.isActive ? (
                      <span className="text-green-600">Đang bán</span>
                    ) : (
                      <span className="text-zinc-400">Ẩn</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => startEdit(v)}
                      disabled={editingId !== null}
                      className="mr-3 text-blue-600 underline disabled:opacity-50"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(v.id)}
                      disabled={editingId !== null}
                      className="text-red-600 underline disabled:opacity-50"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              )
            )}
            {editingId === "__new__" && (
              <VariantEditRow
                form={form}
                setForm={setForm}
                onSave={handleSave}
                onCancel={cancel}
                saving={saving}
                error={error}
              />
            )}
            {variants.length === 0 && editingId === null && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-zinc-500">
                  Chưa có biến thể nào. Sản phẩm cần ít nhất 1 biến thể để khách có thể thêm vào giỏ
                  hàng.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
