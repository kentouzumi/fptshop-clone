import type { ReactNode } from "react";
import Link from "next/link";

interface BrandLite {
  name: string;
  slug: string;
}

interface AttributeFacetValue {
  value: string;
  slug: string;
  count: number;
}

interface AttributeFacet {
  attrName: string;
  slug: string;
  values: AttributeFacetValue[];
}

export interface PriceRangeDef {
  key: string;
  label: string;
  min?: number;
  max?: number;
}

// Dùng chung giữa page.tsx (tính activePriceKey) và component này (render list).
export const PRICE_RANGES: PriceRangeDef[] = [
  { key: "all", label: "Tất cả" },
  { key: "under5", label: "Dưới 5 triệu", min: 0, max: 5_000_000 },
  { key: "5-15", label: "Từ 5 - 15 triệu", min: 5_000_000, max: 15_000_000 },
  { key: "15-30", label: "Từ 15 - 30 triệu", min: 15_000_000, max: 30_000_000 },
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

function CheckSquare({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition ${
        checked ? "border-accent bg-accent" : "border-zinc-300 bg-white"
      }`}
    >
      {checked && (
        <svg className="h-3 w-3 text-accent-ink" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M16.704 5.29a1 1 0 010 1.415l-7.4 7.4a1 1 0 01-1.414 0l-3.6-3.6a1 1 0 111.415-1.414l2.892 2.893 6.692-6.693a1 1 0 011.415 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </span>
  );
}

function FilterRow({ href, checked, label }: { href: string; checked: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition hover:bg-zinc-100 ${
        checked ? "font-medium text-zinc-900" : "text-zinc-600"
      }`}
    >
      <CheckSquare checked={checked} />
      {label}
    </Link>
  );
}

function ChevronIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-zinc-400 transition group-open:rotate-180"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group border-b border-zinc-100 px-4 py-3.5 last:border-b-0" open>
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-zinc-900 [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronIcon />
      </summary>
      <div className="mt-3 flex flex-col gap-1">{children}</div>
    </details>
  );
}

export default function FilterSidebar({
  brands,
  selectedBrands,
  activePriceKey,
  facets,
  currentFilters,
}: {
  brands: BrandLite[];
  selectedBrands: string[];
  activePriceKey: string;
  facets: AttributeFacet[];
  currentFilters: Record<string, string | undefined>;
}) {
  const visibleBrands = brands.slice(0, 6);
  const extraBrands = brands.slice(6);

  // Chỉ chọn được ĐÚNG 1 hãng tại 1 thời điểm (radio behavior) — bấm lại
  // đúng hãng đang chọn thì bỏ chọn (về "tất cả"), bấm hãng khác thì THAY
  // THẾ hoàn toàn lựa chọn cũ (không cộng dồn nhiều hãng như trước).
  function brandHref(slug: string) {
    const alreadySelected = selectedBrands.length === 1 && selectedBrands[0] === slug;
    return buildHref(currentFilters, { brand: alreadySelected ? undefined : slug });
  }

  // Mỗi thông số kỹ thuật (vd "RAM") CHO CHỌN NHIỀU giá trị cùng lúc (OR
  // trong cùng thông số, vd chọn cả "8GB" lẫn "12GB") — khác brand ở trên
  // (chỉ chọn 1) vì đây là hành vi faceted-search tiêu chuẩn, người dùng
  // thường muốn xem gộp vài mức RAM cùng lúc chứ không chỉ 1 mức.
  function specHref(facet: AttributeFacet, valueSlug: string) {
    const key = `spec_${facet.slug}`;
    const currentSlugs = currentFilters[key]?.split(",").filter(Boolean) ?? [];
    const next = currentSlugs.includes(valueSlug)
      ? currentSlugs.filter((s) => s !== valueSlug)
      : [...currentSlugs, valueSlug];
    return buildHref(currentFilters, { [key]: next.length ? next.join(",") : undefined });
  }

  function renderBrand(b: BrandLite) {
    const checked = selectedBrands.includes(b.slug);
    return (
      <Link
        key={b.slug}
        href={brandHref(b.slug)}
        className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${
          checked
            ? "border-accent bg-accent/10 font-medium text-zinc-900"
            : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
        }`}
      >
        <CheckSquare checked={checked} />
        <span className="truncate">{b.name}</span>
      </Link>
    );
  }

  return (
    <aside className="w-full shrink-0 md:w-72">
      <div className="card sticky top-20 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3.5">
          <svg
            className="h-4 w-4 text-zinc-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
          <h2 className="text-sm font-bold text-zinc-900">Bộ lọc tìm kiếm</h2>
        </div>

        {brands.length > 0 && (
          <Section title="Hãng sản xuất">
            <div className="grid grid-cols-2 gap-2">{visibleBrands.map(renderBrand)}</div>
            {extraBrands.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer list-none text-sm font-medium text-accent [&::-webkit-details-marker]:hidden">
                  Xem thêm
                </summary>
                <div className="mt-2 grid grid-cols-2 gap-2">{extraBrands.map(renderBrand)}</div>
              </details>
            )}
          </Section>
        )}

        <Section title="Mức giá">
          <div className="flex flex-col gap-1">
            {PRICE_RANGES.map((r) => (
              <FilterRow
                key={r.key}
                href={buildHref(currentFilters, {
                  minPrice: r.min !== undefined ? String(r.min) : undefined,
                  maxPrice: r.max !== undefined ? String(r.max) : undefined,
                })}
                checked={activePriceKey === r.key}
                label={r.label}
              />
            ))}
          </div>

          <form action="/products" method="GET" className="mt-3 flex flex-col gap-2 border-t border-zinc-100 pt-3">
            <p className="text-xs text-zinc-500">Hoặc nhập khoảng giá phù hợp với bạn:</p>
            {/* Giữ lại MỌI filter khác (category/brand/sort/search/spec_*) khi
                submit form giá — dùng vòng lặp thay vì liệt kê từng field cố
                định vì tên field "spec_*" giờ động theo từng danh mục. */}
            {Object.entries(currentFilters).map(([key, value]) =>
              value && key !== "minPrice" && key !== "maxPrice" ? (
                <input key={key} type="hidden" name={key} value={value} />
              ) : null
            )}
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="minPrice"
                min={0}
                defaultValue={currentFilters.minPrice ?? ""}
                placeholder="Từ"
                className="input min-w-0 flex-1 !px-2.5 !py-2 text-xs"
              />
              <span className="text-zinc-400">~</span>
              <input
                type="number"
                name="maxPrice"
                min={0}
                defaultValue={currentFilters.maxPrice ?? ""}
                placeholder="Đến"
                className="input min-w-0 flex-1 !px-2.5 !py-2 text-xs"
              />
            </div>
            <button type="submit" className="btn-secondary !py-1.5 text-xs">
              Áp dụng
            </button>
          </form>
        </Section>

        {facets.map((facet) => {
          const key = `spec_${facet.slug}`;
          const selectedSlugs = currentFilters[key]?.split(",").filter(Boolean) ?? [];
          return (
            <Section key={facet.slug} title={facet.attrName}>
              {facet.values.map((v) => (
                <FilterRow
                  key={v.slug}
                  href={specHref(facet, v.slug)}
                  checked={selectedSlugs.includes(v.slug)}
                  label={`${v.value} (${v.count})`}
                />
              ))}
            </Section>
          );
        })}
      </div>
    </aside>
  );
}
