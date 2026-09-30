import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { parseBrandInput, updateBrand, deleteBrand } from "@/lib/brands";

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
  const input = parseBrandInput(body);
  if (!input) {
    return NextResponse.json(
      { error: "Vui lòng nhập tên (>= 2 ký tự) và slug chỉ gồm a-z 0-9 -." },
      { status: 400 }
    );
  }

  // Đọc bản ghi cũ TRƯỚC khi ghi đè để nhật ký nói được "đổi từ gì sang
  // gì", không chỉ "có ai đó đã sửa" — đúng cách các route sản phẩm đang làm.
  const before = await prisma.brand.findUnique({
    where: { id },
    select: { name: true, isActive: true, logoUrl: true },
  });

  try {
    const brand = await updateBrand(id, input);
    await logAudit({
      userId: admin.id,
      action: "UPDATE_BRAND",
      entityType: "Brand",
      entityId: brand.id,
      metadata: {
        nameFrom: before?.name ?? null,
        nameTo: brand.name,
        isActiveFrom: before?.isActive ?? null,
        isActiveTo: brand.isActive,
        // Ghi cờ thay vì cả URL: URL Supabase rất dài mà điều admin cần biết
        // chỉ là "lần sửa đó có đổi logo hay không".
        logoChanged: (before?.logoUrl ?? null) !== (brand.logoUrl ?? null),
      },
    });
    return NextResponse.json(brand);
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
  const before = await prisma.brand.findUnique({ where: { id }, select: { name: true } });
  try {
    await deleteBrand(id);
    await logAudit({
      userId: admin.id,
      action: "DELETE_BRAND",
      entityType: "Brand",
      entityId: id,
      metadata: { name: before?.name ?? null },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}
