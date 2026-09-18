import { prisma } from "@/lib/prisma";

export async function getProductReviews(productId: string, currentUserId?: string) {
  const reviews = await prisma.review.findMany({
    where: { productId, isVisible: true },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { fullName: true } },
      votes: { select: { userId: true, isHelpful: true } },
      images: { select: { id: true, url: true } },
    },
  });

  const count = reviews.length;
  const average = count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;

  const reviewsWithVotes = reviews.map(({ votes, ...review }) => ({
    ...review,
    helpfulCount: votes.filter((v) => v.isHelpful).length,
    notHelpfulCount: votes.filter((v) => !v.isHelpful).length,
    myVote: currentUserId ? votes.find((v) => v.userId === currentUserId)?.isHelpful ?? null : null,
  }));

  return { reviews: reviewsWithVotes, count, average };
}

export async function voteReview(reviewId: string, userId: string, isHelpful: boolean) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) {
    throw new Error("Không tìm thấy đánh giá.");
  }
  if (review.userId === userId) {
    throw new Error("Không thể tự vote cho đánh giá của chính mình.");
  }

  const existing = await prisma.reviewVote.findUnique({
    where: { reviewId_userId: { reviewId, userId } },
  });

  if (existing && existing.isHelpful === isHelpful) {
    // Bấm lại đúng lựa chọn cũ -> bỏ vote (toggle off)
    await prisma.reviewVote.delete({ where: { id: existing.id } });
  } else if (existing) {
    await prisma.reviewVote.update({ where: { id: existing.id }, data: { isHelpful } });
  } else {
    await prisma.reviewVote.create({ data: { reviewId, userId, isHelpful } });
  }

  const [helpfulCount, notHelpfulCount, myVote] = await Promise.all([
    prisma.reviewVote.count({ where: { reviewId, isHelpful: true } }),
    prisma.reviewVote.count({ where: { reviewId, isHelpful: false } }),
    prisma.reviewVote.findUnique({ where: { reviewId_userId: { reviewId, userId } } }),
  ]);

  return { helpfulCount, notHelpfulCount, myVote: myVote?.isHelpful ?? null };
}

export async function hasUserPurchasedProduct(
  userId: string,
  productId: string
): Promise<boolean> {
  const count = await prisma.orderItem.count({
    where: {
      order: { userId },
      variant: { productId },
    },
  });
  return count > 0;
}

export async function getUserReviewForProduct(userId: string, productId: string) {
  return prisma.review.findUnique({
    where: { productId_userId: { productId, userId } },
  });
}

export const MAX_REVIEW_IMAGES = 5;

export interface CreateReviewInput {
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  content: string;
  imageUrls?: string[];
}

export async function createReview(input: CreateReviewInput) {
  const isVerified = await hasUserPurchasedProduct(input.userId, input.productId);
  const imageUrls = (input.imageUrls ?? []).slice(0, MAX_REVIEW_IMAGES);

  return prisma.review.create({
    data: {
      productId: input.productId,
      userId: input.userId,
      rating: input.rating,
      title: input.title || null,
      content: input.content,
      isVerified,
      images: imageUrls.length > 0 ? { create: imageUrls.map((url) => ({ url })) } : undefined,
    },
    include: { images: true },
  });
}
