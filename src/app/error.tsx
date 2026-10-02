"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Bắt lỗi xảy ra trong các TRANG (layout vẫn sống, nên Header/Footer vẫn
 * render quanh khối này). Lỗi trong chính root layout thì file này không bắt
 * được — đó là việc của global-error.tsx.
 *
 * `reset()` chỉ render lại nhánh bị lỗi chứ không tải lại cả trang, nên với
 * lỗi tạm thời (DB nghẽn một nhịp) nó đủ để trang hiện lại bình thường mà
 * không mất vị trí cuộn hay state ở Header.
 */
export default function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Ở production Next.js đã lược bỏ nội dung lỗi trước khi gửi xuống client
    // (chỉ còn `digest`), nên dòng này chủ yếu hữu ích lúc chạy local.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <p className="text-sm font-semibold tracking-wide text-accent">Có lỗi xảy ra</p>
      <h1 className="mt-3 text-2xl font-bold text-zinc-900">
        Không tải được nội dung này
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-500">
        Sự cố nằm ở phía chúng tôi. Bạn thử lại ngay bên dưới, hoặc quay lại sau
        ít phút.
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={() => reset()} className="btn-primary">
          Thử lại
        </button>
        <Link href="/" className="btn-secondary">
          Về trang chủ
        </Link>
      </div>

      {/* Không bao giờ hiện error.message — xem lý do trong global-error.tsx. */}
      {error.digest ? (
        <p className="mt-6 font-mono text-xs text-zinc-400">Mã lỗi: {error.digest}</p>
      ) : null}
    </div>
  );
}
