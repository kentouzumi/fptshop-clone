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
  // ProductImage.variantId — ảnh nào gắn riêng cho 1 variant cụ thể (thường
  // dùng để phân biệt theo MÀU, vì ảnh sản phẩm thực tế đổi theo màu chứ
  // không đổi theo dung lượng). null = ảnh chung, hiện khi màu đang chọn
  // không có ảnh riêng nào.
  variantId: string | null;
}

function formatPrice(value: number) {
  return value.toLocaleString("vi-VN") + "₫";
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

  // 2 bộ chọn HOÀN TOÀN ĐỘC LẬP về mặt giao diện: cả "Màu sắc" lẫn "Dung
  // lượng" đều luôn hiện ĐỦ danh sách toàn cục (không ẩn bớt tùy theo lựa
  // chọn còn lại đang là gì) — người dùng bấm vào bên nào trước cũng được.
  // Cái duy nhất phụ thuộc là TRẠNG THÁI của từng nút: 1 dung lượng bị mờ +
  // không bấm được (disabled) nếu tổ hợp (màu đang chọn, dung lượng đó)
  // không khớp variant thật nào trong DB — vì dữ liệu thật không phải ma
  // trận đầy đủ (vd chỉ có "Đen/128GB" và "Xanh Dương/256GB", không có
  // "Đen/256GB"), không thể cho chọn được 1 SKU không tồn tại. Đây đúng
  // kiểu UX các trang bán điện thoại thật (Apple/Samsung...) hay dùng: hiện
  // đủ mọi lựa chọn, chỉ làm mờ ô nào không có hàng thay vì giấu hẳn đi.
  const colors = [...new Set(variants.map((v) => v.color).filter((c): c is string => Boolean(c)))];
  const storages = [...new Set(variants.map((v) => v.storage).filter((s): s is string => Boolean(s)))];

  const [selectedColor, setSelectedColor] = useState<string | null>(variants[0]?.color ?? null);
  const [selectedStorage, setSelectedStorage] = useState<string | null>(variants[0]?.storage ?? null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  function isStorageAvailable(storage: string) {
    return variants.some((v) => v.color === selectedColor && v.storage === storage);
  }

  function handleSelectColor(color: string) {
    setSelectedColor(color);
    setActiveImageIndex(0);
    // Dung lượng đang chọn có thể không còn hợp lệ với màu mới — tự chuyển
    // sang dung lượng hợp lệ đầu tiên của màu đó để luôn có 1 variant thật
    // được chọn (không để rơi vào trạng thái "không có hàng" ngay sau khi
    // đổi màu).
    const stillValid = variants.some((v) => v.color === color && v.storage === selectedStorage);
    if (!stillValid) {
      const firstValidStorage = variants.find((v) => v.color === color)?.storage ?? null;
      setSelectedStorage(firstValidStorage);
    }
  }

  function handleSelectStorage(storage: string) {
    if (!isStorageAvailable(storage)) return;
    setSelectedStorage(storage);
  }

  // Tìm variant khớp cả màu lẫn dung lượng đang chọn; rơi về variant đầu
  // tiên khớp màu (trường hợp sản phẩm không có trường dung lượng) rồi mới
  // tới variant đầu tiên nếu vẫn không khớp gì (không nên xảy ra vì
  // handleSelectColor luôn tự điều chỉnh dung lượng về giá trị hợp lệ).
  const selectedVariant =
    variants.find((v) => v.color === selectedColor && v.storage === selectedStorage) ??
    variants.find((v) => v.color === selectedColor) ??
    variants[0] ??
    null;
  const selectedVariantId = selectedVariant?.id ?? null;
  const price = selectedVariant?.price ?? basePrice;
  const compareAtPrice = selectedVariant?.compareAtPrice ?? null;

  // Ảnh gắn riêng cho variant của MÀU đang chọn (bất kể dung lượng nào của
  // màu đó) — nếu màu này chưa có ảnh riêng (variantId null hết), rơi về bộ
  // ảnh chung của sản phẩm thay vì để trống.
  const colorVariantIds = new Set(variants.filter((v) => v.color === selectedColor).map((v) => v.id));
  const colorImages = images.filter((img) => img.variantId && colorVariantIds.has(img.variantId));
  const displayImages = colorImages.length > 0 ? colorImages : images.filter((img) => !img.variantId);
  const activeImage = displayImages[activeImageIndex] ?? displayImages[0] ?? images[0];

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
        {displayImages.length > 1 && (
          <div className="flex gap-2">
            {displayImages.map((img, i) => (
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

        {colors.length > 0 && (
          <div className="mb-5">
            <p className="mb-2 text-sm font-medium text-zinc-700">Màu sắc</p>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleSelectColor(c)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    c === selectedColor
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-300 text-zinc-700 hover:border-zinc-900"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {storages.length > 0 && (
          <div className="mb-6">
            <p className="mb-2 text-sm font-medium text-zinc-700">Dung lượng</p>
            <div className="flex flex-wrap gap-2">
              {storages.map((s) => {
                const available = isStorageAvailable(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSelectStorage(s)}
                    disabled={!available}
                    title={available ? undefined : `Không có màu ${selectedColor ?? ""} cho dung lượng này`}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      !available
                        ? "cursor-not-allowed border-zinc-200 text-zinc-300 line-through"
                        : s === selectedStorage
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-300 text-zinc-700 hover:border-zinc-900"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
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
