import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const quantity = Number(body?.quantity);

  if (!Number.isInteger(quantity) || quantity < 1) {
    return NextResponse.json({ error: "Số lượng không hợp lệ." }, { status: 400 });
  }

  const item = await prisma.cartItem.findUnique({ where: { id }, include: { cart: true } });
  if (!item || item.cart.userId !== user.id) {
    return NextResponse.json({ error: "Không tìm thấy sản phẩm trong giỏ." }, { status: 404 });
  }

  await prisma.cartItem.update({ where: { id }, data: { quantity } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const { id } = await params;
  const item = await prisma.cartItem.findUnique({ where: { id }, include: { cart: true } });
  if (!item || item.cart.userId !== user.id) {
    return NextResponse.json({ error: "Không tìm thấy sản phẩm trong giỏ." }, { status: 404 });
  }

  await prisma.cartItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
