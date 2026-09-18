import Link from "next/link";
import { OrderStatus } from "@prisma/client";
import { getAllOrdersForAdmin, ORDER_STATUS_LABELS } from "@/lib/orders";

function formatPrice(value: number) {
  return value.toLocaleString("vi-VN") + "₫";
}

const STATUS_FILTERS: { label: string; value: OrderStatus | "" }[] = [
  { label: "Tất cả", value: "" },
  ...Object.values(OrderStatus).map((s) => ({ label: ORDER_STATUS_LABELS[s] ?? s, value: s })),
];

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

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const status =
    sp.status && Object.values(OrderStatus).includes(sp.status as OrderStatus)
      ? (sp.status as OrderStatus)
      : undefined;
  const search = sp.search?.trim() || undefined;
  const page = sp.page ? Number(sp.page) : 1;

  const { orders, total, totalPages } = await getAllOrdersForAdmin({ status, search, page });

  function buildHref(overrides: { status?: string; page?: number }) {
    const params = new URLSearchParams();
    const nextStatus = overrides.status !== undefined ? overrides.status : status ?? "";
    if (nextStatus) params.set("status", nextStatus);
    if (search) params.set("search", search);
    const nextPage = overrides.page ?? 1;
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold tracking-tight">Quản lý đơn hàng ({total})</h1>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <Link
              key={f.value || "all"}
              href={buildHref({ status: f.value })}
              className={`chip !px-3 !py-1 text-sm ${(status ?? "") === f.value ? "chip-active" : "chip-inactive"}`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        <form action="/admin/orders" method="GET" className="flex">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Mã đơn, tên hoặc SĐT khách..."
            className="w-64 rounded-l-full border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 outline-none transition focus:border-accent"
          />
          <button
            type="submit"
            className="rounded-r-full border border-l-0 border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900"
          >
            Tìm
          </button>
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Mã đơn</th>
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">Số sản phẩm</th>
              <th className="px-4 py-3">Tổng tiền</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Ngày đặt</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-zinc-100 transition hover:bg-zinc-100">
                <td className="px-4 py-2.5 font-medium text-zinc-900">{o.code}</td>
                <td className="px-4 py-2.5">
                  {o.user.fullName}
                  <div className="text-xs text-zinc-400">{o.user.phone}</div>
                </td>
                <td className="px-4 py-2.5 text-zinc-600">{o.items.length}</td>
                <td className="px-4 py-2.5 font-medium text-accent">{formatPrice(Number(o.grandTotal))}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      STATUS_STYLES[o.status] ?? "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {ORDER_STATUS_LABELS[o.status] ?? o.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-zinc-600">{new Date(o.createdAt).toLocaleDateString("vi-VN")}</td>
                <td className="px-4 py-2.5 text-right">
                  <Link href={`/admin/orders/${o.id}`} className="font-medium text-zinc-600 hover:text-zinc-900 hover:underline">
                    Chi tiết
                  </Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                  Không có đơn hàng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={buildHref({ page: p })}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition ${
                p === page ? "bg-zinc-900 text-white" : "border border-zinc-200 text-zinc-600 hover:border-zinc-400"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
