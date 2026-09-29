import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { askQuestion } from "@/lib/productQa";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Vui lòng đăng nhập để đặt câu hỏi." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const productId = typeof body?.productId === "string" ? body.productId : "";
  const content = typeof body?.content === "string" ? body.content : "";

  if (!productId) {
    return NextResponse.json({ error: "Thiếu sản phẩm." }, { status: 400 });
  }

  try {
    const question = await askQuestion(productId, user.id, content);
    return NextResponse.json({ id: question.id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
