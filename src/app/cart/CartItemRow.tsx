"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export interface CartItemData {
  id: string;
  productName: string;
  productSlug: string;
  variantLabel: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

function formatPrice(value: number) {
  return value.toLocaleString("vi-VN") + "₫";
}

export default function CartItemRow({ item }: { item: CartItemData }) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  async function updateQuantity(newQuantity: number) {
    if (newQuantity < 1) return;
    setUpdating(true);
    try {
      await fetch(`/api/cart/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQuantity }),
      });
      router.refresh();
    } finally {
      setUpdating(false);
    }
  }

  async function handleRemove() {
    setUpdating(true);
    try {
      await fetch(`/api/cart/items/${item.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="flex items-center gap-4 p-4">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
        {item.imageUrl && (
          <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" />
        )}
      </div>

      <div className="flex-1">
        <Link
          href={`/products/${item.productSlug}`}
          className="text-sm font-medium text-zinc-900 hover:underline"
        >
          {item.productName}
        </Link>
        {item.variantLabel && <p className="text-xs text-zinc-500">{item.variantLabel}</p>}
        <p className="mt-1 text-sm font-medium text-accent">{formatPrice(item.unitPrice)}</p>
      </div>

      <div className="flex items-center gap-1 rounded-full border border-zinc-200 p-1">
        <button
          type="button"
          onClick={() => updateQuantity(item.quantity - 1)}
          disabled={updating || item.quantity <= 1}
          className="flex h-7 w-7 items-center justify-center rounded-full text-sm text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-40"
        >
          −
        </button>
        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
        <button
          type="button"
          onClick={() => updateQuantity(item.quantity + 1)}
          disabled={updating}
          className="flex h-7 w-7 items-center justify-center rounded-full text-sm text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-40"
        >
          +
        </button>
      </div>

      <p className="w-28 text-right text-sm font-semibold text-zinc-900">{formatPrice(item.lineTotal)}</p>

      <button
        type="button"
        onClick={handleRemove}
        disabled={updating}
        className="text-sm text-zinc-400 transition hover:text-red-600 disabled:opacity-50"
      >
        Xóa
      </button>
    </div>
  );
}
