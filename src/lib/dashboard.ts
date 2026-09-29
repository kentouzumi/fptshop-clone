import { prisma } from "@/lib/prisma";
import { countUnansweredQuestions } from "@/lib/productQa";
import {
  ClaimStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductStatus,
  TicketStatus,
  TradeInStatus,
} from "@prisma/client";

/**
 * Dữ liệu cho trang tổng quan /admin.
 *
 * KHÔNG cache (khác các hàm public trong lib/products.ts, categories.ts...):
 * admin cần thấy đúng số liệu ngay lúc mở trang — một trang báo cáo hiện doanh
 * thu cũ 60 giây là vô dụng, và trang này chỉ vài người mở nên không có lý do
 * tối ưu số query bằng cache.
 *
 * Đơn CANCELLED và RETURNED bị loại khỏi MỌI con số doanh thu: đơn đã hủy/đã
 * trả không phải tiền thu được. Đây là lý do không dùng thẳng `_sum` trên toàn
 * bảng Order.
 */

/** Ngưỡng coi là "sắp hết hàng" — tự đặt cho quy mô demo. */
export const LOW_STOCK_THRESHOLD = 5;

const REVENUE_EXCLUDED: OrderStatus[] = [OrderStatus.CANCELLED, OrderStatus.RETURNED];

/** Đầu ngày hôm nay theo giờ máy chủ. */
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number) {
  const d = startOfToday();
  d.setDate(d.getDate() - n);
  return d;
}

async function revenueSince(since: Date) {
  const result = await prisma.order.aggregate({
    _sum: { grandTotal: true },
    _count: true,
    where: { createdAt: { gte: since }, status: { notIn: REVENUE_EXCLUDED } },
  });
  return {
    // `_sum` trả null khi không có đơn nào khớp — quy về 0 ngay tại đây để
    // tầng UI không phải xử lý null cho từng mốc thời gian.
    revenue: Number(result._sum.grandTotal ?? 0),
    orderCount: result._count,
  };
}

export async function getAdminDashboard() {
  const today = startOfToday();
  const last7 = daysAgo(6); // gồm cả hôm nay -> đúng 7 ngày
  const last30 = daysAgo(29);

  const [
    todayStats,
    week,
    month,
    ordersByStatus,
    recentOrders,
    lowStock,
    pendingBankTransfers,
    openTickets,
    openClaims,
    quotedTradeIns,
    unansweredQuestions,
    productCount,
    activeProductCount,
    customerCount,
  ] = await Promise.all([
    revenueSince(today),
    revenueSince(last7),
    revenueSince(last30),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        code: true,
        status: true,
        grandTotal: true,
        createdAt: true,
        user: { select: { fullName: true } },
      },
    }),
    // Chỉ lấy biến thể CÒN BÁN của sản phẩm CÒN BÁN: kho cạn của sản phẩm đã
    // ngừng bán không phải việc cần xử lý, để lẫn vào sẽ làm danh sách này
    // mất tác dụng nhắc việc.
    prisma.inventory.findMany({
      where: {
        quantity: { lte: LOW_STOCK_THRESHOLD },
        variant: { isActive: true, product: { status: ProductStatus.ACTIVE } },
      },
      orderBy: { quantity: "asc" },
      take: 10,
      select: {
        quantity: true,
        store: { select: { name: true } },
        variant: {
          select: {
            sku: true,
            color: true,
            storage: true,
            product: { select: { name: true, id: true } },
          },
        },
      },
    }),
    // Chuyển khoản chờ xác nhận = việc admin PHẢI tự làm (không có webhook tự
    // đối chiếu, xem mục SePay đã hủy bỏ trong CLAUDE.md) nên đưa lên tổng quan
    // thay vì để admin tự nhớ vào lọc trong danh sách đơn.
    prisma.payment.findMany({
      where: { method: PaymentMethod.BANK_TRANSFER, status: PaymentStatus.PENDING },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        amount: true,
        transactionRef: true,
        order: { select: { id: true, code: true, status: true } },
      },
    }),
    prisma.supportTicket.count({ where: { status: TicketStatus.OPEN } }),
    prisma.warrantyClaim.count({ where: { status: ClaimStatus.RECEIVED } }),
    prisma.tradeInRequest.count({ where: { status: TradeInStatus.QUOTED } }),
    countUnansweredQuestions(),
    prisma.product.count(),
    prisma.product.count({ where: { status: ProductStatus.ACTIVE } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
  ]);

  const statusCounts = Object.fromEntries(
    ordersByStatus.map((row) => [row.status, row._count._all])
  ) as Partial<Record<OrderStatus, number>>;

  return {
    today: todayStats,
    week,
    month,
    statusCounts,
    totalOrders: ordersByStatus.reduce((sum, row) => sum + row._count._all, 0),
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      code: o.code,
      status: o.status,
      grandTotal: Number(o.grandTotal),
      createdAt: o.createdAt,
      customerName: o.user.fullName,
    })),
    lowStock: lowStock.map((row) => ({
      quantity: row.quantity,
      storeName: row.store.name,
      sku: row.variant.sku,
      productId: row.variant.product.id,
      productName: row.variant.product.name,
      variantLabel: [row.variant.color, row.variant.storage].filter(Boolean).join(" / "),
    })),
    pendingBankTransfers: pendingBankTransfers.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      transactionRef: p.transactionRef,
      orderId: p.order.id,
      orderCode: p.order.code,
    })),
    todo: { openTickets, openClaims, quotedTradeIns, unansweredQuestions },
    catalog: { productCount, activeProductCount, customerCount },
  };
}
