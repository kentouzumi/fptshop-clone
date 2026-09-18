import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parsePromotionInput, updatePromotion, deletePromotion } from "@/lib/promotions";

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
  const input = parsePromotionInput(body);
  if (!input) {
    return NextResponse.json(
      { error: "Vui lòng nhập tiêu đề và khoảng thời gian hợp lệ (kết thúc phải sau bắt đầu)." },
      { status: 400 }
    );
  }

  const promotion = await updatePromotion(id, input);
  return NextResponse.json(promotion);
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
  await deletePromotion(id);
  return NextResponse.json({ ok: true });
}
