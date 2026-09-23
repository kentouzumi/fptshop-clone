"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCompare } from "@/components/CompareProvider";
import type { CompareProductDetail } from "@/lib/products";
import { MAX_COMPARE_ITEMS } from "@/lib/compare";
import StarRating from "@/components/StarRating";

function formatPrice(value: number) {
  return value.toLocaleString("vi-VN") + "₫";
}

function buildComparisonRows(products: CompareProductDetail[]) {
  const groupOrder: string[] = [];
  const attrNamesByGroup = new Map<string, string[]>();

  for (const p of products) {
    for (const group of p.attributeGroups) {
      if (!attrNamesByGroup.has(group.groupName)) {
        attrNamesByGroup.set(group.groupName, []);
        groupOrder.push(group.groupName);
      }
      const names = attrNamesByGroup.get(group.groupName)!;
      for (const attr of group.attrs) {
        if (!names.includes(attr.name)) names.push(attr.name);
      }
    }
  }

  return groupOrder.map((groupName) => ({
    groupName,
    attrNames: attrNamesByGroup.get(groupName)!,
  }));
}

function getAttrValue(product: CompareProductDetail, groupName: string, attrName: string) {
  const group = product.attributeGroups.find((g) => g.groupName === groupName);
  // Gộp MỌI giá trị cùng tên thông số (máy có thể có nhiều bản dung lượng,
  // hoặc nhiều nhãn "Hiệu năng và Pin") — dùng find() như trước sẽ lặng lẽ
  // bỏ mất các giá trị sau, bảng so sánh hiện thiếu mà không báo gì.
  const values = group?.attrs.filter((a) => a.name === attrName).map((a) => a.value) ?? [];
  return values.length > 0 ? values.join(", ") : null;
}

export default function ComparePage() {
  const { items, isReady, removeItem, clear } = useCompare();
  const [products, setProducts] = useState<CompareProductDetail[] | null>(null);
  const [loading, setLoading] = useState(false);

  const idsKey = items.map((i) => i.id).join(",");

  useEffect(() => {
    // Chưa hydrate xong (chưa biết localStorage có gì) hoặc danh sách rỗng — không cần
    // gọi API, trạng thái rỗng được render trực tiếp từ idsKey ở dưới thay vì qua state.
    if (!isReady || !idsKey) return;

    let cancelled = false;
    // queueMicrotask: tách khỏi thân effect đồng bộ theo react-hooks/set-state-in-effect,
    // xem giải thích chi tiết hơn ở CompareProvider.tsx.
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });

    fetch(`/api/products/compare?ids=${idsKey}`)
      .then((res) => res.json())
      .then((data: { products: CompareProductDetail[] }) => {
        if (cancelled) return;
        setProducts(data.products);

        // Sản phẩm có thể đã bị xóa/ngừng bán sau khi được thêm vào danh sách —
        // tự dọn khỏi localStorage để lần sau không còn hiện "trống" trên thanh nổi.
        const validIds = new Set(data.products.map((p) => p.id));
        for (const id of idsKey.split(",")) {
          if (!validIds.has(id)) removeItem(id);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, idsKey]);

  const rows = useMemo(() => buildComparisonRows(products ?? []), [products]);

  if (!isReady) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <p className="text-zinc-500">Đang tải...</p>
      </div>
    );
  }

  if (!idsKey) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-16 text-center">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight">So sánh sản phẩm</h1>
        <p className="mb-6 text-zinc-500">
          Chưa có sản phẩm nào để so sánh. Bấm &quot;So sánh&quot; ở dưới sản phẩm bạn quan tâm để thêm vào đây.
        </p>
        <Link href="/" className="btn-primary">
          Xem sản phẩm
        </Link>
      </div>
    );
  }

  if (loading || !products) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <p className="text-zinc-500">Đang tải...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-16 text-center">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight">So sánh sản phẩm</h1>
        <p className="mb-6 text-zinc-500">
          Chưa có sản phẩm nào để so sánh. Bấm &quot;So sánh&quot; ở dưới sản phẩm bạn quan tâm để thêm vào đây.
        </p>
        <Link href="/" className="btn-primary">
          Xem sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 pb-28">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">So sánh sản phẩm</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {products.length}/{MAX_COMPARE_ITEMS} sản phẩm — cùng danh mục &quot;{products[0].category}&quot;
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/products?category=${products[0].categorySlug}`} className="btn-secondary text-sm">
            + Thêm sản phẩm
          </Link>
          <button type="button" onClick={clear} className="btn-secondary text-sm">
            Xóa tất cả
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-40 border-b border-zinc-200 bg-white p-3 text-left align-bottom text-xs font-medium text-zinc-400">
                Sản phẩm
              </th>
              {products.map((p) => (
                <th key={p.id} className="w-56 border-b border-l border-zinc-200 bg-white p-3 align-top">
                  <button
                    type="button"
                    onClick={() => removeItem(p.id)}
                    aria-label={`Bỏ ${p.name} khỏi so sánh`}
                    className="float-right text-zinc-400 transition hover:text-red-600"
                  >
                    ×
                  </button>
                  <Link href={`/products/${p.slug}`} className="block">
                    <div className="relative mx-auto mb-2 aspect-square w-24 overflow-hidden rounded-xl bg-zinc-100">
                      {p.imageUrl && (
                        <Image src={p.imageUrl} alt={p.name} fill sizes="96px" className="object-cover" />
                      )}
                    </div>
                    <p className="line-clamp-2 text-center text-sm font-medium text-zinc-900 hover:underline">
                      {p.name}
                    </p>
                  </Link>
                  <p className="mt-1 text-center font-semibold text-accent">
                    {p.minPrice === p.maxPrice
                      ? formatPrice(p.minPrice)
                      : `${formatPrice(p.minPrice)} - ${formatPrice(p.maxPrice)}`}
                  </p>
                  {p.reviewCount > 0 ? (
                    <div className="mt-1 flex items-center justify-center gap-1 text-xs">
                      <StarRating rating={p.averageRating} size="text-sm" />
                      <span className="text-zinc-500">({p.reviewCount})</span>
                    </div>
                  ) : (
                    <p className="mt-1 text-center text-xs text-zinc-400">Chưa có đánh giá</p>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={products.length + 1} className="p-4 text-center text-zinc-400">
                  Các sản phẩm này chưa có thông số kỹ thuật để so sánh.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <Fragment key={row.groupName}>
                  <tr>
                    <td
                      colSpan={products.length + 1}
                      className="sticky left-0 border-t border-zinc-200 bg-zinc-100 p-2.5 px-3 text-xs font-medium text-zinc-700"
                    >
                      {row.groupName}
                    </td>
                  </tr>
                  {row.attrNames.map((attrName) => (
                    <tr key={`${row.groupName}-${attrName}`}>
                      <td className="sticky left-0 z-10 border-t border-zinc-100 bg-white p-3 text-xs text-zinc-500">
                        {attrName}
                      </td>
                      {products.map((p) => (
                        <td
                          key={p.id}
                          className="border-t border-l border-zinc-100 p-3 text-center text-zinc-800"
                        >
                          {getAttrValue(p, row.groupName, attrName) ?? (
                            <span className="text-zinc-300">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
