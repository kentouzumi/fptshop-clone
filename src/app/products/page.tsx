import Link from "next/link";
import { getProducts, getAttributeFacets, getBrandsByCategory, type ProductSort } from "@/lib/products";
import { getCurrentUser } from "@/lib/auth";
import { getWishlistedProductIds } from "@/lib/wishlist";
import { getActiveCategories } from "@/lib/categories";
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
  // Kiểu generic (thay vì liệt kê từng field cố định như trước) vì giờ còn
  // có thêm các query "spec_<slug-thông-số>" ĐỘNG theo từng danh mục (xem
  // getAttributeFacets() ở lib/products.ts) — không thể khai báo trước hết
  // tên field vì chúng phụ thuộc dữ liệu ProductAttribute thật.
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const sort: ProductSort =
    params.sort === "price_asc" || params.sort === "price_desc" ? params.sort : "newest";

  // currentFilters = TOÀN BỘ query hiện tại trừ "page" (đổi bất kỳ filter
  // nào cũng quay về trang 1) — giữ nguyên mọi "spec_*" đang chọn khi bấm
  // đổi 1 filter khác (brand/giá/...).
  const { page: _page, ...currentFilters } = params;

  // Chỉ chọn được đúng 1 hãng tại 1 thời điểm (xem FilterSidebar.tsx) — vẫn
  // đọc dạng mảng vì lib/products.ts hỗ trợ sẵn nhiều slug (brandSlugs),
  // UI chỉ đơn giản là luôn gửi lên đúng 1 phần tử.
  const selectedBrands = params.brand ? params.brand.split(",").filter(Boolean) : [];

  // Bảng lọc thông số kỹ thuật chỉ có ý nghĩa khi đang xem 1 danh mục cụ thể
  // (thông số của điện thoại và tivi không liên quan gì nhau) — trang này
  // giờ chỉ còn vào được qua danh mục hoặc qua ô tìm kiếm, và kết quả tìm
  // kiếm có thể trộn nhiều danh mục nên không hiện bộ lọc thông số. Giải mã
  // "spec_<slug>=<slug-giá-trị-1,...>" thành { attrName thật: [giá trị
  // thật,...] } dựa vào facet đã tính được.
  const facets = params.category ? await getAttributeFacets(params.category) : [];
  const attributeFilters: Record<string, string[]> = {};
  for (const facet of facets) {
    const raw = params[`spec_${facet.slug}`];
    if (!raw) continue;
    const selectedSlugs = raw.split(",").filter(Boolean);
    const values = facet.values.filter((v) => selectedSlugs.includes(v.slug)).map((v) => v.value);
    if (values.length > 0) attributeFilters[facet.attrName] = values;
  }

  // Bộ lọc "Hãng sản xuất" cũng phụ thuộc danh mục đang xem: chỉ hiện hãng
  // THẬT SỰ có sản phẩm trong danh mục đó (Dell không hiện ở Tivi). Trang kết
  // quả tìm kiếm không thuộc danh mục nào nên gộp hãng của mọi danh mục —
  // vẫn suy từ sản phẩm thật, KHÔNG lấy nguyên bảng Brand, vì bảng Brand còn
  // giữ những hãng không còn sản phẩm nào (hàng gia dụng/phụ kiện đã gỡ bán)
  // và hiện chúng ra thì bấm vào chỉ ra trang rỗng.
  const [brands, { products, totalPages }, currentUser] = await Promise.all([
    getBrandsByCategory().then((map) =>
      params.category
        ? (map[params.category as string] ?? [])
        : [...new Map(Object.values(map).flat().map((b) => [b.slug, b])).values()].sort((a, b) =>
            a.name.localeCompare(b.name)
          )
    ),
    getProducts({
      categorySlug: params.category,
      brandSlugs: selectedBrands.length ? selectedBrands : undefined,
      search: params.search,
      minPrice: params.minPrice ? Number(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
      attributeFilters: Object.keys(attributeFilters).length ? attributeFilters : undefined,
      sort,
      page,
    }),
    getCurrentUser(),
  ]);

  // Tiêu đề trang hiện tên danh mục đang xem (thay vì chữ "Sản phẩm" chung
  // chung) — giờ trang này luôn được vào từ 1 danh mục cụ thể hoặc ô tìm kiếm.
  const categoryName = params.category
    ? (await getActiveCategories()).find((c) => c.slug === params.category)?.name
    : undefined;

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
          {params.search
            ? `Kết quả cho "${params.search}"`
            : (categoryName ?? "Sản phẩm")}
        </h1>
        <SortSelect current={sort} />
      </div>

      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        <FilterSidebar
          brands={brands}
          selectedBrands={selectedBrands}
          activePriceKey={activePriceKey}
          facets={facets}
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
