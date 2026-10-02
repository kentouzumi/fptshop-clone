"use client";

import "./globals.css";

/**
 * Lưới an toàn NGOÀI CÙNG: chỉ global-error.tsx bắt được lỗi xảy ra trong
 * CHÍNH root layout. Đây mới là file xử lý đúng ca hỏng nặng nhất của site,
 * không phải error.tsx — vì `Header` nằm trong root layout và nó gọi
 * getCurrentUser() (query bảng Session mỗi request), nên khi DB không với tới
 * được thì root layout throw và error.tsx (nằm BÊN TRONG layout đó) không bao
 * giờ được render. Trước khi có file này, đúng tình huống đó trả về một trang
 * 500 trắng trơn body rỗng — đã quan sát thật trên production khi đo tải.
 *
 * Vì nó THAY THẾ root layout, file này phải tự khai <html>/<body> và KHÔNG
 * được phụ thuộc bất cứ thứ gì có thể là nguyên nhân gây lỗi:
 *   - không import component nào đụng DB (Header/Footer/CompareProvider);
 *   - không dùng next/font: biến --font-sans-src do layout bơm vào <html>,
 *     mà layout thì vừa chết, nên đặt thẳng font hệ thống qua style;
 *   - không gọi cookies()/headers() hay bất kỳ hàm async nào.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body
        className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-16 text-zinc-700"
        style={{
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 text-center">
          <p className="text-sm font-semibold tracking-wide text-accent">
            Lỗi hệ thống
          </p>
          <h1 className="mt-3 text-2xl font-bold text-zinc-900">
            Trang tạm thời không tải được
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-500">
            Sự cố nằm ở phía chúng tôi, không phải do bạn làm gì sai. Thử tải
            lại sau ít phút — phần lớn trường hợp là tạm thời.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button type="button" onClick={() => reset()} className="btn-primary">
              Thử lại
            </button>
            {/*
              CỐ Ý dùng <a> chứ không phải next/link, nên phải tắt rule
              no-html-link-for-pages ở đúng dòng này: điều hướng mềm của Link
              sẽ render LẠI chính root layout vừa throw, tức gần như chắc chắn
              lỗi lại ngay. Chỉ một lần tải lại trang thật mới cho cơ hội chạm
              vào instance khác và dựng lại toàn bộ từ đầu.
            */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className="btn-secondary">
              Về trang chủ
            </a>
          </div>

          {/*
            CHỈ hiện `digest` — tuyệt đối không hiện error.message. Lỗi tầng DB
            của Prisma có thể chứa connection string/tên host trong thông báo.
            `digest` là mã băm Next.js tự sinh và cũng xuất hiện trong Vercel
            Runtime Logs, nên nó là thứ duy nhất vừa an toàn để lộ ra vừa dùng
            được để tra đúng lỗi trong log.
          */}
          {error.digest ? (
            <p className="mt-6 font-mono text-xs text-zinc-400">
              Mã lỗi: {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
