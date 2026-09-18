import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { removeFromWishlist } from "@/lib/wishlist";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  const { productId } = await params;
  await removeFromWishlist(user.id, productId);
  return NextResponse.json({ ok: true });
}
