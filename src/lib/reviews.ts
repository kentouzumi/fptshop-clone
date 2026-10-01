import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const REVIEWS_PER_PAGE = 10;

/**
 * Đánh giá của một sản phẩm, PHÂN TRANG.
 *
 * Bản trước load TOÀN BỘ đánh giá của sản phẩm kèm TOÀN BỘ `votes` của từng
 * đánh giá, rồi đếm bằng JS — một sản phẩm 50.000 đánh giá là 50.000 dòng cộng
 * với toàn bộ lượt vote của chúng, cho một trang chi tiết. Giờ:
 *   - tổng số + điểm trung bình lấy bằng `aggregate` ở tầng SQL (2 con số,
 *     không phụ thuộc số đánh giá),
 *   - chỉ load đúng 1 trang đánh giá,
 *   - số lượt vote đếm bằng `groupBy` trên ĐÚNG các đánh giá của trang đó,
 *   - lựa chọn vote của người đang xem là 1 truy vấn riêng, cũng bó trong
 *     trang đó, thay vì lọc ra từ toàn bộ bảng vote.
 */
export async function getProductReviews(
  productId: string,
  currentUserId?: string,
  page = 1
) {
  const [agg, reviews] = await Promise.all([
    prisma.review.aggregate({
      where: { productId, isVisible: true },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.review.findMany({
      where: { productId, isVisible: true },
      orderBy: { createdAt: "desc" },
      skip: (Math.max(1, page) - 1) * REVIEWS_PER_PAGE,
      take: REVIEWS_PER_PAGE,
      include: {
        user: { select: { fullName: true } },
        images: { select: { id: true, url: true } },
      },
    }),
  ]);

  const count = agg._count._all;
  // _avg trả null khi chưa có đánh giá nào hiển thị.
  const average = agg._avg.rating ?? 0;
  const ids = reviews.map((r) => r.id);

  const [voteGroups, myVotes] = await Promise.all([
    ids.length > 0
      ? prisma.reviewVote.groupBy({
          by: ["reviewId", "isHelpful"],
          where: { reviewId: { in: ids } },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    currentUserId && ids.length > 0
      ? prisma.reviewVote.findMany({
          where: { reviewId: { in: ids }, userId: currentUserId },
          select: { reviewId: true, isHelpful: true },
        })
      : Promise.resolve([]),
  ]);

  const helpful = new Map<string, number>();
  const notHelpful = new Map<string, number>();
  for (const g of voteGroups) {
    (g.isHelpful ? helpful : notHelpful).set(g.reviewId, g._count._all);
  }
  const mine = new Map(myVotes.map((v) => [v.reviewId, v.isHelpful]));

  const reviewsWithVotes = reviews.map((review) => ({
    ...review,
    helpfulCount: helpful.get(review.id) ?? 0,
    notHelpfulCount: notHelpful.get(review.id) ?? 0,
    myVote: mine.get(review.id) ?? null,
  }));

  return {
    reviews: reviewsWithVotes,
    count,
    average,
    page: Math.max(1, page),
    totalPages: Math.max(1, Math.ceil(count / REVIEWS_PER_PAGE)),
  };
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

/**
 * Ghi lại điểm trung bình + số đánh giá vào CHÍNH bản ghi Product.
 *
 * Trang danh sách lấy 12 sản phẩm một lúc. Nếu mỗi card tự trung bình từ
 * bảng Review thì phải kéo toàn bộ lịch sử đánh giá của cả 12 sản phẩm về
 * Node chỉ để ra 12 con số — một sản phẩm 50.000 đánh giá là 50.000 dòng cho
 * đúng 1 card. Nên con số được tính một lần tại đây, mỗi khi review đổi.
 *
 * Nhận `client` để gọi được bên trong transaction (xem createReview): tính
 * lại NGOÀI transaction thì một lỗi ở giữa sẽ để lại review đã lưu nhưng con
 * số trên Product sai vĩnh viễn, vì không có job nào quét lại.
 */
export async function recalcProductRating(
  productId: string,
  client: Prisma.TransactionClient = prisma
) {
  const agg = await client.review.aggregate({
    where: { productId, isVisible: true },
    _avg: { rating: true },
    _count: { _all: true },
  });

  await client.product.update({
    where: { id: productId },
    data: {
      // _avg trả null khi không còn đánh giá nào hiển thị.
      avgRating: agg._avg.rating ?? 0,
      reviewCount: agg._count._all,
    },
  });
}

export async function createReview(input: CreateReviewInput) {
  const isVerified = await hasUserPurchasedProduct(input.userId, input.productId);
  const imageUrls = (input.imageUrls ?? []).slice(0, MAX_REVIEW_IMAGES);

  return prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
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

    await recalcProductRating(input.productId, tx);
    return review;
  });
}
