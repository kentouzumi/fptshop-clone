import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Không tìm thấy trang",
  // Trang 404 không bao giờ nên vào chỉ mục Google.
  robots: { index: false, follow: true },
};

/**
 * Trang 404 dùng chung cho mọi lệnh notFound() trong app (slug sản phẩm/bài
 * viết/thương hiệu không tồn tại) và cho URL gõ sai. Trước đó site dùng trang
 * 404 mặc định của Next.js — chữ đen trên nền trắng, lạc hẳn khỏi theme tối.
 *
 * CỐ Ý không query DB ở đây (vd lấy danh mục để gợi ý): trang 404 phải là
 * trang KHÔNG THỂ tự lỗi. Nếu nó cũng đụng DB thì lúc DB sập, một URL sai sẽ
 * rơi tiếp vào trang lỗi 500 thay vì báo đúng "không tìm thấy".
 */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <p className="font-mono text-sm font-semibold tracking-widest text-accent">404</p>
      <h1 className="mt-3 text-2xl font-bold text-zinc-900">Không tìm thấy trang này</h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-500">
        Đường dẫn có thể đã đổi, hoặc sản phẩm bạn tìm đã ngừng bán. Thử tìm lại
        từ trang chủ nhé.
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="btn-primary">
          Về trang chủ
        </Link>
        <Link href="/tra-cuu-don-hang" className="btn-secondary">
          Tra cứu đơn hàng
        </Link>
      </div>
    </div>
  );
}
