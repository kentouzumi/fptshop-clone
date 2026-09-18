"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface SavedAddress {
  id: string;
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  streetDetail: string;
  label: string | null;
  isDefault: boolean;
}

export interface StoreOption {
  id: string;
  name: string;
  province: string;
  district: string;
  address: string;
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
  shippingFee,
  momoAvailable,
  stores,
}: {
  savedAddresses: SavedAddress[];
  subtotal: number;
  shippingFee: number;
  momoAvailable: boolean;
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
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [streetDetail, setStreetDetail] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "MOMO">("COD");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const usingNewAddress = selectedAddressId === "__new__";
  const isStorePickup = deliveryMethod === "STORE_PICKUP";

  const effectiveShippingFee = isStorePickup || appliedCoupon?.freeShipping ? 0 : shippingFee;
  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const grandTotal = subtotal + effectiveShippingFee - discountAmount;

  async function handleApplyCoupon() {
    const code = couponInput.trim();
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

    setSubmitting(true);
    try {
      const body = {
        deliveryMethod,
        ...(isStorePickup
          ? { pickupStoreId: selectedStoreId }
          : usingNewAddress
            ? { newAddress: { recipientName, phone, province, district, ward, streetDetail } }
            : { addressId: selectedAddressId }),
        note,
        couponCode: appliedCoupon?.code,
        paymentMethod,
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
                    {a.streetDetail}, {a.ward}, {a.district}, {a.province}
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
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Tỉnh/Thành</label>
              <input
                className="input"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Quận/Huyện</label>
              <input
                className="input"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Phường/Xã</label>
              <input
                className="input"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                required
              />
            </div>
          </div>
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
              onClick={handleApplyCoupon}
              disabled={applyingCoupon || !couponInput.trim()}
              className="btn-secondary !px-4 !py-2 text-sm"
            >
              {applyingCoupon ? "Đang kiểm tra..." : "Áp dụng"}
            </button>
          </div>
        )}
        {couponError && <p className="mt-2 text-sm text-red-600">{couponError}</p>}
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
        </div>
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
          <span className="text-zinc-500">Phí vận chuyển</span>
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
            : isStorePickup
              ? "Đặt hàng (thanh toán khi nhận tại cửa hàng)"
              : "Đặt hàng (thanh toán khi nhận hàng)"}
      </button>
    </form>
  );
}
