import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createWarrantyClaim } from "@/lib/warranty";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const warrantyId = typeof body?.warrantyId === "string" ? body.warrantyId : "";
  const issue = typeof body?.issue === "string" ? body.issue.trim() : "";

  if (!warrantyId || issue.length < 10) {
    return NextResponse.json(
      { error: "Vui lòng mô tả sự cố ít nhất 10 ký tự." },
      { status: 400 }
    );
  }

  try {
    const claim = await createWarrantyClaim(user.id, warrantyId, issue);
    return NextResponse.json(claim, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
