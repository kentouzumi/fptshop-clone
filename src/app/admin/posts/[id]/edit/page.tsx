import { notFound } from "next/navigation";
import { getPostByIdForAdmin } from "@/lib/posts";
import PostForm from "../../PostForm";

export const metadata = { title: "Sửa bài viết" };

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPostByIdForAdmin(id);
  if (!post) notFound();

  return (
    <div>
      <h1 className="mb-5 text-xl font-semibold tracking-tight">Sửa bài viết</h1>
      <PostForm
        initial={{
          id: post.id,
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt ?? "",
          content: post.content,
          coverUrl: post.coverUrl ?? "",
          status: post.status,
          metaTitle: post.metaTitle ?? "",
          metaDesc: post.metaDesc ?? "",
        }}
      />
    </div>
  );
}
