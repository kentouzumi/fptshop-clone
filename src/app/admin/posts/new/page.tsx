import PostForm from "../PostForm";

export const metadata = { title: "Viết bài mới" };

export default function NewPostPage() {
  return (
    <div>
      <h1 className="mb-5 text-xl font-semibold tracking-tight">Viết bài mới</h1>
      <PostForm />
    </div>
  );
}
