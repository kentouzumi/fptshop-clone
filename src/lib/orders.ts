import { prisma } from "@/lib/prisma";
import {
  Prisma,
  PaymentMethod,
  PaymentStatus,
  OrderStatus,
  DeliveryMethod,
  ProductStatus,
} from "@prisma/client";
import { validateCoupon } from "@/lib/coupons";
import { awardPointsForOrder } from "@/lib/loyalty";
import { createWarrantiesForOrder } from "@/lib/warranty";
import { createMomoPaymentUrl, verifyMomoCallback } from "@/lib/momo";
import { reserveStockOrThrow, releaseStock } from "@/lib/inventory";

export const SHIPPING_FEE = 30000;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: "Thanh toán khi nhận hàng (COD)",
  VNPAY: "VNPay",
  MOMO: "Ví MoMo",
  BANK_TRANSFER: "Chuyển khoản ngân hàng (VietQR)",
};

export const DELIVERY_METHOD_LABELS: Record<string, string> = {
  HOME_DELIVERY: "Giao hàng tận nơi",
  STORE_PICKUP: "Nhận tại cửa hàng",
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  PROCESSING: "Đang xử lý",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  RETURN_REQUESTED: "Yêu cầu trả hàng",
  RETURNED: "Đã trả hàng",
};

