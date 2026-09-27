import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStaticPage } from "@/lib/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // getStaticPage đã được cache theo slug (unstable_cache, tag STATIC_PAGES_TAG)
  // nên gọi lại ở đây không phát sinh thêm query.
  const page = await getStaticPage(slug);
  if (!page) {
    return { title: "Không tìm thấy trang", robots: { index: false, follow: false } };
  }

  const description = page.content.replace(/\s+/g, " ").trim().slice(0, 200);
  return {
    title: page.title,
    description,
    alternates: { canonical: `/pages/${slug}` },
    openGraph: { type: "article", title: page.title, description, url: `/pages/${slug}` },
  };
}

export default async function StaticContentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getStaticPage(slug);
  if (!page) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">{page.title}</h1>
      <div className="whitespace-pre-line text-zinc-700">{page.content}</div>
    </div>
  );
}
