import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getTicketsForUser, TICKET_CATEGORY_LABELS, TICKET_STATUS_LABELS } from "@/lib/support";
import NewTicketForm from "./NewTicketForm";

export default async function SupportPage() {
  const user = await getCurrentUser();
  const tickets = user ? await getTicketsForUser(user.id) : [];

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-semibold">Hỗ trợ khách hàng</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Xem thêm tại <Link href="/faq" className="underline">Câu hỏi thường gặp</Link>.
      </p>

      {user ? (
        <NewTicketForm
          defaultFullName={user.fullName}
          defaultPhone={user.phone ?? ""}
          defaultEmail={user.email ?? ""}
        />
      ) : (
        <div className="mb-8 rounded-lg border border-zinc-200 p-4 text-sm text-zinc-600">
          <Link href="/login" className="underline">
            Đăng nhập
          </Link>{" "}
          để gửi yêu cầu hỗ trợ và theo dõi phản hồi.
        </div>
      )}

      {user && (
        <>
          <h2 className="mb-3 text-lg font-semibold">Yêu cầu của tôi</h2>
          {tickets.length === 0 ? (
            <p className="text-zinc-500">Bạn chưa gửi yêu cầu nào.</p>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <Link
                  key={t.id}
                  href={`/support/${t.id}`}
                  className="block rounded-lg border border-zinc-200 p-4 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{t.subject}</p>
                    <span className="text-xs text-zinc-500">{TICKET_STATUS_LABELS[t.status]}</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">
                    {TICKET_CATEGORY_LABELS[t.category]} ·{" "}
                    {new Date(t.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