function generateOrderCode() {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DH${Date.now().toString(36).toUpperCase()}${rand}`;
}

export interface NewAddressInput {
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  streetDetail: string;
}

export interface CheckoutInput {
  addressId?: string; // dùng địa chỉ đã lưu trong sổ địa chỉ
  newAddress?: NewAddressInput; // hoặc nhập địa chỉ mới (sẽ được lưu vào sổ địa chỉ)
  note?: string;
  couponCode?: string;
  paymentMethod?: "COD" | "MOMO" | "BANK_TRANSFER";
  deliveryMethod?: "HOME_DELIVERY" | "STORE_PICKUP";
  pickupStoreId?: string; // bắt buộc nếu deliveryMethod = STORE_PICKUP
}

function generateTxnRef(orderCode: string) {
  return `${orderCode}-${Date.now()}`;
}

export async function createOrderFromCart(userId: string, input: CheckoutInput) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: { include: { variant: { include: { product: true } } } },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new Error("Giỏ hàng đang trống.");
  }

  const subtotal = cart.items.reduce(
    (sum, item) => sum + Number(item.variant.price) * item.quantity,
    0
  );

  const isStorePickup = input.deliveryMethod === "STORE_PICKUP";

  const order = await prisma.$transaction(async (tx) => {
    // Kiểm tra lại TÌNH TRẠNG sản phẩm ngay trong transaction — không tin dữ
    // liệu giỏ hàng đọc trước đó (`cart.items` ở trên). `addToCart()` chỉ
    // chặn thêm sản phẩm đã ẩn/ngừng bán TẠI LÚC THÊM VÀO GIỎ; nếu admin ẩn
    // biến thể hoặc ngừng bán cả sản phẩm SAU KHI khách đã bỏ vào giỏ, nếu
    // không kiểm tra lại ở đây khách vẫn đặt được đơn cho sản phẩm không còn
    // bán nữa. Đọc lại qua `tx` (không phải `prisma`) để nằm trong cùng
    // transaction, tránh còn hở giữa lúc kiểm tra và lúc tạo đơn.
    const variantIds = cart.items.map((item) => item.variantId);
    const currentVariants = await tx.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: { select: { status: true } } },
    });
    const currentVariantById = new Map(currentVariants.map((v) => [v.id, v]));
    for (const item of cart.items) {
      const current = currentVariantById.get(item.variantId);
      if (!current || !current.isActive || current.product.status !== ProductStatus.ACTIVE) {
        throw new Error(
          `Sản phẩm "${item.variant.product.name}"${
            item.variant.color || item.variant.storage
              ? ` (${[item.variant.color, item.variant.storage].filter(Boolean).join(" / ")})`
              : ""
          } hiện không còn khả dụng. Vui lòng xóa khỏi giỏ hàng và thử lại.`
        );
      }
    }

    let couponId: string | null = null;
    let discountTotal = 0;
    let shippingFee = SHIPPING_FEE;

    if (input.couponCode) {
      // Validate lại trong transaction (không tin kết quả preview ở client) để tránh
      // race condition (vd 2 đơn cùng dùng nốt lượt cuối của coupon có usageLimit)
      const result = await validateCoupon(tx, input.couponCode, subtotal);
      couponId = result.couponId;
      discountTotal = result.discountAmount;
      if (result.freeShipping) {
        shippingFee = 0;
      }
      await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
    }

    // Nhận tại cửa hàng thì không phát sinh phí ship (ghi đè sau bước coupon vì FREE_SHIPPING
    // coupon cũng chỉ đưa về 0, không xung đột)
    if (isStorePickup) {
      shippingFee = 0;
    }

    const grandTotal = subtotal + shippingFee - discountTotal;

    const isMomo = input.paymentMethod === "MOMO";
    const isBankTransfer = input.paymentMethod === "BANK_TRANSFER";
    const orderCode = generateOrderCode();
    const momoTxnRef = isMomo ? generateTxnRef(orderCode) : null;

    let addressId: string | null = null;
    let pickupStoreId: string | null = null;

    if (isStorePickup) {
      if (!input.pickupStoreId) {
        throw new Error("Vui lòng chọn cửa hàng nhận hàng.");
      }
      const store = await tx.store.findUnique({ where: { id: input.pickupStoreId } });
      if (!store || !store.isActive) {
        throw new Error("Cửa hàng nhận hàng không hợp lệ.");
      }
      pickupStoreId = store.id;
    } else if (input.addressId) {
      const existing = await tx.address.findUnique({ where: { id: input.addressId } });
      if (!existing || existing.userId !== userId) {
        throw new Error("Địa chỉ giao hàng không hợp lệ.");
      }
      addressId = existing.id;
    } else if (input.newAddress) {
      const addressCount = await tx.address.count({ where: { userId } });
      const address = await tx.address.create({
        data: {
          userId,
          recipientName: input.newAddress.recipientName,
          phone: input.newAddress.phone,
          province: input.newAddress.province,
          district: input.newAddress.district,
          ward: input.newAddress.ward,
          streetDetail: input.newAddress.streetDetail,
          isDefault: addressCount === 0,
        },
      });
      addressId = address.id;
    } else {
      throw new Error("Vui lòng chọn hoặc nhập địa chỉ giao hàng.");
    }

    // Kiểm tra VÀ trừ tồn kho — phải làm SAU khi đã biết chắc pickupStoreId
    // (STORE_PICKUP cần trừ đúng kho của cửa hàng khách chọn) và TRƯỚC khi
    // tạo đơn, để nếu thiếu hàng thì toàn bộ transaction rollback (không tạo
    // đơn dở dang, không trừ lượt coupon oan).
    await reserveStockOrThrow(
      tx,
      cart.items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
        productName: item.variant.product.name,
      })),
      { isStorePickup, pickupStoreId }
    );

    const created = await tx.order.create({
      data: {
        code: orderCode,
        userId,
        addressId,
        pickupStoreId,
        deliveryMethod: isStorePickup ? DeliveryMethod.STORE_PICKUP : DeliveryMethod.HOME_DELIVERY,
        status: OrderStatus.PENDING,
        subtotal,
        shippingFee,
        discountTotal,
        grandTotal,
        couponId,
        note: input.note || null,
        items: {
          create: cart.items.map((item) => ({
            variantId: item.variantId,
            productName: item.variant.product.name,
            variantLabel: [item.variant.color, item.variant.storage]
              .filter(Boolean)
              .join(" / "),
            unitPrice: item.variant.price,
            quantity: item.quantity,
            lineTotal: Number(item.variant.price) * item.quantity,
          })),
        },
        payments: {
          create: {
            method: isMomo
              ? PaymentMethod.MOMO
              : isBankTransfer
                ? PaymentMethod.BANK_TRANSFER
                : PaymentMethod.COD,
            status: PaymentStatus.PENDING,
            amount: grandTotal,
            // Chuyển khoản dùng thẳng mã đơn hàng làm nội dung CK (addInfo gửi
            // cho VietQR) — không có webhook như MoMo nên admin đối chiếu thủ
            // công qua đúng mã này khi soát sao kê ngân hàng.
            transactionRef: isMomo ? momoTxnRef : isBankTransfer ? orderCode : null,
          },
        },
        statusHistory: {
          create: { status: OrderStatus.PENDING, note: "Đơn hàng được tạo" },
        },
      },
    });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return created;
  });

  return order;
}

export async function getOrderDetail(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, address: true, payments: true, pickupStore: true },
  });

  if (!order || order.userId !== userId) return null;
  return order;
}

export async function getOrdersForUser(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
}

// Trạng thái kế tiếp hợp lệ cho từng trạng thái đơn hàng (admin chỉ được chuyển theo đúng luồng này)
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  PROCESSING: [OrderStatus.SHIPPING, OrderStatus.CANCELLED],
  SHIPPING: [OrderStatus.DELIVERED],
  DELIVERED: [OrderStatus.COMPLETED, OrderStatus.RETURN_REQUESTED],
  COMPLETED: [],
  CANCELLED: [],
  RETURN_REQUESTED: [OrderStatus.RETURNED],
  RETURNED: [],
};

const ORDER_LIST_PAGE_SIZE = 20;

export async function getAllOrdersForAdmin(params: {
  status?: OrderStatus;
  search?: string;
  page?: number;
}) {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = ORDER_LIST_PAGE_SIZE;

  const where: Prisma.OrderWhereInput = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.search
      ? {
          OR: [
            { code: { contains: params.search, mode: "insensitive" as const } },
            { user: { fullName: { contains: params.search, mode: "insensitive" as const } } },
            { user: { phone: { contains: params.search } } },
          ],
        }
      : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { items: true, user: true },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function getOrderDetailForAdmin(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      address: true,
      pickupStore: true,
      payments: true,
      user: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus, note?: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { payments: true, items: true },
    });
    if (!order) {
      throw new Error("Không tìm thấy đơn hàng.");
    }

    const allowedNext = ORDER_STATUS_TRANSITIONS[order.status];
    if (!allowedNext.includes(newStatus)) {
      throw new Error(
        `Không thể chuyển đơn hàng từ "${ORDER_STATUS_LABELS[order.status]}" sang "${ORDER_STATUS_LABELS[newStatus]}".`
      );
    }

    await tx.order.update({ where: { id: orderId }, data: { status: newStatus } });
    await tx.orderStatusHistory.create({
      data: { orderId, status: newStatus, note: note || null },
    });

    // COD được thu tiền lúc giao hàng nên tự đánh dấu đã thanh toán khi chuyển sang DELIVERED
    if (newStatus === OrderStatus.DELIVERED) {
      const codPayment = order.payments.find(
        (p) => p.method === PaymentMethod.COD && p.status === PaymentStatus.PENDING
      );
      if (codPayment) {
        await tx.payment.update({
          where: { id: codPayment.id },
          data: { status: PaymentStatus.PAID, paidAt: new Date() },
        });
      }

      // Giao thành công: tích điểm thành viên + phát hành phiếu bảo hành cho từng sản phẩm
      await awardPointsForOrder(tx, order.userId, order.id, Number(order.grandTotal));
      await createWarrantiesForOrder(tx, order.id);
    }

    // Đơn bị hủy: hoàn lại đúng số lượng đã trừ kho lúc tạo đơn (xem
    // reserveStockOrThrow trong createOrderFromCart) — nếu không, kho sẽ bị
    // "mất" vĩnh viễn mỗi lần có đơn hủy dù hàng chưa hề rời khỏi cửa hàng.
    if (newStatus === OrderStatus.CANCELLED) {
      await releaseStock(
        tx,
        order.items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          productName: item.productName,
        })),
        { isStorePickup: order.deliveryMethod === DeliveryMethod.STORE_PICKUP, pickupStoreId: order.pickupStoreId }
      );
    }

    await tx.notification.create({
      data: {
        userId: order.userId,
        type: "ORDER_UPDATE",
        title: `Đơn hàng ${order.code} đã ${ORDER_STATUS_LABELS[newStatus]}`,
        content: note || `Đơn hàng của bạn đã chuyển sang trạng thái "${ORDER_STATUS_LABELS[newStatus]}".`,
      },
    });

    return tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        address: true,
        pickupStore: true,
        payments: true,
        user: true,
        statusHistory: { orderBy: { createdAt: "asc" } },
      },
    });
  });
}

// Xác nhận THỦ CÔNG bởi admin sau khi tự kiểm tra tài khoản ngân hàng thật
// thấy tiền đã về — chuyển khoản VietQR không có webhook báo tự động như
// MoMo/VNPay (xem lib/bankTransfer.ts) nên đây là bước bắt buộc phải có con
// người xác nhận. Idempotent (gọi lại lần 2 không lỗi, không tính điểm/tạo
// thông báo trùng) để admin lỡ bấm 2 lần không sao. Coi thanh toán thành
// công tương đương xác nhận đơn (PENDING -> CONFIRMED) giống hệt cách MoMo
// callback thành công đang làm.
export async function confirmBankTransferPayment(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { payments: true } });
    if (!order) {
      throw new Error("Không tìm thấy đơn hàng.");
    }
    const payment = order.payments.find((p) => p.method === PaymentMethod.BANK_TRANSFER);
    if (!payment) {
      throw new Error("Đơn hàng này không dùng phương thức chuyển khoản ngân hàng.");
    }

    if (payment.status !== PaymentStatus.PAID) {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.PAID, paidAt: new Date() },
      });

      if (order.status === OrderStatus.PENDING) {
        await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.CONFIRMED } });
        await tx.orderStatusHistory.create({
          data: {
            orderId,
            status: OrderStatus.CONFIRMED,
            note: "Admin xác nhận đã nhận được tiền chuyển khoản",
          },
        });
        await tx.notification.create({
          data: {
            userId: order.userId,
            type: "ORDER_UPDATE",
            title: `Đơn hàng ${order.code} đã được xác nhận`,
            content: "Chúng tôi đã nhận được thanh toán chuyển khoản của bạn.",
          },
        });
      }
    }

    return tx.order.findUnique({ where: { id: orderId }, include: { payments: true } });
  });
}

// Tạo URL thanh toán MoMo cho 1 đơn hàng đã tồn tại — dùng lúc đặt hàng lần đầu (paymentMethod=MOMO)
// và cả lúc "Thanh toán lại" cho đơn đã tạo nhưng lần trước bị hủy/lỗi giữa chừng. Mỗi lần gọi tạo
// orderId MỚI gửi cho MoMo (MoMo không cho tái sử dụng orderId cũ để tránh nhầm giao dịch — khác hẳn
// mã đơn hàng `code` của hệ thống mình, vẫn giữ nguyên xuyên suốt).
export async function generatePaymentUrlForOrder(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payments: true } });
  if (!order || order.userId !== userId) {
    throw new Error("Không tìm thấy đơn hàng.");
  }

  const payment = order.payments.find((p) => p.method === PaymentMethod.MOMO);
  if (!payment) {
    throw new Error("Đơn hàng này không thanh toán qua MoMo.");
  }
  if (payment.status !== PaymentStatus.PENDING && payment.status !== PaymentStatus.FAILED) {
    throw new Error("Đơn hàng này đã được thanh toán hoặc không thể thanh toán lại.");
  }

  // Thanh toán lại sau khi lần trước FAILED: đưa Payment về PENDING trước khi tạo giao dịch mới
  if (payment.status === PaymentStatus.FAILED) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.PENDING } });
  }

  const txnRef = generateTxnRef(order.code);
  await prisma.payment.update({ where: { id: payment.id }, data: { transactionRef: txnRef } });

  return createMomoPaymentUrl({
    orderId: txnRef,
    amount: Number(order.grandTotal),
    orderInfo: `Thanh toan don hang ${order.code}`,
  });
}

export type MomoCallbackOutcome =
  | { ok: false; reason: "invalid_signature" | "not_found" | "amount_mismatch" }
  | { ok: true; alreadyProcessed: boolean; success: boolean; orderId: string };

// Dùng chung cho cả return URL (trình duyệt redirect về, GET query string) và IPN (MoMo gọi server-to-
// server, POST JSON body) — caller tự đưa cả 2 dạng về Record<string,string> giống nhau trước khi gọi.
// Idempotent nên gọi 2 lần (return + IPN) cho cùng 1 giao dịch không bị tính 2 lần.
export async function handleMomoCallback(query: Record<string, string>): Promise<MomoCallbackOutcome> {
  const result = verifyMomoCallback(query);
  if (!result.isValidSignature || !result.orderId) {
    return { ok: false, reason: "invalid_signature" };
  }

  const payment = await prisma.payment.findFirst({
    where: { transactionRef: result.orderId, method: PaymentMethod.MOMO },
    include: { order: true },
  });
  if (!payment) {
    return { ok: false, reason: "not_found" };
  }

  if (payment.status !== PaymentStatus.PENDING) {
    return { ok: true, alreadyProcessed: true, success: payment.status === PaymentStatus.PAID, orderId: payment.orderId };
  }

  if (Number(payment.amount) !== result.amount) {
    return { ok: false, reason: "amount_mismatch" };
  }

  if (!result.isSuccess) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.FAILED } });
    return { ok: true, alreadyProcessed: false, success: false, orderId: payment.orderId };
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.PAID, paidAt: new Date() },
    });

    if (payment.order.status === OrderStatus.PENDING) {
      await tx.order.update({ where: { id: payment.orderId }, data: { status: OrderStatus.CONFIRMED } });
      await tx.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: OrderStatus.CONFIRMED,
          note: "Thanh toán MoMo thành công",
        },
      });
      await tx.notification.create({
        data: {
          userId: payment.order.userId,
          type: "ORDER_UPDATE",
          title: `Đơn hàng ${payment.order.code} đã ${ORDER_STATUS_LABELS.CONFIRMED}`,
          content: "Thanh toán MoMo thành công, đơn hàng của bạn đã được xác nhận.",
        },
      });
    }
  });

  return { ok: true, alreadyProcessed: false, success: true, orderId: payment.orderId };
}
