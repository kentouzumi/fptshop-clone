import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
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

  try {
    const category = await updateCategory(id, input);
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
  try {
    await deleteCategory(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}
