import { Prisma, ClaimStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const WARRANTY_DURATION_MONTHS = 12;

type PrismaTx = Prisma.TransactionClient;

// Tạo phiếu bảo hành cho từng OrderItem của đơn hàng lúc giao thành công (DELIVERED).
// Thời hạn bảo hành MVP: 12 tháng kể từ ngày giao, áp dụng chung cho mọi sản phẩm
// (thực tế FPT Shop có thời hạn khác nhau theo từng loại sản phẩm).
export async function createWarrantiesForOrder(tx: PrismaTx, orderId: string) {
  const items = await tx.orderItem.findMany({ where: { orderId, warrantyId: null } });
  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + WARRANTY_DURATION_MONTHS);

  for (const item of items) {
    const warranty = await tx.warranty.create({
      data: { startDate: now, endDate, status: "ACTIVE" },
    });
    await tx.orderItem.update({ where: { id: item.id }, data: { warrantyId: warranty.id } });
  }
}

export async function getWarrantiesForUser(userId: string) {
  const items = await prisma.orderItem.findMany({
    where: { order: { userId }, warrantyId: { not: null } },
    include: {
      warranty: { include: { claims: { orderBy: { createdAt: "desc" } } } },
      order: { select: { code: true, createdAt: true } },
    },
    orderBy: { order: { createdAt: "desc" } },
  });

  return items
    .filter((item) => item.warranty !== null)
    .map((item) => ({
      orderItemId: item.id,
      productName: item.productName,
      variantLabel: item.variantLabel,
      orderCode: item.order.code,
      warranty: item.warranty!,
    }));
}

export async function getWarrantyOwner(warrantyId: string) {
  const item = await prisma.orderItem.findFirst({
    where: { warrantyId },
    include: { order: { select: { userId: true } } },
  });
  return item?.order.userId ?? null;
}

export async function createWarrantyClaim(userId: string, warrantyId: string, issue: string) {
  const ownerId = await getWarrantyOwner(warrantyId);
  if (!ownerId || ownerId !== userId) {
    throw new Error("Không tìm thấy phiếu bảo hành.");
  }

  const warranty = await prisma.warranty.findUnique({ where: { id: warrantyId } });
  if (!warranty || warranty.status !== "ACTIVE" || warranty.endDate < new Date()) {
    throw new Error("Phiếu bảo hành đã hết hạn hoặc không còn hiệu lực.");
  }

  return prisma.warrantyClaim.create({ data: { warrantyId, issue } });
}

export async function getAllClaimsForAdmin() {
  const claims = await prisma.warrantyClaim.findMany({
    orderBy: { createdAt: "desc" },
    include: { warranty: true },
  });

  const warrantyIds = claims.map((c) => c.warrantyId);
  const items = await prisma.orderItem.findMany({
    where: { warrantyId: { in: warrantyIds } },
    include: { order: { select: { code: true, user: { select: { fullName: true, phone: true } } } } },
  });
  const itemByWarranty = new Map(items.map((i) => [i.warrantyId!, i]));

  return claims.map((c) => ({
    ...c,
    productName: itemByWarranty.get(c.warrantyId)?.productName ?? "?",
    orderCode: itemByWarranty.get(c.warrantyId)?.order.code ?? "?",
    customerName: itemByWarranty.get(c.warrantyId)?.order.user.fullName ?? "?",
    customerPhone: itemByWarranty.get(c.warrantyId)?.order.user.phone ?? "?",
  }));
}

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  RECEIVED: "Đã tiếp nhận",
  IN_PROGRESS: "Đang xử lý",
  REPAIRED: "Đã sửa xong",
  REPLACED: "Đã đổi máy mới",
  REJECTED: "Từ chối bảo hành",
};

export async function updateClaimStatus(id: string, status: ClaimStatus) {
  const resolvedAt =
    status === "REPAIRED" || status === "REPLACED" || status === "REJECTED" ? new Date() : null;
  return prisma.warrantyClaim.update({ where: { id }, data: { status, resolvedAt } });
}
