import { Prisma, LoyaltyTier } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Quy tắc tích điểm MVP: 1 điểm cho mỗi 10.000đ giá trị đơn hàng (grandTotal),
// tích điểm khi đơn chuyển sang DELIVERED (giao thành công).
export const POINTS_PER_VND = 10000;

// Ngưỡng lên hạng - số tự chọn cho MVP, không dựa theo chính sách FPT Shop thật.
const TIER_THRESHOLDS: { tier: LoyaltyTier; minPoints: number }[] = [
  { tier: LoyaltyTier.DIAMOND, minPoints: 5000 },
  { tier: LoyaltyTier.GOLD, minPoints: 2000 },
  { tier: LoyaltyTier.SILVER, minPoints: 500 },
  { tier: LoyaltyTier.MEMBER, minPoints: 0 },
];

function computeTier(points: number): LoyaltyTier {
  return TIER_THRESHOLDS.find((t) => points >= t.minPoints)!.tier;
}

type PrismaTx = Prisma.TransactionClient;

export async function awardPointsForOrder(tx: PrismaTx, userId: string, orderId: string, grandTotal: number) {
  const points = Math.floor(grandTotal / POINTS_PER_VND);
  if (points <= 0) return;

  const account = await tx.loyaltyAccount.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  const newPoints = account.points + points;
  await tx.loyaltyAccount.update({
    where: { userId },
    data: { points: newPoints, tier: computeTier(newPoints) },
  });

  await tx.loyaltyTransaction.create({
    data: {
      accountId: account.id,
      type: "EARN",
      points,
      orderId,
      note: `Tích điểm từ đơn hàng`,
    },
  });
}

export async function getLoyaltyAccountForUser(userId: string) {
  const account = await prisma.loyaltyAccount.findUnique({
    where: { userId },
    include: { pointTransactions: { orderBy: { createdAt: "desc" }, take: 30 } },
  });

  if (!account) {
    return { points: 0, tier: LoyaltyTier.MEMBER, pointTransactions: [] };
  }
  return account;
}

export const TIER_LABELS: Record<LoyaltyTier, string> = {
  MEMBER: "Thành viên",
  SILVER: "Bạc",
  GOLD: "Vàng",
  DIAMOND: "Kim cương",
};
