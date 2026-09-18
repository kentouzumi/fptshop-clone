import Link from "next/link";
import { TicketStatus } from "@prisma/client";
import { getAllTicketsForAdmin, TICKET_CATEGORY_LABELS, TICKET_STATUS_LABELS } from "@/lib/support";

const STATUS_FILTERS: { label: string; value: TicketStatus | "" }[] = [
  { label: "Tất cả", value: "" },
  ...Object.values(TicketStatus).map((s) => ({ label: TICKET_STATUS_LABELS[s], value: s })),
];

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status =
    sp.status && Object.values(TicketStatus).includes(sp.status as TicketStatus)
      ? (sp.status as TicketStatus)
      : undefined;

  const tickets = await getAllTicketsForAdmin(status);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Yêu cầu hỗ trợ ({tickets.length})</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.value || "all"}
            href={f.value ? `/admin/support?status=${f.value}` : "/admin/support"}
            className={`rounded-full border px-3 py-1 text-sm ${
              (status ?? "") === f.value
                ? "border-black bg-black text-white"
                : "border-zinc-300 text-zinc-600 hover:border-black"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-2">Tiêu đề</th>
              <th className="px-4 py-2">Khách hàng</th>
              <th className="px-4 py-2">Danh mục</th>
              <th className="px-4 py-2">Trạng thái</th>
              <th className="px-4 py-2">Ngày gửi</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id} className="border-t border-zinc-100">
                <td className="px-4 py-2">{t.subject}</td>
                <td className="px-4 py-2">
                  {t.fullName}
                  <div className="text-xs text-zinc-400">{t.phone}</div>
                </td>
                <td className="px-4 py-2">{TICKET_CATEGORY_LABELS[t.category]}</td>
                <td className="px-4 py-2">{TICKET_STATUS_LABELS[t.status]}</td>
                <td className="px-4 py-2">{new Date(t.createdAt).toLocaleDateString("vi-VN")}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/admin/support/${t.id}`} className="text-blue-600 underline">
                    Xem
                  </Link>
                </td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  Không có yêu cầu nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
