import { getAllClaimsForAdmin } from "@/lib/warranty";
import ClaimStatusSelect from "./ClaimStatusSelect";

export default async function AdminWarrantyClaimsPage() {
  const claims = await getAllClaimsForAdmin();

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Yêu cầu bảo hành ({claims.length})</h1>

      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-2">Sản phẩm</th>
              <th className="px-4 py-2">Đơn hàng</th>
              <th className="px-4 py-2">Khách hàng</th>
              <th className="px-4 py-2">Sự cố</th>
              <th className="px-4 py-2">Ngày gửi</th>
              <th className="px-4 py-2">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.id} className="border-t border-zinc-100 align-top">
                <td className="px-4 py-2">{c.productName}</td>
                <td className="px-4 py-2">{c.orderCode}</td>
                <td className="px-4 py-2">
                  {c.customerName}
                  <div className="text-xs text-zinc-400">{c.customerPhone}</div>
                </td>
                <td className="px-4 py-2 max-w-xs">{c.issue}</td>
                <td className="px-4 py-2">{new Date(c.createdAt).toLocaleDateString("vi-VN")}</td>
                <td className="px-4 py-2">
                  <ClaimStatusSelect claimId={c.id} status={c.status} />
                </td>
              </tr>
            ))}
            {claims.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  Chưa có yêu cầu bảo hành nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
