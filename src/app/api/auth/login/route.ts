import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Vui lòng nhập email và mật khẩu." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const passwordOk =
    user?.passwordHash && (await verifyPassword(password, user.passwordHash));

  if (!user || !passwordOk) {
    return NextResponse.json(
      { error: "Email hoặc mật khẩu không đúng." },
      { status: 401 }
    );
  }

  if (!user.isActive) {
    return NextResponse.json(
      { error: "Tài khoản đã bị khóa." },
      { status: 403 }
    );
  }

  await createSession(user.id);

  return NextResponse.json({ id: user.id, email: user.email, fullName: user.fullName });
}
