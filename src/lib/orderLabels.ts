/**
 * Nhãn hiển thị tiếng Việt cho trạng thái đơn/phương thức thanh toán/giao hàng.
 * Tách riêng khỏi lib/orders.ts (vốn import Prisma) để CLIENT COMPONENT dùng
 * được mà không kéo Prisma vào bundle trình duyệt — xem OrderLookupForm.tsx.
 */

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: "Thanh toán khi nhận hàng (COD)",
  VNPAY: "VNPay",
  MOMO: "Ví MoMo",
  BANK_TRANSFER: "Chuyển khoản ngân hàng (VietQR)",
  INSTALLMENT: "Trả góp 0%",
};

export const DELIVERY_METHOD_LABELS: Record<string, string> = {
  HOME_DELIVERY: "Giao hàng tận nơi",
  STORE_PICKUP: "Nhận tại cửa hàng",
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  PROCESSING: "Đang xử lý",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  RETURN_REQUESTED: "Yêu cầu trả hàng",
  RETURNED: "Đã trả hàng",
};

export const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  PREPARING: "Đang chuẩn bị hàng",
  IN_TRANSIT: "Đang vận chuyển",
  OUT_FOR_DELIVERY: "Đang giao tới bạn",
  DELIVERED: "Đã giao",
  FAILED: "Giao không thành công",
};
