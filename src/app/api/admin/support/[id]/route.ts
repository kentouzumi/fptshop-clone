import { NextResponse } from "next/server";
import { TicketStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { addReply, updateTicketStatus } from "@/lib/support";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (typeof body?.content === "string" && body.content.trim()) {
    const reply = await addReply(id, true, body.content.trim());
    return NextResponse.json(reply, { status: 201 });
  }

  if (body?.status && Object.values(TicketStatus).includes(body.status)) {
    const ticket = await updateTicketStatus(id, body.status);
    return NextResponse.json(ticket);
  }

  return NextResponse.json({ error: "Không có thay đổi hợp lệ." }, { status: 400 });
}
