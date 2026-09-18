import { NextResponse } from "next/server";
import { handleMomoCallback } from "@/lib/orders";

// IPN (Instant Payment Notification): MoMo gọi server-to-server vào URL này để xác nhận kết quả giao
// dịch — KHÁC VNPay ở chỗ MoMo gửi POST kèm JSON body (không phải GET query string), và không yêu cầu
// response theo format cố định nào — chỉ cần trả về mã 2xx là MoMo coi như đã nhận được, trả về mã lỗi
// (vd 400) nếu chữ ký/số tiền không khớp để MoMo có thể thử gọi lại. CHỈ hoạt động nếu URL này public
// (khai trong body lúc tạo giao dịch) — với localhost cần ngrok/cloudflared để test đầy đủ bằng IPN thật.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(body)) {
    query[key] = String(value);
  }

  const result = await handleMomoCallback(query);

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  return new NextResponse(null, { status: 204 });
}
