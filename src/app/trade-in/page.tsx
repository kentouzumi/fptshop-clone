import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTradeInRequestsForUser, TRADE_IN_STATUS_LABELS } from "@/lib/tradeIn";
import TradeInForm from "./TradeInForm";

function formatPrice(value: number) {
  return value.toLocaleString("vi-VN") + "₫";
}

export default async function TradeInPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const requests = await getTradeInRequestsForUser(user.id);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Thu cũ đổi mới</h1>

      <TradeInForm />

      <h2 className="mb-3 text-lg font-semibold">Yêu cầu của tôi</h2>
      {requests.length === 0 ? (
        <p className="text-zinc-500">Bạn chưa gửi yêu cầu nào.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-lg border border-zinc-200 p-4">
              <p className="font-medium">{r.deviceInfo}</p>
              <p className="text-sm text-zinc-600">{r.condition}</p>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span>{TRADE_IN_STATUS_LABELS[r.status]}</span>
                <span className="font-semibold text-accent">
                  {Number(r.quotedPrice) > 0 ? formatPrice(Number(r.quotedPrice)) : "Chưa báo giá"}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                {new Date(r.createdAt).toLocaleDateString("vi-VN")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
