import type { NextConfig } from "next";

// Content-Security-Policy: script-src/style-src cần "unsafe-inline" vì Next.js App
// Router tự chèn <script> inline để stream RSC payload lúc hydrate (self.__next_f.push),
// không có cách nào tắt hành vi này ngoài dùng nonce (phức tạp hơn nhiều, không cần
// thiết cho quy mô project này) — dù vậy frame-ancestors/object-src/base-uri vẫn chặn
// được các lớp tấn công quan trọng (clickjacking, plugin injection, base tag hijack).
//
// CHỈ nới lỏng thêm ở môi trường dev (KHÔNG áp dụng khi build production/Vercel):
// - 'unsafe-eval' trong script-src — React/Turbopack dùng eval() lúc dev để dựng lại
//   call stack phục vụ Fast Refresh/debugging (React tự in cảnh báo rõ "React will
//   never use eval() in production mode" nếu thiếu dòng này, không phải lỗi thật).
// - "ws: wss:" trong connect-src — kênh WebSocket Hot Module Reload của dev server.
// Next.js set NODE_ENV=production cho MỌI lần `next build` (kể cả Vercel Preview),
// chỉ `next dev` mới có NODE_ENV=development, nên tách theo biến này là an toàn.
const isDev = process.env.NODE_ENV !== "production";
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://*.supabase.co https://placehold.co https://img.vietqr.io",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com https://test-payment.momo.vn",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "img.vietqr.io" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
