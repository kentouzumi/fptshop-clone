import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createPost, parsePostInput } from "@/lib/posts";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }

  const values = parsePostInput(await request.json().catch(() => null));
  if (!values) {
    return NextResponse.json(
      { error: "Vui lòng nhập tiêu đề (>= 3 ký tự), nội dung (>= 10 ký tự) và slug chỉ gồm a-z 0-9 -." },
      { status: 400 }
    );
  }

  try {
    const post = await createPost(values, admin.id);
    await logAudit({
      userId: admin.id,
      action: "CREATE_POST",
      entityType: "Post",
      entityId: post.id,
      metadata: { title: post.title, status: post.status },
    });
    return NextResponse.json(post, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}
