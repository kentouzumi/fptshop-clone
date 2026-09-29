import Link from "next/link";
import { OrderStatus } from "@prisma/client";
import { ORDER_STATUS_LABELS } from "@/lib/orders";
import { getAdminDashboard, LOW_STOCK_THRESHOLD } from "@/lib/dashboard";

function formatPrice(value: number) {
  return value.toLocaleString("vi-VN") + "₫";
}

function formatDate(d: Date) {
  return new Date(d).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Dùng LẠI đúng bộ màu trạng thái của /admin/orders để cùng 1 trạng thái không
// mang 2 màu khác nhau ở 2 trang quản trị.
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

/** Trạng thái đơn cần admin động tay, hiện thành chip có số ở đầu trang. */
const ACTIONABLE_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPING,
  OrderStatus.RETURN_REQUESTED,
];

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1.5 text-xl font-semibold tracking-tight text-accent">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const data = await getAdminDashboard();

  const todoItems = [
    {
      count: data.pendingBankTransfers.length,
      label: "chuyển khoản chờ xác nhận",
      href: "/admin/orders?status=PENDING",
    },
    { count: data.todo.openTickets, label: "yêu cầu hỗ trợ chưa xử lý", href: "/admin/support" },
    {
      count: data.todo.openClaims,
      label: "yêu cầu bảo hành mới",
      href: "/admin/warranty-claims",
    },
    { count: data.todo.quotedTradeIns, label: "thu cũ chờ khách xác nhận", href: "/admin/trade-in" },
    {
      count: data.todo.unansweredQuestions,
      label: "câu hỏi sản phẩm chưa trả lời",
      href: "/admin/product-qa?unanswered=1",
    },
    {
      count: data.lowStock.length,
      label: `biến thể còn ≤ ${LOW_STOCK_THRESHOLD} trong kho`,
      href: "/admin/inventory",
    },
  ].filter((item) => item.count > 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Tổng quan</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Doanh thu đã trừ đơn hủy và đơn trả hàng.
        </p>
      </div>

      {/* Việc cần làm đặt TRÊN các con số: mở trang quản trị ra thì thứ cần
          biết đầu tiên là "có gì đang chờ mình", không phải doanh thu. Không
          có việc nào thì khối này biến mất hẳn thay vì hiện danh sách 5 dòng
          số 0 vô nghĩa. */}
      {todoItems.length > 0 && (
        <div className="card border-accent/40 bg-accent/5 p-4">
          <p className="mb-2 text-sm font-semibold">Cần xử lý</p>
          <div className="flex flex-wrap gap-2">
            {todoItems.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm transition hover:border-accent"
              >
                <span className="font-semibold text-accent">{item.count}</span>{" "}
                <span className="text-zinc-600">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Doanh thu hôm nay"
          value={formatPrice(data.today.revenue)}
          sub={`${data.today.orderCount} đơn`}
        />
        <StatCard
          label="7 ngày qua"
          value={formatPrice(data.week.revenue)}
          sub={`${data.week.orderCount} đơn`}
        />
        <StatCard
          label="30 ngày qua"
          value={formatPrice(data.month.revenue)}
          sub={`${data.month.orderCount} đơn`}
        />
        <StatCard
          label="Tổng đơn hàng"
          value={String(data.totalOrders)}
          sub={`${data.catalog.activeProductCount}/${data.catalog.productCount} sản phẩm đang bán · ${data.catalog.customerCount} khách`}
        />
      </div>

      <div className="card p-4">
        <p className="mb-3 text-sm font-semibold">Đơn hàng theo trạng thái</p>
        <div className="flex flex-wrap gap-2">
          {ACTIONABLE_STATUSES.map((status) => (
            <Link
              key={status}
              href={`/admin/orders?status=${status}`}
              className={`rounded-full px-3 py-1.5 text-sm transition hover:opacity-80 ${
                STATUS_STYLES[status] ?? "bg-zinc-100 text-zinc-600"
              }`}
            >
              {ORDER_STATUS_LABELS[status] ?? status}:{" "}
              <span className="font-semibold">{data.statusCounts[status] ?? 0}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <p className="text-sm font-semibold">Đơn hàng mới nhất</p>
            <Link href="/admin/orders" className="text-xs text-zinc-500 hover:text-accent">
              Xem tất cả →
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-zinc-400">Chưa có đơn hàng nào.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {data.recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-mono text-xs font-medium hover:text-accent hover:underline"
                      >
                        {o.code}
                      </Link>
                      <p className="text-xs text-zinc-500">
                        {o.customerName} · {formatDate(o.createdAt)}
                      </p>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <p className="font-semibold text-accent">{formatPrice(o.grandTotal)}</p>
                      <span
                        className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs ${
                          STATUS_STYLES[o.status] ?? "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {ORDER_STATUS_LABELS[o.status] ?? o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {data.pendingBankTransfers.length > 0 && (
            <div className="card overflow-hidden">
              <div className="border-b border-zinc-200 px-4 py-3">
                <p className="text-sm font-semibold">Chuyển khoản chờ xác nhận</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Đối chiếu nội dung chuyển khoản với sao kê rồi xác nhận trong chi tiết đơn.
                </p>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {data.pendingBankTransfers.map((p) => (
                    <tr key={p.id} className="border-b border-zinc-100 last:border-0">
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/admin/orders/${p.orderId}`}
                          className="font-mono text-xs font-medium hover:text-accent hover:underline"
                        >
                          {p.orderCode}
                        </Link>
                        <p className="text-xs text-zinc-500">
                          Nội dung CK: {p.transactionRef ?? "—"}
                        </p>
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-accent">
                        {formatPrice(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Sắp hết hàng</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Còn ≤ {LOW_STOCK_THRESHOLD}, tính riêng theo từng cửa hàng.
                </p>
              </div>
              <Link href="/admin/inventory" className="text-xs text-zinc-500 hover:text-accent">
                Sửa tồn kho →
              </Link>
            </div>
            {data.lowStock.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-zinc-400">
                Không có biến thể nào sắp hết hàng.
              </p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {data.lowStock.map((row) => (
                    <tr
                      key={`${row.sku}-${row.storeName}`}
                      className="border-b border-zinc-100 last:border-0"
                    >
                      <td className="px-4 py-2.5">
                        <p className="font-medium">{row.productName}</p>
                        <p className="text-xs text-zinc-500">
                          {row.variantLabel || row.sku} · {row.storeName}
                        </p>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            row.quantity === 0
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {row.quantity === 0 ? "Hết hàng" : `Còn ${row.quantity}`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
