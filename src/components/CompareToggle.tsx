"use client";

import type { CompareItem } from "@/lib/compare";
import { useCompare } from "@/components/CompareProvider";

export default function CompareToggle({
  item,
  variant = "chip",
}: {
  item: CompareItem;
  variant?: "chip" | "button";
}) {
  const { isReady, isInCompare, addItem, removeItem } = useCompare();
  const checked = isReady && isInCompare(item.id);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (checked) {
      removeItem(item.id);
      return;
    }
    const result = addItem(item);
    if (!result.ok && result.error) {
      alert(result.error);
    }
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`flex h-full w-full items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium transition ${
          checked
            ? "border-accent text-accent"
            : "border-zinc-300 text-zinc-600 hover:border-zinc-900 hover:text-zinc-900"
        }`}
      >
        <span aria-hidden>⇄</span>
        {checked ? "Đang so sánh" : "So sánh"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`mt-2 flex w-full items-center gap-1.5 border-t border-zinc-100 pt-2 text-xs font-medium transition ${
        checked ? "text-accent" : "text-zinc-500 hover:text-zinc-900"
      }`}
    >
      <span
        aria-hidden
        className={`flex h-3.5 w-3.5 items-center justify-center rounded border text-[10px] leading-none ${
          checked ? "border-accent bg-accent text-accent-ink" : "border-zinc-300"
        }`}
      >
        {checked && "✓"}
      </span>
      So sánh
    </button>
  );
}
