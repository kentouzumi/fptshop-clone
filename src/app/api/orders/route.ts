import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createOrderFromCart, generatePaymentUrlForOrder, type CheckoutInput } from "@/lib/orders";
import { isMomoConfigured } from "@/lib/momo";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const addressId = typeof body?.addressId === "string" && body.addressId ? body.addressId : undefined;
  const note = typeof body?.note === "string" ? body.note.trim() : "";
  const couponCode = typeof body?.couponCode === "string" && body.couponCode.trim() ? body.couponCode.trim() : undefined;
  const paymentMethod = body?.paymentMethod === "MOMO" ? "MOMO" : "COD";
  const deliveryMethod = body?.deliveryMethod === "STORE_PICKUP" ? "STORE_PICKUP" : "HOME_DELIVERY";
  const pickupStoreId =
    typeof body?.pickupStoreId === "string" && body.pickupStoreId ? body.pickupStoreId : undefined;

  if (paymentMethod === "MOMO" && !isMomoConfigured()) {
    return NextResponse.json(
      { error: "Thanh toán MoMo chưa được cấu hình trên hệ thống. Vui lòng chọn COD." },
      { status: 400 }
    );
  }

  if (deliveryMethod === "STORE_PICKUP" && !pickupStoreId) {
    return NextResponse.json({ error: "Vui lòng chọn cửa hàng nhận hàng." }, { status: 400 });
  }

  let newAddress: CheckoutInput["newAddress"];
  if (deliveryMethod === "HOME_DELIVERY" && !addressId) {
    const raw = body?.newAddress ?? body; // hỗ trợ gửi trực tiếp các trường (tương thích cũ)
    const recipientName = typeof raw?.recipientName === "string" ? raw.recipientName.trim() : "";
    const phone = typeof raw?.phone === "string" ? raw.phone.trim() : "";
    const province = typeof raw?.province === "string" ? raw.province.trim() : "";
    const district = typeof raw?.district === "string" ? raw.district.trim() : "";
    const ward = typeof raw?.ward === "string" ? raw.ward.trim() : "";
    const streetDetail = typeof raw?.streetDetail === "string" ? raw.streetDetail.trim() : "";

    if (!recipientName || !phone || !province || !district || !ward || !streetDetail) {
      return NextResponse.json(
        { error: "Vui lòng chọn hoặc nhập đầy đủ thông tin giao hàng." },
        { status: 400 }
      );
    }

    newAddress = { recipientName, phone, province, district, ward, streetDetail };
  }

  try {
    const order = await createOrderFromCart(user.id, {
      addressId,
      newAddress,
      note,
      couponCode,
      paymentMethod,
      deliveryMethod,
      pickupStoreId,
    });

    if (paymentMethod === "MOMO") {
      const paymentUrl = await generatePaymentUrlForOrder(order.id, user.id);
      return NextResponse.json({ id: order.id, code: order.code, paymentUrl }, { status: 201 });
    }

    return NextResponse.json({ id: order.id, code: order.code }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
