import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-zinc-200">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold">
          FPT Shop Clone
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/products">Sản phẩm</Link>
          {user ? (
            <>
              <span className="text-zinc-600">Xin chào, {user.fullName}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login">Đăng nhập</Link>
              <Link
                href="/register"
                className="rounded-full bg-black px-4 py-1.5 text-white"
              >
                Đăng ký
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
