import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { deletePost, getPostByIdForAdmin, parsePostInput, updatePost } from "@/lib/posts";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }

  const { id } = await params;
  const values = parsePostInput(await request.json().catch(() => null));
  if (!values) {
    return NextResponse.json(
      { error: "Vui lòng nhập tiêu đề (>= 3 ký tự), nội dung (>= 10 ký tự) và slug chỉ gồm a-z 0-9 -." },
      { status: 400 }
    );
  }

  try {
    const before = await getPostByIdForAdmin(id);
    const post = await updatePost(id, values);
    await logAudit({
      userId: admin.id,
      action: "UPDATE_POST",
      entityType: "Post",
      entityId: id,
      metadata: { title: post.title, statusFrom: before?.status ?? null, statusTo: post.status },
    });
    return NextResponse.json(post);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }

  const { id } = await params;
  const before = await getPostByIdForAdmin(id);
  await deletePost(id);
  await logAudit({
    userId: admin.id,
    action: "DELETE_POST",
    entityType: "Post",
    entityId: id,
    metadata: { title: before?.title ?? null },
  });
  return NextResponse.json({ ok: true });
}
