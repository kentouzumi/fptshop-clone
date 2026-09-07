import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/products";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const result = await getProducts({
    categorySlug: searchParams.get("category") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    page: Number(searchParams.get("page") ?? "1"),
    limit: Number(searchParams.get("limit") ?? "12"),
  });

  return NextResponse.json(result);
}
