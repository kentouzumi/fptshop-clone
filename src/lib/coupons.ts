import { Prisma, PrismaClient, CouponType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

export interface SuggestedCoupon {
  code: string;
  /** Mô tả mức ưu đãi, vd "Giảm 10% (tối đa 300.000₫)". */
  benefit: string;
  /** Điều kiện áp dụng, null nếu không yêu cầu giá trị đơn tối thiểu. */
  condition: string | null;
  minOrderValue: number;
  endsAt: Date;
}

function formatVnd(value: number): string {
  return `${value.toLocaleString("vi-VN")}₫`;
}

function describeCoupon(coupon: {
  type: CouponType;
  value: Prisma.Decimal;
  maxDiscount: Prisma.Decimal | null;
}): string {
  if (coupon.type === CouponType.FREE_SHIPPING) return "Miễn phí vận chuyển";
  if (coupon.type === CouponType.FIXED_AMOUNT) return `Giảm ${formatVnd(Number(coupon.value))}`;
  const cap = coupon.maxDiscount !== null ? ` (tối đa ${formatVnd(Number(coupon.maxDiscount))})` : "";
  return `Giảm ${Number(coupon.value)}%${cap}`;
}

/**
 * Danh sách mã giảm giá ĐANG CHẠY để gợi ý sẵn ở /checkout (trước đây khách
 * phải tự biết mã mới nhập được).
 *
 * Trả về CẢ những mã khách chưa đủ điều kiện (đơn chưa đạt `minOrderValue`) —
 * cố ý, để khách biết mua thêm bao nhiêu thì dùng được, giống cách các trang
 * thương mại điện tử thật hiển thị. Việc quyết định có bấm được hay không nằm ở
 * tầng UI; mọi mã dù sao cũng được `validateCoupon()` kiểm tra lại ở server lúc
 * tạo đơn nên không có rủi ro áp mã sai điều kiện.
 *
 * LƯU Ý: model Coupon KHÔNG có cờ công khai/riêng tư hay đối tượng áp dụng, nên
 * mọi mã đang active đều được liệt kê ở đây. Nếu sau này cần mã riêng cho từng
 * khách (vd mã bù đơn lỗi) thì phải thêm cờ vào schema rồi lọc ở hàm này,
 * không thì mã đó sẽ lộ cho tất cả mọi người.
 *
 * KHÔNG cache: `usedCount` đổi theo từng đơn, mã có thể hết lượt bất cứ lúc nào.
 */
export async function getSuggestedCoupons(): Promise<SuggestedCoupon[]> {
  const now = new Date();
  const coupons = await prisma.coupon.findMany({
    where: {
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
    },
    orderBy: [{ minOrderValue: "asc" }, { code: "asc" }],
  });

  return coupons
    // Hết lượt thì lọc ở JS vì Prisma không so sánh được 2 cột với nhau trong where.
    .filter((c) => c.usageLimit === null || c.usedCount < c.usageLimit)
    .map((c) => {
      const minOrderValue = Number(c.minOrderValue);
      return {
        code: c.code,
        benefit: describeCoupon(c),
        condition: minOrderValue > 0 ? `Đơn từ ${formatVnd(minOrderValue)}` : null,
        minOrderValue,
        endsAt: c.endsAt,
      };
    });
}
