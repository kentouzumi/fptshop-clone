import { NextResponse } from "next/server";
import { lookupOrderByCodeAndPhone, maskPhone } from "@/lib/orders";
import { formatAddressLine } from "@/lib/vnAddress";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

/**
 * Tra cứu đơn hàng cho khách chưa đăng nhập (mã đơn + SĐT người nhận).
 * Rate limit chặt hơn các API khác vì đây là endpoint DUY NHẤT trả dữ liệu đơn
 * hàng mà không cần session — không giới hạn thì thành công cụ dò mã đơn.
 */
export async function POST(request: Request) {
  if (isRateLimited(`order-lookup:${getClientIp(request)}`, 10, 5 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Bạn đã thử quá nhiều lần. Vui lòng đợi ít phút rồi thử lại." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code : "";
  const phone = typeof body?.phone === "string" ? body.phone : "";

  if (!code.trim() || !phone.trim()) {
    return NextResponse.json(
      { error: "Vui lòng nhập mã đơn hàng và số điện thoại." },
      { status: 400 }
    );
  }

  const order = await lookupOrderByCodeAndPhone(code, phone);
  if (!order) {
    // Cùng 1 thông báo cho "không có mã này" và "sai số điện thoại" để không
    // lộ việc một mã đơn có tồn tại hay không.
    return NextResponse.json(
      { error: "Không tìm thấy đơn hàng khớp với mã và số điện thoại đã nhập." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    order: {
      code: order.code,
      createdAt: order.createdAt,
      status: order.status,
      deliveryMethod: order.deliveryMethod,
      subtotal: Number(order.subtotal),
      shippingFee: Number(order.shippingFee),
      discountTotal: Number(order.discountTotal),
      grandTotal: Number(order.grandTotal),
      recipientName: order.address!.recipientName,
      // Che bớt SĐT: người tra cứu vốn đã phải biết số này, hiện đủ không thêm
      // thông tin gì mà lại lộ nếu ai đó xem chung màn hình.
      phone: maskPhone(order.address!.phone),
      addressLine: formatAddressLine([
        order.address!.streetDetail,
        order.address!.ward,
        order.address!.district,
        order.address!.province,
      ]),
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        variantLabel: item.variantLabel,
        quantity: item.quantity,
        lineTotal: Number(item.lineTotal),
      })),
      payments: order.payments.map((p) => ({
        id: p.id,
        method: p.method,
        status: p.status,
      })),
      statusHistory: order.statusHistory.map((h) => ({
        id: h.id,
        status: h.status,
        note: h.note,
        createdAt: h.createdAt,
      })),
    },
  });
}
