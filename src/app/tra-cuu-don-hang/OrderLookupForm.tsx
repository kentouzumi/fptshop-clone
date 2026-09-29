"use client";

import { useState, type FormEvent } from "react";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  DELIVERY_METHOD_LABELS,
  SHIPMENT_STATUS_LABELS,
} from "@/lib/orderLabels";
import InstallmentPlanCard from "@/components/InstallmentPlanCard";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  PROCESSING: "bg-blue-50 text-blue-700",
  SHIPPING: "bg-indigo-50 text-indigo-700",
  DELIVERED: "bg-green-50 text-green-700",
  COMPLETED: "bg-green-50 text-green-700",
  CANCELLED: "bg-zinc-100 text-zinc-500",
  RETURN_REQUESTED: "bg-red-50 text-red-700",
  RETURNED: "bg-zinc-100 text-zinc-500",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thanh toán thất bại",
  REFUNDED: "Đã hoàn tiền",
};

interface LookupOrder {
  code: string;
  createdAt: string;
  status: string;
  deliveryMethod: string;
  subtotal: number;
  shippingFee: number;
  discountTotal: number;
  grandTotal: number;
  recipientName: string;
  phone: string;
  addressLine: string;
  shipment: {
    status: string;
    carrier: string | null;
    trackingCode: string | null;
    estimatedDate: string | null;
    deliveredAt: string | null;
  } | null;
  installmentPlan: {
    provider: string;
    months: number;
    downPayment: number;
    monthlyAmount: number;
    approved: boolean;
  } | null;
  items: { id: string; productName: string; variantLabel: string | null; quantity: number; lineTotal: number }[];
  payments: { id: string; method: string; status: string }[];
  statusHistory: { id: string; status: string; note: string | null; createdAt: string }[];
}

function formatPrice(value: number) {
  return value.toLocaleString("vi-VN") + "₫";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("vi-VN");
}

export default function OrderLookupForm() {
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<LookupOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Tra cứu thất bại.");
        return;
      }
      setOrder(data.order);
    } catch {
      setError("Không kết nối được máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="card flex flex-col gap-4 p-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Mã đơn hàng</label>
          <input
            className="input font-mono"
            placeholder="VD: DHMUE3ZXPHKJM9"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Số điện thoại người nhận
          </label>
          <input
            className="input"
            placeholder="Số điện thoại đã dùng khi đặt hàng"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-fit disabled:opacity-50">
          {loading ? "Đang tra cứu..." : "Tra cứu"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {order && (
        <div className="flex flex-col gap-4">
          <div className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-lg font-semibold text-zinc-900">{order.code}</p>
                <p className="text-sm text-zinc-500">Đặt lúc {formatDate(order.createdAt)}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  STATUS_STYLES[order.status] ?? "bg-zinc-100 text-zinc-600"
                }`}
              >
                {ORDER_STATUS_LABELS[order.status] ?? order.status}
              </span>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="mb-2 text-sm font-semibold text-zinc-900">
              {DELIVERY_METHOD_LABELS[order.deliveryMethod] ?? "Giao hàng"}
            </h2>
            <p className="text-sm text-zinc-700">
              {order.recipientName} - {order.phone}
            </p>
            <p className="text-sm text-zinc-500">{order.addressLine}</p>
          </div>

          {order.shipment && (
            <div className="card p-5">
              <h2 className="mb-2 text-sm font-semibold text-zinc-900">Vận chuyển</h2>
              <p className="text-sm text-zinc-700">
                {SHIPMENT_STATUS_LABELS[order.shipment.status] ?? order.shipment.status}
              </p>
              {order.shipment.carrier && (
                <p className="text-sm text-zinc-500">
                  Đơn vị vận chuyển: {order.shipment.carrier}
                </p>
              )}
              {order.shipment.trackingCode && (
                <p className="text-sm text-zinc-500">
                  Mã vận đơn:{" "}
                  <span className="font-mono text-zinc-700">{order.shipment.trackingCode}</span>
                </p>
              )}
              {order.shipment.deliveredAt ? (
                <p className="text-sm text-zinc-500">
                  Đã giao lúc {formatDate(order.shipment.deliveredAt)}
                </p>
              ) : (
                order.shipment.estimatedDate && (
                  <p className="text-sm text-zinc-500">
                    Dự kiến giao:{" "}
                    {new Date(order.shipment.estimatedDate).toLocaleDateString("vi-VN")}
                  </p>
                )
              )}
            </div>
          )}

          {order.installmentPlan && <InstallmentPlanCard plan={order.installmentPlan} />}

          <div className="card divide-y divide-zinc-100">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3 p-3.5 text-sm">
                <span className="text-zinc-700">
                  {item.productName}
                  {item.variantLabel && ` (${item.variantLabel})`} × {item.quantity}
                </span>
                <span className="font-medium text-zinc-900">{formatPrice(item.lineTotal)}</span>
              </div>
            ))}
            <div className="flex flex-col gap-1 p-3.5 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Tạm tính</span>
                <span className="text-zinc-900">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Giảm giá</span>
                  <span>-{formatPrice(order.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-500">Phí vận chuyển</span>
                <span className="text-zinc-900">
                  {order.shippingFee === 0 ? "Miễn phí" : formatPrice(order.shippingFee)}
                </span>
              </div>
              <div className="flex justify-between border-t border-zinc-100 pt-2 text-base font-semibold">
                <span>Tổng cộng</span>
                <span className="text-accent">{formatPrice(order.grandTotal)}</span>
              </div>
            </div>
          </div>

          {order.payments.length > 0 && (
            <div className="card p-5">
              <h2 className="mb-2 text-sm font-semibold text-zinc-900">Thanh toán</h2>
              {order.payments.map((p) => (
                <p key={p.id} className="text-sm text-zinc-700">
                  {PAYMENT_METHOD_LABELS[p.method] ?? p.method} —{" "}
                  {PAYMENT_STATUS_LABELS[p.status] ?? p.status}
                </p>
              ))}
            </div>
          )}

          {order.statusHistory.length > 0 && (
            <div className="card p-5">
              <h2 className="mb-3 text-sm font-semibold text-zinc-900">Lịch sử trạng thái</h2>
              <ol className="flex flex-col gap-2 text-sm">
                {order.statusHistory.map((h) => (
                  <li key={h.id} className="flex flex-wrap gap-2">
                    <span className="text-zinc-500">{formatDate(h.createdAt)}</span>
                    <span className="text-zinc-900">
                      {ORDER_STATUS_LABELS[h.status] ?? h.status}
                    </span>
                    {h.note && <span className="text-zinc-500">— {h.note}</span>}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
