import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getProducts } from "@/lib/products";

function formatPrice(value: number) {
  return value.toLocaleString("vi-VN") + "₫";
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");

  const [categories, { products, totalPages }] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    getProducts({ categorySlug: params.category, search: params.search, page }),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Sản phẩm</h1>

      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          href="/products"
          className={`rounded-full border px-4 py-1.5 text-sm ${
            !params.category
              ? "border-black bg-black text-white"
              : "border-zinc-300 text-zinc-700"
          }`}
        >
          Tất cả
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/products?category=${c.slug}`}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              params.category === c.slug
                ? "border-black bg-black text-white"
                : "border-zinc-300 text-zinc-700"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="text-zinc-500">Không tìm thấy sản phẩm nào.</p>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-zinc-200 p-4 transition hover:shadow-md"
            >
              <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-zinc-100">
                {p.imageUrl && (
                  <Image
                    src={p.imageUrl}
                    alt={p.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover"
                  />
                )}
              </div>
              <p className="text-xs text-zinc-500">{p.brand ?? p.category}</p>
              <h2 className="line-clamp-2 text-sm font-medium">{p.name}</h2>
              <p className="mt-1 font-semibold text-red-600">
                {p.minPrice === p.maxPrice
                  ? formatPrice(p.minPrice)
                  : `${formatPrice(p.minPrice)} - ${formatPrice(p.maxPrice)}`}
              </p>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => {
            const qs = new URLSearchParams({
              ...(params.category ? { category: params.category } : {}),
              page: String(n),
            });
            return (
              <Link
                key={n}
                href={`/products?${qs.toString()}`}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                  n === page ? "bg-black text-white" : "border border-zinc-300"
                }`}
              >
                {n}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
