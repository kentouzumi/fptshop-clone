import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DeleteProductButton from "./DeleteProductButton";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      images: { take: 1, orderBy: { sortOrder: "asc" } },
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Sản phẩm</h1>
        <Link href="/admin/products/new" className="btn-primary !px-4 !py-2 text-sm">
          + Thêm sản phẩm
        </Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Ảnh</th>
              <th className="px-4 py-3">Tên</th>
              <th className="px-4 py-3">Danh mục</th>
              <th className="px-4 py-3">Giá</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-zinc-100 transition hover:bg-zinc-100">
                <td className="px-4 py-2.5">
                  {p.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.images[0].url}
                      alt={p.name}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  )}
                </td>
                <td className="px-4 py-2.5 font-medium text-zinc-900">{p.name}</td>
                <td className="px-4 py-2.5 text-zinc-600">{p.category.name}</td>
                <td className="px-4 py-2.5 text-zinc-900">
                  {Number(p.basePrice).toLocaleString("vi-VN")}đ
                </td>
                <td className="px-4 py-2.5">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="mr-3 font-medium text-zinc-600 hover:text-zinc-900 hover:underline"
                  >
                    Sửa
                  </Link>
                  <DeleteProductButton productId={p.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
