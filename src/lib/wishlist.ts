import { prisma } from "@/lib/prisma";
import { mapProductToListItem, type ProductListItem } from "@/lib/products";

export async function getWishlistCount(userId: string): Promise<number> {
  return prisma.wishlistItem.count({ where: { userId } });
}

export async function isInWishlist(userId: string, productId: string): Promise<boolean> {
  const item = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  return Boolean(item);
}

export async function getWishlistedProductIds(
  userId: string,
  productIds: string[]
): Promise<Set<string>> {
  if (productIds.length === 0) return new Set();
  const items = await prisma.wishlistItem.findMany({
    where: { userId, productId: { in: productIds } },
    select: { productId: true },
  });
  return new Set(items.map((i) => i.productId));
}

export async function addToWishlist(userId: string, productId: string) {
  await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId, productId } },
    update: {},
    create: { userId, productId },
  });
}

export async function removeFromWishlist(userId: string, productId: string) {
  await prisma.wishlistItem.deleteMany({ where: { userId, productId } });
}

export async function getWishlistProducts(userId: string): Promise<ProductListItem[]> {
  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: {
          brand: { select: { name: true } },
          category: { select: { name: true, slug: true } },
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          variants: { select: { price: true }, where: { isActive: true } },
          reviews: { where: { isVisible: true }, select: { rating: true } },
        },
      },
    },
  });

  return items.map((item) => mapProductToListItem(item.product));
}
