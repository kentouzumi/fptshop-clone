"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { value: "ORDER_ISSUE", label: "Vấn đề đơn hàng" },
  { value: "TECHNICAL_SUPPORT", label: "Hỗ trợ kỹ thuật" },
  { value: "COMPLAINT", label: "Khiếu nại" },
  { value: "WARRANTY", label: "Bảo hành" },
  { value: "OTHER", label: "Khác" },
];

export default function NewTicketForm({
  defaultFullName,
  defaultPhone,
  defaultEmail,
}: {
  defaultFullName: string;
  defaultPhone: string;
  defaultEmail: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(defaultFullName);
  const [phone, setPhone] = useState(defaultPhone);
  const [email, setEmail] = useState(defaultEmail);
  const [category, setCategory] = useState("ORDER_ISSUE");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone, email, category, subject, content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gửi yêu cầu thất bại.");
        return;
      }
      router.push(`/support/${data.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8 flex flex-col gap-3 rounded-lg border border-zinc-200 p-4">
      <h2 className="font-semibold">Tạo yêu cầu hỗ trợ</h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Họ tên</label>
          <input className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Số điện thoại</label>
          <input className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Email (không bắt buộc)</label>
        <input className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Danh mục</label>
        <select className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Tiêu đề</label>
        <input className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" value={subject} onChange={(e) => setSubject(e.target.value)} required />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Nội dung</label>
        <textarea className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" rows={3} value={content} onChange={(e) => setContent(e.target.value)} minLength={10} required />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className="w-fit rounded-lg bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
        {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
      </button>
    </form>
  );
}
