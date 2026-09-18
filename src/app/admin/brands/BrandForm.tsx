"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export interface BrandFormValues {
  id?: string;
  name: string;
  slug: string;
  logoUrl: string;
  isActive: boolean;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function BrandForm({ initial }: { initial?: BrandFormValues }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [logoUrl, setLogoUrl] = useState(initial?.logoUrl ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!isEdit) setSlug(slugify(value));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const payload = { name, slug, logoUrl: logoUrl || null, isActive };
      const res = await fetch(isEdit ? `/api/admin/brands/${initial!.id}` : "/api/admin/brands", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Lưu thất bại.");
        return;
      }

      router.push("/admin/brands");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Tên thương hiệu</label>
        <input
          className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Logo (URL, không bắt buộc)</label>
        <input
          className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          placeholder="https://..."
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Đang hoạt động (hiển thị cho khách)
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-2 w-fit rounded-lg bg-black px-6 py-2 text-white transition hover:bg-zinc-800 disabled:opacity-50"
      >
        {saving ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo thương hiệu"}
      </button>
    </form>
  );
}
