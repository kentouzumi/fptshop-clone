import { NextResponse } from "next/server";
import { handleVnpayCallback } from "@/lib/orders";

// IPN (Instant Payment Notification): VNPay gọi server-to-server vào URL này để xác nhận kết quả
// giao dịch — đây mới là nguồn dữ liệu ĐÁNG TIN CẬY theo tài liệu VNPay (khác với return URL ở trên,
// vốn chỉ là redirect trình duyệt, có thể bị người dùng tắt tab giữa chừng nên không đảm bảo luôn
// được gọi). VNPay yêu cầu response đúng format {RspCode, Message} bên dưới, KHÔNG được redirect.
// CHỈ hoạt động nếu URL này public (cấu hình trong VNPay merchant portal) — với localhost cần dùng
// ngrok/cloudflared để có URL tạm public trỏ vào máy dev lúc test (xem CLAUDE.md mục VNPay).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  const result = await handleVnpayCallback(query);

  if (!result.ok) {
    const rspCode = result.reason === "invalid_signature" ? "97" : result.reason === "not_found" ? "01" : "04";
    const message =
      result.reason === "invalid_signature"
        ? "Invalid signature"
        : result.reason === "not_found"
          ? "Order not found"
          : "Invalid amount";
    return NextResponse.json({ RspCode: rspCode, Message: message });
  }

  if (result.alreadyProcessed) {
    return NextResponse.json({ RspCode: "02", Message: "Order already confirmed" });
  }

  return NextResponse.json({ RspCode: "00", Message: "Confirm Success" });
}
