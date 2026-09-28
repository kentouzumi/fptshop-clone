import { prisma } from "@/lib/prisma";
import { ShipmentStatus, DeliveryMethod, type Prisma } from "@prisma/client";

/**
 * Vận đơn cho đơn giao tận nơi. Dùng model `Shipment` đã có sẵn trong schema từ
 * đầu dự án nhưng chưa một dòng code nào dùng tới.
 *
 * QUAN HỆ VỚI TRẠNG THÁI ĐƠN: Order.status vẫn là NGUỒN CHÂN LÝ DUY NHẤT về
 * việc đơn đã giao hay chưa — Shipment.status chỉ mô tả chi tiết hơn chặng vận
 * chuyển ở giữa. Vì vậy admin KHÔNG tự đặt được Shipment sang DELIVERED: giá
 * trị đó do updateOrderStatus() tự set khi đơn chuyển sang DELIVERED. Nếu cho
 * đặt tay ở cả 2 nơi thì sẽ có lúc vận đơn nói "đã giao" còn đơn hàng nói "đang
 * giao", không biết tin cái nào.
 */

/** Các đơn vị vận chuyển phổ biến ở VN, chỉ dùng làm gợi ý — admin gõ tên khác vẫn được. */
export const CARRIER_SUGGESTIONS = [
  "Giao Hàng Nhanh (GHN)",
  "Giao Hàng Tiết Kiệm (GHTK)",
  "Viettel Post",
  "J&T Express",
  "Ninja Van",
  "VNPost",
  "Giao hàng nội bộ",
];

/** Trạng thái admin được phép tự đặt — KHÔNG có DELIVERED, xem ghi chú ở đầu file. */
export const ADMIN_SETTABLE_SHIPMENT_STATUSES: ShipmentStatus[] = [
  ShipmentStatus.PREPARING,
  ShipmentStatus.IN_TRANSIT,
  ShipmentStatus.OUT_FOR_DELIVERY,
  ShipmentStatus.FAILED,
];

export interface ShipmentInput {
  carrier: string | null;
  trackingCode: string | null;
  status: ShipmentStatus;
  estimatedDate: Date | null;
}

export function parseShipmentInput(body: unknown): ShipmentInput | null {
  const b = body as Record<string, unknown>;

  const carrier = typeof b?.carrier === "string" && b.carrier.trim() ? b.carrier.trim() : null;
  const trackingCode =
    typeof b?.trackingCode === "string" && b.trackingCode.trim() ? b.trackingCode.trim() : null;

  const status = b?.status;
  if (!ADMIN_SETTABLE_SHIPMENT_STATUSES.includes(status as ShipmentStatus)) {
    return null;
  }

  let estimatedDate: Date | null = null;
  if (typeof b?.estimatedDate === "string" && b.estimatedDate.trim()) {
    const parsed = new Date(b.estimatedDate);
    if (Number.isNaN(parsed.getTime())) return null;
    estimatedDate = parsed;
  }

  return { carrier, trackingCode, status: status as ShipmentStatus, estimatedDate };
}

/**
 * Admin tạo/sửa vận đơn. Dùng upsert vì đơn có thể chưa từng có vận đơn (vd
 * admin muốn nhập mã trước khi chuyển đơn sang "Đang giao").
 * Chặn với đơn NHẬN TẠI CỬA HÀNG: không có vận chuyển nào để theo dõi.
 */
export async function upsertShipmentForOrder(orderId: string, input: ShipmentInput) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, deliveryMethod: true, shipment: { select: { status: true } } },
  });
  if (!order) {
    throw new Error("Không tìm thấy đơn hàng.");
  }
  if (order.deliveryMethod === DeliveryMethod.STORE_PICKUP) {
    throw new Error("Đơn nhận tại cửa hàng không có vận đơn để theo dõi.");
  }
  // Đơn đã giao xong thì vận đơn đã ở DELIVERED — không cho kéo ngược về
  // IN_TRANSIT rồi mâu thuẫn với trạng thái đơn.
  if (order.shipment?.status === ShipmentStatus.DELIVERED) {
    throw new Error("Đơn đã giao xong, không sửa được trạng thái vận đơn nữa.");
  }

  return prisma.shipment.upsert({
    where: { orderId },
    update: input,
    create: { orderId, ...input },
  });
}

/**
 * Tự tạo vận đơn khi đơn chuyển sang "Đang giao" (chỉ đơn giao tận nơi), để
 * admin luôn có sẵn 1 dòng để điền mã vận đơn thay vì phải tự nhớ tạo.
 * Gọi TRONG transaction của updateOrderStatus nên nhận `tx`.
 */
export async function ensureShipmentOnShipping(
  tx: Prisma.TransactionClient,
  orderId: string,
  deliveryMethod: DeliveryMethod
) {
  if (deliveryMethod === DeliveryMethod.STORE_PICKUP) return;

  const existing = await tx.shipment.findUnique({ where: { orderId } });
  if (existing) return;

  // IN_TRANSIT chứ không phải PREPARING mặc định của schema: đơn đã sang "Đang
  // giao" nghĩa là hàng đã rời kho, để PREPARING sẽ mâu thuẫn ngay từ đầu.
  await tx.shipment.create({ data: { orderId, status: ShipmentStatus.IN_TRANSIT } });
}

/** Đồng bộ vận đơn khi đơn đã giao xong — Order.status là nguồn chân lý. */
export async function markShipmentDelivered(tx: Prisma.TransactionClient, orderId: string) {
  const existing = await tx.shipment.findUnique({ where: { orderId } });
  if (!existing) return;

  await tx.shipment.update({
    where: { orderId },
    data: { status: ShipmentStatus.DELIVERED, deliveredAt: new Date() },
  });
}
