import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";

  if (fullName.length < 2) {
    return NextResponse.json({ error: "Vui lòng nhập họ tên hợp lệ." }, { status: 400 });
  }

  // Email là định danh đăng nhập (khớp với tài khoản Google) nên KHÔNG cho
  // sửa ở đây — khác trước đây khi email chỉ là thông tin liên hệ tùy chọn.
  const updated = await prisma.user.update({ where: { id: user.id }, data: { fullName } });

  return NextResponse.json({
    id: updated.id,
    fullName: updated.fullName,
    email: updated.email,
    phone: updated.phone,
  });
}
