"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const INPUT = "bg-white text-zinc-900 w-full rounded border border-zinc-300 px-3 py-2 text-sm";

export interface PostFormData {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverUrl: string;
  status: "DRAFT" | "PUBLISHED";
  metaTitle: string;
  metaDesc: string;
}

/** Bỏ dấu tiếng Việt rồi rút gọn thành slug — cùng cách ProductForm đang làm. */
function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function PostForm({ initial }: { initial?: PostFormData }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl ?? "");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(initial?.status ?? "DRAFT");
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle ?? "");
  const [metaDesc, setMetaDesc] = useState(initial?.metaDesc ?? "");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tạo mới thì slug luôn bám theo tiêu đề; SỬA thì giữ nguyên slug cũ dù đổi
  // tiêu đề, tránh vỡ URL bài đã chia sẻ/được index (cùng quyết định đã áp
  // dụng cho ProductForm/CategoryForm).
  function handleTitle(value: string) {
    setTitle(value);
    if (!isEdit) setSlug(slugify(value));
  }

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Tải ảnh thất bại.");
        return;
      }
      setCoverUrl(data.url);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(isEdit ? `/api/admin/posts/${initial!.id}` : "/api/admin/posts", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, title, excerpt, content, coverUrl, status, metaTitle, metaDesc }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Lưu bài viết thất bại.");
        return;
      }
      router.push("/admin/posts");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-5">
      <div>
        <label htmlFor="post-title" className="mb-1 block text-sm font-medium">
          Tiêu đề
        </label>
        <input
          id="post-title"
          className={INPUT}
          value={title}
          onChange={(e) => handleTitle(e.target.value)}
          required
        />
        <p className="mt-1 text-xs text-zinc-500">
          Đường dẫn: /tin-tuc/<span className="font-mono">{slug || "..."}</span>
          {isEdit && " (giữ nguyên khi sửa để không vỡ link cũ)"}
        </p>
      </div>

      <div>
        <label htmlFor="post-excerpt" className="mb-1 block text-sm font-medium">
          Tóm tắt <span className="font-normal text-zinc-500">(không bắt buộc)</span>
        </label>
        <textarea
          id="post-excerpt"
          className={INPUT}
          rows={2}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Hiện ở danh sách tin tức và dùng làm mô tả trên Google nếu bỏ trống ô SEO."
        />
      </div>

      <div>
        <label htmlFor="post-content" className="mb-1 block text-sm font-medium">
          Nội dung
        </label>
        <textarea
          id="post-content"
          className={`${INPUT} font-normal`}
          rows={16}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          placeholder="Nội dung bài viết. Để trống 1 dòng giữa các đoạn để tách đoạn."
        />
        <p className="mt-1 text-xs text-zinc-500">
          Nhập văn bản thuần — thẻ HTML sẽ hiện nguyên dạng chứ không được thực thi (chống XSS).
          Cách nhau 1 dòng trống để tách đoạn.
        </p>
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium">Ảnh bìa</span>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept="image/*"
            className="file-input text-sm"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
            }}
          />
          {uploading && <span className="text-xs text-zinc-500">Đang tải ảnh...</span>}
        </div>
        <input
          className={`${INPUT} mt-2`}
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
          placeholder="Hoặc dán URL ảnh"
        />
        {coverUrl && (
          <div className="mt-2 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverUrl} alt="" className="h-20 w-32 rounded object-cover" />
            <button
              type="button"
              onClick={() => setCoverUrl("")}
              className="text-xs text-red-600 hover:underline"
            >
              Xóa ảnh
            </button>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="post-status" className="mb-1 block text-sm font-medium">
          Trạng thái
        </label>
        <select
          id="post-status"
          className={INPUT}
          value={status}
          onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLISHED")}
        >
          <option value="DRAFT">Bản nháp (chưa hiện cho khách)</option>
          <option value="PUBLISHED">Xuất bản</option>
        </select>
      </div>

      <details className="rounded-xl border border-zinc-200 p-3">
        <summary className="cursor-pointer text-sm font-medium">Hiển thị trên Google</summary>
        <div className="mt-3 space-y-3">
          <div>
            <label htmlFor="post-meta-title" className="mb-1 block text-sm">
              Tiêu đề SEO{" "}
              <span className="text-xs text-zinc-500">({metaTitle.length}/70, bỏ trống dùng tiêu đề bài)</span>
            </label>
            <input
              id="post-meta-title"
              className={INPUT}
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              maxLength={70}
            />
          </div>
          <div>
            <label htmlFor="post-meta-desc" className="mb-1 block text-sm">
              Mô tả SEO{" "}
              <span className="text-xs text-zinc-500">({metaDesc.length}/160, bỏ trống dùng tóm tắt)</span>
            </label>
            <textarea
              id="post-meta-desc"
              className={INPUT}
              rows={2}
              value={metaDesc}
              onChange={(e) => setMetaDesc(e.target.value)}
              maxLength={160}
            />
          </div>
        </div>
      </details>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={submitting} className="btn-primary text-sm">
          {submitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo bài viết"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/posts")}
          className="btn-secondary text-sm"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}
