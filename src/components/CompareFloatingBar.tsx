"use client";

import Image from "next/image";
import Link from "next/link";
import { useCompare } from "@/components/CompareProvider";
import { MAX_COMPARE_ITEMS } from "@/lib/compare";

export default function CompareFloatingBar() {
  const { items, isReady, removeItem, clear } = useCompare();

  if (!isReady || items.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.55)]">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative flex shrink-0 items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-100 py-1.5 pl-1.5 pr-6"
            >
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-zinc-50">
                {item.imageUrl && (
                  <Image src={item.imageUrl} alt={item.name} fill sizes="36px" className="object-cover" />
                )}
              </div>
              <span className="max-w-[8rem] truncate text-xs font-medium text-zinc-700">{item.name}</span>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                aria-label={`Bỏ ${item.name} khỏi danh sách so sánh`}
                className="absolute right-1.5 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 transition hover:text-red-600"
              >
                ×
              </button>
            </div>
          ))}
          <span className="shrink-0 text-xs text-zinc-400">
            {items.length}/{MAX_COMPARE_ITEMS}
          </span>
        </div>

        <button
          type="button"
          onClick={clear}
          className="hidden shrink-0 text-xs font-medium text-zinc-500 transition hover:text-red-600 sm:block"
        >
          Xóa tất cả
        </button>
        <Link href="/compare" className="btn-primary !px-5 !py-2 shrink-0 text-sm">
          So sánh ngay
        </Link>
      </div>
    </div>
  );
}
