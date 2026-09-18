"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = [
  { value: "OPEN", label: "Mới" },
  { value: "IN_PROGRESS", label: "Đang xử lý" },
  { value: "RESOLVED", label: "Đã giải quyết" },
  { value: "CLOSED", label: "Đã đóng" },
];

export default function AdminTicketPanel({ ticketId, status }: { ticketId: string; status: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [statusValue, setStatusValue] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleReply(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/support/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gửi phản hồi thất bại.");
        return;
      }
      setContent("");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    setStatusValue(newStatus);
    await fetch(`/api/admin/support/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
  }

  return (
    <div className="mt-4 space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Trạng thái</label>
        <select
          value={statusValue}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="bg-white text-zinc-900 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={handleReply} className="flex flex-col gap-2">
        <label className="text-sm font-medium">Phản hồi khách hàng</label>
        <textarea
          className="bg-white text-zinc-900 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-fit rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {submitting ? "Đang gửi..." : "Gửi phản hồi"}
        </button>
      </form>
    </div>
  );
}
