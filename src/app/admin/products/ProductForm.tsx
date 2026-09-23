"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Option = { id: string; name: string };

export interface ProductAttributeRow {
  groupName: string;
  attrName: string;
  attrValue: string;
}

export interface ProductFormValues {
  id?: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  brandId: string;
  basePrice: string;
  status: string;
  isFeatured: boolean;
  images: string[];
  attributes: ProductAttributeRow[];
}

const MAX_IMAGES = 8;

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ProductForm({
  categories,
  brands,
  initial,
}: {
  categories: Option[];
  brands: Option[];
  initial?: ProductFormValues;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? "");
  const [brandId, setBrandId] = useState(initial?.brandId ?? "");
  const [basePrice, setBasePrice] = useState(initial?.basePrice ?? "");
  const [status, setStatus] = useState(initial?.status ?? "ACTIVE");
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [manualImageUrl, setManualImageUrl] = useState("");
  const [attributes, setAttributes] = useState<ProductAttributeRow[]>(initial?.attributes ?? []);
  // Biến thể ĐẦU TIÊN — chỉ hỏi lúc TẠO MỚI (isEdit dùng VariantsManager
  // riêng, đầy đủ hơn nhiều, không lặp lại ở đây). Lý do thêm: trước đây
  // sản phẩm mới tạo không có variant nào, ảnh chung (variantId null) hiện
  // đúng, nhưng đến khi admin qua trang Sửa bấm "+ Thêm biến thể" và lỡ gắn
  // luôn ảnh riêng cho biến thể đó, ảnh riêng sẽ ĐÈ lên ảnh chung theo đúng
  // thiết kế "ưu tiên ảnh theo màu" — nhìn như bị mất ảnh ban đầu. Cho nhập
  // Màu/Dung lượng/SKU ngay lúc tạo sản phẩm giúp biến thể đầu tiên có sẵn,
  // dùng chung ảnh vừa upload (không gắn riêng), tránh luồng 2 bước dễ nhầm.
  const [variantSku, setVariantSku] = useState("");
  const [variantColor, setVariantColor] = useState("");
  const [variantStorage, setVariantStorage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!isEdit) setSlug(slugify(value));
  }

  async function handleFilesChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setError(`Tối đa ${MAX_IMAGES} ảnh cho mỗi sản phẩm.`);
      return;
    }

    setUploading(true);
    setError(null);
    try {
      for (const file of files.slice(0, remaining)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Upload ảnh thất bại.");
          break;
        }
        setImages((prev) => [...prev, data.url]);
      }
    } finally {
      setUploading(false);
    }
  }

  function addManualImageUrl() {
    const url = manualImageUrl.trim();
    if (!url) return;
    if (images.length >= MAX_IMAGES) {
      setError(`Tối đa ${MAX_IMAGES} ảnh cho mỗi sản phẩm.`);
      return;
    }
    setImages((prev) => [...prev, url]);
    setManualImageUrl("");
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function addAttributeRow() {
    setAttributes((prev) => [...prev, { groupName: "", attrName: "", attrValue: "" }]);
  }

  function updateAttributeRow(index: number, field: keyof ProductAttributeRow, value: string) {
    setAttributes((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
  }

  function removeAttributeRow(index: number) {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const payload = {
        name,
        slug,
        description,
        categoryId,
        brandId: brandId || null,
        basePrice: Number(basePrice),
        status,
        isFeatured,
        images,
        attributes,
      };

      const res = await fetch(
        isEdit ? `/api/admin/products/${initial!.id}` : "/api/admin/products",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Lưu thất bại.");
        return;
      }

      // Sản phẩm đã tạo xong ở bước trên — nếu admin có nhập SKU cho biến
      // thể đầu tiên, tạo luôn NGAY SAU (request riêng, không cùng
      // transaction với việc tạo sản phẩm) để dùng chung ảnh vừa upload.
      if (!isEdit && variantSku.trim()) {
        const variantRes = await fetch(`/api/admin/products/${data.id}/variants`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sku: variantSku.trim(),
            color: variantColor.trim() || null,
            storage: variantStorage.trim() || null,
            price: Number(basePrice),
            isActive: true,
          }),
        });
        if (!variantRes.ok) {
          const variantData = await variantRes.json().catch(() => null);
          // Sản phẩm vẫn đã tạo thành công — KHÔNG chặn ở đây, chỉ báo lỗi
          // và đưa admin sang trang Sửa để tự thêm lại biến thể (giống cách
          // xử lý "đơn hàng đã tạo nhưng paymentUrl lỗi" ở lib/orders.ts:
          // không để mất phần đã làm được chỉ vì bước sau thất bại).
          alert(
            `Đã tạo sản phẩm nhưng tạo biến thể thất bại: ${
              variantData?.error ?? "Lỗi không xác định."
            }\nBạn có thể thêm lại biến thể ở trang Sửa sản phẩm.`
          );
          router.push(`/admin/products/${data.id}/edit`);
          router.refresh();
          return;
        }
      }

      router.push("/admin/products");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Tên sản phẩm</label>
        <input
          className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Mô tả</label>
        <textarea
          className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Danh mục</label>
          <select
            className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Thương hiệu</label>
          <select
            className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2"
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
          >
            <option value="">-- Không có --</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Giá (đ)</label>
          <input
            type="number"
            min={0}
            className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Trạng thái</label>
          <select
            className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="DRAFT">Nháp</option>
            <option value="ACTIVE">Đang bán</option>
            <option value="OUT_OF_STOCK">Hết hàng</option>
            <option value="DISCONTINUED">Ngừng bán</option>
          </select>
        </div>
      </div>

      {!isEdit && (
        <div className="rounded-lg border border-zinc-200 p-3">
          <p className="mb-2 text-sm font-medium">
            Biến thể đầu tiên (không bắt buộc — để trống SKU nếu muốn thêm
            biến thể sau ở trang Sửa)
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">SKU</label>
              <input
                className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                value={variantSku}
                onChange={(e) => setVariantSku(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Màu</label>
              <input
                className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                value={variantColor}
                onChange={(e) => setVariantColor(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Dung lượng</label>
              <input
                className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                value={variantStorage}
                onChange={(e) => setVariantStorage(e.target.value)}
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Biến thể này dùng chung giá (ở trên) và ảnh chung của sản phẩm
            (không gắn ảnh riêng) — vào trang Sửa nếu cần đổi giá riêng hoặc
            gắn ảnh riêng theo màu.
          </p>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isFeatured}
          onChange={(e) => setIsFeatured(e.target.checked)}
        />
        Sản phẩm nổi bật
      </label>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Ảnh sản phẩm (tối đa {MAX_IMAGES} ảnh, ảnh đầu tiên là ảnh đại diện)
        </label>
        {images.length < MAX_IMAGES && (
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesChange}
            disabled={uploading}
            className="file-input"
          />
        )}
        <p className="mt-2 text-xs text-zinc-500">
          Hoặc dán trực tiếp URL ảnh (dùng khi chưa cấu hình Supabase Storage):
        </p>
        <div className="mt-1 flex gap-2">
          <input
            className="bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            placeholder="https://..."
            value={manualImageUrl}
            onChange={(e) => setManualImageUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addManualImageUrl();
              }
            }}
          />
          <button
            type="button"
            onClick={addManualImageUrl}
            className="shrink-0 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium transition hover:bg-zinc-100"
          >
            + Thêm
          </button>
        </div>
        {uploading && <p className="mt-1 text-xs text-zinc-500">Đang tải ảnh lên...</p>}
        {images.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {images.map((url, i) => (
              <div key={`${url}-${i}`} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Ảnh ${i + 1}`} className="h-20 w-20 rounded object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-0 left-0 rounded-tr bg-black/70 px-1 text-[10px] text-white">
                    Đại diện
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs text-white"
                  aria-label="Xóa ảnh"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-sm font-medium">Thông số kỹ thuật</label>
          <button
            type="button"
            onClick={addAttributeRow}
            className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-medium transition hover:bg-zinc-100"
          >
            + Thêm thông số
          </button>
        </div>
        {attributes.length === 0 && (
          <p className="text-xs text-zinc-500">Chưa có thông số nào. Bấm &quot;+ Thêm thông số&quot; để thêm.</p>
        )}
        {attributes.length > 0 && (
          <div className="flex flex-col gap-2">
            {attributes.map((attr, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2">
                <input
                  className="bg-white text-zinc-900 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
                  placeholder="Nhóm (vd: Màn hình)"
                  value={attr.groupName}
                  onChange={(e) => updateAttributeRow(i, "groupName", e.target.value)}
                />
                <input
                  className="bg-white text-zinc-900 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
                  placeholder="Tên thông số (vd: Kích thước)"
                  value={attr.attrName}
                  onChange={(e) => updateAttributeRow(i, "attrName", e.target.value)}
                />
                <input
                  className="bg-white text-zinc-900 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
                  placeholder="Giá trị (vd: 6.7 inch)"
                  value={attr.attrValue}
                  onChange={(e) => updateAttributeRow(i, "attrValue", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeAttributeRow(i)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-red-600"
                  aria-label="Xóa thông số"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="mt-1 text-xs text-zinc-500">
          Thông số cùng &quot;Nhóm&quot; sẽ được gộp chung khi hiển thị ở trang chi tiết sản phẩm.
          Dòng thiếu bất kỳ ô nào sẽ tự bị bỏ qua khi lưu.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-2 w-fit rounded-lg bg-black px-6 py-2 text-white transition hover:bg-zinc-800 disabled:opacity-50"
      >
        {saving ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo sản phẩm"}
      </button>
    </form>
  );
}
