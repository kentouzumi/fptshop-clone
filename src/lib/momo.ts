import crypto from "crypto";

// Cổng thanh toán MoMo (test/sandbox, luồng "Thanh toán qua ứng dụng MoMo" —
// captureWallet) — tài liệu: https://developers.momo.vn/v3/docs/payment/api/wallet/onetime
// Dùng bộ test credentials CÔNG KHAI do chính MoMo công bố trong tài liệu dev
// (partnerCode "MOMO") — KHÔNG cần đăng ký tài khoản merchant nào, khác hẳn
// VNPay/ZaloPay đều bắt buộc tự tạo tài khoản sandbox trước. Đã tự gọi thử
// endpoint thật để xác nhận bộ giá trị mặc định dưới đây hoạt động đúng
// trước khi viết vào app (xem CLAUDE.md).
const MOMO_ENDPOINT =
  process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/create";
const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || "MOMO";
const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85";
const MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz";
const MOMO_REDIRECT_URL =
  process.env.MOMO_REDIRECT_URL || "http://localhost:3000/api/payments/momo/return";
const MOMO_IPN_URL = process.env.MOMO_IPN_URL || "http://localhost:3000/api/payments/momo/ipn";

// Luôn coi là "đã cấu hình" vì có sẵn giá trị mặc định công khai — hàm này giữ
// lại để nhất quán cách gọi với vnpay cũ và phòng trường hợp sau này đổi sang
// tài khoản merchant thật (partnerCode riêng) rồi lại cần validate.
export function isMomoConfigured() {
  return Boolean(MOMO_PARTNER_CODE && MOMO_ACCESS_KEY && MOMO_SECRET_KEY);
}

// CẢNH BÁO BẢO MẬT (rà soát nghiệp vụ phát hiện — xem CLAUDE.md): 3 biến
// MOMO_ACCESS_KEY/MOMO_SECRET_KEY/MOMO_PARTNER_CODE mặc định ở trên là bộ
// TEST CREDENTIALS CÔNG KHAI do chính MoMo công bố trong tài liệu dev — bất
// kỳ ai đọc tài liệu MoMo cũng biết được, nên có thể TỰ TÍNH được chữ ký hợp
// lệ và gọi thẳng /api/payments/momo/ipn để đánh dấu 1 đơn hàng của họ thành
// "đã thanh toán" mà không cần trả tiền thật. Đây KHÔNG phải lỗi có thể sửa
// bằng code (code đang làm đúng theo tài liệu MoMo) — chỉ hết khi nào deploy
// với 1 tài khoản merchant MoMo THẬT có secret riêng không công bố (đặt qua
// biến môi trường MOMO_SECRET_KEY, KHÔNG dùng giá trị mặc định này). Dùng
// hàm này để hiện cảnh báo rõ ràng ở admin (xem admin/orders/[id]/page.tsx)
// mỗi khi có 1 thanh toán MoMo "thành công" trong lúc vẫn đang dùng secret
// công khai, tránh admin nhầm tưởng đó là tiền thật.
export function isUsingPublicMomoTestCredentials() {
  return (
    !process.env.MOMO_ACCESS_KEY ||
    process.env.MOMO_ACCESS_KEY === "F8BBA842ECF85" ||
    !process.env.MOMO_SECRET_KEY ||
    process.env.MOMO_SECRET_KEY === "K951B6PE1waDMi640xX08PD3vg6EkVlz"
  );
}

function signHmac(raw: string) {
  return crypto.createHmac("sha256", MOMO_SECRET_KEY).update(raw).digest("hex");
}

export interface CreateMomoPaymentInput {
  orderId: string; // phải DUY NHẤT với MoMo — dùng txnRef (khác hẳn mã đơn hệ thống) để thử lại được
  amount: number; // VNĐ
  orderInfo: string;
}

// MoMo yêu cầu raw string ký theo ĐÚNG thứ tự field cố định này (không phải sort alphabet như VNPay).
export async function createMomoPaymentUrl(input: CreateMomoPaymentInput): Promise<string> {
  const requestId = input.orderId;
  const amount = String(Math.round(input.amount));
  const extraData = "";
  const requestType = "captureWallet";

  const rawSignature =
    `accessKey=${MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}` +
    `&ipnUrl=${MOMO_IPN_URL}&orderId=${input.orderId}&orderInfo=${input.orderInfo}` +
    `&partnerCode=${MOMO_PARTNER_CODE}&redirectUrl=${MOMO_REDIRECT_URL}` +
    `&requestId=${requestId}&requestType=${requestType}`;

  const body = {
    partnerCode: MOMO_PARTNER_CODE,
    partnerName: "FPT Shop Clone",
    storeId: "FptShopCloneStore",
    requestId,
    amount,
    orderId: input.orderId,
    orderInfo: input.orderInfo,
    redirectUrl: MOMO_REDIRECT_URL,
    ipnUrl: MOMO_IPN_URL,
    lang: "vi",
    extraData,
    requestType,
    signature: signHmac(rawSignature),
  };

  const res = await fetch(MOMO_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.payUrl) {
    throw new Error(data?.message ?? "Không tạo được giao dịch MoMo.");
  }

  return data.payUrl as string;
}

export interface MomoCallbackResult {
  isValidSignature: boolean;
  isSuccess: boolean;
  orderId: string;
  amount: number;
  resultCode: string;
  transId: string;
}

// Dùng chung cho cả return URL (GET, query string trên trình duyệt) lẫn IPN (POST, JSON body server-to-
// server) — caller tự đưa cả 2 dạng về Record<string,string> giống nhau trước khi gọi hàm này. Raw string
// ký ở đây theo bộ field KHÁC với lúc tạo giao dịch (bắt buộc theo đúng tài liệu MoMo).
export function verifyMomoCallback(query: Record<string, string>): MomoCallbackResult {
  const {
    signature = "",
    partnerCode = MOMO_PARTNER_CODE,
    orderId = "",
    requestId = "",
    amount = "0",
    orderInfo = "",
    orderType = "",
    transId = "",
    resultCode = "",
    message = "",
    payType = "",
    responseTime = "",
    extraData = "",
  } = query;

  const rawSignature =
    `accessKey=${MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}` +
    `&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}` +
    `&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}` +
    `&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

  const expected = signHmac(rawSignature);
  // So sánh bằng crypto.timingSafeEqual thay vì `===` — chống timing attack
  // (đo thời gian phản hồi để dò dần từng ký tự của chữ ký đúng). Phải kiểm
  // tra ĐỘ DÀI bằng nhau trước vì timingSafeEqual throw nếu 2 buffer khác
  // độ dài, thay vì trả false như mong đợi.
  const isValidSignature =
    Boolean(signature) &&
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  return {
    isValidSignature,
    isSuccess: isValidSignature && resultCode === "0",
    orderId,
    amount: Number(amount),
    resultCode,
    transId,
  };
}
