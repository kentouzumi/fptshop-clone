"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  INSTALLMENT_PROVIDERS,
  MIN_INSTALLMENT_TOTAL,
  quoteInstallment,
} from "@/lib/installment";
import ProvinceWardPicker from "@/components/ProvinceWardPicker";

export interface SavedAddress {
  id: string;
  recipientName: string;
  phone: string;
  province: string;
  ward: string;
  streetDetail: string;
  label: string | null;
  isDefault: boolean;
  /** Phí ship theo khu vực của địa chỉ này, tính sẵn ở server. */
  shippingFee: number;
  zoneLabel: string;
}

/**
 * Phí ship tính sẵn cho từng tỉnh/thành ở server — KHÔNG gọi getShippingFee()
 * trực tiếp trong client component, vì hàm đó kéo theo cả file dữ liệu 3321
 * phường/xã vào bundle trình duyệt.
 */
export interface ProvinceShipping {
  code: number;
  name: string;
  shippingFee: number;
  zoneLabel: string;
}

export interface StoreOption {
  id: string;
  name: string;
  province: string;
  district: string;
  address: string;
}

export interface SuggestedCouponView {
  code: string;
  benefit: string;
  condition: string | null;
  minOrderValue: number;
}

interface AppliedCoupon {
  code: string;
  discountAmount: number;
  freeShipping: boolean;
}

function formatPrice(value: number) {
  return value.toLocaleString("vi-VN") + "₫";
}

function radioCardClass(selected: boolean, disabled = false) {
  return `flex items-start gap-3 rounded-xl border p-3.5 text-sm transition ${
    disabled
      ? "cursor-not-allowed border-zinc-200 opacity-50"
      : selected
        ? "cursor-pointer border-accent bg-accent/10 ring-1 ring-accent"
        : "cursor-pointer border-zinc-200 hover:border-zinc-400"
  }`;
}

