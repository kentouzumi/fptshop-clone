import { NextResponse } from "next/server";
import { getProductsForCompare } from "@/lib/products";
import { MAX_COMPARE_ITEMS } from "@/lib/compare";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = (searchParams.get("ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, MAX_COMPARE_ITEMS);

  const products = await getProductsForCompare(ids);
  return NextResponse.json({ products });
}
