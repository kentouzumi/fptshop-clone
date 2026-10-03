"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_QUESTION_LENGTH, MIN_QUESTION_LENGTH } from "@/lib/qaLimits";
import { formatVnDate } from "@/lib/dateValue";

export interface QaAnswerProp {
  id: string;
  content: string;
  isStaff: boolean;
  authorName: string;
  createdAt: string;
}

export interface QaQuestionProp {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
  answers: QaAnswerProp[];
}

// Ngày đi qua formatVnDate: chuỗi rỗng/không hợp lệ ra "" thay vì "Invalid Date".

/**
 * Hỏi đáp dưới sản phẩm. Khác phần "Đánh giá" ở chỗ KHÔNG giới hạn 1 lần/người
 * (một khách có thể hỏi nhiều câu về cùng sản phẩm) và không có chấm sao.
 */
export default function ProductQaSection({
  productId,
  questions,
  isLoggedIn,
  canAnswerAsStaff,
}: {
  productId: string;
  questions: QaQuestionProp[];
  isLoggedIn: boolean;
  /** Admin trả lời thì câu trả lời mang nhãn "Nhân viên tư vấn". */
  canAnswerAsStaff: boolean;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, content }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gửi câu hỏi thất bại.");
        return;
      }
      setContent("");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(questionId: string) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/questions/${questionId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gửi câu trả lời thất bại.");
        return;
      }
      setReplyContent("");
      setReplyTo(null);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold tracking-tight">Hỏi và đáp</h2>

      {isLoggedIn ? (
        <form onSubmit={handleAsk} className="card mb-5 p-4">
          <label htmlFor="qa-question" className="mb-2 block text-sm font-medium text-zinc-900">
            Đặt câu hỏi về sản phẩm này
          </label>
          <textarea
            id="qa-question"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            maxLength={MAX_QUESTION_LENGTH}
            required
            placeholder="Ví dụ: Máy này có hỗ trợ sạc nhanh không ạ?"
            className="input w-full text-sm"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-xs text-zinc-400">
              {content.trim().length}/{MAX_QUESTION_LENGTH} ký tự (tối thiểu {MIN_QUESTION_LENGTH})
            </span>
            <button
              type="submit"
              disabled={submitting || content.trim().length < MIN_QUESTION_LENGTH}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {submitting ? "Đang gửi..." : "Gửi câu hỏi"}
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </form>
      ) : (
        <p className="card mb-5 p-4 text-sm text-zinc-500">
          <a href="/login" className="text-accent hover:underline">
            Đăng nhập
          </a>{" "}
          để đặt câu hỏi về sản phẩm này.
        </p>
      )}

      {questions.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Chưa có câu hỏi nào. Hãy là người đầu tiên hỏi về sản phẩm này.
        </p>
      ) : (
        <ul className="space-y-4">
          {questions.map((q) => (
            <li key={q.id} className="card p-4">
              <p className="text-sm text-zinc-900">{q.content}</p>
              <p className="mt-1 text-xs text-zinc-400">
                {q.authorName} · {formatVnDate(q.createdAt)}
              </p>

              {q.answers.length > 0 && (
                <ul className="mt-3 space-y-3 border-l-2 border-zinc-200 pl-4">
                  {q.answers.map((a) => (
                    <li key={a.id}>
                      <p className="text-sm text-zinc-700">{a.content}</p>
                      <p className="mt-0.5 text-xs">
                        <span
                          className={
                            a.isStaff ? "font-medium text-accent" : "text-zinc-400"
                          }
                        >
                          {a.authorName}
                        </span>
                        <span className="text-zinc-400"> · {formatVnDate(a.createdAt)}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              {isLoggedIn &&
                (replyTo === q.id ? (
                  <div className="mt-3">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      rows={2}
                      required
                      placeholder={
                        canAnswerAsStaff ? "Trả lời với tư cách nhân viên..." : "Trả lời..."
                      }
                      className="input w-full text-sm"
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleReply(q.id)}
                        disabled={submitting || replyContent.trim().length < 2}
                        className="btn-primary !px-4 !py-1.5 text-xs disabled:opacity-50"
                      >
                        Gửi
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyTo(null);
                          setReplyContent("");
                        }}
                        className="btn-secondary !px-4 !py-1.5 text-xs"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setReplyTo(q.id)}
                    className="mt-2 text-xs text-accent hover:underline"
                  >
                    Trả lời
                  </button>
                ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
