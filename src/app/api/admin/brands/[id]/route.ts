import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
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

  try {
    const brand = await updateBrand(id, input);
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
  try {
    await deleteBrand(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}
