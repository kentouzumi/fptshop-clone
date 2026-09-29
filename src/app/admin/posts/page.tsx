import Link from "next/link";
import { getAllPostsForAdmin } from "@/lib/posts";
import DeletePostButton from "./DeletePostButton";

export const metadata = { title: "Tin tức" };

export default async function AdminPostsPage() {
  const posts = await getAllPostsForAdmin();

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Tin tức</h1>
          <p className="text-sm text-zinc-500">{posts.length} bài viết</p>
        </div>
        <Link href="/admin/posts/new" className="btn-primary text-sm">
          + Viết bài mới
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="card p-6 text-sm text-zinc-500">
          Chưa có bài viết nào. Bấm &quot;Viết bài mới&quot; để bắt đầu.
        </p>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 text-left text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Tiêu đề</th>
                <th className="px-4 py-2.5 font-medium">Trạng thái</th>
                <th className="px-4 py-2.5 font-medium">Đăng lúc</th>
                <th className="px-4 py-2.5 font-medium">Lượt xem</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {posts.map((post) => (
                <tr key={post.id}>
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-zinc-900">{post.title}</span>
                    <span className="block font-mono text-xs text-zinc-400">/{post.slug}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={
                        post.status === "PUBLISHED"
                          ? "rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
                          : "rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-600"
                      }
                    >
                      {post.status === "PUBLISHED" ? "Đã xuất bản" : "Bản nháp"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-zinc-500">
                    {post.publishedAt ? post.publishedAt.toLocaleString("vi-VN") : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-600">{post.viewCount}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right">
                    {post.status === "PUBLISHED" && (
                      <Link
                        href={`/tin-tuc/${post.slug}`}
                        className="mr-3 text-xs text-zinc-500 hover:underline"
                      >
                        Xem
                      </Link>
                    )}
                    <Link
                      href={`/admin/posts/${post.id}/edit`}
                      className="mr-3 text-xs text-accent hover:underline"
                    >
                      Sửa
                    </Link>
                    <DeletePostButton postId={post.id} title={post.title} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
