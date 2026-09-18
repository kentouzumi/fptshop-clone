import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrderDetail, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/orders";
import RetryPaymentButton from "./RetryPaymentButton";

function formatPrice(value: number) {
  return value.toLocaleString("vi-VN") + "₫";
}

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

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const { payment: paymentQuery } = await searchParams;
  const order = await getOrderDetail(id, user.id);
  if (!order) notFound();

  const payment = order.payments[0];
  const canRetryPayment =
    payment && payment.method === "MOMO" && (payment.status === "PENDING" || payment.status === "FAILED");

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      {paymentQuery === "success" && (
        <div className="mb-4 rounded-xl bg-green-50 p-4 text-sm text-green-800">
          Thanh toán MoMo thành công! Đơn hàng đã được xác nhận.
        </div>
      )}
      {paymentQuery === "failed" && (
        <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">
          Thanh toán MoMo không thành công. Bạn có thể thử thanh toán lại bên dưới.
        </div>
      )}

      <div className="mb-6 rounded-xl bg-green-50 p-4 text-sm text-green-800">
        Đặt hàng thành công! Mã đơn hàng: <b>{order.code}</b>
      </div>

      <h1 className="mb-4 text-xl font-semibold tracking-tight">Chi tiết đơn hàng</h1>

      <div className="card mb-4 flex items-center justify-between p-4">
        <span className="text-sm text-zinc-500">Trạng thái</span>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            STATUS_STYLES[order.status] ?? "bg-zinc-100 text-zinc-700"
          }`}
        >
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      {order.deliveryMethod === "STORE_PICKUP" && order.pickupStore ? (
        <div className="card mb-4 p-4">
          <p className="mb-1 text-sm font-medium text-zinc-900">Nhận tại cửa hàng</p>
          <p className="text-sm text-zinc-700">{order.pickupStore.name}</p>
          <p className="text-sm text-zinc-500">
            {order.pickupStore.address}, {order.pickupStore.district}, {order.pickupStore.province}
          </p>
          {order.pickupStore.phone && (
            <p className="text-sm text-zinc-500">SĐT cửa hàng: {order.pickupStore.phone}</p>
          )}
        </div>
      ) : (
        order.address && (
          <div className="card mb-4 p-4">
            <p className="mb-1 text-sm font-medium text-zinc-900">Giao đến</p>
            <p className="text-sm text-zinc-700">
              {order.address.recipientName} - {order.address.phone}
            </p>
            <p className="text-sm text-zinc-500">
              {order.address.streetDetail}, {order.address.ward}, {order.address.district},{" "}
              {order.address.province}
            </p>
          </div>
        )
      )}

      <div className="card divide-y divide-zinc-100">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between p-3.5 text-sm">
            <span className="text-zinc-700">
              {item.productName}
              {item.variantLabel && ` (${item.variantLabel})`} × {item.quantity}
            </span>
            <span className="font-medium text-zinc-900">{formatPrice(Number(item.lineTotal))}</span>
          </div>
        ))}
      </div>

      <div className="card mt-4 space-y-1.5 p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-500">Tạm tính</span>
          <span className="text-zinc-900">{formatPrice(Number(order.subtotal))}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Phí vận chuyển</span>
          <span className="text-zinc-900">{formatPrice(Number(order.shippingFee))}</span>
        </div>
        <div className="flex justify-between border-t border-zinc-100 pt-2 text-base font-semibold">
          <span>Tổng cộng</span>
          <span className="text-accent">{formatPrice(Number(order.grandTotal))}</span>
        </div>
      </div>

      {payment && (
        <p className="mt-4 text-sm text-zinc-500">
          Thanh toán: {PAYMENT_METHOD_LABELS[payment.method] ?? payment.method} —{" "}
          <span
            className={
              payment.status === "PAID"
                ? "font-medium text-green-700"
                : payment.status === "FAILED"
                  ? "font-medium text-red-600"
                  : "font-medium text-amber-700"
            }
          >
            {payment.status === "PAID"
              ? "Đã thanh toán"
              : payment.status === "FAILED"
                ? "Thanh toán thất bại"
                : "Chưa thanh toán"}
          </span>
        </p>
      )}

      {canRetryPayment && <RetryPaymentButton orderId={order.id} />}

      <Link href="/orders" className="mt-6 inline-block text-sm text-zinc-600 underline hover:text-zinc-900">
        Xem tất cả đơn hàng
      </Link>
    </div>
  );
}
