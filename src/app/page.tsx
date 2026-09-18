import Link from "next/link";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getProducts } from "@/lib/products";
import { getCurrentUser } from "@/lib/auth";
import { getWishlistedProductIds } from "@/lib/wishlist";
import { getActivePromotions } from "@/lib/promotions";
import { getActiveCategories } from "@/lib/categories";
import ProductCard from "@/components/ProductCard";
import HeroBanner from "@/components/HeroBanner";

// Banner không có trang admin quản lý (chỉ tạo qua seed/Prisma Studio) nên
// không có điểm nào để gọi revalidateTag — cache thuần theo thời gian (5
// phút) là đủ, không cần cơ chế tag như category/brand/store/promotion/faq.
const getHomeBanners = unstable_cache(
  async () =>
    prisma.banner.findMany({
      where: { position: "home_slider", isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ["home-banners"],
  { revalidate: 300 }
);

export default async function Home() {
  const [banners, categories, featured, newest, currentUser, promotions] = await Promise.all([
    getHomeBanners(),
    getActiveCategories(),
    getProducts({ featuredOnly: true, limit: 4 }),
    getProducts({ limit: 8 }),
    getCurrentUser(),
    getActivePromotions(),
  ]);

  const wishlistedIds = currentUser
    ? await getWishlistedProductIds(currentUser.id, [
        ...featured.products.map((p) => p.id),
        ...newest.products.map((p) => p.id),
      ])
    : new Set<string>();

  return (
    <div className="flex flex-col gap-14 pb-16">
      {banners.length > 0 && (
        <HeroBanner
          banners={banners.map((b) => ({ id: b.id, imageUrl: b.imageUrl, linkUrl: b.linkUrl }))}
        />
      )}

      {promotions.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-6">
          <h2 className="mb-4 text-xl font-semibold tracking-tight">Khuyến mãi</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {promotions.map((p) => {
              const content = (
                <div className="card group flex h-full flex-col justify-between overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div>
                    <p className="font-semibold text-zinc-900">{p.title}</p>
                    {p.description && <p className="mt-1 text-sm text-zinc-600">{p.description}</p>}
                  </div>
                  <p className="mt-3 text-xs text-zinc-400">
                    Đến hết {new Date(p.endsAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              );
              return p.linkUrl ? (
                <Link key={p.id} href={p.linkUrl}>
                  {content}
                </Link>
              ) : (
                <div key={p.id}>{content}</div>
              );
            })}
          </div>
        </section>
      )}

      <section className="mx-auto w-full max-w-6xl px-6">
        <h2 className="mb-4 text-xl font-semibold tracking-tight">Danh mục sản phẩm</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/products?category=${c.slug}`}
              className="card flex items-center justify-center p-6 text-center font-medium text-zinc-700 transition hover:-translate-y-0.5 hover:text-zinc-900 hover:shadow-lg"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      {featured.products.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Sản phẩm nổi bật</h2>
          </div>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {featured.products.map((p) => (
              <ProductCard key={p.id} product={p} initialInWishlist={wishlistedIds.has(p.id)} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto w-full max-w-6xl px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Sản phẩm mới</h2>
        </div>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {newest.products.map((p) => (
            <ProductCard key={p.id} product={p} initialInWishlist={wishlistedIds.has(p.id)} />
          ))}
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-6 text-center">
        <Link href="/products" className="btn-secondary">
          Xem tất cả sản phẩm
        </Link>
      </div>
    </div>
  );
}
