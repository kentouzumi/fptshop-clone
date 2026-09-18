import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { normalizePhone, verifyOtp } from "@/lib/otp";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const phone = normalizePhone(typeof body?.phone === "string" ? body.phone : "");
  const code = typeof body?.code === "string" ? body.code.trim() : "";

  if (!phone || code.length !== 6) {
    return NextResponse.json(
      { error: "Thông tin không hợp lệ." },
      { status: 400 }
    );
  }

  const result = await verifyOtp(phone, code);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  let user = await prisma.user.findUnique({ where: { phone } });

  if (!user) {
    user = await prisma.user.create({
      data: { phone, fullName: phone, phoneVerified: new Date() },
    });
  } else if (!user.phoneVerified) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { phoneVerified: new Date() },
    });
  }

  if (!user.isActive) {
    return NextResponse.json(
      { error: "Tài khoản đã bị khóa." },
      { status: 403 }
    );
  }

  await createSession(user.id);

  return NextResponse.json({ id: user.id, phone: user.phone, fullName: user.fullName });
}
