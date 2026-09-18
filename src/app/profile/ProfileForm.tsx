"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function ProfileForm({
  initialFullName,
  initialEmail,
  phone,
}: {
  initialFullName: string;
  initialEmail: string;
  phone: string | null;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialFullName);
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Cập nhật thất bại.");
        return;
      }

      setSuccess(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {phone && (
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-500">
            Số điện thoại
          </label>
          <input
            className="input bg-zinc-50 text-zinc-500"
            value={phone}
            disabled
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">Họ và tên</label>
        <input
          className="input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Email (không bắt buộc)</label>
        <input
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Dùng để nhận thông báo/hóa đơn"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Cập nhật thành công.</p>}

      <button type="submit" disabled={saving} className="btn-primary mt-1 w-full">
        {saving ? "Đang lưu..." : "Lưu thay đổi"}
      </button>
    </form>
  );
}
