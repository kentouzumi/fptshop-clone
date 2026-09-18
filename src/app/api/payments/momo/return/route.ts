import { NextResponse } from "next/server";
import { handleMomoCallback } from "@/lib/orders";

// MoMo redirect trình duyệt khách hàng về đây sau khi thanh toán (GET, query string) — không phải
// server-to-server. Dùng để cập nhật trạng thái ngay cho mục đích dev/demo local, y hệt cách VNPay
// return URL từng dùng trước đây; IPN (route ipn/route.ts) mới là nguồn xác nhận đáng tin cậy.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  const result = await handleMomoCallback(query);

  if (!result.ok) {
    return NextResponse.redirect(new URL(`/orders?payment=error`, url.origin));
  }

  const status = result.success ? "success" : "failed";
  return NextResponse.redirect(new URL(`/orders/${result.orderId}?payment=${status}`, url.origin));
}
