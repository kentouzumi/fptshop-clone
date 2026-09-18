import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { createReview, MAX_REVIEW_IMAGES } from "@/lib/reviews";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Vui lòng đăng nhập để đánh giá." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const productId = typeof body?.productId === "string" ? body.productId : "";
  const rating = Number(body?.rating);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  const imageUrls = Array.isArray(body?.imageUrls)
    ? body.imageUrls.filter((u: unknown): u is string => typeof u === "string" && u.length > 0)
    : [];

  if (!productId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Vui lòng chọn số sao từ 1 đến 5." },
      { status: 400 }
    );
  }
  if (content.length < 10) {
    return NextResponse.json(
      { error: "Nội dung đánh giá cần ít nhất 10 ký tự." },
      { status: 400 }
    );
  }
  if (imageUrls.length > MAX_REVIEW_IMAGES) {
    return NextResponse.json(
      { error: `Tối đa ${MAX_REVIEW_IMAGES} ảnh cho mỗi đánh giá.` },
      { status: 400 }
    );
  }

  try {
    const review = await createReview({
      productId,
      userId: user.id,
      rating,
      title,
      content,
      imageUrls,
    });
    return NextResponse.json(review, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: "Bạn đã đánh giá sản phẩm này rồi." },
        { status: 409 }
      );
    }
    throw e;
  }
}
