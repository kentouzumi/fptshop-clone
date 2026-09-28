import { prisma } from "@/lib/prisma";

export async function getCartItemCount(userId: string): Promise<number> {
  const result = await prisma.cartItem.aggregate({
    where: { cart: { userId } },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
}

export async function getCartDetail(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        orderBy: { id: "asc" },
        include: {
          variant: {
            include: {
              product: {
                include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
              },
            },
          },
        },
      },
    },
  });

  if (!cart) {
    return { items: [], subtotal: 0 };
  }

  const items = cart.items.map((item) => {
    const unitPrice = Number(item.variant.price);
    return {
      id: item.id,
      quantity: item.quantity,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
      productName: item.variant.product.name,
      productSlug: item.variant.product.slug,
      variantLabel: [item.variant.color, item.variant.storage].filter(Boolean).join(" / "),
      imageUrl: item.variant.product.images[0]?.url ?? null,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return { items, subtotal };
}

export async function addToCart(userId: string, variantId: string, quantity: number) {
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant || !variant.isActive) {
    throw new Error("Sản phẩm không khả dụng.");
  }

  // Chặn bỏ vào giỏ thứ đã hết hàng. Trang chi tiết đã disable nút, nhưng đây
  // là API công khai nên phải tự kiểm tra lại ở server (không tin client).
  // CHỈ chặn khi hết sạch ở MỌI cửa hàng: biến thể còn hàng ở cửa hàng khác
  // vẫn mua được qua hình thức "Nhận tại cửa hàng", chặn ở đây là chặn oan.
  // Không còn cửa hàng nào đang hoạt động -> bỏ qua, khớp nhánh fail-open của
  // reserveStockOrThrow() ở lib/inventory.ts.
  const activeStoreCount = await prisma.store.count({ where: { isActive: true } });
  if (activeStoreCount > 0) {
    const stock = await prisma.inventory.aggregate({
      _sum: { quantity: true },
      where: { variantId, store: { isActive: true } },
    });
    if ((stock._sum.quantity ?? 0) <= 0) {
      throw new Error("Phiên bản này đang hết hàng.");
    }
  }

  const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    update: { quantity: { increment: quantity } },
    create: { cartId: cart.id, variantId, quantity },
  });
}
