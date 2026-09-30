import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getBrandsWithProductCount } from "@/lib/brands";
import { absoluteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: "Thương hiệu",
  description:
    "Danh sách thương hiệu điện thoại, laptop và tivi chính hãng đang bán: Apple, Samsung, Xiaomi, OPPO, Dell, Asus, LG, TCL, Philips.",
  alternates: { canonical: absoluteUrl("/thuong-hieu") },
};

export default async function BrandsIndexPage() {
  const brands = await getBrandsWithProductCount();

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Thương hiệu</h1>
      <p className="mb-6 text-sm text-zinc-500">
        {brands.length} thương hiệu đang có hàng. Bấm vào một thương hiệu để xem toàn bộ sản phẩm
        của hãng đó.
      </p>

      {brands.length === 0 ? (
        <p className="card p-6 text-sm text-zinc-500">Chưa có thương hiệu nào đang bán hàng.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/thuong-hieu/${brand.slug}`}
              className="card flex flex-col items-center gap-3 p-5 text-center transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              {/* bg-zinc-950 = #fbf7ef, tức là bề mặt SÁNG NHẤT của theme, KHÔNG
                  phải "gần đen" như tên gọi gợi ý: globals.css đảo ngược thang
                  zinc cho theme tối "Đêm Hổ Phách" (bg-white ở đây là #241a33
                  tím than, dùng cho bề mặt card). Logo chính hãng phần lớn là
                  chữ đen (Apple, Asus, Samsung) nên bắt buộc phải nằm trên ô
                  sáng, đặt thẳng lên nền tối là lặn mất. Hãng chưa có logo thì
                  hiện chữ cái đầu, không để khoảng trống hay ảnh vỡ. */}
              {brand.logoUrl ? (
                <div className="relative h-12 w-full rounded-xl bg-zinc-950">
                  <Image
                    src={brand.logoUrl}
                    alt={brand.name}
                    fill
                    sizes="160px"
                    className="object-contain p-2"
                  />
                </div>
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-lg font-semibold text-accent">
                  {brand.name.charAt(0)}
                </span>
              )}
              <span className="font-semibold text-zinc-900">{brand.name}</span>
              <span className="text-xs text-zinc-500">{brand.productCount} sản phẩm</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
