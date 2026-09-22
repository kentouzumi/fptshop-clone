import { NextResponse } from "next/server";
import { handleMomoCallback } from "@/lib/orders";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

// MoMo redirect trình duyệt khách hàng về đây sau khi thanh toán (GET, query string) — không phải
// server-to-server. Dùng để cập nhật trạng thái ngay cho mục đích dev/demo local, y hệt cách VNPay
// return URL từng dùng trước đây; IPN (route ipn/route.ts) mới là nguồn xác nhận đáng tin cậy.
export async function GET(request: Request) {
  const url = new URL(request.url);

  // Giới hạn tốc độ gọi theo IP — route này verify chữ ký bằng secret CÔNG
  // KHAI (xem lib/momo.ts: isUsingPublicMomoTestCredentials), nên về lý
  // thuyết ai cũng tự tính được chữ ký hợp lệ và thử dò orderId/txnRef bằng
  // cách gọi lặp lại. Giới hạn này không chặn tuyệt đối (xem lib/rateLimit.ts)
  // nhưng tăng đáng kể chi phí dò so với không giới hạn gì.
  if (isRateLimited(`momo-return:${getClientIp(request)}`, 30, 5 * 60 * 1000)) {
    return NextResponse.redirect(new URL(`/orders?payment=error`, url.origin));
  }

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
