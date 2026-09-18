import { NextResponse } from "next/server";
import { TradeInStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { updateTradeInRequest } from "@/lib/tradeIn";

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

  const changes: { quotedPrice?: number; status?: TradeInStatus } = {};
  if (body?.quotedPrice !== undefined) {
    const price = Number(body.quotedPrice);
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Giá báo không hợp lệ." }, { status: 400 });
    }
    changes.quotedPrice = price;
  }
  if (body?.status !== undefined) {
    if (!Object.values(TradeInStatus).includes(body.status)) {
      return NextResponse.json({ error: "Trạng thái không hợp lệ." }, { status: 400 });
    }
    changes.status = body.status;
  }

  try {
    const tradeIn = await updateTradeInRequest(id, changes);
    return NextResponse.json(tradeIn);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
