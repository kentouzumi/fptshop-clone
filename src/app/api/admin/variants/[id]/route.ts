import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseVariantInput, updateVariant, deleteVariant } from "@/lib/variants";

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
  const input = parseVariantInput(body);
  if (!input) {
    return NextResponse.json(
      { error: "Vui lòng nhập SKU và giá (>= 0) hợp lệ." },
      { status: 400 }
    );
  }

  try {
    const variant = await updateVariant(id, input);
    return NextResponse.json(variant);
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
  try {
    await deleteVariant(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}
