import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseStaticPageInput, updateStaticPage, deleteStaticPage } from "@/lib/content";

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
  const input = parseStaticPageInput(body);
  if (!input) {
    return NextResponse.json(
      { error: "Vui lòng nhập slug (a-z 0-9 -), tiêu đề và nội dung hợp lệ." },
      { status: 400 }
    );
  }

  try {
    const page = await updateStaticPage(id, input);
    return NextResponse.json(page);
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
  await deleteStaticPage(id);
  return NextResponse.json({ ok: true });
}
