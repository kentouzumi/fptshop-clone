import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
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

  const store = await updateStore(id, input);
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
  try {
    await deleteStore(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}
