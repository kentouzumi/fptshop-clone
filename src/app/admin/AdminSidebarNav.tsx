"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_GROUPS: { title: string; items: { href: string; label: string }[] }[] = [
  {
    title: "Bán hàng",
    items: [
      { href: "/admin/products", label: "Sản phẩm" },
      { href: "/admin/inventory", label: "Tồn kho" },
      { href: "/admin/orders", label: "Đơn hàng" },
      { href: "/admin/categories", label: "Danh mục" },
      { href: "/admin/brands", label: "Thương hiệu" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { href: "/admin/promotions", label: "Khuyến mãi" },
      { href: "/admin/static-pages", label: "Trang tĩnh" },
      { href: "/admin/faq", label: "FAQ" },
    ],
  },
  {
    title: "Chăm sóc khách hàng",
    items: [
      { href: "/admin/warranty-claims", label: "Bảo hành" },
      { href: "/admin/trade-in", label: "Thu cũ đổi mới" },
      { href: "/admin/support", label: "Hỗ trợ" },
    ],
  },
  {
    title: "Hệ thống",
    items: [
      { href: "/admin/users", label: "Người dùng" },
      { href: "/admin/stores", label: "Cửa hàng" },
    ],
  },
];

export default function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            {group.title}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();
  const flatItems = NAV_GROUPS.flatMap((g) => g.items);

  return (
    <div className="-mx-6 mb-4 flex gap-2 overflow-x-auto border-b border-zinc-200 px-6 pb-4 md:hidden">
      {flatItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} className={`chip shrink-0 ${active ? "chip-active" : "chip-inactive"}`}>
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
