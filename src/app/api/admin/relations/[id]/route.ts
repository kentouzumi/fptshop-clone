import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { deleteProductRelation, moveProductRelation } from "@/lib/productRelations";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const direction = body?.direction;
  if (direction !== "up" && direction !== "down") {
    return NextResponse.json({ error: "Hướng di chuyển không hợp lệ." }, { status: 400 });
  }

  try {
    // `moved: false` = đã ở đầu/cuối nhóm, không phải lỗi.
    return NextResponse.json({ moved: await moveProductRelation(id, direction) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }

  const { id } = await params;
  try {
    await deleteProductRelation(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}
