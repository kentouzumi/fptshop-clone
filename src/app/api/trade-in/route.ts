import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { parseTradeInInput, createTradeInRequest } from "@/lib/tradeIn";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const input = parseTradeInInput(body);
  if (!input) {
    return NextResponse.json(
      { error: "Vui lòng mô tả máy cũ và tình trạng máy (ít nhất 3 ký tự)." },
      { status: 400 }
    );
  }

  const tradeIn = await createTradeInRequest(user.id, input);
  return NextResponse.json(tradeIn, { status: 201 });
}
