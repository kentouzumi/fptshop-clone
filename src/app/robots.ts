import type { MetadataRoute } from "next";
import { SITE_URL, absoluteUrl } from "@/lib/siteUrl";

/**
 * robots.txt sinh động (Next.js tự phục vụ ở /robots.txt).
 *
 * Chặn crawl các nhánh KHÔNG có nội dung công khai: toàn bộ /admin và /api,
 * cùng các trang chỉ có nghĩa với 1 người dùng đã đăng nhập (giỏ hàng, đơn
 * hàng, sổ địa chỉ, thông báo...). Các trang này vốn đã redirect về /login khi
 * chưa đăng nhập nên bot không lấy được gì, nhưng để chúng trong robots.txt
 * giúp Google không tiêu tốn crawl budget vào các URL luôn trả về redirect.
 *
 * KHÔNG chặn /products (kể cả các URL có query lọc) — bản thân trang danh mục
 * là nội dung cần index; riêng các biến thể có filter/tìm kiếm thì đã tự đặt
 * `robots: noindex` + canonical trỏ về URL danh mục gốc ngay trong
 * generateMetadata của trang đó, chính xác hơn là chặn thô ở đây.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          "/cart",
          "/checkout",
          "/orders",
          "/addresses",
          "/profile",
          "/notifications",
          "/wishlist",
          "/warranty",
          "/trade-in",
          "/loyalty",
          "/support",
          "/login",
          "/compare",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
