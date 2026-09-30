import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/siteUrl";
import { PRODUCTS_TAG } from "@/lib/products";
import { POSTS_TAG } from "@/lib/posts";
import { getBrandSlugsForSitemap } from "@/lib/brands";
import { ProductStatus, PostStatus } from "@prisma/client";

/**
 * sitemap.xml sinh động từ DB (Next.js tự phục vụ ở /sitemap.xml).
 *
 * `lastModified` lấy từ `updatedAt` thật của bản ghi, không phải `new Date()`
 * — bơm ngày hiện tại cho mọi URL mỗi lần bot ghé sẽ nói dối rằng cả site vừa
 * đổi, Google học được là trường này không đáng tin rồi bỏ qua luôn.
 *
 * KHÔNG liệt kê các URL có query lọc (`?brand=`, `?spec_*=`): cùng một tập sản
 * phẩm nhìn qua nhiều URL khác nhau là nội dung trùng lặp, và chính các URL đó
 * đã tự đặt noindex + canonical về danh mục gốc (xem products/page.tsx).
 *
 * LƯU Ý QUAN TRỌNG — `force-dynamic` là BẮT BUỘC, không phải tùy chọn: mặc
 * định Next.js coi sitemap là route TĨNH và prerender nó NGAY LÚC BUILD, tức
 * là lần đầu tiên trong dự án có query DB ở thời điểm build. Đã gặp thật:
 * `npm run build` chết hẳn ở bước "prerendering /sitemap.xml" với
 * `(EMAXCONNSESSION) max clients reached ... pool_size: 15`. Toàn bộ ~85 route
 * còn lại đều Dynamic nên build trước giờ KHÔNG cần kết nối DB (xem mục
 * "Chuẩn bị deploy lên Vercel" trong CLAUDE.md) — giữ đúng tính chất đó thay
 * vì để build phụ thuộc vào việc DB có rảnh connection hay không.
 *
 * Đổi lại, dữ liệu vẫn không bị query lại mỗi lần bot ghé: 3 query gói trong
 * `unstable_cache` với TTL 1 giờ, và dùng chung PRODUCTS_TAG nên admin thêm/
 * sửa/xóa sản phẩm là sitemap tự mới ngay (mọi mutation sản phẩm đã tự
 * revalidateTag(PRODUCTS_TAG) từ trước, không cần thêm code invalidate nào).
 */
export const dynamic = "force-dynamic";

const getSitemapData = unstable_cache(
  async () =>
    Promise.all([
      // Bỏ filter `parentId: null`: danh mục CON (iPhone 15 Series, Laptop
      // gaming...) cũng là trang có nội dung thật, tự đặt canonical về chính
      // nó và được index — không liệt kê thì Google chỉ tìm thấy chúng qua
      // link nội bộ.
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
        select: { slug: true, parentId: true },
      }),
      prisma.product.findMany({
        where: { status: ProductStatus.ACTIVE },
        orderBy: { updatedAt: "desc" },
        select: { slug: true, updatedAt: true },
      }),
      prisma.staticPage.findMany({ select: { slug: true, updatedAt: true } }),
      // Bài viết chỉ tính là đã đăng khi tới giờ đăng — cùng điều kiện
      // với publishedWhere() ở lib/posts.ts, không chỉ dựa vào status.
      prisma.post.findMany({
        where: { status: PostStatus.PUBLISHED, publishedAt: { lte: new Date() } },
        orderBy: { publishedAt: "desc" },
        select: { slug: true, updatedAt: true },
      }),
      getBrandSlugsForSitemap(),
    ]),
  ["sitemap-entries"],
  // Thêm POSTS_TAG: đăng/sửa/xóa bài viết cũng phải làm mới sitemap ngay,
  // các hàm trong lib/posts.ts đã tự revalidateTag(POSTS_TAG).
  { tags: [PRODUCTS_TAG, POSTS_TAG], revalidate: 3600 }
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products, staticPages, posts, brands] = await getSitemapData();

  // Sản phẩm mới nhất đại diện cho lần thay đổi gần nhất của cả catalog —
  // dùng cho trang chủ và các trang danh mục (Category không có updatedAt).
  const catalogUpdatedAt = products[0]?.updatedAt ?? new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified: catalogUpdatedAt,
      changeFrequency: "daily",
      priority: 1,
    },
    ...categories.map((c) => ({
      url: absoluteUrl(`/products?category=${c.slug}`),
      lastModified: catalogUpdatedAt,
      changeFrequency: "daily" as const,
      // Danh mục con hẹp hơn nên ưu tiên thấp hơn danh mục cấp cao một bậc.
      priority: c.parentId ? 0.8 : 0.9,
    })),
    {
      url: absoluteUrl("/thuong-hieu"),
      lastModified: catalogUpdatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    ...brands.map((b) => ({
      url: absoluteUrl(`/thuong-hieu/${b.slug}`),
      lastModified: catalogUpdatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: absoluteUrl(`/products/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    {
      url: absoluteUrl("/stores"),
      lastModified: catalogUpdatedAt,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/faq"),
      lastModified: catalogUpdatedAt,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      // Trang công khai, không cần đăng nhập -> nên để Google index.
      url: absoluteUrl("/tra-cuu-don-hang"),
      lastModified: catalogUpdatedAt,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...(posts.length > 0
      ? [
          {
            url: absoluteUrl("/tin-tuc"),
            lastModified: posts[0].updatedAt,
            changeFrequency: "daily" as const,
            priority: 0.7,
          },
        ]
      : []),
    ...posts.map((p) => ({
      url: absoluteUrl(`/tin-tuc/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...staticPages.map((p) => ({
      url: absoluteUrl(`/pages/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];
}
