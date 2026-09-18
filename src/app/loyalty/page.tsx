import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getLoyaltyAccountForUser, TIER_LABELS, POINTS_PER_VND } from "@/lib/loyalty";

const TXN_TYPE_LABELS: Record<string, string> = {
  EARN: "Tích điểm",
  REDEEM: "Đổi điểm",
  EXPIRE: "Hết hạn",
  ADJUST: "Điều chỉnh",
};

export default async function LoyaltyPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const account = await getLoyaltyAccountForUser(user.id);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Điểm thành viên</h1>

      <div className="mb-6 rounded-xl border border-zinc-200 p-6 text-center">
        <p className="text-sm text-zinc-500">Hạng thành viên</p>
        <p className="text-xl font-semibold">{TIER_LABELS[account.tier]}</p>
        <p className="mt-3 text-sm text-zinc-500">Điểm tích lũy</p>
        <p className="text-3xl font-bold text-accent">{account.points}</p>
        <p className="mt-3 text-xs text-zinc-400">
          Cứ mỗi {POINTS_PER_VND.toLocaleString("vi-VN")}đ giá trị đơn hàng giao thành công, bạn
          nhận được 1 điểm.
        </p>
      </div>

      <h2 className="mb-3 text-lg font-semibold">Lịch sử điểm</h2>
      {account.pointTransactions.length === 0 ? (
        <p className="text-zinc-500">Chưa có giao dịch điểm nào.</p>
      ) : (
        <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200">
          {account.pointTransactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <p>{TXN_TYPE_LABELS[t.type] ?? t.type}</p>
                <p className="text-xs text-zinc-400">
                  {new Date(t.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
              <span className={t.points >= 0 ? "text-green-600" : "text-red-600"}>
                {t.points >= 0 ? "+" : ""}
                {t.points}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
