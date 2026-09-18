"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Faq {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
}

interface FormState {
  question: string;
  answer: string;
  sortOrder: string;
}

const EMPTY: FormState = { question: "", answer: "", sortOrder: "0" };

export default function FaqManager({ items }: { items: Faq[] }) {
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

  function startEdit(f: Faq) {
    setEditingId(f.id);
    setForm({ question: f.question, answer: f.answer, sortOrder: String(f.sortOrder) });
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
      const payload = { question: form.question, answer: form.answer, sortOrder: Number(form.sortOrder) };
      const res = await fetch(isNew ? "/api/admin/faq" : `/api/admin/faq/${editingId}`, {
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
    if (!confirm("Xóa câu hỏi này?")) return;
    const res = await fetch(`/api/admin/faq/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("Xóa thất bại.");
  }

  function FormFields() {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-100 p-3">
        <input
          className="bg-white text-zinc-900 rounded border border-zinc-300 px-2 py-1 text-sm"
          placeholder="Câu hỏi"
          value={form.question}
          onChange={(e) => setForm({ ...form, question: e.target.value })}
        />
        <textarea
          className="bg-white text-zinc-900 rounded border border-zinc-300 px-2 py-1 text-sm"
          rows={3}
          placeholder="Câu trả lời"
          value={form.answer}
          onChange={(e) => setForm({ ...form, answer: e.target.value })}
        />
        <input
          type="number"
          className="bg-white text-zinc-900 w-32 rounded border border-zinc-300 px-2 py-1 text-sm"
          placeholder="Thứ tự"
          value={form.sortOrder}
          onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
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
        <h1 className="text-xl font-semibold">Câu hỏi thường gặp</h1>
        {editingId === null && (
          <button type="button" onClick={startAdd} className="rounded-lg bg-black px-4 py-2 text-sm text-white">
            + Thêm câu hỏi
          </button>
        )}
      </div>

      {editingId === "__new__" && <div className="mb-4">{FormFields()}</div>}

      <div className="space-y-3">
        {items.map((f) =>
          editingId === f.id ? (
            <div key={f.id}>{FormFields()}</div>
          ) : (
            <div key={f.id} className="flex items-center justify-between rounded-lg border border-zinc-200 p-3">
              <div>
                <p className="font-medium">{f.question}</p>
                <p className="text-xs text-zinc-500">Thứ tự: {f.sortOrder}</p>
              </div>
              <div className="flex gap-3 text-sm">
                <button onClick={() => startEdit(f)} disabled={editingId !== null} className="text-blue-600 underline disabled:opacity-50">
                  Sửa
                </button>
                <button onClick={() => handleDelete(f.id)} disabled={editingId !== null} className="text-red-600 underline disabled:opacity-50">
                  Xóa
                </button>
              </div>
            </div>
          )
        )}
        {items.length === 0 && editingId === null && (
          <p className="text-center text-zinc-500">Chưa có câu hỏi nào.</p>
        )}
      </div>
    </div>
  );
}
