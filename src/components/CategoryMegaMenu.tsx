"use client";

import { useState } from "react";
import Link from "next/link";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string }[];
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
  tivi: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5h16.5a1 1 0 011 1v11a1 1 0 01-1 1H3.75a1 1 0 01-1-1v-11a1 1 0 011-1zM8.25 20.25h7.5M12 17.5v2.75" />
    </svg>
  ),
};

const DEFAULT_ICON = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

// Icon cho DANH MỤC CON. Mỗi icon cố ý gắn với ĐẶC ĐIỂM THẬT phân biệt dòng
// đó, không phải hình trang trí cho khác nhau: 4 dòng điện thoại nếu vẽ 4 cái
// điện thoại giống hệt thì icon không nói thêm được gì so với chữ, nên mỗi
// cái mang đúng thứ dòng máy đó được biết tới.
//  - iPhone 15 Series: viên thuốc Dynamic Island ở đỉnh màn hình.
//  - Galaxy S Series: bút S Pen (S24 Ultra trong shop có bút).
//  - Redmi Series: cục pin đầy — Redmi bán chạy nhờ pin 5000mAh.
//  - Reno Series: cụm camera nổi bật — Reno lấy camera/zoom làm điểm mạnh.
//  - MacBook / Laptop gaming / mỏng nhẹ: máy tính, tay cầm game, chiếc lông vũ.
//  - Tivi QLED / LED: màn hình có chấm lượng tử, và màn hình trơn.
const SUBCATEGORY_ICONS: Record<string, React.ReactNode> = {
  "iphone-15-series": (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path strokeLinecap="round" d="M10.5 5.5h3" />
    </svg>
  ),
  "samsung-galaxy-s-series": (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <rect x="4" y="2.5" width="10" height="19" rx="2.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 4.5l2.5 2.5-8 8-3 .5.5-3 8-8z" />
    </svg>
  ),
  "xiaomi-redmi-series": (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <rect x="9" y="7" width="6" height="10" rx="1" fill="currentColor" stroke="none" />
      <path strokeLinecap="round" d="M10.5 5.5h3" />
    </svg>
  ),
  "oppo-reno-series": (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <circle cx="12" cy="9" r="2.5" />
      <circle cx="12" cy="9" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  ),
  macbook: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <rect x="4" y="5" width="16" height="11" rx="1.5" />
      <path strokeLinecap="round" d="M2 19h20" />
    </svg>
  ),
  "laptop-gaming": (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinejoin="round" d="M7 8h10a4 4 0 014 4v2a3 3 0 01-5.4 1.8L14 14h-4l-1.6 1.8A3 3 0 013 14v-2a4 4 0 014-4z" />
      <path strokeLinecap="round" d="M7 11.5v2M6 12.5h2M16 12h.01M17.5 13.5h.01" />
    </svg>
  ),
  "laptop-mong-nhe": (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20c0-7 5-12 12-13 1 7-3 12-8 12.5L4 20z" />
      <path strokeLinecap="round" d="M7 17c2-3 5-5 8-6" />
    </svg>
  ),
  "tivi-qled": (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <rect x="2.5" y="4.5" width="19" height="12" rx="1.5" />
      <path strokeLinecap="round" d="M8.5 20h7" />
      <circle cx="9" cy="9" r="1" fill="currentColor" stroke="none" />
      <circle cx="13" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="8" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  "tivi-led": (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <rect x="2.5" y="4.5" width="19" height="12" rx="1.5" />
      <path strokeLinecap="round" d="M8.5 20h7" />
    </svg>
  ),
};

const DEFAULT_SUB_ICON = (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
  </svg>
);

// Mega menu kiểu FPT Shop thật: hiện khi di chuột vào (thuần CSS group-hover,
// không cần state đóng/mở — tránh race condition mouseleave/mouseenter khi
// chuột di chuyển giữa nút và panel).
//
// Panel bên phải có 2 khối tách biệt, mỗi khối một vai trò KHÁC nhau:
//
//  - "Danh mục con": danh mục con THẬT (Category.parentId) — iPhone 15
//    Series, Laptop gaming, Tivi QLED... Trước đây khối này hiện danh sách
//    THƯƠNG HIỆU dưới cái tên "Danh mục con" vì dự án chưa có tầng danh mục
//    con nào; giờ có dữ liệu thật nên nó hiện đúng thứ nó nói.
//  - "Thương hiệu": vẫn là hãng thật đang có hàng trong danh mục đó, nhưng
//    giờ là một khối riêng có nhãn đúng. Chip hãng trỏ tới trang lọc
//    `?category=&brand=` (hàng của hãng TRONG danh mục đang chọn) thay vì
//    trang thương hiệu — trang thương hiệu gom hàng của hãng ở MỌI danh mục
//    nên không khớp ngữ cảnh "đang xem danh mục này"; lối vào trang đó là
//    link "Xem tất cả thương hiệu" phía dưới.
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
  const children = active.children;

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

      <div className="invisible absolute left-0 top-full z-40 w-[min(92vw,600px)] pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100">
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
            {children.length > 0 && (
              <>
                <p className="mb-2 text-sm font-semibold text-zinc-900">Danh mục con</p>
                <ul className="mb-5 space-y-1">
                  {children.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/products?category=${c.slug}`}
                        className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
                      >
                        <span className="shrink-0 text-zinc-400">
                          {SUBCATEGORY_ICONS[c.slug] ?? DEFAULT_SUB_ICON}
                        </span>
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <p className="mb-2 text-sm font-semibold text-zinc-900">Thương hiệu</p>
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

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1">
              <Link
                href={`/products?category=${active.slug}`}
                className="text-sm font-medium text-accent hover:underline"
              >
                Xem tất cả {active.name} →
              </Link>
              <Link
                href="/thuong-hieu"
                className="text-sm text-zinc-500 hover:underline"
              >
                Xem tất cả thương hiệu
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
