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

// Mega menu kiểu FPT Shop thật: hiện khi di chuột vào (thuần CSS group-hover,
// không cần state đóng/mở — tránh race condition mouseleave/mouseenter khi
// chuột di chuyển giữa nút và panel). State duy nhất cần JS là category nào
// đang được hover ở cột trái để đổi nội dung cột phải.
//
// KHÁC BẢN GỐC: FPT Shop thật nhóm sub-category theo TỪNG thương hiệu bên
// trong từng danh mục (vd "Apple > iPhone 17/16/15 Series..."). Dữ liệu
// project này không có sub-category lẫn brand-per-category (Category chỉ có
// 3 danh mục phẳng: Điện thoại/Laptop/Phụ kiện; Brand là danh sách chung,
// không gắn categoryId) — nên cột phải hiển thị brand dạng chip link thẳng
// tới /products?category=...&brand=... (dùng đúng filter đã có sẵn) thay vì
// bịa thêm sub-category giả không tồn tại trong DB.
export default function CategoryMegaMenu({
  categories,
  brands,
}: {
  categories: CategoryItem[];
  brands: BrandItem[];
}) {
  const [activeSlug, setActiveSlug] = useState(categories[0]?.slug ?? "");
  const active = categories.find((c) => c.slug === activeSlug) ?? categories[0];

  if (!active) return null;

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

      <div className="invisible absolute left-0 top-full z-40 w-[min(90vw,560px)] pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100">
        <div className="flex overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="w-44 shrink-0 border-r border-zinc-100 bg-zinc-50 py-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/products?category=${c.slug}`}
                onMouseEnter={() => setActiveSlug(c.slug)}
                className={`block px-4 py-2.5 text-sm transition ${
                  c.slug === active.slug
                    ? "bg-white font-semibold text-accent"
                    : "text-zinc-600 hover:bg-white hover:text-zinc-900"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>

          <div className="flex-1 p-5">
            <p className="mb-3 text-sm font-semibold text-zinc-900">Thương hiệu nổi bật</p>
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
              <p className="text-sm text-zinc-500">Chưa có thương hiệu nào.</p>
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
