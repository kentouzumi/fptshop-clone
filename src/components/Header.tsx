import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getCartItemCount } from "@/lib/cart";
import { getWishlistCount } from "@/lib/wishlist";
import { getUnreadNotificationCount } from "@/lib/notifications";
import LogoutButton from "@/components/LogoutButton";
import SearchAutocomplete from "@/app/products/SearchAutocomplete";

function IconBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function HeartIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 6.75h12l.94 12.219A1.5 1.5 0 0117.445 20.5H6.555a1.5 1.5 0 01-1.495-1.531L6 6.75zM9 6.75V5.25a3 3 0 116 0v1.5"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
      />
    </svg>
  );
}

const ICON_LINK_CLASS =
  "relative flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900";

export default async function Header() {
  const user = await getCurrentUser();
  const cartCount = user ? await getCartItemCount(user.id) : 0;
  const wishlistCount = user ? await getWishlistCount(user.id) : 0;
  const unreadCount = user ? await getUnreadNotificationCount(user.id) : 0;
  const isAdmin = user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN");

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-6 py-3.5">
        <Link href="/" className="shrink-0 font-display text-lg font-bold tracking-tight text-zinc-900">
          FPT<span className="text-accent">.</span>Shop
        </Link>

        <form action="/products" method="GET" className="hidden flex-1 max-w-md sm:flex">
          <SearchAutocomplete />
        </form>

        <div className="ml-auto flex items-center gap-1">
          {user && (
            <>
              <Link href="/wishlist" className={ICON_LINK_CLASS} aria-label="Yêu thích">
                <HeartIcon />
                <IconBadge count={wishlistCount} />
              </Link>
              <Link href="/cart" className={ICON_LINK_CLASS} aria-label="Giỏ hàng">
                <BagIcon />
                <IconBadge count={cartCount} />
              </Link>
              <Link href="/notifications" className={ICON_LINK_CLASS} aria-label="Thông báo">
                <BellIcon />
                <IconBadge count={unreadCount} />
              </Link>
            </>
          )}

          <div className="ml-2 flex items-center gap-3 border-l border-zinc-200 pl-3">
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    href="/admin/products"
                    className="hidden rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-accent hover:text-zinc-900 sm:inline-block"
                  >
                    Quản trị
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-ink">
                    {user.fullName?.trim()?.[0]?.toUpperCase() ?? "K"}
                  </span>
                  <span className="hidden md:inline">{user.fullName}</span>
                </Link>
                <LogoutButton />
              </>
            ) : (
              <Link href="/login" className="btn-primary !px-4 !py-2 text-xs">
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-100 bg-zinc-100/60">
        <nav className="mx-auto flex w-full max-w-6xl items-center gap-6 px-6 py-2 text-sm text-zinc-600">
          <Link href="/products" className="font-medium text-zinc-900 hover:text-zinc-600">
            Sản phẩm
          </Link>
          <Link href="/stores" className="hover:text-zinc-900">
            Cửa hàng
          </Link>
          <Link href="/support" className="hover:text-zinc-900">
            Hỗ trợ
          </Link>
          <Link href="/faq" className="hover:text-zinc-900">
            FAQ
          </Link>
          {user && (
            <Link href="/orders" className="hover:text-zinc-900">
              Đơn hàng của tôi
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
