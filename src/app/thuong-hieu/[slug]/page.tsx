import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getBrandPageData } from "@/lib/brands";
import { getProducts, type ProductSort } from "@/lib/products";
import { getCurrentUser } from "@/lib/auth";
import { getWishlistedProductIds } from "@/lib/wishlist";
import { getOutOfStockProductIds } from "@/lib/inventory";
import ProductCard from "@/components/ProductCard";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl } from "@/lib/siteUrl";

/**
 * Trang thương hiệu (microsite) — gom toàn bộ hàng của một hãng về một chỗ,
 * kèm đoạn giới thiệu hãng.
 *
 * KHÁC với `/products?brand=<slug>` (vốn đã có từ trước): trang lọc chỉ hiện
 * hàng của hãng đó TRONG MỘT danh mục đang xem, còn trang này cắt theo hãng
 * TRƯỚC rồi mới cho lọc danh mục — Apple ở đây hiện cả iPhone lẫn MacBook
 * trong cùng một trang, điều trang lọc không làm được. Đây cũng là lý do nó
 * đáng có URL riêng để Google index, trong khi mọi URL `/products` có tham số
 * lọc đều đang noindex.
 */

// Dùng chung 1 lượt query giữa generateMetadata và component: không bọc
// cache() thì mỗi lần render trang là 2 lượt gọi y hệt nhau (cùng cách đã làm
// ở trang chi tiết sản phẩm).
const loadBrand = cache(async (slug: string) => getBrandPageData(slug));

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}): Promise<Metadata> {
  const { slug } = await params;
  const brand = await loadBrand(slug);
  if (!brand) return { title: "Không tìm thấy thương hiệu", robots: { index: false, follow: true } };

  const query = await searchParams;
  // Lọc danh mục / sắp xếp / phân trang = cùng tập sản phẩm nhìn qua URL khác
  // → không index bản đó nhưng canonical vẫn dồn về trang hãng gốc, y hệt
  // cách /products xử lý các tham số xem.
  const hasViewParams = Boolean(query.category || query.sort || (query.page && query.page !== "1"));

  const title = `${brand.name} chính hãng`;
  const description =
    brand.description ??
    `Toàn bộ sản phẩm ${brand.name} chính hãng đang bán: ${brand.categories
      .map((c) => c.name.toLowerCase())
      .join(", ")}.`;

  return {
    title,
    description: description.slice(0, 300),
    alternates: { canonical: absoluteUrl(`/thuong-hieu/${brand.slug}`) },
    ...(hasViewParams ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "website",
      title,
      description: description.slice(0, 300),
      url: absoluteUrl(`/thuong-hieu/${brand.slug}`),
      locale: "vi_VN",
      ...(brand.logoUrl ? { images: [{ url: brand.logoUrl }] } : {}),
    },
  };
}

function chipClass(active: boolean) {
  return active
    ? "rounded-full border border-accent bg-accent/10 px-4 py-2 text-sm font-medium text-zinc-900"
    : "rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition hover:border-zinc-400";
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const brand = await loadBrand(slug);
  if (!brand) notFound();

  const page = Math.max(1, Number(query.page ?? "1") || 1);
  const sort: ProductSort =
    query.sort === "price_asc" || query.sort === "price_desc" ? query.sort : "newest";

  // Chỉ nhận `category` nếu hãng này THẬT SỰ có hàng ở đó — gõ tay 1 slug lạ
  // vào URL sẽ ra lưới rỗng mà không rõ vì sao, còn bỏ qua thì trang vẫn hiện
  // đúng toàn bộ hàng của hãng.
  const activeCategory = brand.categories.find((c) => c.slug === query.category)?.slug;

  const [{ products, totalPages }, currentUser] = await Promise.all([
    getProducts({
      brandSlugs: [brand.slug],
      categorySlug: activeCategory,
      sort,
      page,
      limit: 12,
    }),
    getCurrentUser(),
  ]);

  const shownIds = products.map((p) => p.id);
  const [wishlistedIds, outOfStockIds] = await Promise.all([
    currentUser ? getWishlistedProductIds(currentUser.id, shownIds) : new Set<string>(),
    getOutOfStockProductIds(shownIds),
  ]);

  function hrefFor(overrides: Record<string, string | undefined>) {
    const merged = { ...query, ...overrides };
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (value) qs.set(key, value);
    }
    const s = qs.toString();
    return s ? `/thuong-hieu/${slug}?${s}` : `/thuong-hieu/${slug}`;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Brand",
          name: brand.name,
          url: absoluteUrl(`/thuong-hieu/${brand.slug}`),
          ...(brand.description ? { description: brand.description } : {}),
          ...(brand.logoUrl ? { logo: brand.logoUrl } : {}),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Trang chủ", item: absoluteUrl("/") },
            {
              "@type": "ListItem",
              position: 2,
              name: "Thương hiệu",
              item: absoluteUrl("/thuong-hieu"),
            },
            {
              "@type": "ListItem",
              position: 3,
              name: brand.name,
              item: absoluteUrl(`/thuong-hieu/${brand.slug}`),
            },
          ],
        }}
      />

      <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
        <Link href="/" className="hover:underline">
          Trang chủ
        </Link>
        <span>/</span>
        <Link href="/thuong-hieu" className="hover:underline">
          Thương hiệu
        </Link>
        <span>/</span>
        <span className="text-zinc-900">{brand.name}</span>
      </nav>

      <div className="card mb-8 flex flex-col gap-5 p-6 sm:flex-row sm:items-start">
        {brand.logoUrl ? (
          <div className="relative h-16 w-32 shrink-0">
            <Image
              src={brand.logoUrl}
              alt={brand.name}
              fill
              sizes="128px"
              className="object-contain"
            />
          </div>
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-2xl font-semibold text-accent">
            {brand.name.charAt(0)}
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{brand.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {brand.productCount} sản phẩm đang bán ·{" "}
            {brand.categories.map((c) => c.name).join(", ")}
          </p>
          {brand.description && (
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-600">
              {brand.description}
            </p>
          )}
        </div>
      </div>

      {brand.categories.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Link href={hrefFor({ category: undefined, page: undefined })} className={chipClass(!activeCategory)}>
            Tất cả ({brand.productCount})
          </Link>
          {brand.categories.map((c) => (
            <Link
              key={c.slug}
              href={hrefFor({ category: c.slug, page: undefined })}
              className={chipClass(activeCategory === c.slug)}
            >
              {c.name} ({c.productCount})
            </Link>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <p className="card p-6 text-sm text-zinc-500">Không có sản phẩm nào.</p>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              initialInWishlist={wishlistedIds.has(p.id)}
              outOfStock={outOfStockIds.has(p.id)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={hrefFor({ page: n === 1 ? undefined : String(n) })}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition ${
                n === page
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-200 text-zinc-600 hover:border-zinc-400"
              }`}
            >
              {n}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
