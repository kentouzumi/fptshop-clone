import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { addToCart } from "@/lib/cart";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Vui lòng đăng nhập để thêm vào giỏ hàng." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const variantId = typeof body?.variantId === "string" ? body.variantId : "";
  const quantity = Number(body?.quantity ?? 1);

  if (!variantId || !Number.isInteger(quantity) || quantity < 1) {
    return NextResponse.json({ error: "Thông tin không hợp lệ." }, { status: 400 });
  }

  try {
    await addToCart(user.id, variantId, quantity);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
