import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { voteReview } from "@/lib/reviews";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (typeof body?.isHelpful !== "boolean") {
    return NextResponse.json({ error: "Thiếu thông tin isHelpful." }, { status: 400 });
  }

  try {
    const result = await voteReview(id, user.id, body.isHelpful);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
