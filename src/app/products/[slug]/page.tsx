import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SITE_NAME, absoluteUrl } from "@/lib/siteUrl";
import JsonLd from "@/components/JsonLd";
import { getProducts } from "@/lib/products";
import { getProductReviews, getUserReviewForProduct } from "@/lib/reviews";
import { isInWishlist, getWishlistedProductIds } from "@/lib/wishlist";
import { getCurrentUser } from "@/lib/auth";
import ProductGalleryAndBuy from "./ProductGalleryAndBuy";
import ReviewForm from "./ReviewForm";
import WishlistButton from "./WishlistButton";
import ReviewVoteButtons from "./ReviewVoteButtons";
import ProductCard from "@/components/ProductCard";
import StarRating from "@/components/StarRating";
import CompareToggle from "@/components/CompareToggle";

// Bọc `cache()` của React: generateMetadata và chính component cùng cần đủ dữ
// liệu sản phẩm, gọi riêng lẻ sẽ thành 2 lượt query y hệt nhau cho MỖI lần
// render. cache() dedupe trong cùng 1 lượt render server (cùng cách đã làm với
// getCurrentUser() ở lib/auth.ts), nên chỉ còn đúng 1 query.
const getProductBySlug = cache(async (slug: string) =>
  prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      brand: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { where: { isActive: true }, orderBy: { price: "asc" } },
      attributes: { orderBy: { sortOrder: "asc" } },
    },
  })
);

