import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import { getPublishedPostBySlug, getRelatedPosts, incrementPostView } from "@/lib/posts";
import { absoluteUrl } from "@/lib/siteUrl";
import JsonLd from "@/components/JsonLd";
import { formatVnDate, toIsoString } from "@/lib/dateValue";

// Dùng chung giữa generateMetadata và component — không bọc cache() thì mỗi
// lần render trang là 2 truy vấn y hệt nhau (cùng cách đã làm với
// getCurrentUser() ở lib/auth.ts và với sản phẩm ở /products/[slug]).
const loadPost = cache(async (slug: string) => getPublishedPostBySlug(slug));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) return { title: "Không tìm thấy bài viết" };

  const title = post.metaTitle ?? post.title;
  const description = post.metaDesc ?? post.excerpt ?? post.content.slice(0, 160);
  const url = absoluteUrl(`/tin-tuc/${post.slug}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      publishedTime: toIsoString(post.publishedAt),
      images: post.coverUrl ? [post.coverUrl] : undefined,
    },
    twitter: {
      card: post.coverUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: post.coverUrl ? [post.coverUrl] : undefined,
    },
  };
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) notFound();

  const related = await getRelatedPosts(post.id);

  // Không await: đếm lượt xem không được làm chậm việc hiển thị bài, và hàm
  // đã tự nuốt lỗi bên trong nên không có promise rejection nào lọt ra.
  void incrementPostView(post.id);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.metaDesc ?? post.excerpt ?? undefined,
          image: post.coverUrl ?? undefined,
          datePublished: toIsoString(post.publishedAt),
          dateModified: toIsoString(post.updatedAt),
          author: post.author?.fullName
            ? { "@type": "Person", name: post.author.fullName }
            : undefined,
          mainEntityOfPage: absoluteUrl(`/tin-tuc/${post.slug}`),
        }}
      />

      <nav className="mb-4 text-sm text-zinc-500">
        <Link href="/" className="hover:underline">
          Trang chủ
        </Link>
        {" / "}
        <Link href="/tin-tuc" className="hover:underline">
          Tin tức
        </Link>
      </nav>

      <h1 className="mb-2 text-3xl font-bold tracking-tight">{post.title}</h1>
      <p className="mb-6 text-sm text-zinc-500">
        {formatVnDate(post.publishedAt)}
        {post.author?.fullName && <> · {post.author.fullName}</>}
      </p>

      {post.coverUrl && (
        <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-2xl bg-zinc-100">
          <Image
            src={post.coverUrl}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </div>
      )}

      {post.excerpt && (
        <p className="mb-6 border-l-2 border-accent pl-4 text-lg text-zinc-600">{post.excerpt}</p>
      )}

      {/* Nội dung là VĂN BẢN THUẦN do admin nhập, KHÔNG phải HTML — tách đoạn
          theo dòng trống và render bằng <p> thay vì dangerouslySetInnerHTML.
          Đây là nội dung do người dùng (admin) nhập, để lọt HTML vào là mở
          thẳng đường XSS lưu trữ. */}
      <div className="space-y-4 text-[15px] leading-relaxed text-zinc-700">
        {post.content
          .split(/\n{2,}/)
          .map((para) => para.trim())
          .filter(Boolean)
          .map((para, i) => (
            <p key={i} className="whitespace-pre-line">
              {para}
            </p>
          ))}
      </div>

      {related.length > 0 && (
        <div className="mt-10 border-t border-zinc-200 pt-6">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Bài viết khác</h2>
          <ul className="space-y-3">
            {related.map((r) => (
              <li key={r.id}>
                <Link href={`/tin-tuc/${r.slug}`} className="text-sm hover:underline">
                  {r.title}
                </Link>
                <span className="ml-2 text-xs text-zinc-400">
                  {formatVnDate(r.publishedAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
