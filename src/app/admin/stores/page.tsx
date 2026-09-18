import Link from "next/link";
import { getAllStoresForAdmin } from "@/lib/stores";
import DeleteStoreButton from "./DeleteStoreButton";

export default async function AdminStoresPage() {
  const stores = await getAllStoresForAdmin();

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Link href="/admin/stores/new" className="rounded-lg bg-black px-4 py-2 text-sm text-white">
          + Thêm cửa hàng
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-2">Tên</th>
              <th className="px-4 py-2">Địa chỉ</th>
              <th className="px-4 py-2">Trạng thái</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {stores.map((s) => (
              <tr key={s.id} className="border-t border-zinc-100">
                <td className="px-4 py-2">{s.name}</td>
                <td className="px-4 py-2">
                  {s.address}, {s.district}, {s.province}
                </td>
                <td className="px-4 py-2">
                  {s.isActive ? <span className="text-green-600">Hoạt động</span> : <span className="text-zinc-400">Ẩn</span>}
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <Link href={`/admin/stores/${s.id}/edit`} className="mr-3 text-blue-600 underline">
                    Sửa
                  </Link>
                  <DeleteStoreButton storeId={s.id} />
                </td>
              </tr>
            ))}
            {stores.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                  Chưa có cửa hàng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
