"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WishlistButton({
  productId,
  initialInWishlist,
}: {
  productId: string;
  initialInWishlist: boolean;
}) {
  const router = useRouter();
  const [inWishlist, setInWishlist] = useState(initialInWishlist);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      if (inWishlist) {
        const res = await fetch(`/api/wishlist/${productId}`, { method: "DELETE" });
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (res.ok) {
          setInWishlist(false);
          router.refresh();
        }
      } else {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (res.ok) {
          setInWishlist(true);
          router.refresh();
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`flex h-full w-full items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium transition disabled:opacity-50 ${
        inWishlist
          ? "border-red-500 text-red-500"
          : "border-zinc-300 text-zinc-600 hover:border-zinc-900 hover:text-zinc-900"
      }`}
    >
      <span>{inWishlist ? "♥" : "♡"}</span>
      {inWishlist ? "Đã yêu thích" : "Yêu thích"}
    </button>
  );
}
