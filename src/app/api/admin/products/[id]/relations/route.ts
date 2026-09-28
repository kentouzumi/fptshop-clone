import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { addProductRelation, parseRelationType } from "@/lib/productRelations";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  const relatedProductId =
    typeof body?.relatedProductId === "string" ? body.relatedProductId.trim() : "";
  const type = parseRelationType(body?.type);

  if (!relatedProductId || !type) {
    return NextResponse.json(
      { error: "Thiếu sản phẩm được liên kết hoặc loại liên kết không hợp lệ." },
      { status: 400 }
    );
  }

  try {
    return NextResponse.json(await addProductRelation(id, relatedProductId, type), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}
