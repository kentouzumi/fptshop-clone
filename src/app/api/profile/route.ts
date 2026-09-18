import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
  const emailInput =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (fullName.length < 2) {
    return NextResponse.json({ error: "Vui lòng nhập họ tên hợp lệ." }, { status: 400 });
  }

  const data: { fullName: string; email?: string } = { fullName };

  if (emailInput && emailInput !== user.email) {
    if (!EMAIL_REGEX.test(emailInput)) {
      return NextResponse.json({ error: "Email không hợp lệ." }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email: emailInput } });
    if (existing && existing.id !== user.id) {
      return NextResponse.json({ error: "Email này đã được sử dụng." }, { status: 409 });
    }
    data.email = emailInput;
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data });

  return NextResponse.json({
    id: updated.id,
    fullName: updated.fullName,
    email: updated.email,
    phone: updated.phone,
  });
}
