"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  bannerUrl: string | null;
  linkUrl: string | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  sortOrder: number;
}

interface FormState {
  title: string;
  description: string;
  bannerUrl: string;
  linkUrl: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  sortOrder: string;
}

function toLocalInput(iso: string) {
  return iso ? iso.slice(0, 16) : "";
}

const EMPTY: FormState = {
  title: "",
  description: "",
  bannerUrl: "",
  linkUrl: "",
  startsAt: "",
  endsAt: "",
  isActive: true,
  sortOrder: "0",
};

export default function PromotionsManager({ promotions }: { promotions: Promotion[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function startAdd() {
    setEditingId("__new__");
    setForm(EMPTY);
    setError(null);
  }

  function startEdit(p: Promotion) {
    setEditingId(p.id);
    setForm({
      title: p.title,
      description: p.description ?? "",
      bannerUrl: p.bannerUrl ?? "",
      linkUrl: p.linkUrl ?? "",
      startsAt: toLocalInput(p.startsAt),
      endsAt: toLocalInput(p.endsAt),
      isActive: p.isActive,
      sortOrder: String(p.sortOrder),
    });
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
      const isNew = editingId === "__new__";
      const payload = {
        title: form.title,
        description: form.description || null,
        bannerUrl: form.bannerUrl || null,
        linkUrl: form.linkUrl || null,
        startsAt: form.startsAt,
        endsAt: form.endsAt,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder),
      };
      const res = await fetch(isNew ? "/api/admin/promotions" : `/api/admin/promotions/${editingId}`, {
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

  async function handleDelete(id: string) {
    if (!confirm("Xóa khuyến mãi này?")) return;
    const res = await fetch(`/api/admin/promotions/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("Xóa thất bại.");
  }

  function FormFields() {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-100 p-3">
        <input
          className="bg-white text-zinc-900 rounded border border-zinc-300 px-2 py-1 text-sm"
          placeholder="Tiêu đề"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          className="bg-white text-zinc-900 rounded border border-zinc-300 px-2 py-1 text-sm"
          rows={2}
          placeholder="Mô tả (tùy chọn)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            className="bg-white text-zinc-900 rounded border border-zinc-300 px-2 py-1 text-sm"
            placeholder="URL ảnh banner (tùy chọn)"
            value={form.bannerUrl}
            onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })}
          />
          <input
            className="bg-white text-zinc-900 rounded border border-zinc-300 px-2 py-1 text-sm"
            placeholder="URL liên kết (tùy chọn)"
            value={form.linkUrl}
            onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Bắt đầu</label>
            <input
              type="datetime-local"
              className="bg-white text-zinc-900 w-full rounded border border-zinc-300 px-2 py-1 text-sm"
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Kết thúc</label>
            <input
              type="datetime-local"
              className="bg-white text-zinc-900 w-full rounded border border-zinc-300 px-2 py-1 text-sm"
              value={form.endsAt}
              onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="number"
            className="bg-white text-zinc-900 w-24 rounded border border-zinc-300 px-2 py-1 text-sm"
            placeholder="Thứ tự"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
          />
          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Đang hoạt động
          </label>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleSave} disabled={saving} className="rounded bg-black px-3 py-1.5 text-xs text-white disabled:opacity-50">
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
          <button type="button" onClick={cancel} className="rounded border border-zinc-300 px-3 py-1.5 text-xs">
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
        <h1 className="text-xl font-semibold">Khuyến mãi</h1>
        {editingId === null && (
          <button type="button" onClick={startAdd} className="rounded-lg bg-black px-4 py-2 text-sm text-white">
            + Thêm khuyến mãi
          </button>
        )}
      </div>

      {editingId === "__new__" && <div className="mb-4">{FormFields()}</div>}

      <div className="space-y-3">
        {promotions.map((p) =>
          editingId === p.id ? (
            <div key={p.id}>{FormFields()}</div>
          ) : (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-zinc-200 p-3">
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-xs text-zinc-500">
                  {new Date(p.startsAt).toLocaleDateString("vi-VN")} -{" "}
                  {new Date(p.endsAt).toLocaleDateString("vi-VN")}
                  {" · "}
                  {p.isActive ? <span className="text-green-600">Hoạt động</span> : <span className="text-zinc-400">Ẩn</span>}
                </p>
              </div>
              <div className="flex gap-3 text-sm">
                <button onClick={() => startEdit(p)} disabled={editingId !== null} className="text-blue-600 underline disabled:opacity-50">
                  Sửa
                </button>
                <button onClick={() => handleDelete(p.id)} disabled={editingId !== null} className="text-red-600 underline disabled:opacity-50">
                  Xóa
                </button>
              </div>
            </div>
          )
        )}
        {promotions.length === 0 && editingId === null && (
          <p className="text-center text-zinc-500">Chưa có khuyến mãi nào.</p>
        )}
      </div>
    </div>
  );
}
