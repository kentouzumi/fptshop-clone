import Link from "next/link";

const FOOTER_LINKS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Mua sắm",
    links: [
      { label: "Tất cả sản phẩm", href: "/products" },
      { label: "Cửa hàng", href: "/stores" },
      { label: "Yêu thích", href: "/wishlist" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { label: "Trung tâm hỗ trợ", href: "/support" },
      { label: "Câu hỏi thường gặp", href: "/faq" },
      { label: "Tra cứu bảo hành", href: "/warranty" },
      { label: "Thu cũ đổi mới", href: "/trade-in" },
    ],
  },
  {
    title: "Tài khoản",
    links: [
      { label: "Đơn hàng của tôi", href: "/orders" },
      { label: "Điểm thành viên", href: "/loyalty" },
      { label: "Sổ địa chỉ", href: "/addresses" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-200 bg-white">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-8 px-6 py-12 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <p className="font-display text-lg font-bold tracking-tight">
            FPT<span className="text-accent">.</span>Shop
          </p>
          <p className="mt-2 max-w-xs text-sm text-zinc-500">
            Dự án học tập mô phỏng chức năng website thương mại điện tử FPT Shop.
          </p>
        </div>
        {FOOTER_LINKS.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-semibold text-zinc-900">{col.title}</p>
            <ul className="mt-3 flex flex-col gap-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-zinc-500 hover:text-zinc-900">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-zinc-100 px-6 py-5 text-center text-xs text-zinc-400">
        © {new Date().getFullYear()} FPT Shop Clone — dự án demo, không phải website chính thức.
      </div>
    </footer>
  );
}
