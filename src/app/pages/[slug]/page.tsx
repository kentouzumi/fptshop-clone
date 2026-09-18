import { notFound } from "next/navigation";
import { getStaticPage } from "@/lib/content";

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
