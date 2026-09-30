import { getAttributeFacets, type AttributeFacet, type ProductSort } from "@/lib/products";
import { getAllOutOfStockProductIds } from "@/lib/inventory";

/**
 * Giải mã tham số bộ lọc trên URL thành dữ liệu cho getProducts() +
 * FilterSidebar.
 *
 * Tách ra khỏi products/page.tsx vì trang thương hiệu (/thuong-hieu/[slug])
 * dùng CHUNG đúng bộ lọc đó — giữ 2 bản sao thì chỉ cần thêm 1 bộ lọc mới là
 * hai trang lệch nhau ngay (vd trang này giải mã spec_* còn trang kia không,
 * sidebar vẫn hiện ô tick nhưng bấm vào không lọc gì).
 */

export interface PriceRangeDef {
  key: string;
  label: string;
  min?: number;
  max?: number;
}

export const PRICE_RANGES: PriceRangeDef[] = [
  { key: "all", label: "Tất cả" },
  { key: "under5", label: "Dưới 5 triệu", min: 0, max: 5_000_000 },
  { key: "5-15", label: "Từ 5 - 15 triệu", min: 5_000_000, max: 15_000_000 },
  { key: "15-30", label: "Từ 15 - 30 triệu", min: 15_000_000, max: 30_000_000 },
  { key: "over30", label: "Trên 30 triệu", min: 30_000_000 },
];

export interface ResolvedFilters {
  sort: ProductSort;
  page: number;
  /** Toàn bộ query hiện tại TRỪ "page" — đổi filter nào cũng quay về trang 1. */
  currentFilters: Record<string, string | undefined>;
  selectedBrands: string[];
  facets: AttributeFacet[];
  /** { attrName thật: [giá trị thật] } — undefined khi không lọc thông số nào. */
  attributeFilters: Record<string, string[]> | undefined;
  activePriceKey: string;
  minPrice: number | undefined;
  maxPrice: number | undefined;
  inStockOnly: boolean;
  excludeProductIds: string[] | undefined;
}

export async function resolveFilterParams(
  params: Record<string, string | undefined>,
  /**
   * Danh mục đang xem. Bộ lọc THÔNG SỐ chỉ có nghĩa khi biết danh mục (thông
   * số của điện thoại và tivi không liên quan gì nhau) — để trống thì chỉ còn
   * bộ lọc giá/tồn kho, đúng như trang kết quả tìm kiếm và trang thương hiệu
   * khi chưa chọn danh mục.
   */
  categorySlug?: string,
  /**
   * Bó facet trong phạm vi 1 hãng (trang thương hiệu). Bỏ trống thì đếm theo
   * cả danh mục như /products.
   */
  brandSlug?: string
): Promise<ResolvedFilters> {
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const sort: ProductSort =
    params.sort === "price_asc" || params.sort === "price_desc" ? params.sort : "newest";

  const currentFilters = { ...params };
  delete currentFilters.page;

  const selectedBrands = params.brand ? params.brand.split(",").filter(Boolean) : [];

  // Giải mã "spec_<slug>=<slug-giá-trị-1,...>" thành { attrName thật: [giá
  // trị thật] } dựa vào facet đã tính được — slug trong URL không tra ngược
  // ra chuỗi gốc được (bỏ dấu là thao tác một chiều).
  const facets = categorySlug ? await getAttributeFacets(categorySlug, brandSlug) : [];
  const attributeFilters: Record<string, string[]> = {};
  for (const facet of facets) {
    const raw = params[`spec_${facet.slug}`];
    if (!raw) continue;
    const selectedSlugs = raw.split(",").filter(Boolean);
    const values = facet.values.filter((v) => selectedSlugs.includes(v.slug)).map((v) => v.value);
    if (values.length > 0) attributeFilters[facet.attrName] = values;
  }

  // Tồn kho phải biết TRƯỚC khi truy vấn để loại ngay trong where — lọc sau
  // khi đã lấy trang sẽ làm mỗi trang thiếu sản phẩm và tổng số trang sai.
  // Sắp xếp id để khóa cache của getProducts() ổn định (thứ tự Prisma trả về
  // không đảm bảo).
  const inStockOnly = params.instock === "1";
  const excludeProductIds = inStockOnly
    ? [...(await getAllOutOfStockProductIds())].sort()
    : undefined;

  const activePriceKey =
    PRICE_RANGES.find(
      (r) =>
        String(r.min ?? "") === (params.minPrice ?? "") &&
        String(r.max ?? "") === (params.maxPrice ?? "")
    )?.key ?? "all";

  return {
    sort,
    page,
    currentFilters,
    selectedBrands,
    facets,
    attributeFilters: Object.keys(attributeFilters).length ? attributeFilters : undefined,
    activePriceKey,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    inStockOnly,
    excludeProductIds,
  };
}
