import Link from "next/link";
import { getProducts, type ProductSort } from "@/lib/products";
import { getCurrentUser } from "@/lib/auth";
import { getWishlistedProductIds } from "@/lib/wishlist";
import { getActiveCategories } from "@/lib/categories";
import { getActiveBrands } from "@/lib/brands";
import ProductCard from "@/components/ProductCard";
import SortSelect from "./SortSelect";

const PRICE_RANGES: { key: string; label: string; min?: number; max?: number }[] = [
  { key: "all", label: "Tất cả mức giá" },
  { key: "under5", label: "Dưới 5 triệu", min: 0, max: 5_000_000 },
  { key: "5-15", label: "5 - 15 triệu", min: 5_000_000, max: 15_000_000 },
  { key: "15-30", label: "15 - 30 triệu", min: 15_000_000, max: 30_000_000 },
  { key: "over30", label: "Trên 30 triệu", min: 30_000_000 },
];

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

  const [categories, brands, { products, totalPages }, currentUser] = await Promise.all([
    getActiveCategories(),
    getActiveBrands(),
    getProducts({
      categorySlug: params.category,
      brandSlug: params.brand,
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

      <div className="card mb-8 flex flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-2">
          <Link
            href={buildHref(currentFilters, { category: undefined })}
            className={`chip ${!params.category ? "chip-active" : "chip-inactive"}`}
          >
            Tất cả danh mục
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={buildHref(currentFilters, { category: c.slug })}
              className={`chip ${params.category === c.slug ? "chip-active" : "chip-inactive"}`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-zinc-100 pt-3">
          <Link
            href={buildHref(currentFilters, { brand: undefined })}
            className={`chip !px-3 !py-1 text-xs ${!params.brand ? "chip-active" : "chip-inactive"}`}
          >
            Tất cả thương hiệu
          </Link>
          {brands.map((b) => (
            <Link
              key={b.id}
              href={buildHref(currentFilters, { brand: b.slug })}
              className={`chip !px-3 !py-1 text-xs ${
                params.brand === b.slug ? "chip-active" : "chip-inactive"
              }`}
            >
              {b.name}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-zinc-100 pt-3">
          {PRICE_RANGES.map((r) => (
            <Link
              key={r.key}
              href={buildHref(currentFilters, {
                minPrice: r.min !== undefined ? String(r.min) : undefined,
                maxPrice: r.max !== undefined ? String(r.max) : undefined,
              })}
              className={`chip !px-3 !py-1 text-xs ${
                activePriceKey === r.key ? "chip-active" : "chip-inactive"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

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
  );
}
