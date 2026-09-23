import crypto from "crypto";

// Xác nhận TỰ ĐỘNG thanh toán chuyển khoản ngân hàng qua webhook SePay
// (sepay.vn) — khác VietQR Quick Link (lib/bankTransfer.ts, chỉ vẽ ảnh QR
// tĩnh, KHÔNG báo gì khi có tiền về), SePay liên kết trực tiếp với tài
// khoản ngân hàng THẬT của chủ shop và gọi 1 request POST tới webhook của
// mình MỖI KHI tài khoản đó có biến động số dư (cả tiền vào lẫn tiền ra) —
// route /api/payments/sepay/webhook đối chiếu nội dung chuyển khoản + số
// tiền với các đơn đang chờ để tự xác nhận, không cần admin bấm tay nữa
// (xem confirmBankTransferPayment/findPendingBankTransferOrderByTransaction
// ở lib/orders.ts). Nút xác nhận thủ công ở /admin/orders/[id] VẪN GIỮ
// NGUYÊN làm phương án dự phòng (vd khách chuyển khoản quên ghi đúng nội
// dung nên webhook không khớp được đơn nào).
//
// CÁCH CẤU HÌNH (user tự làm — cần tài khoản ngân hàng thật, không tự làm
// hộ được vì đây là thông tin tài khoản cá nhân):
// 1) Đăng ký tại https://sepay.vn, làm theo hướng dẫn liên kết tài khoản
//    ngân hàng thật (qua SMS Banking hoặc Internet Banking).
// 2) Vào mục "Cấu hình" > "Webhooks" > "Thêm Webhooks mới": Sự kiện chọn
//    "Có tiền vào", URL điền
//    https://<domain-app-thật>/api/payments/sepay/webhook, phần xác thực
//    chọn "API Key" rồi TỰ ĐẶT 1 chuỗi ngẫu nhiên bất kỳ làm API Key (không
//    phải giá trị SePay cấp sẵn) — dán ĐÚNG giá trị đó vào biến
//    SEPAY_API_KEY trong .env (2 bên phải khớp y hệt).
const SEPAY_API_KEY = process.env.SEPAY_API_KEY || "";

export function isSepayConfigured() {
  return Boolean(SEPAY_API_KEY);
}

// SePay gửi kèm header "Authorization: Apikey <API_KEY>" trong mỗi lần gọi
// webhook — so sánh bằng crypto.timingSafeEqual (không dùng `===`) để chống
// timing attack, cùng cách đã áp dụng cho chữ ký MoMo ở lib/momo.ts. Phải tự
// import crypto ở đây (không import module-level để tránh lỗi nếu chạy ở
// edge runtime, dù route hiện tại vẫn dùng Node runtime mặc định).
export function verifySepayAuth(authorizationHeader: string | null): boolean {
  if (!isSepayConfigured() || !authorizationHeader) return false;
  const expected = `Apikey ${SEPAY_API_KEY}`;
  if (authorizationHeader.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(authorizationHeader), Buffer.from(expected));
}
