import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { setQuestionVisible } from "@/lib/productQa";

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
  if (typeof body?.isVisible !== "boolean") {
    return NextResponse.json({ error: "Thiếu trạng thái hiển thị." }, { status: 400 });
  }

  try {
    await setQuestionVisible(id, body.isVisible);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
