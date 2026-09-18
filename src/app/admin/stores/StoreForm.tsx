"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export interface StoreFormValues {
  id?: string;
  name: string;
  province: string;
  district: string;
  address: string;
  phone: string;
  openHours: string;
  isActive: boolean;
}

export default function StoreForm({ initial }: { initial?: StoreFormValues }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [name, setName] = useState(initial?.name ?? "");
  const [province, setProvince] = useState(initial?.province ?? "");
  const [district, setDistrict] = useState(initial?.district ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [openHours, setOpenHours] = useState(initial?.openHours ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = { name, province, district, address, phone: phone || null, openHours: openHours || null, isActive };
      const res = await fetch(isEdit ? `/api/admin/stores/${initial!.id}` : "/api/admin/stores", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Lưu thất bại.");
        return;
      }
      router.push("/admin/stores");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Tên cửa hàng</label>
        <input className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Tỉnh/Thành</label>
          <input className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2" value={province} onChange={(e) => setProvince(e.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Quận/Huyện</label>
          <input className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2" value={district} onChange={(e) => setDistrict(e.target.value)} required />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Địa chỉ cụ thể</label>
        <input className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2" value={address} onChange={(e) => setAddress(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Số điện thoại (tùy chọn)</label>
          <input className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Giờ mở cửa (tùy chọn)</label>
          <input className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2" placeholder="8:00 - 22:00" value={openHours} onChange={(e) => setOpenHours(e.target.value)} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Đang hoạt động (hiển thị cho khách)
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={saving} className="mt-2 w-fit rounded-lg bg-black px-6 py-2 text-white transition hover:bg-zinc-800 disabled:opacity-50">
        {saving ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo cửa hàng"}
      </button>
    </form>
  );
}
