import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getOrderDetailForAdmin,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TRANSITIONS,
} from "@/lib/orders";
import OrderStatusUpdateForm from "../OrderStatusUpdateForm";

function formatPrice(value: number) {
  return value.toLocaleString("vi-VN") + "₫";
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: "Tiền mặt khi nhận hàng (COD)",
  BANK_CARD: "Thẻ ngân hàng",
  VISA_MASTERCARD: "Visa/Mastercard",
  E_WALLET: "Ví điện tử",
  INSTALLMENT: "Trả góp",
  BANK_TRANSFER: "Chuyển khoản",
  VNPAY: "VNPay",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thất bại",
  REFUNDED: "Đã hoàn tiền",
};

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

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderDetailForAdmin(id);
  if (!order) notFound();

  const nextStatuses = ORDER_STATUS_TRANSITIONS[order.status];

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/orders" className="mb-4 inline-block text-sm text-zinc-500 hover:underline">
        ← Danh sách đơn hàng
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Đơn hàng {order.code}</h1>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            STATUS_STYLES[order.status] ?? "bg-zinc-100 text-zinc-700"
          }`}
        >
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      <div className="mb-6 card p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Cập nhật trạng thái</h2>
        <OrderStatusUpdateForm
          orderId={order.id}
          nextStatuses={nextStatuses}
          statusLabels={ORDER_STATUS_LABELS}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-2 text-sm font-semibold text-zinc-700">Khách hàng</h2>
          <p className="text-sm">{order.user.fullName}</p>
          <p className="text-sm text-zinc-500">{order.user.phone}</p>
          {order.user.email && <p className="text-sm text-zinc-500">{order.user.email}</p>}
        </div>

        {order.deliveryMethod === "STORE_PICKUP" && order.pickupStore ? (
          <div className="card p-4">
            <h2 className="mb-2 text-sm font-semibold text-zinc-700">Nhận tại cửa hàng</h2>
            <p className="text-sm">{order.pickupStore.name}</p>
            <p className="text-sm text-zinc-500">
              {order.pickupStore.address}, {order.pickupStore.district}, {order.pickupStore.province}
            </p>
            {order.note && <p className="mt-1 text-sm text-zinc-500">Ghi chú: {order.note}</p>}
          </div>
        ) : (
          order.address && (
            <div className="card p-4">
              <h2 className="mb-2 text-sm font-semibold text-zinc-700">Giao đến</h2>
              <p className="text-sm">
                {order.address.recipientName} - {order.address.phone}
              </p>
              <p className="text-sm text-zinc-500">
                {order.address.streetDetail}, {order.address.ward}, {order.address.district},{" "}
                {order.address.province}
              </p>
              {order.note && <p className="mt-1 text-sm text-zinc-500">Ghi chú: {order.note}</p>}
            </div>
          )
        )}
      </div>

      <div className="mb-6 card p-4">
        <h2 className="mb-2 text-sm font-semibold text-zinc-700">Thanh toán</h2>
        {order.payments.map((p) => (
          <p key={p.id} className="text-sm">
            {PAYMENT_METHOD_LABELS[p.method] ?? p.method} —{" "}
            <span className={p.status === "PAID" ? "text-green-600" : "text-zinc-500"}>
              {PAYMENT_STATUS_LABELS[p.status] ?? p.status}
            </span>
          </p>
        ))}
      </div>

      <div className="card mb-6 divide-y divide-zinc-100">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between p-3 text-sm">
            <span>
              {item.productName}
              {item.variantLabel && ` (${item.variantLabel})`} × {item.quantity}
            </span>
            <span className="font-medium">{formatPrice(Number(item.lineTotal))}</span>
          </div>
        ))}
      </div>

      <div className="mb-6 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-500">Tạm tính</span>
          <span>{formatPrice(Number(order.subtotal))}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Phí vận chuyển</span>
          <span>{formatPrice(Number(order.shippingFee))}</span>
        </div>
        <div className="flex justify-between text-base font-semibold">
          <span>Tổng cộng</span>
          <span className="text-accent">{formatPrice(Number(order.grandTotal))}</span>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="mb-2 text-sm font-semibold text-zinc-700">Lịch sử trạng thái</h2>
        <div className="space-y-2">
          {order.statusHistory.map((h) => (
            <div key={h.id} className="flex justify-between text-sm">
              <span>
                {ORDER_STATUS_LABELS[h.status] ?? h.status}
                {h.note && <span className="text-zinc-400"> — {h.note}</span>}
              </span>
              <span className="text-zinc-400">
                {new Date(h.createdAt).toLocaleString("vi-VN")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
