// Rate limit đơn giản kiểu sliding-window, lưu trong bộ nhớ tiến trình
// (KHÔNG dùng Redis hay dịch vụ ngoài nào — đủ dùng cho quy mô demo). LƯU Ý
// GIỚI HẠN: trên môi trường serverless nhiều instance (Vercel), mỗi instance
// giữ Map riêng nên giới hạn này chỉ áp dụng ĐÚNG trong phạm vi 1 instance —
// không chặn tuyệt đối 1 kẻ tấn công dùng nhiều request đồng thời trúng
// nhiều instance khác nhau, nhưng vẫn tăng đáng kể chi phí so với không có
// gì cả (đặc biệt hữu ích khi chạy `next start` 1 tiến trình duy nhất, hoặc
// khi Vercel dồn traffic thấp về ít instance).
const attempts = new Map<string, { count: number; windowStart: number }>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  // Dọn dữ liệu cũ để Map không phình vô hạn qua thời gian (tiến trình dev
  // server/next start có thể sống rất lâu).
  for (const [k, v] of attempts) {
    if (now - v.windowStart > windowMs) attempts.delete(k);
  }

  const entry = attempts.get(key);
  if (!entry || now - entry.windowStart > windowMs) {
    attempts.set(key, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  return entry.count > limit;
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
