"use client";

import { useState } from "react";
import Link from "next/link";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

interface BrandItem {
  name: string;
  slug: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "dien-thoai": (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18h3" />
    </svg>
  ),
  laptop: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18v-8.25a1.5 1.5 0 011.5-1.5h16.5a1.5 1.5 0 011.5 1.5V18M2.25 18l-.5 2.121A1.5 1.5 0 003.211 22h17.578a1.5 1.5 0 001.462-1.879L21.75 18M2.25 18h19.5" />
    </svg>
  ),
  "dien-may": (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5h16.5a1 1 0 011 1v11a1 1 0 01-1 1H3.75a1 1 0 01-1-1v-11a1 1 0 011-1zM8.25 20.25h7.5M12 17.5v2.75" />
    </svg>
  ),
  "phu-kien": (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 18v-6a8.25 8.25 0 0116.5 0v6M3.75 18a1.5 1.5 0 001.5 1.5H6a1.5 1.5 0 001.5-1.5v-3A1.5 1.5 0 006 13.5H3.75V18zm16.5 0a1.5 1.5 0 01-1.5 1.5H18a1.5 1.5 0 01-1.5-1.5v-3a1.5 1.5 0 011.5-1.5h2.25V18z" />
    </svg>
  ),
};

const DEFAULT_ICON = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

// Mega menu kiểu FPT Shop thật: hiện khi di chuột vào (thuần CSS group-hover,
// không cần state đóng/mở — tránh race condition mouseleave/mouseenter khi
// chuột di chuyển giữa nút và panel).
//
// Đã đơn giản hóa lại (user yêu cầu quay về đúng 4 danh mục phẳng: Điện
// thoại/Laptop/Điện máy/Phụ kiện, không còn danh mục con dùng parentId như
// bản trước) — cột trái giờ chỉ là list phẳng, mỗi category 1 <Link> duy
// nhất, không còn logic tách nhiều tên trong 1 dòng.
//
// Panel bên phải đổi tên từ "Thương hiệu {category}" thành "Danh mục con"
// theo đúng yêu cầu (vd hover "Điện thoại" muốn thấy danh mục con kiểu
// "iPhone, Samsung,..."): dữ liệu thật của dự án không có tầng category con
// theo brand (Category chỉ có 4 hàng phẳng), nên tái dùng ĐÚNG danh sách
// brand thật đang có sản phẩm trong category đó (getBrandsByCategory) làm
// nội dung cho "Danh mục con" — Apple/Samsung/Xiaomi/OPPO dưới Điện thoại
// chính là các "hãng = danh mục con" mà user mô tả, không bịa thêm dữ liệu
// category giả không gắn với sản phẩm thật nào.
export default function CategoryMegaMenu({
  categories,
  brandsByCategory,
}: {
  categories: CategoryItem[];
  brandsByCategory: Record<string, BrandItem[]>;
}) {
  const [activeSlug, setActiveSlug] = useState(categories[0]?.slug ?? "");
  const active = categories.find((c) => c.slug === activeSlug) ?? categories[0];

  if (!active) return null;

  const brands = brandsByCategory[active.slug] ?? [];

  return (
    <div className="group relative">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink shadow-[0_6px_18px_-8px_rgba(255,180,84,0.55)] transition hover:brightness-110"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
        </svg>
        <span className="hidden sm:inline">Danh mục</span>
      </button>

      <div className="invisible absolute left-0 top-full z-40 w-[min(90vw,520px)] pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100">
        <div className="flex overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="w-48 shrink-0 border-r border-zinc-100 bg-zinc-50 py-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/products?category=${c.slug}`}
                onMouseEnter={() => setActiveSlug(c.slug)}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm ${
                  c.slug === active.slug
                    ? "bg-white font-semibold text-accent"
                    : "text-zinc-600 hover:bg-white hover:text-zinc-900"
                }`}
              >
                <span className="shrink-0 text-zinc-500">{CATEGORY_ICONS[c.slug] ?? DEFAULT_ICON}</span>
                {c.name}
              </Link>
            ))}
          </div>

          <div className="flex-1 p-5">
            <p className="mb-3 text-sm font-semibold text-zinc-900">Danh mục con</p>
            {brands.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {brands.map((b) => (
                  <Link
                    key={b.slug}
                    href={`/products?category=${active.slug}&brand=${b.slug}`}
                    className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-accent hover:text-zinc-900"
                  >
                    {b.name}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Chưa có sản phẩm nào.</p>
            )}

            <Link
              href={`/products?category=${active.slug}`}
              className="mt-5 inline-block text-sm font-medium text-accent hover:underline"
            >
              Xem tất cả {active.name} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
