import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrdersForUser, ORDER_STATUS_LABELS } from "@/lib/orders";

function formatPrice(value: number) {
  return value.toLocaleString("vi-VN") + "₫";
}

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const orders = await getOrdersForUser(user.id);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Đơn hàng của tôi</h1>

      {orders.length === 0 ? (
        <div className="card p-10 text-center text-zinc-500">Bạn chưa có đơn hàng nào.</div>
      ) : (
        <div className="card divide-y divide-zinc-100">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex items-center justify-between p-4 transition hover:bg-zinc-100"
            >
              <div>
                <p className="font-medium text-zinc-900">{order.code}</p>
                <p className="text-sm text-zinc-500">
                  {order.items.length} sản phẩm -{" "}
                  {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-accent">
                  {formatPrice(Number(order.grandTotal))}
                </p>
                <p className="text-sm text-zinc-500">
                  {ORDER_STATUS_LABELS[order.status] ?? order.status}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
