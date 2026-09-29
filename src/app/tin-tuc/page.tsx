import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getPublishedPosts } from "@/lib/posts";
import { absoluteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: "Tin tức công nghệ",
  description:
    "Tin tức, đánh giá và thủ thuật về điện thoại, laptop, tivi — cập nhật từ FPT Shop Clone.",
  alternates: { canonical: absoluteUrl("/tin-tuc") },
};

function formatDate(value: Date | null) {
  return value ? value.toLocaleDateString("vi-VN") : "";
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const { posts, totalPages } = await getPublishedPosts(page);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Tin tức công nghệ</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Đánh giá sản phẩm, thủ thuật sử dụng và tin mới về điện thoại, laptop, tivi.
      </p>

      {posts.length === 0 ? (
        <p className="card p-6 text-sm text-zinc-500">Chưa có bài viết nào được đăng.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/tin-tuc/${post.slug}`}
              className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="relative aspect-[16/9] bg-zinc-100">
                {post.coverUrl ? (
                  <Image
                    src={post.coverUrl}
                    alt={post.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                    Không có ảnh bìa
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="mb-1 text-xs text-zinc-400">{formatDate(post.publishedAt)}</p>
                <h2 className="line-clamp-2 font-semibold text-zinc-900 group-hover:underline">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="mt-1.5 line-clamp-3 text-sm text-zinc-500">{post.excerpt}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={n === 1 ? "/tin-tuc" : `/tin-tuc?page=${n}`}
              className={
                n === page
                  ? "rounded-full border border-accent bg-accent/10 px-4 py-2 text-sm font-medium"
                  : "rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:border-zinc-400"
              }
            >
              {n}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
