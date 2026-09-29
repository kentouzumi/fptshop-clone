"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RELATION_TYPES,
  RELATION_TYPE_LABELS,
  type RelationType,
} from "@/lib/relationLabels";

const INPUT = "bg-white text-zinc-900 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm";

export interface RelationRow {
  id: string;
  type: RelationType;
  sortOrder: number;
  relatedProduct: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    discontinued: boolean;
  };
}

interface Suggestion {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  basePrice: number;
}

export default function RelationsManager({
  productId,
  relations,
  maxRelations,
}: {
  productId: string;
  relations: RelationRow[];
  maxRelations: number;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [type, setType] = useState<RelationType>("ACCESSORY");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hủy kết quả về trễ: gõ nhanh thì phản hồi của lần gõ cũ có thể về SAU lần
  // mới và đè mất kết quả đúng (cùng cách làm ở SearchAutocomplete).
  const requestIdRef = useRef(0);

  const full = relations.length >= maxRelations;
  const linkedIds = new Set(relations.map((r) => r.relatedProduct.id));

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      // queueMicrotask: rule react-hooks/set-state-in-effect của
      // eslint-config-next 16 cấm gọi setState đồng bộ ngay trong thân effect.
      queueMicrotask(() => setResults([]));
      return;
    }
    const id = ++requestIdRef.current;
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/products/suggest?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (id === requestIdRef.current) setResults(data);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  async function handleAdd(relatedProductId: string) {
    setBusyId(relatedProductId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}/relations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relatedProductId, type }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Thêm liên kết thất bại.");
        return;
      }
      setQuery("");
      setResults([]);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleMove(id: string, direction: "up" | "down") {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/relations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Đổi thứ tự thất bại.");
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/relations/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Xóa liên kết thất bại.");
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h3 className="mb-1 text-base font-semibold">Sản phẩm liên quan / mua kèm</h3>
      <p className="mb-3 text-xs text-zinc-500">
        Liên kết một chiều: thêm ở đây thì sản phẩm kia hiện trên trang của sản phẩm NÀY, chứ không
        tự hiện ngược lại. Có liên kết loại &quot;{RELATION_TYPE_LABELS.RELATED}&quot; thì khối
        &quot;Sản phẩm cùng danh mục&quot; tự động gợi ý theo danh mục sẽ được thay bằng danh sách
        bạn chọn. Thứ tự trong từng loại đổi được bằng nút ↑/↓ và đúng thứ tự khách nhìn thấy.
      </p>

      <div className="card p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            className={`${INPUT} sm:w-56`}
            value={type}
            onChange={(e) => setType(e.target.value as RelationType)}
          >
            {RELATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {RELATION_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <input
            className={INPUT}
            placeholder="Gõ tên sản phẩm muốn liên kết (từ 2 ký tự)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={full}
          />
        </div>

        {full && (
          <p className="mt-2 text-xs text-amber-600">
            Đã đạt tối đa {maxRelations} liên kết. Xóa bớt trước khi thêm mới.
          </p>
        )}

        {results.length > 0 && !full && (
          <ul className="mt-3 divide-y divide-zinc-100 rounded border border-zinc-200">
            {results.map((s) => {
              const isSelf = s.id === productId;
              const already = linkedIds.has(s.id);
              return (
                <li key={s.id} className="flex items-center gap-3 px-3 py-2">
                  {s.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.imageUrl} alt="" className="h-8 w-8 rounded object-contain" />
                  )}
                  <span className="flex-1 text-sm">{s.name}</span>
                  <button
                    type="button"
                    onClick={() => handleAdd(s.id)}
                    disabled={isSelf || already || busyId === s.id}
                    className="rounded bg-black px-2 py-1 text-xs text-white disabled:opacity-40"
                    title={
                      isSelf
                        ? "Đây là sản phẩm đang sửa"
                        : already
                          ? "Đã có trong danh sách"
                          : undefined
                    }
                  >
                    {already ? "Đã thêm" : "+ Thêm"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

        {relations.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">Chưa liên kết sản phẩm nào.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {RELATION_TYPES.map((t) => {
              const rows = relations.filter((r) => r.type === t);
              if (rows.length === 0) return null;
              return (
                <div key={t}>
                  <div className="mb-1 text-xs font-medium text-zinc-500">
                    {RELATION_TYPE_LABELS[t]}
                  </div>
                  <ul className="divide-y divide-zinc-100 rounded border border-zinc-200">
                    {rows.map((r, i) => (
                      <li key={r.id} className="flex items-center gap-3 px-3 py-2">
                        {r.relatedProduct.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.relatedProduct.imageUrl}
                            alt=""
                            className="h-8 w-8 rounded object-contain"
                          />
                        )}
                        <span className="flex-1 text-sm">
                          {r.relatedProduct.name}
                          {r.relatedProduct.discontinued && (
                            <span className="ml-2 text-xs text-amber-600">
                              (đã ngừng bán — không hiện cho khách)
                            </span>
                          )}
                        </span>
                        {/* Nút lên/xuống thay vì kéo-thả: đủ dùng cho danh sách
                            tối đa 12 dòng và không cần thêm thư viện nào. */}
                        <button
                          type="button"
                          onClick={() => handleMove(r.id, "up")}
                          disabled={i === 0 || busyId === r.id}
                          aria-label="Đưa lên trên"
                          className="rounded border border-zinc-300 px-1.5 text-xs disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(r.id, "down")}
                          disabled={i === rows.length - 1 || busyId === r.id}
                          aria-label="Đưa xuống dưới"
                          className="rounded border border-zinc-300 px-1.5 text-xs disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(r.id)}
                          disabled={busyId === r.id}
                          className="text-xs text-red-600 hover:underline disabled:opacity-40"
                        >
                          Xóa
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