function plainDescription(text: string, max = 300) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product || product.status === "DISCONTINUED") {
    // Trang sẽ notFound() ngay sau đó — không để Google index tiêu đề rỗng.
    return { title: "Không tìm thấy sản phẩm", robots: { index: false, follow: false } };
  }

  // metaTitle/metaDesc có trong schema Product từ đầu dự án nhưng CHƯA TỪNG
  // được dùng ở đâu — giờ là nguồn ưu tiên, còn tên/mô tả sản phẩm là phương
  // án dự phòng để mọi sản phẩm đều có metadata tử tế dù admin không nhập gì.
  const title = product.metaTitle?.trim() || `${product.name} chính hãng`;
  const description = product.metaDesc?.trim() || plainDescription(product.description);
  const image = product.images[0]?.url;

  return {
    title,
    description,
    // Canonical tuyệt đối: cùng 1 sản phẩm có thể tới từ nhiều đường (link
    // trong danh mục, trang so sánh, chia sẻ kèm tham số tracking) — chỉ 1 URL
    // được tính là chính thức.
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `/products/${product.slug}`,
      siteName: SITE_NAME,
      locale: "vi_VN",
      ...(image ? { images: [{ url: image, alt: product.name }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await getProductBySlug(slug);

  if (!product || product.status === "DISCONTINUED") {
    notFound();
  }

  // Một thông số có thể có NHIỀU dòng cùng attrName (vd máy bán cả bản 256GB
  // lẫn 512GB, hoặc nhiều nhãn "Hiệu năng và Pin") — gộp lại thành 1 dòng,
  // các giá trị nối bằng dấu phẩy. Nếu render mỗi dòng riêng thì bảng thông
  // số lặp lại y hệt tên thông số vài lần, và React cũng báo trùng key.
  const attributeGroups = new Map<string, { name: string; value: string }[]>();
  for (const attr of product.attributes) {
    const list = attributeGroups.get(attr.groupName) ?? [];
    const existing = list.find((a) => a.name === attr.attrName);
    if (existing) {
      existing.value += `, ${attr.attrValue}`;
    } else {
      list.push({ name: attr.attrName, value: attr.attrValue });
    }
    attributeGroups.set(attr.groupName, list);
  }

  // Loạt query dưới đây trước kia chạy TUẦN TỰ (7 lượt await liên tiếp) dù phần
  // lớn độc lập với nhau — chỉ cần đúng thứ tự phụ thuộc dữ liệu (product ->
  // (related sản phẩm + user hiện tại) -> phần còn lại cần cả 2 cái đó), nên
  // gom thành 2 đợt Promise.all thay vì 7 round-trip DB nối đuôi nhau.
  const [{ products: relatedProducts }, currentUser] = await Promise.all([
    getProducts({ categorySlug: product.category.slug, limit: 4 }),
    getCurrentUser(),
  ]);
  const related = relatedProducts.filter((p) => p.id !== product.id).slice(0, 4);

  const [
    { reviews, count: reviewCount, average: averageRating },
    userReview,
    inWishlist,
    relatedWishlistedIds,
    stockSum,
  ] = await Promise.all([
    getProductReviews(product.id, currentUser?.id),
    currentUser ? getUserReviewForProduct(currentUser.id, product.id) : Promise.resolve(null),
    currentUser ? isInWishlist(currentUser.id, product.id) : Promise.resolve(false),
    currentUser
      ? getWishlistedProductIds(currentUser.id, related.map((p) => p.id))
      : Promise.resolve(new Set<string>()),
    // Chỉ dùng cho `availability` của JSON-LD. Khai "còn hàng" cho máy đã hết
    // kho là khai sai với Google (và đúng ra là với khách), mà tồn kho thì đã
    // có sẵn trong DB nên không có lý do gì đoán.
    prisma.inventory.aggregate({
      _sum: { quantity: true },
      where: { variant: { productId: product.id } },
    }),
  ]);

  const prices = product.variants.map((v) => Number(v.price));
  const minPrice = prices.length ? Math.min(...prices) : Number(product.basePrice);
  const maxPrice = prices.length ? Math.max(...prices) : Number(product.basePrice);
  // `_sum` trả null khi KHÔNG có dòng Inventory nào cho sản phẩm (vd biến thể
  // vừa tạo, chưa seed kho) — coi là còn hàng, khớp với cách
  // reserveStockOrThrow() ở lib/inventory.ts cố ý fail-open trong trường hợp
  // này thay vì chặn bán.
  const totalStock = stockSum._sum.quantity;
  const inStock = totalStock === null || totalStock > 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: plainDescription(product.description),
          image: product.images.map((img) => img.url),
          sku: product.variants[0]?.sku,
          ...(product.brand ? { brand: { "@type": "Brand", name: product.brand.name } } : {}),
          category: product.category.name,
          // AggregateOffer (không phải Offer) vì 1 sản phẩm có nhiều biến thể
          // với giá khác nhau — khai 1 giá duy nhất sẽ lệch với giá hiện trên
          // trang khi khách chọn biến thể khác.
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "VND",
            lowPrice: minPrice,
            highPrice: maxPrice,
            offerCount: Math.max(1, product.variants.length),
            availability: inStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            url: absoluteUrl(`/products/${product.slug}`),
          },
          // Google từ chối toàn bộ khối AggregateRating nếu reviewCount = 0,
          // nên chỉ khai khi thực sự có đánh giá.
          ...(reviewCount > 0
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: Number(averageRating.toFixed(1)),
                  reviewCount,
                  bestRating: 5,
                  worstRating: 1,
                },
              }
            : {}),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Trang chủ", item: absoluteUrl("/") },
            {
              "@type": "ListItem",
              position: 2,
              name: product.category.name,
              item: absoluteUrl(`/products?category=${product.category.slug}`),
            },
            { "@type": "ListItem", position: 3, name: product.name },
          ],
        }}
      />
      <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-zinc-500">
        <Link href="/" className="hover:underline">
          Trang chủ
        </Link>
        <span>/</span>
        <Link href={`/products?category=${product.category.slug}`} className="hover:underline">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-zinc-800">{product.name}</span>
      </nav>

      <h1 className="mb-1 text-2xl font-semibold tracking-tight">{product.name}</h1>
      {product.brand && <p className="mb-6 text-sm text-zinc-500">Thương hiệu: {product.brand.name}</p>}

      <ProductGalleryAndBuy
        productName={product.name}
        images={product.images.map((img) => ({
          url: img.url,
          altText: img.altText,
          variantId: img.variantId,
        }))}
        variants={product.variants.map((v) => ({
          id: v.id,
          color: v.color,
          storage: v.storage,
          price: Number(v.price),
          compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
        }))}
        basePrice={Number(product.basePrice)}
        wishlistButton={
          <WishlistButton productId={product.id} initialInWishlist={inWishlist} />
        }
        compareButton={
          <CompareToggle
            variant="button"
            item={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              imageUrl: product.images[0]?.url ?? null,
              price: Number(product.basePrice),
              categorySlug: product.category.slug,
              categoryName: product.category.name,
            }}
          />
        }
      />

      <section className="mt-12">
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Mô tả sản phẩm</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-700">{product.description}</p>
      </section>

      {attributeGroups.size > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold tracking-tight">Thông số kỹ thuật</h2>
          <div className="card overflow-hidden">
            {[...attributeGroups.entries()].map(([groupName, attrs]) => (
              <div key={groupName}>
                <div className="bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700">
                  {groupName}
                </div>
                {attrs.map((attr) => (
                  <div
                    key={attr.name}
                    className="flex border-t border-zinc-100 px-4 py-2.5 text-sm"
                  >
                    <span className="w-1/3 text-zinc-500">{attr.name}</span>
                    <span className="w-2/3 text-zinc-800">{attr.value}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Đánh giá sản phẩm</h2>
        <div className="mb-4 flex items-center gap-3">
          <StarRating rating={averageRating} size="text-xl" />
          <span className="text-sm text-zinc-600">
            {averageRating.toFixed(1)}/5 ({reviewCount} đánh giá)
          </span>
        </div>

        {currentUser ? (
          userReview ? (
            <p className="mb-6 text-sm text-zinc-500">Bạn đã đánh giá sản phẩm này.</p>
          ) : (
            <ReviewForm productId={product.id} />
          )
        ) : (
          <p className="mb-6 text-sm text-zinc-500">
            <Link href="/login" className="underline">
              Đăng nhập
            </Link>{" "}
            để đánh giá sản phẩm.
          </p>
        )}

        {reviews.length === 0 ? (
          <p className="text-zinc-500">Chưa có đánh giá nào cho sản phẩm này.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="mb-1 flex items-center gap-2">
                  <StarRating rating={r.rating} />
                  <span className="text-sm font-medium">{r.user.fullName}</span>
                  {r.isVerified && (
                    <span className="rounded bg-green-50 px-1.5 py-0.5 text-xs text-green-700">
                      Đã mua hàng
                    </span>
                  )}
                </div>
                {r.title && <p className="font-medium">{r.title}</p>}
                <p className="text-sm text-zinc-700">{r.content}</p>
                {r.images.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {r.images.map((img) => (
                      <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt="Ảnh đánh giá"
                          className="h-20 w-20 rounded object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-xs text-zinc-400">
                  {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                </p>
                <ReviewVoteButtons
                  reviewId={r.id}
                  helpfulCount={r.helpfulCount}
                  notHelpfulCount={r.notHelpfulCount}
                  myVote={r.myVote}
                  loggedIn={Boolean(currentUser)}
                  isOwnReview={currentUser?.id === r.userId}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Sản phẩm cùng danh mục</h2>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} initialInWishlist={relatedWishlistedIds.has(p.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
