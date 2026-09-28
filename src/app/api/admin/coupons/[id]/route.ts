import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseCouponInput, updateCoupon, deleteCoupon } from "@/lib/coupons";

const INVALID_MESSAGE =
  "Dữ liệu không hợp lệ. Mã chỉ gồm chữ HOA/số/gạch (3-32 ký tự), phần trăm từ 1-100, số tiền và giá trị đơn tối thiểu phải là số nguyên không âm, ngày kết thúc phải sau ngày bắt đầu.";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }

  const { id } = await params;
  const input = parseCouponInput(await request.json().catch(() => null));
  if (!input) {
    return NextResponse.json({ error: INVALID_MESSAGE }, { status: 400 });
  }

  try {
    return NextResponse.json(await updateCoupon(id, input));
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 409 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }

  const { id } = await params;
  try {
    await deleteCoupon(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 409 });
  }
}
