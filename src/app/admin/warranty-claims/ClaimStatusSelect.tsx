"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = ["RECEIVED", "IN_PROGRESS", "REPAIRED", "REPLACED", "REJECTED"];
const LABELS: Record<string, string> = {
  RECEIVED: "Đã tiếp nhận",
  IN_PROGRESS: "Đang xử lý",
  REPAIRED: "Đã sửa xong",
  REPLACED: "Đã đổi máy mới",
  REJECTED: "Từ chối bảo hành",
};

export default function ClaimStatusSelect({ claimId, status }: { claimId: string; status: string }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  async function handleChange(newStatus: string) {
    setValue(newStatus);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/warranty-claims/${claimId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        setValue(status);
        alert("Cập nhật thất bại.");
        return;
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={value}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value)}
      className="bg-white text-zinc-900 rounded border border-zinc-300 px-2 py-1 text-sm disabled:opacity-50"
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>
          {LABELS[s]}
        </option>
      ))}
    </select>
  );
}
