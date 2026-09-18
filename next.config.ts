import type { NextConfig } from "next";

// Content-Security-Policy: script-src/style-src cần "unsafe-inline" vì Next.js App
// Router tự chèn <script> inline để stream RSC payload lúc hydrate (self.__next_f.push),
// không có cách nào tắt hành vi này ngoài dùng nonce (phức tạp hơn nhiều, không cần
// thiết cho quy mô project này) — dù vậy frame-ancestors/object-src/base-uri vẫn chặn
// được các lớp tấn công quan trọng (clickjacking, plugin injection, base tag hijack).
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://*.supabase.co https://placehold.co",
  "font-src 'self' data:",
  "connect-src 'self'",
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
