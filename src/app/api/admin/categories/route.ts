import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseCategoryInput, createCategory } from "@/lib/categories";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const input = parseCategoryInput(body);
  if (!input) {
    return NextResponse.json(
      { error: "Vui lòng nhập tên (>= 2 ký tự) và slug chỉ gồm a-z 0-9 -." },
      { status: 400 }
    );
  }

  try {
    const category = await createCategory(input);
    return NextResponse.json(category, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}
