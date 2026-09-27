/**
 * URL gốc của site, dùng cho metadataBase (next/metadata tự đổi mọi đường dẫn
 * tương đối trong canonical/openGraph thành URL tuyệt đối), sitemap.xml và
 * robots.txt — 3 chỗ này BẮT BUỘC phải là URL tuyệt đối, đường dẫn tương đối
 * không có ý nghĩa gì với Google.
 *
 * Thứ tự ưu tiên:
 * 1. NEXT_PUBLIC_SITE_URL — tự đặt khi cần (vd domain riêng sau này).
 * 2. VERCEL_PROJECT_PRODUCTION_URL — Vercel tự cấp, LUÔN trỏ domain
 *    production kể cả khi build đang chạy cho 1 preview deployment (khác
 *    VERCEL_URL: biến đó trỏ chính deployment hiện tại, dùng làm canonical sẽ
 *    khiến mỗi lần deploy lại sinh ra một URL "chính thức" khác nhau).
 * 3. Cuối cùng mới hardcode domain hiện tại, để KHÔNG cần cấu hình thêm biến
 *    env nào trên Vercel mà sitemap/canonical vẫn đúng ngay.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://fptshop-clone.vercel.app")
).replace(/\/$/, "");

export const SITE_NAME = "FPT Shop Clone";

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
