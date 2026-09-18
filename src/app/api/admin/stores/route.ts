import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseStoreInput, createStore } from "@/lib/stores";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const input = parseStoreInput(body);
  if (!input) {
    return NextResponse.json(
      { error: "Vui lòng nhập đầy đủ tên, tỉnh/thành, quận/huyện, địa chỉ." },
      { status: 400 }
    );
  }

  const store = await createStore(input);
  return NextResponse.json(store, { status: 201 });
}
