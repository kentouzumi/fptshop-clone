"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function WarrantyClaimForm({ warrantyId }: { warrantyId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [issue, setIssue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/warranty/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ warrantyId, issue }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gửi yêu cầu thất bại.");
        return;
      }
      setIssue("");
      setOpen(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm text-blue-600 underline">
        Gửi yêu cầu bảo hành
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2">
      <textarea
        className="bg-white text-zinc-900 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        rows={2}
        placeholder="Mô tả sự cố (ít nhất 10 ký tự)"
        value={issue}
        onChange={(e) => setIssue(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {submitting ? "Đang gửi..." : "Gửi"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm">
          Hủy
        </button>
      </div>
    </form>
  );
}
