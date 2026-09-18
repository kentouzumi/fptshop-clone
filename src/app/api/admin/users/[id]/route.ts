import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth";
import { updateUserRole, setUserActive } from "@/lib/users";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (body && "role" in body) {
    const admin = await requireSuperAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Chỉ SUPER_ADMIN mới được đổi vai trò người dùng." },
        { status: 403 }
      );
    }
    if (!Object.values(UserRole).includes(body.role as UserRole)) {
      return NextResponse.json({ error: "Vai trò không hợp lệ." }, { status: 400 });
    }
    try {
      const user = await updateUserRole(admin.id, id, body.role as UserRole);
      return NextResponse.json(user);
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  if (body && "isActive" in body) {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
    }
    try {
      const user = await setUserActive(admin.id, id, Boolean(body.isActive));
      return NextResponse.json(user);
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "Không có thay đổi hợp lệ." }, { status: 400 });
}
