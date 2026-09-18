import { NextResponse } from "next/server";
import { normalizePhone, requestOtp } from "@/lib/otp";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const phone = normalizePhone(typeof body?.phone === "string" ? body.phone : "");

  if (!phone) {
    return NextResponse.json(
      { error: "Số điện thoại không hợp lệ." },
      { status: 400 }
    );
  }

  try {
    const { code } = await requestOtp(phone);

    return NextResponse.json({
      ok: true,
      // Chỉ trả mã trong môi trường dev để test khi chưa nối SMS gateway thật.
      ...(process.env.NODE_ENV !== "production" ? { devCode: code } : {}),
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 429 });
  }
}
