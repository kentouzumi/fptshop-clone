"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface VariantOption {
  id: string;
  color: string | null;
  storage: string | null;
  price: number;
  compareAtPrice: number | null;
}

interface ImageOption {
  url: string;
  altText: string | null;
}

function formatPrice(value: number) {
  return value.toLocaleString("vi-VN") + "₫";
}

function variantLabel(v: VariantOption) {
  return [v.color, v.storage].filter(Boolean).join(" / ") || v.id;
}

export default function ProductGalleryAndBuy({
  productName,
  images,
  variants,
  basePrice,
  wishlistButton,
  compareButton,
}: {
  productName: string;
  images: ImageOption[];
  variants: VariantOption[];
  basePrice: number;
  wishlistButton?: React.ReactNode;
  compareButton?: React.ReactNode;
}) {
  const router = useRouter();
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id ?? null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null;
  const price = selectedVariant?.price ?? basePrice;
  const compareAtPrice = selectedVariant?.compareAtPrice ?? null;
  const activeImage = images[activeImageIndex] ?? images[0];

  async function handleAddToCart() {
    if (!selectedVariantId) return;
    setAdding(true);
    setMessage(null);
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: selectedVariantId, quantity: 1 }),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Có lỗi xảy ra." });
        return;
      }

      setMessage({ type: "success", text: "Đã thêm vào giỏ hàng." });
      router.refresh();
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <div>
        <div className="relative mb-3 aspect-square overflow-hidden rounded-2xl bg-zinc-100 shadow-sm">
          {activeImage && (
            <Image
              src={activeImage.url}
              alt={activeImage.altText ?? productName}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2">
            {images.map((img, i) => (
              <button
                key={img.url}
                type="button"
                onClick={() => setActiveImageIndex(i)}
                className={`relative h-16 w-16 overflow-hidden rounded-xl border-2 transition ${
                  i === activeImageIndex ? "border-zinc-900" : "border-transparent hover:border-zinc-300"
                }`}
              >
                <Image src={img.url} alt={img.altText ?? productName} fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-5 flex items-baseline gap-3">
          <span className="text-3xl font-bold tracking-tight text-accent">{formatPrice(price)}</span>
          {compareAtPrice && compareAtPrice > price && (
            <span className="text-base text-zinc-400 line-through">
              {formatPrice(compareAtPrice)}
            </span>
          )}
        </div>

        {variants.length > 0 && (
          <div className="mb-6">
            <p className="mb-2 text-sm font-medium text-zinc-700">Phiên bản</p>
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVariantId(v.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    v.id === selectedVariantId
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-300 text-zinc-700 hover:border-zinc-900"
                  }`}
                >
                  {variantLabel(v)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!selectedVariantId || adding}
            title={selectedVariantId ? undefined : "Sản phẩm này chưa có phiên bản để mua"}
            className="btn-primary flex-1 !rounded-xl py-3.5 disabled:!bg-zinc-300 disabled:!text-zinc-500 disabled:!shadow-none"
          >
            {adding
              ? "Đang thêm..."
              : selectedVariantId
                ? "Thêm vào giỏ hàng"
                : "Chưa có phiên bản để mua"}
          </button>
          {wishlistButton && <div className="w-40">{wishlistButton}</div>}
        </div>
        {compareButton && <div className="mt-3 w-40">{compareButton}</div>}
        {message && (
          <p
            className={`mt-2 text-sm ${
              message.type === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
