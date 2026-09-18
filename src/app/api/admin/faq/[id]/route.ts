import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseFaqInput, updateFaqItem, deleteFaqItem } from "@/lib/content";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const input = parseFaqInput(body);
  if (!input) {
    return NextResponse.json(
      { error: "Vui lòng nhập câu hỏi (>= 3 ký tự) và câu trả lời." },
      { status: 400 }
    );
  }

  const item = await updateFaqItem(id, input);
  return NextResponse.json(item);
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
  await deleteFaqItem(id);
  return NextResponse.json({ ok: true });
}
