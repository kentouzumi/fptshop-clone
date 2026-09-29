/**
 * Trả góp 0% qua công ty tài chính.
 *
 * QUY TẮC MVP TỰ ĐẶT — không phải chính sách thật của FPT Shop hay của các
 * công ty tài chính được nêu tên, giống cách lib/loyalty.ts tự đặt quy tắc
 * tích điểm. Lãi suất luôn 0%: khách trả đúng giá niêm yết, chia thành khoản
 * trả trước + N kỳ bằng nhau, phần lãi do shop chịu.
 *
 * File này CỐ Ý không import Prisma: cả CheckoutForm (client) lẫn ProductCard
 * (client) đều cần tính số tiền góp hàng tháng, import từ file có Prisma sẽ
 * kéo Prisma vào bundle trình duyệt (xem lý do đã tách lib/orderLabels.ts).
 * Phần đụng DB nằm ở lib/orders.ts.
 */

export const INSTALLMENT_INTEREST_RATE = 0;

/** Dưới mức này công ty tài chính không nhận hồ sơ. */
export const MIN_INSTALLMENT_TOTAL = 3_000_000;

export interface InstallmentProvider {
  id: string;
  name: string;
  /** Các kỳ hạn (số tháng) mà nhà cấp vốn này hỗ trợ. */
  months: number[];
  /** Tỷ lệ trả trước bắt buộc, tính trên tổng giá trị đơn hàng. */
  downPaymentPercent: number;
}

export const INSTALLMENT_PROVIDERS: InstallmentProvider[] = [
  { id: "home-credit", name: "Home Credit", months: [6, 9, 12], downPaymentPercent: 20 },
  { id: "hd-saison", name: "HD SAISON", months: [6, 12], downPaymentPercent: 25 },
  { id: "fe-credit", name: "FE Credit", months: [6, 9, 12, 18], downPaymentPercent: 30 },
];

export function isInstallmentEligible(total: number): boolean {
  return Number.isFinite(total) && total >= MIN_INSTALLMENT_TOTAL;
}

export function getInstallmentProvider(id: string): InstallmentProvider | undefined {
  return INSTALLMENT_PROVIDERS.find((p) => p.id === id);
}

export interface InstallmentQuote {
  providerId: string;
  providerName: string;
  months: number;
  downPayment: number;
  monthlyAmount: number;
  interestRate: number;
  /** Tổng giá trị đơn mà gói này áp dụng — luôn bằng downPayment + monthlyAmount * months. */
  total: number;
}

/** Làm tròn LÊN tới 1.000đ — số tiền góp hàng tháng ở VN luôn là bội của 1.000. */
function roundUpThousand(value: number): number {
  return Math.ceil(value / 1000) * 1000;
}

/**
 * Tính 1 gói trả góp. Trả null nếu tổ hợp không hợp lệ (nhà cấp vốn không tồn
 * tại, không hỗ trợ kỳ hạn đó, hoặc đơn chưa đạt mức tối thiểu) — nơi gọi phải
 * tự xử lý null thay vì nhận về một gói bịa.
 */
export function quoteInstallment(
  total: number,
  providerId: string,
  months: number
): InstallmentQuote | null {
  const provider = getInstallmentProvider(providerId);
  if (!provider || !provider.months.includes(months)) return null;
  if (!isInstallmentEligible(total)) return null;

  // Làm tròn SỐ TIỀN GÓP HÀNG THÁNG trước, rồi suy ngược downPayment = tổng -
  // góp * số kỳ. Nhờ vậy downPayment + N kỳ góp luôn khớp CHÍNH XÁC tổng đơn.
  // Làm ngược lại (làm tròn khoản trả trước trước) sẽ để dư/thiếu vài nghìn
  // đồng ở kỳ cuối mà không ai chịu phần lệch đó.
  const monthlyAmount = roundUpThousand(
    (total * (100 - provider.downPaymentPercent)) / 100 / months
  );
  const downPayment = total - monthlyAmount * months;
  if (downPayment < 0) return null;

  return {
    providerId: provider.id,
    providerName: provider.name,
    months,
    downPayment,
    monthlyAmount,
    interestRate: INSTALLMENT_INTEREST_RATE,
    total,
  };
}

/** Toàn bộ gói khả dụng cho 1 tổng tiền, theo đúng thứ tự khai báo nhà cấp vốn. */
export function getInstallmentQuotes(total: number): InstallmentQuote[] {
  if (!isInstallmentEligible(total)) return [];
  return INSTALLMENT_PROVIDERS.flatMap((p) =>
    p.months
      .map((m) => quoteInstallment(total, p.id, m))
      .filter((q): q is InstallmentQuote => q !== null)
  );
}

/**
 * Gói có số tiền góp hàng tháng THẤP NHẤT — dùng cho nhãn "Trả góp 0% từ X
 * đ/tháng" trên card sản phẩm (chữ "từ" chính là gói này).
 */
export function getLowestMonthlyQuote(total: number): InstallmentQuote | null {
  return getInstallmentQuotes(total).reduce<InstallmentQuote | null>(
    (best, q) => (best === null || q.monthlyAmount < best.monthlyAmount ? q : best),
    null
  );
}
