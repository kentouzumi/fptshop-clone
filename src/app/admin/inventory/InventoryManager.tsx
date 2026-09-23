"use client";

import { useMemo, useState } from "react";

interface StoreInfo {
  id: string;
  name: string;
  isActive: boolean;
}

interface Row {
  variantId: string;
  sku: string;
  color: string | null;
  storage: string | null;
  isActive: boolean;
  productName: string;
  productSlug: string;
  quantityByStore: Record<string, number>;
}

function cellKey(variantId: string, storeId: string) {
  return `${variantId}:${storeId}`;
}

export default function InventoryManager({
  stores,
  rows,
}: {
  stores: StoreInfo[];
  rows: Row[];
}) {
  const [search, setSearch] = useState("");
  // Số lượng đang hiển thị trên ô input — khởi tạo từ dữ liệu server, sau đó
  // tự cập nhật theo từng ô khi lưu thành công (không cần router.refresh()
  // cả trang chỉ vì sửa 1 ô).
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const row of rows) {
      for (const store of stores) {
        initial[cellKey(row.variantId, store.id)] = row.quantityByStore[store.id] ?? 0;
      }
    }
    return initial;
  });
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const [errorKeys, setErrorKeys] = useState<Record<string, string>>({});

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.productName.toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q) ||
        (r.color ?? "").toLowerCase().includes(q) ||
        (r.storage ?? "").toLowerCase().includes(q)
    );
  }, [search, rows]);

  async function handleSave(variantId: string, storeId: string, quantity: number) {
    const key = cellKey(variantId, storeId);
    setSavingKeys((prev) => new Set(prev).add(key));
    setErrorKeys((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, variantId, quantity }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErrorKeys((prev) => ({ ...prev, [key]: data?.error ?? "Lưu thất bại." }));
        return;
      }
      setSavedKeys((prev) => new Set(prev).add(key));
    } catch {
      setErrorKeys((prev) => ({ ...prev, [key]: "Lỗi mạng, thử lại." }));
    } finally {
      setSavingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Tìm theo tên sản phẩm, SKU, màu, dung lượng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input max-w-sm"
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Sản phẩm</th>
              <th className="px-4 py-3">Biến thể</th>
              {stores.map((store) => (
                <th key={store.id} className="px-4 py-3">
                  {store.name}
                  {!store.isActive && <span className="ml-1 text-zinc-400">(ẩn)</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.variantId} className="border-t border-zinc-100 transition hover:bg-zinc-100">
                <td className="px-4 py-2.5 font-mono text-xs text-zinc-600">{row.sku}</td>
                <td className="px-4 py-2.5 font-medium text-zinc-900">
                  {row.productName}
                  {!row.isActive && (
                    <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                      Đã ẩn
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-zinc-600">
                  {[row.color, row.storage].filter(Boolean).join(" / ") || "—"}
                </td>
                {stores.map((store) => {
                  const key = cellKey(row.variantId, store.id);
                  const saving = savingKeys.has(key);
                  const error = errorKeys[key];
                  const justSaved = savedKeys.has(key);
                  return (
                    <td key={store.id} className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          value={values[key] ?? 0}
                          onChange={(e) => {
                            setValues((prev) => ({ ...prev, [key]: Number(e.target.value) }));
                            setSavedKeys((prev) => {
                              if (!prev.has(key)) return prev;
                              const next = new Set(prev);
                              next.delete(key);
                              return next;
                            });
                          }}
                          onBlur={(e) => {
                            const quantity = Number(e.target.value);
                            if (Number.isInteger(quantity) && quantity >= 0) {
                              handleSave(row.variantId, store.id, quantity);
                            }
                          }}
                          className="input w-20 !py-1.5 text-sm"
                        />
                        {saving && <span className="text-xs text-zinc-400">Đang lưu...</span>}
                        {!saving && error && <span className="text-xs text-red-600">{error}</span>}
                        {!saving && !error && justSaved && (
                          <span className="text-xs text-green-600">Đã lưu</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={3 + stores.length} className="px-4 py-8 text-center text-zinc-500">
                  Không tìm thấy biến thể nào khớp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
