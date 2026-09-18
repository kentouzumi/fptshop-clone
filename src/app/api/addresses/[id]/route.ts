import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  parseAddressInput,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/lib/addresses";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  // Chỉ đổi địa chỉ mặc định, không sửa các trường khác
  if (body && Object.keys(body).length === 1 && "isDefault" in body) {
    try {
      await setDefaultAddress(user.id, id);
      return NextResponse.json({ ok: true });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  const input = parseAddressInput(body);
  if (!input) {
    return NextResponse.json(
      { error: "Vui lòng nhập đầy đủ thông tin địa chỉ." },
      { status: 400 }
    );
  }

  try {
    const address = await updateAddress(user.id, id, input, Boolean(body?.isDefault));
    return NextResponse.json(address);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  const { id } = await params;
  try {
    await deleteAddress(user.id, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = (e as Error).message ?? "Có lỗi xảy ra.";
    const status = message.includes("đã được dùng cho đơn hàng") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
