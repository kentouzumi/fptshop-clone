import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { setInventoryQuantity } from "@/lib/inventory";

// Inventory dùng khóa CHÍNH tổ hợp (storeId, variantId) chứ không có id đơn
// giản như các resource khác trong /admin — dùng 1 route PATCH duy nhất
// nhận cả storeId/variantId/quantity trong body thay vì route động
// /api/admin/inventory/[id] (không có 1 "id" tự nhiên nào để đặt vào URL).
export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const storeId = typeof body?.storeId === "string" ? body.storeId : "";
  const variantId = typeof body?.variantId === "string" ? body.variantId : "";
  const quantity = Number(body?.quantity);

  if (!storeId || !variantId || !Number.isInteger(quantity) || quantity < 0) {
    return NextResponse.json({ error: "Thông tin không hợp lệ." }, { status: 400 });
  }

  try {
    await setInventoryQuantity(storeId, variantId, quantity);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
