"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { MAX_COMPARE_ITEMS, type CompareItem } from "@/lib/compare";

const STORAGE_KEY = "compare-list";

interface AddItemResult {
  ok: boolean;
  error?: string;
}

interface CompareContextValue {
  items: CompareItem[];
  isReady: boolean;
  isInCompare: (id: string) => boolean;
  addItem: (item: CompareItem) => AddItemResult;
  removeItem: (id: string) => void;
  clear: () => void;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Chỉ đọc localStorage sau khi mount (client-only) để tránh lệch nội dung giữa
  // HTML render sẵn trên server (không biết gì về localStorage) và lần render đầu ở client.
  useEffect(() => {
    // queueMicrotask: đọc localStorage vẫn phải chờ tới sau lần render đầu tiên (tránh
    // hydration mismatch với HTML server không biết gì về localStorage), nhưng tách setState
    // ra khỏi thân effect đồng bộ theo đúng khuyến nghị của react-hooks/set-state-in-effect.
    queueMicrotask(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) setItems(JSON.parse(raw));
      } catch {
        // localStorage có thể bị chặn (chế độ ẩn danh...) — coi như danh sách rỗng
      } finally {
        setIsReady(true);
      }
    });
  }, []);

  const persist = useCallback((next: CompareItem[]) => {
    setItems(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // vẫn giữ được state trong bộ nhớ dù không lưu được xuống localStorage
    }
  }, []);

  const isInCompare = useCallback((id: string) => items.some((i) => i.id === id), [items]);

  const addItem = useCallback(
    (item: CompareItem): AddItemResult => {
      if (items.some((i) => i.id === item.id)) return { ok: true };

      if (items.length > 0 && items[0].categorySlug !== item.categorySlug) {
        return {
          ok: false,
          error: `Chỉ có thể so sánh các sản phẩm cùng danh mục "${items[0].categoryName}". Hãy xóa danh sách hiện tại nếu muốn so sánh danh mục khác.`,
        };
      }

      if (items.length >= MAX_COMPARE_ITEMS) {
        return { ok: false, error: `Chỉ có thể so sánh tối đa ${MAX_COMPARE_ITEMS} sản phẩm cùng lúc.` };
      }

      persist([...items, item]);
      return { ok: true };
    },
    [items, persist]
  );

  const removeItem = useCallback((id: string) => persist(items.filter((i) => i.id !== id)), [items, persist]);

  const clear = useCallback(() => persist([]), [persist]);

  return (
    <CompareContext.Provider value={{ items, isReady, isInCompare, addItem, removeItem, clear }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare() phải được gọi bên trong <CompareProvider>.");
  return ctx;
}
