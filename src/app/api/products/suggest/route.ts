import { NextResponse } from "next/server";
import { searchSuggestions } from "@/lib/products";
import { dbUnavailable } from "@/lib/apiError";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  try {
    const suggestions = await searchSuggestions(q);
    return NextResponse.json(suggestions);
  } catch (error) {
    return dbUnavailable("api/products/suggest", error);
  }
}
