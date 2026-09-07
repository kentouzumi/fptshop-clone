import { prisma } from "@/lib/prisma";
import { ProductStatus, Prisma } from "@prisma/client";

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  category: string;
  imageUrl: string | null;
  minPrice: number;
  maxPrice: number;
  isFeatured: boolean;
}

export interface GetProductsParams {
  categorySlug?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetProductsResult {
  products: ProductListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getProducts(
  params: GetProductsParams = {}
): Promise<GetProductsResult> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(48, Math.max(1, params.limit ?? 12));

  const where: Prisma.ProductWhereInput = {
    status: ProductStatus.ACTIVE,
    ...(params.categorySlug ? { category: { slug: params.categorySlug } } : {}),
    ...(params.search
      ? { name: { contains: params.search, mode: "insensitive" } }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        variants: { select: { price: true }, where: { isActive: true } },
      },
    }),
  ]);

  const products: ProductListItem[] = rows.map((p) => {
    const prices = p.variants.map((v) => Number(v.price));
    const minPrice = prices.length ? Math.min(...prices) : Number(p.basePrice);
    const maxPrice = prices.length ? Math.max(...prices) : Number(p.basePrice);
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: p.brand?.name ?? null,
      category: p.category.name,
      imageUrl: p.images[0]?.url ?? null,
      minPrice,
      maxPrice,
      isFeatured: p.isFeatured,
    };
  });

  return {
    products,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
