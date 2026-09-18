import { Prisma, PrismaClient, CouponType } from "@prisma/client";

type PrismaClientOrTx = PrismaClient | Prisma.TransactionClient;

export interface CouponValidationResult {
  couponId: string;
  code: string;
  type: CouponType;
  discountAmount: number; // giảm trên subtotal (0 nếu là FREE_SHIPPING)
  freeShipping: boolean;
}

export async function validateCoupon(
  client: PrismaClientOrTx,
  rawCode: string,
  subtotal: number
): Promise<CouponValidationResult> {
  const code = rawCode.trim().toUpperCase();
  const coupon = await client.coupon.findUnique({ where: { code } });

  if (!coupon) {
    throw new Error("Mã giảm giá không tồn tại.");
  }
  if (!coupon.isActive) {
    throw new Error("Mã giảm giá đã bị vô hiệu hóa.");
  }

  const now = new Date();
  if (now < coupon.startsAt) {
    throw new Error("Mã giảm giá chưa đến thời gian áp dụng.");
  }
  if (now > coupon.endsAt) {
    throw new Error("Mã giảm giá đã hết hạn.");
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw new Error("Mã giảm giá đã hết lượt sử dụng.");
  }

  const minOrderValue = Number(coupon.minOrderValue);
  if (subtotal < minOrderValue) {
    throw new Error(
      `Đơn hàng cần tối thiểu ${minOrderValue.toLocaleString("vi-VN")}đ để áp dụng mã này.`
    );
  }

  let discountAmount = 0;
  let freeShipping = false;

  if (coupon.type === CouponType.PERCENT) {
    discountAmount = Math.round((subtotal * Number(coupon.value)) / 100);
    if (coupon.maxDiscount !== null) {
      discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
    }
  } else if (coupon.type === CouponType.FIXED_AMOUNT) {
    discountAmount = Math.min(Number(coupon.value), subtotal);
  } else {
    freeShipping = true;
  }

  return { couponId: coupon.id, code: coupon.code, type: coupon.type, discountAmount, freeShipping };
}
