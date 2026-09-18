import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generatePaymentUrlForOrder } from "@/lib/orders";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const paymentUrl = await generatePaymentUrlForOrder(id, user.id);
    return NextResponse.json({ paymentUrl });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
