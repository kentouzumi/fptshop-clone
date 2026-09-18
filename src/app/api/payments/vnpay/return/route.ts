import { NextResponse } from "next/server";
import { handleVnpayCallback } from "@/lib/orders";

// VNPay redirect trình duyệt khách hàng về đây sau khi thanh toán (không phải server-to-server).
// Chỉ dùng để cập nhật trạng thái Payment cho MỤC ĐÍCH DEV/DEMO LOCAL vì IPN (route ipn/route.ts,
// mới là nguồn xác nhận đáng tin cậy theo tài liệu VNPay) cần 1 URL public mà VNPay gọi tới được,
// còn localhost thì không — xem CLAUDE.md mục VNPay để biết cách test đầy đủ bằng ngrok/tunnel.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  const result = await handleVnpayCallback(query);

  if (!result.ok) {
    return NextResponse.redirect(new URL(`/orders?payment=error`, url.origin));
  }

  const status = result.success ? "success" : "failed";
  return NextResponse.redirect(new URL(`/orders/${result.orderId}?payment=${status}`, url.origin));
}
