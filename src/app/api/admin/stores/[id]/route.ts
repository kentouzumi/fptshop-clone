import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { parseStoreInput, updateStore, deleteStore } from "@/lib/stores";

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
  const input = parseStoreInput(body);
  if (!input) {
    return NextResponse.json(
      { error: "Vui lòng nhập đầy đủ tên, tỉnh/thành, quận/huyện, địa chỉ." },
      { status: 400 }
    );
  }

  const before = await prisma.store.findUnique({
    where: { id },
    select: { name: true, isActive: true },
  });
  const store = await updateStore(id, input);
  await logAudit({
    userId: admin.id,
    action: "UPDATE_STORE",
    entityType: "Store",
    entityId: store.id,
    metadata: {
      nameFrom: before?.name ?? null,
      nameTo: store.name,
      // Tắt cửa hàng ảnh hưởng thẳng tới tồn kho và lựa chọn nhận hàng ở
      // /checkout, nên đây là thứ đáng truy nhất trong nhật ký cửa hàng.
      isActiveFrom: before?.isActive ?? null,
      isActiveTo: store.isActive,
    },
  });
  return NextResponse.json(store);
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
  const before = await prisma.store.findUnique({ where: { id }, select: { name: true } });
  try {
    await deleteStore(id);
    await logAudit({
      userId: admin.id,
      action: "DELETE_STORE",
      entityType: "Store",
      entityId: id,
      metadata: { name: before?.name ?? null },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}