export default function CheckoutForm({
  savedAddresses,
  subtotal,
  provinces,
  defaultShippingFee,
  suggestedCoupons,
  momoAvailable,
  bankTransferAvailable,
  stores,
}: {
  savedAddresses: SavedAddress[];
  subtotal: number;
  provinces: ProvinceShipping[];
  defaultShippingFee: number;
  suggestedCoupons: SuggestedCouponView[];
  momoAvailable: boolean;
  bankTransferAvailable: boolean;
  stores: StoreOption[];
}) {
  const router = useRouter();
  const defaultSaved = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];

  const [deliveryMethod, setDeliveryMethod] = useState<"HOME_DELIVERY" | "STORE_PICKUP">(
    "HOME_DELIVERY"
  );
  const [selectedStoreId, setSelectedStoreId] = useState<string>(stores[0]?.id ?? "");

  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    defaultSaved ? defaultSaved.id : "__new__"
  );
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("");
  const [ward, setWard] = useState("");
  const [streetDetail, setStreetDetail] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "COD" | "MOMO" | "BANK_TRANSFER" | "INSTALLMENT"
  >("COD");
  const [installmentProviderId, setInstallmentProviderId] = useState(INSTALLMENT_PROVIDERS[0].id);
  const [installmentMonths, setInstallmentMonths] = useState(INSTALLMENT_PROVIDERS[0].months[0]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const usingNewAddress = selectedAddressId === "__new__";
  const isStorePickup = deliveryMethod === "STORE_PICKUP";

  const selectedSavedAddress = savedAddresses.find((a) => a.id === selectedAddressId) ?? null;
  const selectedProvince = provinces.find((p) => p.name === province) ?? null;

  // Phí ship phụ thuộc tỉnh/thành đang chọn. Chưa chọn địa chỉ mới nào thì hiện
  // mức mặc định để khách vẫn thấy tổng tiền tạm tính thay vì ô trống.
  const shippingFee = usingNewAddress
    ? (selectedProvince?.shippingFee ?? defaultShippingFee)
    : (selectedSavedAddress?.shippingFee ?? defaultShippingFee);
  const shippingZoneLabel = usingNewAddress
    ? (selectedProvince?.zoneLabel ?? null)
    : (selectedSavedAddress?.zoneLabel ?? null);

  const effectiveShippingFee = isStorePickup || appliedCoupon?.freeShipping ? 0 : shippingFee;
  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const grandTotal = subtotal + effectiveShippingFee - discountAmount;

  // Tra gop tinh tren TONG CUOI CUNG (da tru giam gia, da cong phi ship) nen ap
  // ma giam gia hay doi tinh giao hang la so tien gop tu cap nhat theo. Server
  // tinh lai dung cong thuc nay luc tao don, khong tin so o client.
  const installmentAvailable = grandTotal >= MIN_INSTALLMENT_TOTAL;
  const installmentProvider =
    INSTALLMENT_PROVIDERS.find((p) => p.id === installmentProviderId) ?? INSTALLMENT_PROVIDERS[0];
  const installmentQuote = installmentAvailable
    ? quoteInstallment(grandTotal, installmentProvider.id, installmentMonths)
    : null;

  function handleSelectInstallmentProvider(id: string) {
    setInstallmentProviderId(id);
    // Moi nha cap von ho tro bo ky han khac nhau - ky han dang chon co the
    // khong con hop le, tu chuyen ve ky han dau tien cua nha cap von moi
    // (cung cach handleSelectColor xu ly dung luong o trang chi tiet san pham).
    const next = INSTALLMENT_PROVIDERS.find((p) => p.id === id);
    if (next && !next.months.includes(installmentMonths)) {
      setInstallmentMonths(next.months[0]);
    }
  }

  async function handleApplyCoupon(rawCode?: string) {
    const code = (rawCode ?? couponInput).trim();
    if (!code) return;

    setApplyingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAppliedCoupon(null);
        setCouponError(data.error ?? "Mã giảm giá không hợp lệ.");
        return;
      }

      setAppliedCoupon({
        code: data.code,
        discountAmount: data.discountAmount,
        freeShipping: data.freeShipping,
      });
      // Đồng bộ ô nhập với mã vừa bấm từ danh sách gợi ý, để nếu khách bấm "Xóa"
      // thì vẫn thấy lại mã cũ trong ô thay vì ô trống.
      setCouponInput(data.code);
    } finally {
      setApplyingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (isStorePickup && !selectedStoreId) {
      setError("Vui lòng chọn cửa hàng nhận hàng.");
      return;
    }

    if (paymentMethod === "INSTALLMENT" && !installmentQuote) {
      setError("Vui lòng chọn lại gói trả góp.");
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        deliveryMethod,
        ...(isStorePickup
          ? { pickupStoreId: selectedStoreId }
          : usingNewAddress
            ? { newAddress: { recipientName, phone, province, ward, streetDetail } }
            : { addressId: selectedAddressId }),
        note,
        couponCode: appliedCoupon?.code,
        paymentMethod,
        ...(paymentMethod === "INSTALLMENT"
          ? { installment: { providerId: installmentProvider.id, months: installmentMonths } }
          : {}),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Đặt hàng thất bại.");
        return;
      }

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      // Đơn đã tạo thành công nhưng bước lấy paymentUrl từ MoMo thất bại
      // (xem /api/orders) — vẫn điều hướng sang trang chi tiết đơn kèm cờ
      // riêng để hiện đúng thông báo, tránh nhầm với trường hợp thanh toán
      // thật sự thất bại (?payment=failed, dùng khi MoMo trả về kết quả
      // thất bại rõ ràng, khác với "chưa kịp tạo được link thanh toán").
      if (data.paymentUrlError) {
        router.push(`/orders/${data.id}?payment=link_failed`);
        return;
      }

      router.push(`/orders/${data.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="card p-4">
        <label className="mb-3 block text-sm font-semibold text-zinc-900">Hình thức nhận hàng</label>
        <div className="flex flex-col gap-2">
          <label className={radioCardClass(deliveryMethod === "HOME_DELIVERY")}>
            <input
              type="radio"
              name="deliveryMethod"
              className="mt-0.5"
              checked={deliveryMethod === "HOME_DELIVERY"}
              onChange={() => setDeliveryMethod("HOME_DELIVERY")}
            />
            Giao hàng tận nơi
          </label>
          <label className={radioCardClass(deliveryMethod === "STORE_PICKUP", stores.length === 0)}>
            <input
              type="radio"
              name="deliveryMethod"
              className="mt-0.5"
              checked={deliveryMethod === "STORE_PICKUP"}
              disabled={stores.length === 0}
              onChange={() => setDeliveryMethod("STORE_PICKUP")}
            />
            <span>
              Nhận tại cửa hàng <span className="text-zinc-500">(miễn phí)</span>
              {stores.length === 0 && (
                <span className="ml-1 text-xs text-zinc-400">(chưa có cửa hàng)</span>
              )}
            </span>
          </label>
        </div>
      </div>

      {isStorePickup && (
        <div className="card p-4">
          <label className="mb-3 block text-sm font-semibold text-zinc-900">Chọn cửa hàng</label>
          <div className="flex flex-col gap-2">
            {stores.map((s) => (
              <label key={s.id} className={radioCardClass(selectedStoreId === s.id)}>
                <input
                  type="radio"
                  name="store"
                  className="mt-1"
                  checked={selectedStoreId === s.id}
                  onChange={() => setSelectedStoreId(s.id)}
                />
                <span>
                  <span className="font-medium text-zinc-900">{s.name}</span>
                  <br />
                  <span className="text-zinc-500">
                    {s.address}, {s.district}, {s.province}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {!isStorePickup && savedAddresses.length > 0 && (
        <div className="card p-4">
          <label className="mb-3 block text-sm font-semibold text-zinc-900">Chọn địa chỉ giao hàng</label>
          <div className="flex flex-col gap-2">
            {savedAddresses.map((a) => (
              <label key={a.id} className={radioCardClass(selectedAddressId === a.id)}>
                <input
                  type="radio"
                  name="address"
                  className="mt-1"
                  checked={selectedAddressId === a.id}
                  onChange={() => setSelectedAddressId(a.id)}
                />
                <span>
                  <span className="font-medium text-zinc-900">{a.recipientName}</span> - {a.phone}
                  {a.label && (
                    <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs">{a.label}</span>
                  )}
                  {a.isDefault && (
                    <span className="ml-2 rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">
                      Mặc định
                    </span>
                  )}
                  <br />
                  <span className="text-zinc-500">
                    {a.streetDetail}, {a.ward}, {a.province}
                  </span>
                  <br />
                  <span className="text-xs text-zinc-500">
                    Phí giao hàng {formatPrice(a.shippingFee)} · {a.zoneLabel}
                  </span>
                </span>
              </label>
            ))}
            <label className={radioCardClass(usingNewAddress)}>
              <input
                type="radio"
                name="address"
                className="mt-0.5"
                checked={usingNewAddress}
                onChange={() => setSelectedAddressId("__new__")}
              />
              + Nhập địa chỉ mới
            </label>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            <Link href="/addresses" className="underline hover:text-zinc-900">
              Quản lý sổ địa chỉ
            </Link>
          </p>
        </div>
      )}

      {!isStorePickup && usingNewAddress && (
        <div className="card flex flex-col gap-4 p-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Họ tên người nhận</label>
            <input
              className="input"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Số điện thoại</label>
            <input
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <ProvinceWardPicker
            provinces={provinces}
            province={province}
            ward={ward}
            onChange={(next) => {
              setProvince(next.province);
              setWard(next.ward);
            }}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Địa chỉ cụ thể</label>
            <input
              className="input"
              placeholder="Số nhà, tên đường..."
              value={streetDetail}
              onChange={(e) => setStreetDetail(e.target.value)}
              required
            />
          </div>
          <p className="text-xs text-zinc-500">
            Địa chỉ này sẽ tự động được lưu vào sổ địa chỉ của bạn.
          </p>
        </div>
      )}

      <div className="card p-4">
        <label className="mb-1 block text-sm font-medium text-zinc-700">Ghi chú (không bắt buộc)</label>
        <textarea
          className="input"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="card p-4">
        <label className="mb-1 block text-sm font-medium text-zinc-700">Mã giảm giá (không bắt buộc)</label>
        {appliedCoupon ? (
          <div className="flex items-center justify-between rounded-xl border border-green-600 bg-green-50 px-3.5 py-2.5 text-sm">
            <span className="text-green-700">
              Đã áp dụng mã <b>{appliedCoupon.code}</b>
              {appliedCoupon.freeShipping
                ? " (miễn phí vận chuyển)"
                : ` (-${formatPrice(appliedCoupon.discountAmount)})`}
            </span>
            <button type="button" onClick={handleRemoveCoupon} className="text-red-600 hover:underline">
              Xóa
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              className="input flex-1 uppercase"
              placeholder="Nhập mã giảm giá"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
            />
            <button
              type="button"
              onClick={() => handleApplyCoupon()}
              disabled={applyingCoupon || !couponInput.trim()}
              className="btn-secondary !px-4 !py-2 text-sm"
            >
              {applyingCoupon ? "Đang kiểm tra..." : "Áp dụng"}
            </button>
          </div>
        )}
        {couponError && <p className="mt-2 text-sm text-red-600">{couponError}</p>}

        {!appliedCoupon && suggestedCoupons.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-xs font-medium text-zinc-500">Mã đang có</p>
            {suggestedCoupons.map((c) => {
              const missing = c.minOrderValue - subtotal;
              const eligible = missing <= 0;
              return (
                <div
                  key={c.code}
                  className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-sm ${
                    eligible ? "border-zinc-200" : "border-zinc-200 opacity-60"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-mono font-semibold text-zinc-900">{c.code}</p>
                    <p className="text-zinc-600">{c.benefit}</p>
                    {!eligible ? (
                      <p className="text-xs text-zinc-500">
                        Mua thêm {formatPrice(missing)} để dùng mã này
                      </p>
                    ) : (
                      c.condition && <p className="text-xs text-zinc-500">{c.condition}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon(c.code)}
                    disabled={!eligible || applyingCoupon}
                    className="btn-secondary shrink-0 !px-3 !py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Áp dụng
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card p-4">
        <label className="mb-3 block text-sm font-semibold text-zinc-900">Phương thức thanh toán</label>
        <div className="flex flex-col gap-2">
          <label className={radioCardClass(paymentMethod === "COD")}>
            <input
              type="radio"
              name="paymentMethod"
              className="mt-0.5"
              checked={paymentMethod === "COD"}
              onChange={() => setPaymentMethod("COD")}
            />
            Thanh toán khi nhận hàng (COD)
          </label>
          <label className={radioCardClass(paymentMethod === "MOMO", !momoAvailable)}>
            <input
              type="radio"
              name="paymentMethod"
              className="mt-0.5"
              checked={paymentMethod === "MOMO"}
              disabled={!momoAvailable}
              onChange={() => setPaymentMethod("MOMO")}
            />
            <span>
              Thanh toán qua ví MoMo
              {!momoAvailable && <span className="ml-1 text-xs text-zinc-400">(chưa khả dụng)</span>}
            </span>
          </label>
          <label className={radioCardClass(paymentMethod === "BANK_TRANSFER", !bankTransferAvailable)}>
            <input
              type="radio"
              name="paymentMethod"
              className="mt-0.5"
              checked={paymentMethod === "BANK_TRANSFER"}
              disabled={!bankTransferAvailable}
              onChange={() => setPaymentMethod("BANK_TRANSFER")}
            />
            <span>
              Chuyển khoản ngân hàng (quét mã QR)
              {!bankTransferAvailable && (
                <span className="ml-1 text-xs text-zinc-400">(chưa khả dụng)</span>
              )}
            </span>
          </label>
          <label className={radioCardClass(paymentMethod === "INSTALLMENT", !installmentAvailable)}>
            <input
              type="radio"
              name="paymentMethod"
              className="mt-0.5"
              checked={paymentMethod === "INSTALLMENT"}
              disabled={!installmentAvailable}
              onChange={() => setPaymentMethod("INSTALLMENT")}
            />
            <span>
              Trả góp 0% qua công ty tài chính
              {!installmentAvailable && (
                <span className="ml-1 text-xs text-zinc-400">
                  (đơn từ {formatPrice(MIN_INSTALLMENT_TOTAL)} mới áp dụng)
                </span>
              )}
            </span>
          </label>
        </div>

        {paymentMethod === "INSTALLMENT" && installmentAvailable && (
          <div className="mt-4 border-t border-zinc-100 pt-4">
            <span className="mb-2 block text-sm font-medium text-zinc-900">Nhà cấp vốn</span>
            <div className="flex flex-col gap-2">
              {INSTALLMENT_PROVIDERS.map((p) => {
                // "Từ ... /tháng" của mỗi nhà cấp vốn = kỳ hạn dài nhất họ hỗ trợ,
                // tính ngay trên tổng đơn hiện tại để khách so sánh được trước khi chọn.
                const monthlyAmounts = p.months
                  .map((m) => quoteInstallment(grandTotal, p.id, m)?.monthlyAmount)
                  .filter((v): v is number => typeof v === "number");
                const cheapest = monthlyAmounts.length > 0 ? Math.min(...monthlyAmounts) : null;
                return (
                  <label key={p.id} className={radioCardClass(installmentProviderId === p.id)}>
                    <input
                      type="radio"
                      name="installmentProvider"
                      className="mt-0.5"
                      checked={installmentProviderId === p.id}
                      onChange={() => handleSelectInstallmentProvider(p.id)}
                    />
                    <span className="flex-1">
                      <span className="font-medium">{p.name}</span>
                      <span className="block text-xs text-zinc-500">
                        Trả trước {p.downPaymentPercent}%
                        {cheapest !== null && <> · từ {formatPrice(cheapest)}/tháng</>}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>

            <span className="mb-2 mt-4 block text-sm font-medium text-zinc-900">Kỳ hạn</span>
            <div className="flex flex-wrap gap-2">
              {installmentProvider.months.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setInstallmentMonths(m)}
                  className={
                    m === installmentMonths
                      ? "rounded-full border border-accent bg-accent/10 px-3.5 py-1.5 text-sm ring-1 ring-accent"
                      : "rounded-full border border-zinc-200 px-3.5 py-1.5 text-sm hover:border-zinc-400"
                  }
                >
                  {m} tháng
                </button>
              ))}
            </div>

            {installmentQuote && (
              <div className="mt-4 space-y-1.5 rounded-xl bg-zinc-100 p-3.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Trả trước</span>
                  <span className="font-medium">{formatPrice(installmentQuote.downPayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Góp hàng tháng × {installmentQuote.months}</span>
                  <span className="font-semibold text-accent">
                    {formatPrice(installmentQuote.monthlyAmount)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-zinc-200 pt-1.5">
                  <span className="text-zinc-500">Lãi suất</span>
                  <span className="font-medium">0%</span>
                </div>
                <p className="pt-1 text-xs text-zinc-500">
                  Tổng phải trả đúng bằng giá trị đơn hàng. Hồ sơ cần được{" "}
                  {installmentQuote.providerName} duyệt trước khi đơn được xử lý.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card space-y-1.5 p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-500">Tạm tính</span>
          <span className="text-zinc-900">{formatPrice(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-green-700">
            <span>Giảm giá</span>
            <span>-{formatPrice(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-zinc-500">
            Phí vận chuyển
            {!isStorePickup && shippingZoneLabel && (
              <span className="block text-xs text-zinc-400">{shippingZoneLabel}</span>
            )}
          </span>
          <span className="text-zinc-900">
            {isStorePickup ? (
              "Miễn phí"
            ) : appliedCoupon?.freeShipping ? (
              <>
                <span className="mr-1 text-zinc-400 line-through">{formatPrice(shippingFee)}</span>
                Miễn phí
              </>
            ) : (
              formatPrice(effectiveShippingFee)
            )}
          </span>
        </div>
        <div className="flex justify-between border-t border-zinc-100 pt-2 text-base font-semibold">
          <span>Tổng cộng</span>
          <span className="text-accent">{formatPrice(grandTotal)}</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={submitting} className="btn-primary !py-3.5">
        {submitting
          ? "Đang xử lý..."
          : paymentMethod === "MOMO"
            ? "Đặt hàng & thanh toán qua MoMo"
            : paymentMethod === "INSTALLMENT"
              ? "Đặt hàng & gửi hồ sơ trả góp"
              : isStorePickup
              ? "Đặt hàng (thanh toán khi nhận tại cửa hàng)"
              : "Đặt hàng (thanh toán khi nhận hàng)"}
      </button>
    </form>
  );
}
