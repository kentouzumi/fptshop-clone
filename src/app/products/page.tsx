import type { Metadata } from "next";
import Link from "next/link";
import { getProducts, getAttributeFacets, getBrandsByCategory, type ProductSort } from "@/lib/products";
import { getCurrentUser } from "@/lib/auth";
import { getWishlistedProductIds } from "@/lib/wishlist";
import { getActiveCategoryBySlug } from "@/lib/categories";
import ProductCard from "@/components/ProductCard";
import SortSelect from "./SortSelect";
import FilterSidebar, { PRICE_RANGES } from "./FilterSidebar";
import { getOutOfStockProductIds, getAllOutOfStockProductIds } from "@/lib/inventory";

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

// Mô tả riêng cho từng danh mục: đoạn snippet Google hiện dưới tiêu đề. Dùng
// bản viết tay theo danh mục thay vì 1 câu chung chung ghép tên danh mục vào —
// 3 danh mục thì viết tay được, và mô tả đặc thù có ích hơn hẳn cho người đọc
// kết quả tìm kiếm. Danh mục mới (admin tự tạo) tự rơi về câu dự phòng.
const CATEGORY_META_DESC: Record<string, string> = {
  "dien-thoai":
    "Điện thoại chính hãng đủ mức giá: iPhone, Samsung, Xiaomi, OPPO. Lọc nhanh theo dung lượng ROM, RAM, dung lượng pin và tần số quét.",
  laptop:
    "Laptop chính hãng Apple, Dell, Asus cho học tập và làm việc. Lọc theo CPU, RAM, ổ cứng, card đồ họa và kích thước màn hình.",
  tivi: "Smart Tivi và Google Tivi chính hãng Samsung, LG, TCL, Xiaomi, Philips. Lọc theo kích thước màn hình, độ phân giải và loại tivi.",
};

