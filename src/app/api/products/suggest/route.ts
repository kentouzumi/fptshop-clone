import { NextResponse } from "next/server";
import { searchSuggestions } from "@/lib/products";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  const suggestions = await searchSuggestions(q);
  return NextResponse.json(suggestions);
}
