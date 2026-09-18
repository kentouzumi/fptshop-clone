import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import AdminSidebarNav, { AdminMobileNav } from "./AdminSidebarNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin) {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl gap-8 px-6 py-8">
      <aside className="hidden w-56 shrink-0 md:block">
        <div className="sticky top-20">
          <div className="mb-6 px-3">
            <Link href="/admin/products" className="text-lg font-semibold tracking-tight text-zinc-900">
              Quản trị
            </Link>
            <p className="mt-0.5 truncate text-xs text-zinc-500">{admin.fullName}</p>
          </div>
          <AdminSidebarNav />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <AdminMobileNav />
        {children}
      </div>
    </div>
  );
}
