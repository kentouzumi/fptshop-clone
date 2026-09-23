import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseVariantInput, createVariant, parseImages } from "@/lib/variants";

export async function POST(
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
      { error: "Vui lòng nhập giá (>= 0) hợp lệ." },
      { status: 400 }
    );
  }

  const images = parseImages((body as Record<string, unknown>)?.images);

  try {
    const variant = await createVariant(id, input, images);
    return NextResponse.json(variant, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}
