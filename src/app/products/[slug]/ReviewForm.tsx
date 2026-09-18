"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const MAX_IMAGES = 5;

export default function ReviewForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleFilesChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const remaining = MAX_IMAGES - imageUrls.length;
    if (remaining <= 0) {
      setError(`Tối đa ${MAX_IMAGES} ảnh cho mỗi đánh giá.`);
      return;
    }

    setUploading(true);
    setError(null);
    try {
      for (const file of files.slice(0, remaining)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/reviews/upload-image", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Upload ảnh thất bại.");
          break;
        }
        setImageUrls((prev) => [...prev, data.url]);
      }
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url: string) {
    setImageUrls((prev) => prev.filter((u) => u !== url));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, title, content, imageUrls }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Gửi đánh giá thất bại.");
        return;
      }

      setContent("");
      setTitle("");
      setImageUrls([]);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 flex flex-col gap-3 rounded-lg border border-zinc-200 p-4"
    >
      <div>
        <label className="mb-1 block text-sm font-medium">Số sao</label>
        <div className="flex gap-1 text-2xl text-amber-500">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} sao`}
            >
              {n <= rating ? "★" : "☆"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Tiêu đề (không bắt buộc)</label>
        <input
          className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Nội dung</label>
        <textarea
          className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          minLength={10}
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Ảnh đính kèm (không bắt buộc, tối đa {MAX_IMAGES} ảnh)
        </label>
        {imageUrls.length < MAX_IMAGES && (
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesChange}
            disabled={uploading}
            className="file-input"
          />
        )}
        {uploading && <p className="mt-1 text-xs text-zinc-500">Đang tải ảnh lên...</p>}
        {imageUrls.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {imageUrls.map((url) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="Ảnh đánh giá" className="h-16 w-16 rounded object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs text-white"
                  aria-label="Xóa ảnh"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || uploading}
        className="w-fit rounded-lg bg-black px-5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
      >
        {submitting ? "Đang gửi..." : "Gửi đánh giá"}
      </button>
    </form>
  );
}
