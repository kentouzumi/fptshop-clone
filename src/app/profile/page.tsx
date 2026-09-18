import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ProfileForm from "./ProfileForm";

const QUICK_LINKS = [
  { href: "/addresses", label: "Sổ địa chỉ" },
  { href: "/orders", label: "Đơn hàng của tôi" },
  { href: "/warranty", label: "Bảo hành" },
  { href: "/trade-in", label: "Thu cũ đổi mới" },
  { href: "/loyalty", label: "Điểm thành viên" },
  { href: "/support", label: "Yêu cầu hỗ trợ của tôi" },
];

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto w-full max-w-md px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Hồ sơ của tôi</h1>

      <div className="card p-6">
        <ProfileForm
          initialFullName={user.fullName}
          initialEmail={user.email ?? ""}
          phone={user.phone}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2">
        {QUICK_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="card px-4 py-3 text-sm font-medium text-zinc-700 transition hover:-translate-y-0.5 hover:text-zinc-900 hover:shadow-md"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
