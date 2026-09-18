import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseFaqInput, createFaqItem } from "@/lib/content";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const input = parseFaqInput(body);
  if (!input) {
    return NextResponse.json(
      { error: "Vui lòng nhập câu hỏi (>= 3 ký tự) và câu trả lời." },
      { status: 400 }
    );
  }

  const item = await createFaqItem(input);
  return NextResponse.json(item, { status: 201 });
}
