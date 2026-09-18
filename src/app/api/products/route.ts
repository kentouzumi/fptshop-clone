import { NextRequest, NextResponse } from "next/server";
import { getProducts, type ProductSort } from "@/lib/products";

const VALID_SORTS: ProductSort[] = ["newest", "price_asc", "price_desc"];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const sortParam = searchParams.get("sort");
  const sort = VALID_SORTS.includes(sortParam as ProductSort)
    ? (sortParam as ProductSort)
    : undefined;

  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  const result = await getProducts({
    categorySlug: searchParams.get("category") ?? undefined,
    brandSlug: searchParams.get("brand") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sort,
    page: Number(searchParams.get("page") ?? "1"),
    limit: Number(searchParams.get("limit") ?? "12"),
  });

  return NextResponse.json(result);
}
