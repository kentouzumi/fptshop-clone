import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { parseTicketInput, createTicket } from "@/lib/support";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const input = parseTicketInput(body);
  if (!input) {
    return NextResponse.json(
      { error: "Vui lòng nhập đầy đủ họ tên, SĐT, danh mục, tiêu đề và nội dung (>= 10 ký tự)." },
      { status: 400 }
    );
  }

  const ticket = await createTicket(user.id, input);
  return NextResponse.json(ticket, { status: 201 });
}
