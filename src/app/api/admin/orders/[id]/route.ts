import { NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { updateOrderStatus } from "@/lib/orders";

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
  const status = body?.status;
  const note = typeof body?.note === "string" ? body.note.trim() : undefined;

  if (!status || !Object.values(OrderStatus).includes(status)) {
    return NextResponse.json({ error: "Trạng thái không hợp lệ." }, { status: 400 });
  }

  try {
    const order = await updateOrderStatus(id, status, note);
    return NextResponse.json(order);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Có lỗi xảy ra.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
