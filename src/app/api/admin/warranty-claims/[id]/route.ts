import { NextResponse } from "next/server";
import { ClaimStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { updateClaimStatus } from "@/lib/warranty";

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
  const status = body?.status;
  if (!status || !Object.values(ClaimStatus).includes(status)) {
    return NextResponse.json({ error: "Trạng thái không hợp lệ." }, { status: 400 });
  }

  const claim = await updateClaimStatus(id, status);
  return NextResponse.json(claim);
}
