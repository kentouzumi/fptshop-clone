import { getAllTradeInRequestsForAdmin } from "@/lib/tradeIn";
import TradeInAdminRow from "./TradeInAdminRow";

export default async function AdminTradeInPage() {
  const requests = await getAllTradeInRequestsForAdmin();

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Thu cũ đổi mới ({requests.length})</h1>

      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-2">Khách hàng</th>
              <th className="px-4 py-2">Thiết bị</th>
              <th className="px-4 py-2">Tình trạng</th>
              <th className="px-4 py-2">Ngày gửi</th>
              <th className="px-4 py-2">Giá báo / Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-t border-zinc-100 align-top">
                <td className="px-4 py-2">
                  {r.user.fullName}
                  <div className="text-xs text-zinc-400">{r.user.phone}</div>
                </td>
                <td className="px-4 py-2">{r.deviceInfo}</td>
                <td className="px-4 py-2 max-w-xs">{r.condition}</td>
                <td className="px-4 py-2">{new Date(r.createdAt).toLocaleDateString("vi-VN")}</td>
                <td className="px-4 py-2">
                  <TradeInAdminRow id={r.id} quotedPrice={Number(r.quotedPrice)} status={r.status} />
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  Chưa có yêu cầu nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
