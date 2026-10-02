import { NextResponse } from "next/server";

/**
 * Trả lời cho trường hợp một route GET công khai không đọc được dữ liệu.
 *
 * VÌ SAO CẦN: các route này trước đây không có try/catch, nên lỗi tầng DB
 * thành HTTP 500 với body RỖNG — không thông báo, không mã lỗi, và không có
 * dòng log nào để tra. Lúc đo tải đã gặp đúng vậy trên production: 1/3 request
 * trả 500 trắng và cách duy nhất để lần ra nguyên nhân là suy luận gián tiếp
 * từ việc "chỉ các endpoint đụng DB mới vỡ".
 *
 * Chọn 503 chứ không phải 500: đây là lỗi TẠM THỜI (pool/pooler đầy, DB nghẽn
 * một nhịp) chứ không phải request sai. 503 + Retry-After nói đúng điều đó cho
 * CDN, monitoring và client biết là thử lại sau sẽ được.
 *
 * `console.error` ở đây là phần quan trọng nhất của hàm: nó đưa lỗi thật vào
 * Vercel Runtime Logs. Không có nó thì lỗi biến mất không dấu vết.
 */
export function dbUnavailable(scope: string, error: unknown) {
  console.error(`[${scope}] không đọc được dữ liệu:`, error);

  return NextResponse.json(
    { error: "Hệ thống đang quá tải, vui lòng thử lại sau ít phút." },
    {
      status: 503,
      headers: {
        "Retry-After": "5",
        // Không để CDN/trình duyệt cache một câu trả lời lỗi tạm thời.
        "Cache-Control": "no-store",
      },
    }
  );
}
