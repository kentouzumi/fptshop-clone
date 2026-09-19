import Link from "next/link";
import { getProducts, type ProductSort } from "@/lib/products";
import { getCurrentUser } from "@/lib/auth";
import { getWishlistedProductIds } from "@/lib/wishlist";
import { getActiveBrands } from "@/lib/brands";
import ProductCard from "@/components/ProductCard";
import SortSelect from "./SortSelect";
import FilterSidebar, { PRICE_RANGES } from "./FilterSidebar";

function buildHref(
  current: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>
) {
  const merged = { ...current, ...overrides };
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value) qs.set(key, value);
  }
  const query = qs.toString();
  return query ? `/products?${query}` : "/products";
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    search?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const sort: ProductSort =
    params.sort === "price_asc" || params.sort === "price_desc" ? params.sort : "newest";

  const currentFilters = {
    category: params.category,
    brand: params.brand,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    sort: params.sort,
    search: params.search,
  };

  // Chỉ chọn được đúng 1 hãng tại 1 thời điểm (xem FilterSidebar.tsx) — vẫn
  // đọc dạng mảng vì lib/products.ts hỗ trợ sẵn nhiều slug (brandSlugs),
  // UI chỉ đơn giản là luôn gửi lên đúng 1 phần tử.
  const selectedBrands = params.brand ? params.brand.split(",").filter(Boolean) : [];

  const [brands, { products, totalPages }, currentUser] = await Promise.all([
    getActiveBrands(),
    getProducts({
      categorySlug: params.category,
      brandSlugs: selectedBrands.length ? selectedBrands : undefined,
      search: params.search,
      minPrice: params.minPrice ? Number(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
      sort,
      page,
    }),
    getCurrentUser(),
  ]);

  const wishlistedIds = currentUser
    ? await getWishlistedProductIds(currentUser.id, products.map((p) => p.id))
    : new Set<string>();

  const activePriceKey =
    PRICE_RANGES.find(
      (r) =>
        String(r.min ?? "") === (params.minPrice ?? "") &&
        String(r.max ?? "") === (params.maxPrice ?? "")
    )?.key ?? "all";

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {params.search ? `Kết quả cho "${params.search}"` : "Sản phẩm"}
        </h1>
        <SortSelect current={sort} />
      </div>

      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        <FilterSidebar
          brands={brands}
          selectedBrands={selectedBrands}
          activePriceKey={activePriceKey}
          currentFilters={currentFilters}
        />

        <div className="min-w-0 flex-1">
          {products.length === 0 ? (
            <p className="text-zinc-500">Không tìm thấy sản phẩm nào.</p>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} initialInWishlist={wishlistedIds.has(p.id)} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-10 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={buildHref(currentFilters, { page: n === 1 ? undefined : String(n) })}
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
      </div>
    </div>
  );
}
