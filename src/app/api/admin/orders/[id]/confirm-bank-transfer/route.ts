import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { confirmBankTransferPayment } from "@/lib/orders";
import { logAudit } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }

  const { id } = await params;
  try {
    const order = await confirmBankTransferPayment(id);
    await logAudit({
      userId: admin.id,
      action: "CONFIRM_BANK_TRANSFER",
      entityType: "Order",
      entityId: id,
      metadata: { code: order?.code ?? null },
    });
    return NextResponse.json({ ok: true, order });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
