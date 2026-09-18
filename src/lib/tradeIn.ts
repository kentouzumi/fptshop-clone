import { prisma } from "@/lib/prisma";
import { TradeInStatus } from "@prisma/client";

export interface TradeInInput {
  deviceVariantId: string | null;
  deviceInfo: string;
  condition: string;
}

export function parseTradeInInput(body: unknown): TradeInInput | null {
  const b = body as Record<string, unknown>;
  const deviceVariantId =
    typeof b?.deviceVariantId === "string" && b.deviceVariantId ? b.deviceVariantId : null;
  const deviceInfo = typeof b?.deviceInfo === "string" ? b.deviceInfo.trim() : "";
  const condition = typeof b?.condition === "string" ? b.condition.trim() : "";

  if (deviceInfo.length < 3 || condition.length < 3) return null;
  return { deviceVariantId, deviceInfo, condition };
}

export const TRADE_IN_STATUS_LABELS: Record<TradeInStatus, string> = {
  QUOTED: "Chờ báo giá / đã báo giá tạm tính",
  CONFIRMED: "Đã xác nhận giá",
  RECEIVED: "Đã nhận máy",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

export const TRADE_IN_STATUS_TRANSITIONS: Record<TradeInStatus, TradeInStatus[]> = {
  QUOTED: [TradeInStatus.CONFIRMED, TradeInStatus.CANCELLED],
  CONFIRMED: [TradeInStatus.RECEIVED, TradeInStatus.CANCELLED],
  RECEIVED: [TradeInStatus.COMPLETED, TradeInStatus.CANCELLED],
  COMPLETED: [],
  CANCELLED: [],
};

export async function createTradeInRequest(userId: string, input: TradeInInput) {
  return prisma.tradeInRequest.create({
    data: { userId, ...input, quotedPrice: 0, status: "QUOTED" },
  });
}

export async function getTradeInRequestsForUser(userId: string) {
  return prisma.tradeInRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { deviceVariant: { include: { product: true } } },
  });
}

export async function getAllTradeInRequestsForAdmin() {
  return prisma.tradeInRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { fullName: true, phone: true } },
      deviceVariant: { include: { product: true } },
    },
  });
}

export async function updateTradeInRequest(
  id: string,
  changes: { quotedPrice?: number; status?: TradeInStatus }
) {
  const existing = await prisma.tradeInRequest.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Không tìm thấy yêu cầu thu cũ đổi mới.");
  }

  if (changes.status) {
    const allowed = TRADE_IN_STATUS_TRANSITIONS[existing.status];
    if (!allowed.includes(changes.status)) {
      throw new Error(
        `Không thể chuyển từ "${TRADE_IN_STATUS_LABELS[existing.status]}" sang "${TRADE_IN_STATUS_LABELS[changes.status]}".`
      );
    }
  }

  return prisma.tradeInRequest.update({
    where: { id },
    data: {
      ...(changes.quotedPrice !== undefined ? { quotedPrice: changes.quotedPrice } : {}),
      ...(changes.status ? { status: changes.status } : {}),
    },
  });
}
