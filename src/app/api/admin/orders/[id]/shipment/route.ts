import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseShipmentInput, upsertShipmentForOrder } from "@/lib/shipments";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }

  const { id } = await params;
  const input = parseShipmentInput(await request.json().catch(() => null));
  if (!input) {
    return NextResponse.json(
      { error: "Trạng thái vận đơn không hợp lệ hoặc ngày dự kiến sai định dạng." },
      { status: 400 }
    );
  }

  try {
    return NextResponse.json(await upsertShipmentForOrder(id, input));
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 409 });
  }
}
