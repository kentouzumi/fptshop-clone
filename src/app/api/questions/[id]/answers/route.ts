import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { answerQuestion } from "@/lib/productQa";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Vui lòng đăng nhập để trả lời." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content : "";

  try {
    // Nhãn "Nhân viên tư vấn" suy từ vai trò của user đang đăng nhập ở tầng
    // service, KHÔNG nhận từ body — nếu không thì khách nào cũng tự gắn được.
    const answer = await answerQuestion(id, user.id, user.role, content);
    return NextResponse.json({ id: answer.id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
