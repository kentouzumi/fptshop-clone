import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/lib/siteUrl";
import OrderLookupForm from "./OrderLookupForm";

export const metadata: Metadata = {
  title: "Tra cứu đơn hàng",
  description:
    "Tra cứu tình trạng đơn hàng bằng mã đơn và số điện thoại người nhận, không cần đăng nhập.",
  alternates: { canonical: absoluteUrl("/tra-cuu-don-hang") },
};

export default function OrderLookupPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Tra cứu đơn hàng</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Nhập mã đơn hàng và số điện thoại người nhận để xem tình trạng đơn, không cần đăng nhập.
        Đơn <strong className="font-medium text-zinc-700">nhận tại cửa hàng</strong> không tra cứu
        được theo cách này (lúc đặt không nhập số điện thoại) — vui lòng{" "}
        <Link href="/login" className="underline hover:text-zinc-900">
          đăng nhập
        </Link>{" "}
        và xem trong mục Đơn hàng của tôi.
      </p>

      <OrderLookupForm />
    </div>
  );
}
