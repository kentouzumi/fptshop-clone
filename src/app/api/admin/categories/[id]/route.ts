import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { parseCategoryInput, updateCategory, deleteCategory } from "@/lib/categories";

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
  const input = parseCategoryInput(body);
  if (!input) {
    return NextResponse.json(
      { error: "Vui lòng nhập tên (>= 2 ký tự) và slug chỉ gồm a-z 0-9 -." },
      { status: 400 }
    );
  }

  const before = await prisma.category.findUnique({
    where: { id },
    select: { name: true, parentId: true, isActive: true, imageUrl: true },
  });

  try {
    const category = await updateCategory(id, input);
    await logAudit({
      userId: admin.id,
      action: "UPDATE_CATEGORY",
      entityType: "Category",
      entityId: category.id,
      metadata: {
        nameFrom: before?.name ?? null,
        nameTo: category.name,
        // Chuyển danh mục sang cha khác là thay đổi LỚN (đổi luôn cả đường
        // duyệt lẫn bộ lọc thông số kế thừa) nhưng nhìn trên UI thì rất kín —
        // ghi lại để còn truy được.
        parentIdFrom: before?.parentId ?? null,
        parentIdTo: category.parentId,
        isActiveFrom: before?.isActive ?? null,
        isActiveTo: category.isActive,
        imageChanged: (before?.imageUrl ?? null) !== (category.imageUrl ?? null),
      },
    });
    return NextResponse.json(category);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }

  const { id } = await params;
  const before = await prisma.category.findUnique({ where: { id }, select: { name: true } });
  try {
    await deleteCategory(id);
    await logAudit({
      userId: admin.id,
      action: "DELETE_CATEGORY",
      entityType: "Category",
      entityId: id,
      metadata: { name: before?.name ?? null },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}