/** Các query KHÔNG làm đổi "trang này nói về cái gì" — chỉ đổi cách xem. */
const NON_CANONICAL_PARAMS = ["brand", "minPrice", "maxPrice", "sort", "page"];

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;

  if (params.search) {
    // Trang kết quả tìm kiếm không bao giờ nên vào index: nội dung thay đổi
    // theo từ khóa, và mỗi từ khóa lại là 1 URL — đúng định nghĩa nội dung
    // mỏng/trùng lặp mà Google khuyên chặn.
    return {
      title: `Tìm kiếm: ${params.search}`,
      robots: { index: false, follow: true },
    };
  }

  if (!params.category) {
    // /products trần = "tất cả sản phẩm". Site đã CỐ Ý bỏ hết lối vào trang
    // này (xem mục thu gọn 3 danh mục) nên cũng không để nó vào index —
    // nhưng URL vẫn phải sống vì đây đồng thời là trang tìm kiếm và trang lọc
    // theo danh mục.
    return {
      title: "Tất cả sản phẩm",
      robots: { index: false, follow: true },
    };
  }

  // Tra qua getActiveCategoryBySlug (không phải getActiveCategories, vốn chỉ
  // trả cấp cao nhất) để slug của DANH MỤC CON cũng khớp — nếu không, trang
  // danh mục con bị coi như không tồn tại rồi đặt noindex dù nó là trang có
  // nội dung thật và đáng index nhất sau trang sản phẩm.
  const category = await getActiveCategoryBySlug(params.category);
  if (!category) {
    return { title: "Sản phẩm", robots: { index: false, follow: true } };
  }

  // Có lọc/sắp xếp/phân trang = cùng tập sản phẩm nhìn qua URL khác → không
  // index bản đó, nhưng canonical vẫn trỏ về URL danh mục gốc để Google dồn
  // hết tín hiệu về 1 trang, và `follow` để bot vẫn đi tiếp vào sản phẩm.
  const hasViewParams =
    NON_CANONICAL_PARAMS.some((k) => params[k] && params[k] !== "1") ||
    Object.keys(params).some((k) => k.startsWith("spec_"));

  const title = `${category.name} chính hãng`;
  // Danh mục con chưa có mô tả viết tay thì ghép thêm tên danh mục cha vào
  // câu dự phòng ("... thuộc nhóm Điện thoại") — chỉ riêng "Mua iPhone 15
  // series chính hãng" không cho người đọc kết quả tìm kiếm biết đây là
  // danh mục gì của cửa hàng nào.
  const description =
    CATEGORY_META_DESC[category.slug] ??
    (category.parent
      ? `Mua ${category.name} chính hãng thuộc nhóm ${category.parent.name}, giá tốt, bảo hành 12 tháng.`
      : `Mua ${category.name.toLowerCase()} chính hãng, giá tốt, bảo hành 12 tháng.`);

  return {
    title,
    description,
    alternates: { canonical: `/products?category=${category.slug}` },
    ...(hasViewParams ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "website",
      title,
      description,
      url: `/products?category=${category.slug}`,
      locale: "vi_VN",
    },
  };
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
  // Bỏ "page" khỏi bộ lọc hiện tại (đổi filter nào cũng quay về trang 1).
  const currentFilters = { ...params };
  delete currentFilters.page;

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
  // Bộ lọc "Chỉ hiện hàng còn": phải biết danh sách sản phẩm hết hàng TRƯỚC
  // khi truy vấn để loại ngay trong where — lọc sau khi đã lấy trang sẽ làm
  // mỗi trang thiếu sản phẩm và tổng số trang sai. Sắp xếp id để khóa cache
  // của getProducts() ổn định (thứ tự Prisma trả về không đảm bảo).
  const inStockOnly = params.instock === "1";
  const excludeProductIds = inStockOnly
    ? [...(await getAllOutOfStockProductIds())].sort()
    : undefined;

  const [category, brands, { products, totalPages }, currentUser] = await Promise.all([
    params.category ? getActiveCategoryBySlug(params.category) : null,
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
      excludeProductIds,
      sort,
      page,
    }),
    getCurrentUser(),
  ]);

  // Tiêu đề trang hiện tên danh mục đang xem (thay vì chữ "Sản phẩm" chung
  // chung) — giờ trang này luôn được vào từ 1 danh mục cụ thể hoặc ô tìm kiếm.
  const categoryName = category?.name;

  // Hàng chip điều hướng ngang danh mục con. CỐ Ý không đưa vào FilterSidebar:
  // mục "Danh mục" trong sidebar đã bị bỏ theo yêu cầu trước đó, và đây không
  // phải bộ lọc cộng dồn với các bộ lọc khác mà là ĐIỀU HƯỚNG sang một trang
  // danh mục khác (đổi luôn cả bộ lọc thông số, breadcrumb, canonical).
  //
  // Đang ở danh mục CHA thì hiện các con của nó; đang ở danh mục CON thì hiện
  // các danh mục ANH EM (cùng cha) để nhảy ngang giữa chúng mà không phải
  // quay về danh mục cha trước.
  const siblingParent = category?.parent ?? null;
  const subCategories = category
    ? category.children.length > 0
      ? category.children
      : siblingParent
        ? ((await getActiveCategoryBySlug(siblingParent.slug))?.children ?? [])
        : []
    : [];

  const shownIds = products.map((p) => p.id);
  const [wishlistedIds, outOfStockIds] = await Promise.all([
    currentUser ? getWishlistedProductIds(currentUser.id, shownIds) : new Set<string>(),
    getOutOfStockProductIds(shownIds),
  ]);

  const activePriceKey =
    PRICE_RANGES.find(
      (r) =>
        String(r.min ?? "") === (params.minPrice ?? "") &&
        String(r.max ?? "") === (params.maxPrice ?? "")
    )?.key ?? "all";

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      {siblingParent && (
        <nav className="mb-3 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          <Link href="/" className="hover:underline">
            Trang chủ
          </Link>
          <span>/</span>
          <Link href={`/products?category=${siblingParent.slug}`} className="hover:underline">
            {siblingParent.name}
          </Link>
          <span>/</span>
          <span className="text-zinc-900">{categoryName}</span>
        </nav>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {params.search
            ? `Kết quả cho "${params.search}"`
            : (categoryName ?? "Sản phẩm")}
        </h1>
        <SortSelect current={sort} />
      </div>

      {subCategories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href={`/products?category=${siblingParent?.slug ?? params.category}`}
            className={
              siblingParent
                ? "rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition hover:border-zinc-400"
                : "rounded-full border border-accent bg-accent/10 px-4 py-2 text-sm font-medium text-zinc-900"
            }
          >
            Tất cả {siblingParent?.name ?? categoryName}
          </Link>
          {subCategories.map((c) => (
            <Link
              key={c.id}
              href={`/products?category=${c.slug}`}
              className={
                c.slug === params.category
                  ? "rounded-full border border-accent bg-accent/10 px-4 py-2 text-sm font-medium text-zinc-900"
                  : "rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition hover:border-zinc-400"
              }
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        <FilterSidebar
          brands={brands}
          selectedBrands={selectedBrands}
          activePriceKey={activePriceKey}
          facets={facets}
          currentFilters={currentFilters}
          inStockOnly={inStockOnly}
        />

        <div className="min-w-0 flex-1">
          {products.length === 0 ? (
            <p className="text-zinc-500">Không tìm thấy sản phẩm nào.</p>
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
