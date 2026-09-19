import { prisma } from "@/lib/prisma";
import CategoryForm from "../CategoryForm";

export default async function NewCategoryPage() {
  // Chỉ cho chọn danh mục CẤP CAO NHẤT làm cha — dự án chỉ hỗ trợ tối đa 2
  // cấp (cha/con, xem prisma/seed.ts + lib/products.ts), nếu cho chọn 1
  // category con làm cha sẽ tạo ra cấp thứ 3 mà mega menu/lọc theo danh mục
  // cha đều KHÔNG xử lý tới (chỉ tra 1 cấp children) — category đó coi như
  // biến mất khỏi menu dù vẫn có trong DB.
  const parentOptions = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Thêm danh mục mới</h1>
      <CategoryForm parentOptions={parentOptions} />
    </div>
  );
}
