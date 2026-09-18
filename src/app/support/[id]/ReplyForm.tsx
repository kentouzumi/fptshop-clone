"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function ReplyForm({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/support/${ticketId}/reply`, {
        method: "POST",
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

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2">
      <textarea
        className="bg-white text-zinc-900 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        rows={2}
        placeholder="Nhập phản hồi..."
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
  );
}
