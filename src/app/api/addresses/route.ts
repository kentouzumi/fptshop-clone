import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAddressesForUser, createAddress, parseAddressInput } from "@/lib/addresses";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  const addresses = await getAddressesForUser(user.id);
  return NextResponse.json(addresses);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const input = parseAddressInput(body);
  if (!input) {
    return NextResponse.json(
      { error: "Vui lòng nhập đầy đủ thông tin địa chỉ." },
      { status: 400 }
    );
  }

  const address = await createAddress(user.id, input, Boolean((body as Record<string, unknown>)?.isDefault));
  return NextResponse.json(address, { status: 201 });
}
