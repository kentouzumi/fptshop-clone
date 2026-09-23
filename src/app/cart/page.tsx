import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCartDetail } from "@/lib/cart";
import CartItemRow from "./CartItemRow";

function formatPrice(value: number) {
  return value.toLocaleString("vi-VN") + "₫";
}

export default async function CartPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { items, subtotal } = await getCartDetail(user.id);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Giỏ hàng</h1>

      {items.length === 0 ? (
        <div className="card p-10 text-center text-zinc-500">
          Giỏ hàng của bạn đang trống.
          <div className="mt-4">
            <Link href="/" className="btn-secondary">
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="card divide-y divide-zinc-100">
            {items.map((item) => (
              <CartItemRow key={item.id} item={item} />
            ))}
          </div>

          <div className="card mt-6 flex items-center justify-between p-5">
            <span className="text-lg font-medium">Tổng cộng</span>
            <span className="text-xl font-bold text-accent">{formatPrice(subtotal)}</span>
          </div>

          <Link href="/checkout" className="btn-primary mt-4 w-full !py-3.5">
            Tiến hành thanh toán
          </Link>
        </>
      )}
    </div>
  );
}
