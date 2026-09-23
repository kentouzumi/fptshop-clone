// Thanh toán bằng CHUYỂN KHOẢN NGÂN HÀNG THẬT qua mã VietQR — khác hẳn MoMo
// (lib/momo.ts): không có cổng trung gian, không cần đăng ký merchant, tiền
// đi THẲNG vào tài khoản ngân hàng thật của chủ shop khi khách quét mã bằng
// app ngân hàng bất kỳ hoặc app MoMo (đều đọc được chuẩn VietQR). Đánh đổi:
// không có webhook báo tự động như MoMo — admin phải tự kiểm tra tài khoản
// rồi bấm xác nhận thủ công (xem confirmBankTransferPayment ở lib/orders.ts).
//
// Dùng dịch vụ "Quick Link" công khai miễn phí của VietQR (không cần API key,
// không cần đăng ký) — tài liệu: https://www.vietqr.io/danh-sach-api/link-tao-ma-nhanh/
const BANK_ID = process.env.BANK_ID || "";
const BANK_ACCOUNT_NUMBER = process.env.BANK_ACCOUNT_NUMBER || "";
const BANK_ACCOUNT_NAME = process.env.BANK_ACCOUNT_NAME || "";

export function isBankTransferConfigured() {
  return Boolean(BANK_ID && BANK_ACCOUNT_NUMBER && BANK_ACCOUNT_NAME);
}

export function getBankAccountInfo() {
  return { bankId: BANK_ID, accountNumber: BANK_ACCOUNT_NUMBER, accountName: BANK_ACCOUNT_NAME };
}

// Trả về URL ảnh QR động (VietQR tự vẽ lại mỗi lần gọi theo query string,
// không cần lưu file nào) — nhúng thẳng vào thẻ <Image>/<img>.
export function buildVietQrUrl({ amount, addInfo }: { amount: number; addInfo: string }): string {
  const params = new URLSearchParams({
    amount: String(Math.round(amount)),
    addInfo,
    accountName: BANK_ACCOUNT_NAME,
  });
  return `https://img.vietqr.io/image/${BANK_ID}-${BANK_ACCOUNT_NUMBER}-compact2.png?${params.toString()}`;
}
