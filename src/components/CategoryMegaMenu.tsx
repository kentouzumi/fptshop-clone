"use client";

import { useState } from "react";
import Link from "next/link";

interface LeafCategory {
  id: string;
  name: string;
  slug: string;
}

interface CategoryItem extends LeafCategory {
  children: LeafCategory[];
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
  "tivi-may-lanh-dieu-hoa": (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5h16.5a1 1 0 011 1v11a1 1 0 01-1 1H3.75a1 1 0 01-1-1v-11a1 1 0 011-1zM8.25 20.25h7.5M12 17.5v2.75" />
    </svg>
  ),
  "tu-lanh-tu-dong-tu-mat": (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 3.75h12a1 1 0 011 1v14.5a1 1 0 01-1 1H6a1 1 0 01-1-1V4.75a1 1 0 011-1zM5 9.75h14M8.5 6.5v1.5M8.5 12.5v1.5" />
    </svg>
  ),
  "may-giat-may-say-tu-say": (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="13" r="5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.75 3.75h14.5a1 1 0 011 1v14.5a1 1 0 01-1 1H4.75a1 1 0 01-1-1V4.75a1 1 0 011-1zM7 6h.01M9.5 6h.01" />
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
// User yêu cầu rõ: những dòng gộp nhiều tên (vd "Thiết bị bếp, Máy rửa bát,
// Máy hút mùi") phải "vẫn giữ nguyên thế" (nhìn vẫn 1 dòng y hệt cũ) NHƯNG
// "chỉ có thể chọn Thiết bị bếp HOẶC Máy rửa bát HOẶC Máy hút mùi" — tức
// từng tên trong dòng đó phải là 1 lựa chọn ĐỘC LẬP, không phải cả dòng là
// 1 link chung. Cách làm: mỗi category cấp cao nếu CÓ `children` (category
// con, xem getActiveCategoriesWithChildren() ở lib/categories.ts — dùng
// đúng quan hệ parentId đã có sẵn trong schema từ đầu dự án, seed.ts giờ
// tạo category con cho mỗi tên tách riêng) thì render TỪNG TÊN CON như 1
// <Link> riêng, nối nhau bằng ", " ngay trong CÙNG 1 dòng — không phải
// wrap cả dòng trong 1 thẻ <a> như trước. Category KHÔNG có children (Điện
// thoại, Laptop, Phụ kiện) vẫn render như cũ (cả dòng là 1 link).
//
// `active` giờ luôn là 1 LEAF (category không con — hoặc category gốc nếu
// nó không có con, hoặc 1 trong các con của nó) vì đó mới là category thật
// sự có sản phẩm/brand — panel bên phải (brand chip) luôn tra theo leaf
// đang active, không bao giờ tra theo category cha (cha không tự có sản
// phẩm trực tiếp nữa sau khi tách).
export default function CategoryMegaMenu({
  categories,
  brandsByCategory,
}: {
  categories: CategoryItem[];
  brandsByCategory: Record<string, BrandItem[]>;
}) {
  const firstLeafSlug = categories[0]?.children[0]?.slug ?? categories[0]?.slug ?? "";
  const [activeSlug, setActiveSlug] = useState(firstLeafSlug);

  const allLeaves = categories.flatMap((c) => (c.children.length > 0 ? c.children : [c]));
  const active = allLeaves.find((leaf) => leaf.slug === activeSlug) ?? allLeaves[0];

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

      <div className="invisible absolute left-0 top-full z-40 w-[min(90vw,640px)] pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100">
        <div className="flex overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="max-h-[420px] w-56 shrink-0 overflow-y-auto border-r border-zinc-100 bg-zinc-50 py-2">
            {categories.map((c) => (
              <div key={c.id} className="flex items-start gap-3 px-4 py-2 text-sm">
                <span className="mt-0.5 shrink-0 text-zinc-500">
                  {CATEGORY_ICONS[c.slug] ?? DEFAULT_ICON}
                </span>
                <span className="leading-tight">
                  {c.children.length > 0
                    ? c.children.map((child, i) => (
                        <span key={child.id}>
                          {i > 0 && <span className="text-zinc-400">, </span>}
                          <Link
                            href={`/products?category=${child.slug}`}
                            onMouseEnter={() => setActiveSlug(child.slug)}
                            className={
                              child.slug === active.slug
                                ? "font-semibold text-accent"
                                : "text-zinc-600 hover:text-zinc-900 hover:underline"
                            }
                          >
                            {child.name}
                          </Link>
                        </span>
                      ))
                    : (
                        <Link
                          href={`/products?category=${c.slug}`}
                          onMouseEnter={() => setActiveSlug(c.slug)}
                          className={
                            c.slug === active.slug
                              ? "font-semibold text-accent"
                              : "text-zinc-600 hover:text-zinc-900"
                          }
                        >
                          {c.name}
                        </Link>
                      )}
                </span>
              </div>
            ))}
          </div>

          <div className="flex-1 p-5">
            <p className="mb-3 text-sm font-semibold text-zinc-900">
              Thương hiệu {active.name.toLowerCase()}
            </p>
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
