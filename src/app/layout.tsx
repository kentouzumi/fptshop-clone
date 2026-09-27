import type { Metadata } from "next";
import { Unbounded, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CompareProvider } from "@/components/CompareProvider";
import CompareFloatingBar from "@/components/CompareFloatingBar";
import { SITE_NAME, SITE_URL } from "@/lib/siteUrl";
import "./globals.css";

const displayFont = Unbounded({
  variable: "--font-display-src",
  subsets: ["vietnamese", "latin"],
  weight: ["600", "700", "800"],
});

const bodyFont = Plus_Jakarta_Sans({
  variable: "--font-sans-src",
  subsets: ["vietnamese", "latin"],
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono-src",
  subsets: ["vietnamese", "latin"],
});

export const metadata: Metadata = {
  // metadataBase: bắt buộc phải có để mọi đường dẫn tương đối trong canonical/
  // openGraph của các trang con tự thành URL tuyệt đối. Thiếu nó, Next.js bỏ
  // qua các URL tương đối kèm cảnh báo lúc build chứ không báo lỗi.
  metadataBase: new URL(SITE_URL),
  // "%s" được thay bằng `title` của từng trang con; trang nào không tự khai
  // title thì dùng `default`.
  title: {
    default: `${SITE_NAME} — Điện thoại, Laptop, Tivi chính hãng`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Mua điện thoại, laptop và tivi chính hãng với giá tốt. Bảo hành 12 tháng, thu cũ đổi mới, nhận hàng tại cửa hàng hoặc giao tận nơi.",
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: SITE_NAME,
    url: "/",
  },
  twitter: { card: "summary_large_image" },
  robots: {
    index: true,
    follow: true,
    // Cho phép Google hiện ảnh lớn + toàn bộ đoạn mô tả trong kết quả tìm
    // kiếm; mặc định của Google với site không khai báo là hạn chế hơn.
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-50">
        <CompareProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CompareFloatingBar />
        </CompareProvider>
      </body>
    </html>
  );
}
