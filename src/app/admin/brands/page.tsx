import Link from "next/link";
import { getAllBrandsForAdmin } from "@/lib/brands";
import DeleteBrandButton from "./DeleteBrandButton";

export default async function AdminBrandsPage() {
  const brands = await getAllBrandsForAdmin();

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Link href="/admin/brands/new" className="rounded-lg bg-black px-4 py-2 text-sm text-white">
          + Thêm thương hiệu
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-2">Tên</th>
              <th className="px-4 py-2">Sản phẩm</th>
              <th className="px-4 py-2">Trạng thái</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {brands.map((b) => (
              <tr key={b.id} className="border-t border-zinc-100">
                <td className="px-4 py-2">{b.name}</td>
                <td className="px-4 py-2">{b._count.products}</td>
                <td className="px-4 py-2">
                  {b.isActive ? (
                    <span className="text-green-600">Hoạt động</span>
                  ) : (
                    <span className="text-zinc-400">Ẩn</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <Link href={`/admin/brands/${b.id}/edit`} className="mr-3 text-blue-600 underline">
                    Sửa
                  </Link>
                  <DeleteBrandButton brandId={b.id} />
                </td>
              </tr>
            ))}
            {brands.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                  Chưa có thương hiệu nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
