import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parsePromotionInput, createPromotion } from "@/lib/promotions";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const input = parsePromotionInput(body);
  if (!input) {
    return NextResponse.json(
      { error: "Vui lòng nhập tiêu đề và khoảng thời gian hợp lệ (kết thúc phải sau bắt đầu)." },
      { status: 400 }
    );
  }

  const promotion = await createPromotion(input);
  return NextResponse.json(promotion, { status: 201 });
}
