"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export interface AddressFormValues {
  id?: string;
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  streetDetail: string;
  label: string;
  isDefault: boolean;
}

export default function AddressForm({ initial }: { initial?: AddressFormValues }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [recipientName, setRecipientName] = useState(initial?.recipientName ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [province, setProvince] = useState(initial?.province ?? "");
  const [district, setDistrict] = useState(initial?.district ?? "");
  const [ward, setWard] = useState(initial?.ward ?? "");
  const [streetDetail, setStreetDetail] = useState(initial?.streetDetail ?? "");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const payload = { recipientName, phone, province, district, ward, streetDetail, label, isDefault };
      const res = await fetch(isEdit ? `/api/addresses/${initial!.id}` : "/api/addresses", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Lưu thất bại.");
        return;
      }

      router.push("/addresses");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Họ tên người nhận</label>
        <input
          className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Số điện thoại</label>
        <input
          className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Tỉnh/Thành</label>
          <input
            className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Quận/Huyện</label>
          <input
            className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Phường/Xã</label>
          <input
            className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2"
            value={ward}
            onChange={(e) => setWard(e.target.value)}
            required
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Địa chỉ cụ thể</label>
        <input
          className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2"
          placeholder="Số nhà, tên đường..."
          value={streetDetail}
          onChange={(e) => setStreetDetail(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Nhãn (không bắt buộc)</label>
        <input
          className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2"
          placeholder="Nhà riêng, Công ty..."
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
        Đặt làm địa chỉ mặc định
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-2 w-fit rounded-lg bg-black px-6 py-2 text-white transition hover:bg-zinc-800 disabled:opacity-50"
      >
        {saving ? "Đang lưu..." : isEdit ? "Cập nhật" : "Lưu địa chỉ"}
      </button>
    </form>
  );
}
