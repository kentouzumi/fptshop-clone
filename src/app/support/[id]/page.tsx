import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTicketDetail, TICKET_CATEGORY_LABELS, TICKET_STATUS_LABELS } from "@/lib/support";
import ReplyForm from "./ReplyForm";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const ticket = await getTicketDetail(id, user.id);
  if (!ticket) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{ticket.subject}</h1>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm">
          {TICKET_STATUS_LABELS[ticket.status]}
        </span>
      </div>
      <p className="mb-6 text-sm text-zinc-500">{TICKET_CATEGORY_LABELS[ticket.category]}</p>

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

      {ticket.status !== "CLOSED" && <ReplyForm ticketId={ticket.id} />}
    </div>
  );
}
