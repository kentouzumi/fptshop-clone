"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
}

interface FormState {
  slug: string;
  title: string;
  content: string;
}

const EMPTY: FormState = { slug: "", title: "", content: "" };

export default function StaticPagesManager({ pages }: { pages: Page[] }) {
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

  function startEdit(p: Page) {
    setEditingId(p.id);
    setForm({ slug: p.slug, title: p.title, content: p.content });
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
      const res = await fetch(isNew ? "/api/admin/static-pages" : `/api/admin/static-pages/${editingId}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
    if (!confirm("Xóa trang này?")) return;
    const res = await fetch(`/api/admin/static-pages/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("Xóa thất bại.");
  }

  function FormFields() {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-100 p-3">
        <div className="grid grid-cols-2 gap-2">
          <input
            className="bg-white text-zinc-900 rounded border border-zinc-300 px-2 py-1 text-sm"
            placeholder="Tiêu đề"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            className="bg-white text-zinc-900 rounded border border-zinc-300 px-2 py-1 font-mono text-sm"
            placeholder="slug-duong-dan"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
        </div>
        <textarea
          className="bg-white text-zinc-900 rounded border border-zinc-300 px-2 py-1 text-sm"
          rows={5}
          placeholder="Nội dung"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
        />
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
        <h1 className="text-xl font-semibold">Trang nội dung tĩnh</h1>
        {editingId === null && (
          <button type="button" onClick={startAdd} className="rounded-lg bg-black px-4 py-2 text-sm text-white">
            + Thêm trang
          </button>
        )}
      </div>

      {editingId === "__new__" && <div className="mb-4">{FormFields()}</div>}

      <div className="space-y-3">
        {pages.map((p) =>
          editingId === p.id ? (
            <div key={p.id}>{FormFields()}</div>
          ) : (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-zinc-200 p-3">
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-xs text-zinc-500">/pages/{p.slug}</p>
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
        {pages.length === 0 && editingId === null && (
          <p className="text-center text-zinc-500">Chưa có trang nào.</p>
        )}
      </div>
    </div>
  );
}
