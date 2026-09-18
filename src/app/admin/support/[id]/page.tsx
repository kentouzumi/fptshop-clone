import { notFound } from "next/navigation";
import { getTicketDetail, TICKET_CATEGORY_LABELS } from "@/lib/support";
import AdminTicketPanel from "./AdminTicketPanel";

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = await getTicketDetail(id);
  if (!ticket) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold">{ticket.subject}</h1>
      <p className="mb-4 text-sm text-zinc-500">
        {ticket.fullName} · {ticket.phone} {ticket.email && `· ${ticket.email}`} ·{" "}
        {TICKET_CATEGORY_LABELS[ticket.category]}
      </p>

      <div className="space-y-3">
        <div className="rounded-lg border border-zinc-200 p-4">
          <p className="mb-1 text-xs text-zinc-400">
            {ticket.fullName} · {new Date(ticket.createdAt).toLocaleString("vi-VN")}
          </p>
          <p className="text-sm">{ticket.content}</p>
        </div>

        {ticket.replies.map((r) => (
          <div
            key={r.id}
            className={`rounded-lg border p-4 ${
              r.isStaff ? "border-blue-200 bg-blue-50" : "border-zinc-200"
            }`}
          >
            <p className="mb-1 text-xs text-zinc-400">
              {r.isStaff ? "Nhân viên hỗ trợ" : ticket.fullName} ·{" "}
              {new Date(r.createdAt).toLocaleString("vi-VN")}
            </p>
            <p className="text-sm">{r.content}</p>
          </div>
        ))}
      </div>

      <AdminTicketPanel ticketId={ticket.id} status={ticket.status} />
    </div>
  );
}
