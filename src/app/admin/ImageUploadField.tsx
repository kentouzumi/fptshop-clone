"use client";

import { useRef, useState } from "react";
import Image from "next/image";

/**
 * Ô chọn MỘT ảnh cho form admin (logo thương hiệu, ảnh danh mục).
 *
 * Giữ nguyên cả 2 cách nhập như ProductForm/ReviewForm đã làm: chọn tệp để
 * upload lên Supabase, HOẶC dán thẳng URL ảnh có sẵn. Không bỏ ô dán URL đi
 * vì ảnh sẵn trên Storage (hoặc ảnh do script seed tải lên) vẫn cần gán lại
 * được mà không phải tải xuống rồi upload lại.
 *
 * Khác ProductForm ở chỗ đây là ảnh ĐƠN: chọn tệp mới thì THAY thế ảnh cũ
 * chứ không cộng dồn vào danh sách.
 */
export default function ImageUploadField({
  label,
  value,
  onChange,
  folder,
  hint,
  previewClassName = "h-16 w-32",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  /** Tên ngắn thư mục trên Storage — xem ADMIN_UPLOAD_FOLDERS ở lib/supabaseStorage.ts. */
  folder: "brands" | "categories";
  hint?: string;
  previewClassName?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", folder);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Tải ảnh lên thất bại.");
        return;
      }
      onChange(data.url);
    } catch {
      setError("Không kết nối được để tải ảnh lên.");
    } finally {
      setUploading(false);
      // Xóa giá trị input để chọn LẠI ĐÚNG file vừa chọn vẫn kích hoạt
      // onChange (trình duyệt không bắn sự kiện nếu giá trị không đổi).
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>

      {value && (
        <div className="mb-2 flex items-center gap-3">
          {/* Nền sáng: theme tối đảo thang màu (bg-zinc-950 = #fbf7ef là bề
              mặt sáng nhất), mà logo hãng phần lớn là chữ đen — xem trước
              trên nền tối thì không thấy gì. */}
          <div className={`relative ${previewClassName} shrink-0 rounded-lg bg-zinc-950`}>
            <Image src={value} alt="" fill sizes="128px" className="object-contain p-2" />
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-red-600 hover:underline"
          >
            Xóa ảnh
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
        className="file-input w-full text-sm"
      />

      <input
        className="bg-white text-zinc-900 mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        placeholder="Hoặc dán URL ảnh có sẵn: https://..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {uploading && <p className="mt-1 text-xs text-zinc-500">Đang tải ảnh lên...</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}
