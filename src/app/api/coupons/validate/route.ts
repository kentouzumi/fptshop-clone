import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateCoupon } from "@/lib/coupons";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const subtotal = Number(body?.subtotal);

  if (!code || !Number.isFinite(subtotal) || subtotal < 0) {
    return NextResponse.json({ error: "Thiếu mã giảm giá hoặc tổng tiền." }, { status: 400 });
  }

  try {
    const result = await validateCoupon(prisma, code, subtotal);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
