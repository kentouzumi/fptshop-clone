import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getTicketDetail, addReply } from "@/lib/support";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  const { id } = await params;
  const ticket = await getTicketDetail(id, user.id);
  if (!ticket) {
    return NextResponse.json({ error: "Không tìm thấy yêu cầu hỗ trợ." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (content.length < 1) {
    return NextResponse.json({ error: "Vui lòng nhập nội dung." }, { status: 400 });
  }

  const reply = await addReply(id, false, content);
  return NextResponse.json(reply, { status: 201 });
}
