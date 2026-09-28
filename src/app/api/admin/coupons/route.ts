import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseCouponInput, createCoupon } from "@/lib/coupons";

const INVALID_MESSAGE =
  "Dữ liệu không hợp lệ. Mã chỉ gồm chữ HOA/số/gạch (3-32 ký tự), phần trăm từ 1-100, số tiền và giá trị đơn tối thiểu phải là số nguyên không âm, ngày kết thúc phải sau ngày bắt đầu.";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }

  const input = parseCouponInput(await request.json().catch(() => null));
  if (!input) {
    return NextResponse.json({ error: INVALID_MESSAGE }, { status: 400 });
  }

  try {
    return NextResponse.json(await createCoupon(input), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 409 });
  }
}
