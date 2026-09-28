import { NextResponse } from "next/server";
import { getWards, findProvinceByCode } from "@/lib/vnAddress";

/**
 * Danh sách phường/xã của 1 tỉnh/thành. Tách thành API riêng thay vì nhúng thẳng
 * toàn bộ 3321 phường/xã vào client bundle của form địa chỉ.
 * Dữ liệu hành chính công khai, không cần đăng nhập.
 */
export async function GET(request: Request) {
  const code = Number(new URL(request.url).searchParams.get("province"));
  if (!Number.isInteger(code) || !findProvinceByCode(code)) {
    return NextResponse.json({ error: "Tỉnh/thành không hợp lệ." }, { status: 400 });
  }

  return NextResponse.json(
    { wards: getWards(code) },
    // Dữ liệu hành chính gần như không đổi -> cho phép cache lâu ở CDN/trình duyệt.
    { headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" } }
  );
}
