import crypto from "crypto";

// Cổng thanh toán VNPay (sandbox) — tài liệu: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
// Cần đăng ký tài khoản merchant sandbox miễn phí tại https://sandbox.vnpayment.vn/devreg/
// để lấy VNPAY_TMN_CODE + VNPAY_HASH_SECRET, điền vào .env (xem TODO trong CLAUDE.md).

const VNPAY_URL = process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const VNPAY_TMN_CODE = process.env.VNPAY_TMN_CODE || "";
const VNPAY_HASH_SECRET = process.env.VNPAY_HASH_SECRET || "";
const VNPAY_RETURN_URL = process.env.VNPAY_RETURN_URL || "http://localhost:3000/api/payments/vnpay/return";

export function isVnpayConfigured() {
  return Boolean(VNPAY_TMN_CODE && VNPAY_HASH_SECRET);
}

function formatVnpDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

// VNPay yêu cầu sort key alphabet rồi encode theo application/x-www-form-urlencoded (dùng encodeURIComponent,
// thay %20 bằng +) trước khi vừa build chuỗi ký (signData) vừa build URL thật — phải dùng CHUNG 1 cách encode
// cho cả 2 bước này thì chữ ký mới khớp lúc VNPay verify lại.
function sortAndEncodeParams(params: Record<string, string>) {
  const sortedKeys = Object.keys(params).sort();
  const parts = sortedKeys
    .filter((key) => params[key] !== undefined && params[key] !== "")
    .map((key) => `${key}=${encodeURIComponent(params[key]).replace(/%20/g, "+")}`);
  return parts.join("&");
}

function signParams(params: Record<string, string>) {
  const signData = sortAndEncodeParams(params);
  return crypto.createHmac("sha512", VNPAY_HASH_SECRET).update(signData).digest("hex");
}

export interface CreateVnpayUrlInput {
  txnRef: string; // mã tham chiếu duy nhất cho mỗi lần thử thanh toán, dùng để đối chiếu lúc callback
  amount: number; // VNĐ (chưa nhân 100)
  orderInfo: string;
  ipAddr: string;
}

export function createVnpayPaymentUrl(input: CreateVnpayUrlInput) {
  if (!isVnpayConfigured()) {
    throw new Error(
      "Chưa cấu hình VNPAY_TMN_CODE/VNPAY_HASH_SECRET trong .env. Đăng ký sandbox tại https://sandbox.vnpayment.vn/devreg/"
    );
  }

  const params: Record<string, string> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: VNPAY_TMN_CODE,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: input.txnRef,
    vnp_OrderInfo: input.orderInfo,
    vnp_OrderType: "other",
    vnp_Amount: String(Math.round(input.amount) * 100),
    vnp_ReturnUrl: VNPAY_RETURN_URL,
    vnp_IpAddr: input.ipAddr,
    vnp_CreateDate: formatVnpDate(new Date()),
  };

  const secureHash = signParams(params);
  const query = sortAndEncodeParams(params);
  return `${VNPAY_URL}?${query}&vnp_SecureHash=${secureHash}`;
}

export interface VnpayCallbackResult {
  isValidSignature: boolean;
  isSuccess: boolean;
  txnRef: string;
  amount: number; // đã chia lại 100, ra đơn vị VNĐ
  responseCode: string;
  transactionNo: string;
}

// Dùng chung cho cả return URL (redirect trình duyệt) và IPN (server-to-server) vì VNPay gửi
// cùng 1 bộ tham số vnp_* cho cả 2, chỉ khác cơ chế gọi.
export function verifyVnpayCallback(query: Record<string, string>): VnpayCallbackResult {
  const { vnp_SecureHash, vnp_SecureHashType, ...rest } = query;
  void vnp_SecureHashType;

  const expectedHash = signParams(rest as Record<string, string>);
  const isValidSignature = Boolean(vnp_SecureHash) && expectedHash === vnp_SecureHash;

  const responseCode = query.vnp_ResponseCode || "";
  return {
    isValidSignature,
    isSuccess: isValidSignature && responseCode === "00",
    txnRef: query.vnp_TxnRef || "",
    amount: Number(query.vnp_Amount || "0") / 100,
    responseCode,
    transactionNo: query.vnp_TransactionNo || "",
  };
}
