import { getAllCouponsForAdmin, getCouponOrderCounts } from "@/lib/coupons";
import CouponsManager, { type CouponStatus } from "./CouponsManager";

/**
 * Trạng thái hiệu lực tính ở SERVER: rule react-hooks/purity của
 * eslint-config-next 16 cấm gọi Date.now() trong lúc render client component,
 * và mốc thời gian của server mới là mốc mà getSuggestedCoupons() dùng để quyết
 * định mã có hiện ra cho khách hay không.
 */
function resolveStatus(c: {
  isActive: boolean;
  startsAt: Date;
  endsAt: Date;
  usageLimit: number | null;
  usedCount: number;
}): CouponStatus {
  const now = Date.now();
  if (!c.isActive) return "disabled";
  if (c.endsAt.getTime() < now) return "expired";
  if (c.startsAt.getTime() > now) return "scheduled";
  if (c.usageLimit !== null && c.usedCount >= c.usageLimit) return "exhausted";
  return "running";
}

export default async function AdminCouponsPage() {
  const [coupons, orderCounts] = await Promise.all([
    getAllCouponsForAdmin(),
    getCouponOrderCounts(),
  ]);

  return (
    <CouponsManager
      coupons={coupons.map((c) => ({
        id: c.id,
        code: c.code,
        type: c.type,
        value: Number(c.value),
        minOrderValue: Number(c.minOrderValue),
        maxDiscount: c.maxDiscount === null ? null : Number(c.maxDiscount),
        usageLimit: c.usageLimit,
        usedCount: c.usedCount,
        startsAt: c.startsAt.toISOString(),
        endsAt: c.endsAt.toISOString(),
        isActive: c.isActive,
        status: resolveStatus(c),
        orderCount: orderCounts[c.id] ?? 0,
      }))}
    />
  );
}
