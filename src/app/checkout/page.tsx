import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCartDetail } from "@/lib/cart";
import { getAddressesForUser } from "@/lib/addresses";
import { SHIPPING_FEE } from "@/lib/orders";
import { isMomoConfigured } from "@/lib/momo";
import { getActiveStores } from "@/lib/stores";
import CheckoutForm from "./CheckoutForm";

function formatPrice(value: number) {
  return value.toLocaleString("vi-VN") + "₫";
}

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [{ items, subtotal }, addresses, stores] = await Promise.all([
    getCartDetail(user.id),
    getAddressesForUser(user.id),
    getActiveStores(),
  ]);
  if (items.length === 0) {
    redirect("/cart");
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Thanh toán</h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">Thông tin giao hàng</h2>
          <CheckoutForm
            subtotal={subtotal}
            shippingFee={SHIPPING_FEE}
            savedAddresses={addresses.map((a) => ({
              id: a.id,
              recipientName: a.recipientName,
              phone: a.phone,
              province: a.province,
              district: a.district,
              ward: a.ward,
              streetDetail: a.streetDetail,
              label: a.label,
              isDefault: a.isDefault,
            }))}
            momoAvailable={isMomoConfigured()}
            stores={stores.map((s) => ({
              id: s.id,
              name: s.name,
              province: s.province,
              district: s.district,
              address: s.address,
            }))}
          />
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">Đơn hàng của bạn</h2>
          <div className="card divide-y divide-zinc-100">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between p-3.5 text-sm">
                <span className="text-zinc-700">
                  {item.productName}
                  {item.variantLabel && ` (${item.variantLabel})`} × {item.quantity}
                </span>
                <span className="font-medium text-zinc-900">{formatPrice(item.lineTotal)}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-zinc-500">
            Chọn phương thức thanh toán ở cột bên trái.
          </p>
        </div>
      </div>
    </div>
  );
}
