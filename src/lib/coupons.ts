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
 * CHỈ liệt kê mã `isPublic: true`. Mã riêng (isPublic false — vd mã bù cho đơn
 * giao lỗi gửi riêng cho 1 khách) vẫn dùng bình thường nếu khách tự nhập đúng
 * mã, chỉ là không bao giờ xuất hiện trong danh sách gợi ý này.
 *
 * KHÔNG cache: `usedCount` đổi theo từng đơn, mã có thể hết lượt bất cứ lúc nào.
 */
export async function getSuggestedCoupons(): Promise<SuggestedCoupon[]> {
  const now = new Date();
  const coupons = await prisma.coupon.findMany({
    where: {
      isActive: true,
      isPublic: true,
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

// ---------------------------------------------------------------------------
// Quản trị mã giảm giá (admin)
// ---------------------------------------------------------------------------

export interface CouponInput {
  code: string;
  type: CouponType;
  value: number;
  minOrderValue: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  /** true = hiện trong danh sách gợi ý ở /checkout; false = mã riêng, phải tự biết mã. */
  isPublic: boolean;
}

/** Mã chỉ cho chữ HOA/số/gạch để khách gõ lại được — validateCoupon() vốn tự uppercase. */
const COUPON_CODE_PATTERN = /^[A-Z0-9_-]{3,32}$/;

export function parseCouponInput(body: unknown): CouponInput | null {
  const b = body as Record<string, unknown>;

  const code = typeof b?.code === "string" ? b.code.trim().toUpperCase() : "";
  if (!COUPON_CODE_PATTERN.test(code)) return null;

  const type = b?.type;
  if (
    type !== CouponType.PERCENT &&
    type !== CouponType.FIXED_AMOUNT &&
    type !== CouponType.FREE_SHIPPING
  ) {
    return null;
  }

  const startsAt = new Date(String(b?.startsAt));
  const endsAt = new Date(String(b?.endsAt));
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    return null;
  }

  const minOrderValue = Number(b?.minOrderValue ?? 0);
  if (!Number.isInteger(minOrderValue) || minOrderValue < 0) return null;

  const rawLimit = b?.usageLimit;
  const usageLimit =
    rawLimit === null || rawLimit === undefined || rawLimit === "" ? null : Number(rawLimit);
  if (usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit < 1)) return null;

  // Mỗi loại mã dùng `value`/`maxDiscount` theo nghĩa khác nhau, nên chuẩn hóa
  // ngay ở đây thay vì để dữ liệu vô nghĩa lọt vào DB (vd FREE_SHIPPING mà có
  // maxDiscount thì validateCoupon() sẽ bỏ qua, nhưng admin nhìn vào lại tưởng
  // nó có tác dụng).
  let value = Number(b?.value ?? 0);
  let maxDiscount =
    b?.maxDiscount === null || b?.maxDiscount === undefined || b?.maxDiscount === ""
      ? null
      : Number(b.maxDiscount);

  if (type === CouponType.PERCENT) {
    if (!Number.isInteger(value) || value < 1 || value > 100) return null;
    if (maxDiscount !== null && (!Number.isInteger(maxDiscount) || maxDiscount < 1)) return null;
  } else if (type === CouponType.FIXED_AMOUNT) {
    if (!Number.isInteger(value) || value < 1) return null;
    maxDiscount = null; // giảm số tiền cố định thì không có khái niệm "tối đa"
  } else {
    value = 0; // miễn phí ship không dùng tới value
    maxDiscount = null;
  }

  return {
    code,
    type,
    value,
    minOrderValue,
    maxDiscount,
    usageLimit,
    startsAt,
    endsAt,
    isActive: b?.isActive !== false,
    isPublic: b?.isPublic !== false,
  };
}

export async function getAllCouponsForAdmin() {
  return prisma.coupon.findMany({ orderBy: [{ isActive: "desc" }, { endsAt: "desc" }] });
}

/** Số đơn đã dùng từng mã — để cảnh báo trước khi xóa (xem deleteCoupon). */
export async function getCouponOrderCounts(): Promise<Record<string, number>> {
  const rows = await prisma.order.groupBy({
    by: ["couponId"],
    where: { couponId: { not: null } },
    _count: { _all: true },
  });
  const result: Record<string, number> = {};
  for (const row of rows) {
    if (row.couponId) result[row.couponId] = row._count._all;
  }
  return result;
}

async function assertCodeAvailable(code: string, excludeId?: string) {
  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing && existing.id !== excludeId) {
    throw new Error("Mã giảm giá này đã tồn tại.");
  }
}

export async function createCoupon(input: CouponInput) {
  await assertCodeAvailable(input.code);
  // KHÔNG cần revalidateTag: getSuggestedCoupons() cố tình không cache (usedCount
  // đổi theo từng đơn) — nếu sau này thêm cache cho nó thì phải thêm invalidate ở đây.
  return prisma.coupon.create({ data: input });
}

export async function updateCoupon(id: string, input: CouponInput) {
  await assertCodeAvailable(input.code, id);
  return prisma.coupon.update({ where: { id }, data: input });
}

export async function deleteCoupon(id: string) {
  // Order.couponId là quan hệ OPTIONAL nên Prisma mặc định onDelete: SetNull —
  // xóa thẳng sẽ không báo lỗi gì nhưng đơn hàng cũ mất luôn dấu vết đã dùng mã
  // nào (đúng lớp lỗi đã gặp với Address <-> Order). Phải tự chặn ở đây.
  const usedByOrder = await prisma.order.findFirst({ where: { couponId: id } });
  if (usedByOrder) {
    throw new Error(
      "Không thể xóa vì mã này đã được dùng cho đơn hàng. Hãy tắt (bỏ chọn 'Đang hoạt động') thay vì xóa."
    );
  }
  await prisma.coupon.delete({ where: { id } });
}
