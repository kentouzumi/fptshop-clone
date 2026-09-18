import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getWishlistProducts } from "@/lib/wishlist";
import ProductCard from "@/components/ProductCard";

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const products = await getWishlistProducts(user.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Sản phẩm yêu thích</h1>

      {products.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 p-8 text-center text-zinc-500">
          Bạn chưa có sản phẩm yêu thích nào.
          <div className="mt-4">
            <Link href="/products" className="text-black underline">
              Khám phá sản phẩm
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} initialInWishlist />
          ))}
        </div>
      )}
    </div>
  );
}
