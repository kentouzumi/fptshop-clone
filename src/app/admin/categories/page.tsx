import Link from "next/link";
import { getAllCategoriesForAdmin } from "@/lib/categories";
import DeleteCategoryButton from "./DeleteCategoryButton";

export default async function AdminCategoriesPage() {
  const categories = await getAllCategoriesForAdmin();

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Link
          href="/admin/categories/new"
          className="rounded-lg bg-black px-4 py-2 text-sm text-white"
        >
          + Thêm danh mục
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-2">Tên</th>
              <th className="px-4 py-2">Danh mục cha</th>
              <th className="px-4 py-2">Sản phẩm</th>
              <th className="px-4 py-2">Trạng thái</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-t border-zinc-100">
                <td className="px-4 py-2">
                  <span
                    className="inline-flex items-center gap-1.5"
                    style={c.depth > 0 ? { paddingLeft: 20 } : undefined}
                  >
                    {c.depth > 0 && <span className="text-zinc-400">↳</span>}
                    {c.name}
                  </span>
                </td>
                <td className="px-4 py-2">{c.parent?.name ?? "-"}</td>
                <td className="px-4 py-2">{c._count.products}</td>
                <td className="px-4 py-2">
                  {c.isActive ? (
                    <span className="text-green-600">Hoạt động</span>
                  ) : (
                    <span className="text-zinc-400">Ẩn</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <Link href={`/admin/categories/${c.id}/edit`} className="mr-3 text-blue-600 underline">
                    Sửa
                  </Link>
                  <DeleteCategoryButton categoryId={c.id} />
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  Chưa có danh mục nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
