"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function QuestionRow({
  questionId,
  isVisible,
  hasAnswer,
}: {
  questionId: string;
  isVisible: boolean;
  hasAnswer: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitAnswer() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/questions/${questionId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gửi câu trả lời thất bại.");
        return;
      }
      setContent("");
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function toggleVisible() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/questions/${questionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !isVisible }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Đổi trạng thái thất bại.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={busy}
          className="btn-primary !px-4 !py-1.5 text-xs disabled:opacity-40"
        >
          {hasAnswer ? "Trả lời thêm" : "Trả lời"}
        </button>
        {/* Ẩn thay vì xóa: câu hỏi spam vẫn nên giữ lại để còn đối chiếu nếu
            cần, và xóa là thao tác không hoàn tác được. */}
        <button
          type="button"
          onClick={toggleVisible}
          disabled={busy}
          className="text-xs text-zinc-500 hover:underline disabled:opacity-40"
        >
          {isVisible ? "Ẩn khỏi trang sản phẩm" : "Hiện lại"}
        </button>
      </div>

      {open && (
        <div className="mt-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="Câu trả lời sẽ hiện với nhãn 'Nhân viên tư vấn'."
            className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
          />
          <button
            type="button"
            onClick={submitAnswer}
            disabled={busy || content.trim().length < 2}
            className="btn-primary mt-2 !px-4 !py-1.5 text-xs disabled:opacity-40"
          >
            {busy ? "Đang gửi..." : "Gửi câu trả lời"}
          </button>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
