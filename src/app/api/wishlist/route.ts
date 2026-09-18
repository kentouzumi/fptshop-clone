import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { addToWishlist } from "@/lib/wishlist";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const productId = typeof body?.productId === "string" ? body.productId : "";

  if (!productId) {
    return NextResponse.json({ error: "Thiếu productId." }, { status: 400 });
  }

  await addToWishlist(user.id, productId);
  return NextResponse.json({ ok: true }, { status: 201 });
}
