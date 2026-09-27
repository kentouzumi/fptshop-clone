"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import StarRating from "@/components/StarRating";
import CompareToggle from "@/components/CompareToggle";

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  category: string;
  categorySlug: string;
  imageUrl: string | null;
  minPrice: number;
  maxPrice: number;
  compareAtPrice: number | null;
  discountPercent: number | null;
  averageRating: number;
  reviewCount: number;
}

function formatPrice(value: number) {
  return value.toLocaleString("vi-VN") + "₫";
}

export default function ProductCard({
  product,
  initialInWishlist = false,
}: {
  product: ProductCardData;
  initialInWishlist?: boolean;
}) {
  const router = useRouter();
  const [inWishlist, setInWishlist] = useState(initialInWishlist);
  const [loading, setLoading] = useState(false);

  async function toggleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    try {
      const res = inWishlist
        ? await fetch(`/api/wishlist/${product.id}`, { method: "DELETE" })
        : await fetch("/api/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: product.id }),
          });

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.ok) {
        setInWishlist(!inWishlist);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="card group relative block p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <button
        type="button"
        onClick={toggleWishlist}
        disabled={loading}
        aria-label={inWishlist ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
        className={`absolute right-6 top-6 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-lg shadow-sm backdrop-blur transition disabled:opacity-50 ${
          inWishlist ? "text-red-500" : "text-zinc-400 hover:text-red-500"
        }`}
      >
        {inWishlist ? "♥" : "♡"}
      </button>

      <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-zinc-100">
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        )}
      </div>
      <p className="text-xs text-zinc-500">{product.brand ?? product.category}</p>
      <h3 className="line-clamp-2 text-sm font-medium text-zinc-900">{product.name}</h3>
      {product.reviewCount > 0 ? (
        <div className="mt-1 flex items-center gap-1 text-xs">
          <StarRating rating={product.averageRating} size="text-sm" />
          <span className="text-zinc-500">({product.reviewCount})</span>
        </div>
      ) : (
        <div className="mt-1 text-xs text-zinc-400">Chưa có đánh giá</div>
      )}
      <p className="mt-1.5 font-semibold text-accent">
        {product.minPrice === product.maxPrice
          ? formatPrice(product.minPrice)
          : `${formatPrice(product.minPrice)} - ${formatPrice(product.maxPrice)}`}
      </p>
      {/* Giá niêm yết + mức giảm chỉ hiện khi biến thể rẻ nhất THỰC SỰ có
          compareAtPrice lớn hơn giá bán (mapProductToListItem đã tự lọc) —
          không dựng badge "-0%" cho sản phẩm bán đúng giá niêm yết. Giữ
          chiều cao cố định cho cả 2 trạng thái bằng cách để khối này ngoài
          luồng chữ chính, tránh card cao thấp so le trong cùng 1 hàng. */}
      <div className="mt-0.5 flex min-h-[1.25rem] items-center gap-2 text-xs">
        {product.compareAtPrice !== null && (
          <>
            <span className="text-zinc-400 line-through">{formatPrice(product.compareAtPrice)}</span>
            <span className="rounded-full bg-red-600/10 px-1.5 py-0.5 font-semibold text-red-500">
              -{product.discountPercent}%
            </span>
          </>
        )}
      </div>

      <CompareToggle
        item={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          imageUrl: product.imageUrl,
          price: product.minPrice,
          categorySlug: product.categorySlug,
          categoryName: product.category,
        }}
      />
    </Link>
  );
}
