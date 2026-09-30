import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
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

  const before = await prisma.promotion.findUnique({
    where: { id },
    select: { title: true, isActive: true },
  });
  const promotion = await updatePromotion(id, input);
  await logAudit({
    userId: admin.id,
    action: "UPDATE_PROMOTION",
    entityType: "Promotion",
    entityId: promotion.id,
    metadata: {
      titleFrom: before?.title ?? null,
      titleTo: promotion.title,
      isActiveFrom: before?.isActive ?? null,
      isActiveTo: promotion.isActive,
    },
  });
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
  const before = await prisma.promotion.findUnique({ where: { id }, select: { title: true } });
  await deletePromotion(id);
  await logAudit({
    userId: admin.id,
    action: "DELETE_PROMOTION",
    entityType: "Promotion",
    entityId: id,
    metadata: { title: before?.title ?? null },
  });
  return NextResponse.json({ ok: true });
}
