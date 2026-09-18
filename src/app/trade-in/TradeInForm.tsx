"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function TradeInForm() {
  const router = useRouter();
  const [deviceInfo, setDeviceInfo] = useState("");
  const [condition, setCondition] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/trade-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceInfo, condition }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gửi yêu cầu thất bại.");
        return;
      }
      setDeviceInfo("");
      setCondition("");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8 flex flex-col gap-3 rounded-lg border border-zinc-200 p-4">
      <h2 className="font-semibold">Gửi yêu cầu định giá máy cũ</h2>
      <div>
        <label className="mb-1 block text-sm font-medium">Thông tin máy cũ</label>
        <input
          className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          placeholder="VD: iPhone 12 128GB"
          value={deviceInfo}
          onChange={(e) => setDeviceInfo(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Tình trạng máy</label>
        <textarea
          className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          rows={2}
          placeholder="VD: Máy dùng 2 năm, còn bảo hành, màn hình có vài vết xước nhẹ..."
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-fit rounded-lg bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
      </button>
    </form>
  );
}
