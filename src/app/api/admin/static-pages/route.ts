import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseStaticPageInput, createStaticPage } from "@/lib/content";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const input = parseStaticPageInput(body);
  if (!input) {
    return NextResponse.json(
      { error: "Vui lòng nhập slug (a-z 0-9 -), tiêu đề và nội dung hợp lệ." },
      { status: 400 }
    );
  }

  try {
    const page = await createStaticPage(input);
    return NextResponse.json(page, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}
