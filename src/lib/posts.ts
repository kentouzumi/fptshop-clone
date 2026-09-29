import { prisma } from "@/lib/prisma";
import { PostStatus, Prisma } from "@prisma/client";
import { revalidateTag, unstable_cache } from "next/cache";

export const POSTS_TAG = "posts";

/** Số bài mỗi trang ở /tin-tuc và ở trang quản trị. */
export const POSTS_PAGE_SIZE = 9;

export interface PostInput {
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverUrl: string | null;
  status: PostStatus;
  metaTitle: string | null;
  metaDesc: string | null;
}

export function parsePostInput(body: unknown): PostInput | null {
  const b = body as Record<string, unknown>;
  const slug = typeof b?.slug === "string" ? b.slug.trim() : "";
  const title = typeof b?.title === "string" ? b.title.trim() : "";
  const content = typeof b?.content === "string" ? b.content.trim() : "";
  const excerpt = typeof b?.excerpt === "string" ? b.excerpt.trim() : "";
  const coverUrl = typeof b?.coverUrl === "string" ? b.coverUrl.trim() : "";
  const metaTitle = typeof b?.metaTitle === "string" ? b.metaTitle.trim() : "";
  const metaDesc = typeof b?.metaDesc === "string" ? b.metaDesc.trim() : "";
  const status = b?.status === "PUBLISHED" ? PostStatus.PUBLISHED : PostStatus.DRAFT;

  if (!/^[a-z0-9-]+$/.test(slug) || title.length < 3 || content.length < 10) return null;

  return {
    slug,
    title,
    content,
    excerpt: excerpt || null,
    coverUrl: coverUrl || null,
    status,
    // Cắt theo đúng giới hạn Google thường hiển thị, giống lib/productInput.ts.
    metaTitle: metaTitle ? metaTitle.slice(0, 70) : null,
    metaDesc: metaDesc ? metaDesc.slice(0, 160) : null,
  };
}

/**
 * Chỉ bài ĐÃ XUẤT BẢN và đã tới giờ đăng. So `publishedAt <= now` chứ không
 * chỉ dựa vào `status`: cho phép hẹn giờ đăng bài trong tương lai mà không cần
 * thêm cột nào. Vì vậy cache PHẢI có `revalidate` (bài tới giờ đăng không có
 * thao tác admin nào để gọi revalidateTag) — cùng lý do đã áp dụng cho
 * getActivePromotions().
 */
const publishedWhere = (): Prisma.PostWhereInput => ({
  status: PostStatus.PUBLISHED,
  publishedAt: { lte: new Date() },
});

export const getPublishedPosts = unstable_cache(
  async (page = 1) => {
    const take = POSTS_PAGE_SIZE;
    const skip = (Math.max(1, page) - 1) * take;
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: publishedWhere(),
        orderBy: { publishedAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          coverUrl: true,
          publishedAt: true,
        },
      }),
      prisma.post.count({ where: publishedWhere() }),
    ]);
    return { posts, total, totalPages: Math.max(1, Math.ceil(total / take)) };
  },
  ["published-posts"],
  { tags: [POSTS_TAG], revalidate: 60 }
);

export const getPublishedPostBySlug = unstable_cache(
  async (slug: string) =>
    prisma.post.findFirst({
      where: { slug, ...publishedWhere() },
      include: { author: { select: { fullName: true } } },
    }),
  ["published-post-by-slug"],
  { tags: [POSTS_TAG], revalidate: 60 }
);

/** Bài khác để đọc tiếp, loại chính bài đang xem. */
export const getRelatedPosts = unstable_cache(
  async (excludeId: string, limit = 3) =>
    prisma.post.findMany({
      where: { ...publishedWhere(), NOT: { id: excludeId } },
      orderBy: { publishedAt: "desc" },
      take: limit,
      select: { id: true, slug: true, title: true, coverUrl: true, publishedAt: true },
    }),
  ["related-posts"],
  { tags: [POSTS_TAG], revalidate: 60 }
);

/** Cho sitemap.xml — chỉ cần slug + thời điểm cập nhật. */
export const getPublishedPostsForSitemap = unstable_cache(
  async () =>
    prisma.post.findMany({
      where: publishedWhere(),
      select: { slug: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
    }),
  ["published-posts-sitemap"],
  { tags: [POSTS_TAG], revalidate: 3600 }
);

/**
 * Tăng lượt xem. CỐ Ý không nằm trong hàm đọc bài có cache: đọc bài được cache
 * 60s nên nếu gộp vào thì lượt xem sẽ chỉ tăng mỗi 60s một lần. Cũng KHÔNG
 * throw — đếm lượt xem hỏng không được phép làm vỡ trang đọc bài.
 */
export async function incrementPostView(id: string): Promise<void> {
  try {
    await prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } });
  } catch (e) {
    console.error("[posts] không tăng được lượt xem:", (e as Error).message);
  }
}

// ---------------- Admin ----------------

export async function getAllPostsForAdmin() {
  return prisma.post.findMany({
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    include: { author: { select: { fullName: true } } },
  });
}

export async function getPostByIdForAdmin(id: string) {
  return prisma.post.findUnique({ where: { id } });
}

async function assertSlugAvailable(slug: string, excludeId?: string) {
  const existing = await prisma.post.findFirst({
    where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    select: { id: true },
  });
  if (existing) throw new Error("Đường dẫn (slug) này đã có bài viết khác dùng.");
}

export async function createPost(input: PostInput, authorId: string) {
  await assertSlugAvailable(input.slug);
  const post = await prisma.post.create({
    data: {
      ...input,
      authorId,
      // Đặt mốc đăng ngay lúc chuyển sang PUBLISHED, để `publishedAt` luôn có
      // giá trị cho mọi bài đã xuất bản (điều kiện lọc publishedWhere dựa vào
      // nó — thiếu thì bài sẽ không bao giờ hiện ra dù status đã PUBLISHED).
      publishedAt: input.status === PostStatus.PUBLISHED ? new Date() : null,
    },
  });
  revalidateTag(POSTS_TAG, { expire: 0 });
  return post;
}

export async function updatePost(id: string, input: PostInput) {
  await assertSlugAvailable(input.slug, id);
  const before = await prisma.post.findUnique({ where: { id }, select: { publishedAt: true } });

  const post = await prisma.post.update({
    where: { id },
    data: {
      ...input,
      // Giữ nguyên mốc đăng cũ nếu bài vốn đã xuất bản (sửa lại bài không phải
      // là đăng lại — đẩy publishedAt lên hiện tại sẽ làm bài cũ nhảy lên đầu
      // danh sách một cách vô lý). Chỉ đặt mốc mới khi lần đầu xuất bản.
      publishedAt:
        input.status === PostStatus.PUBLISHED ? (before?.publishedAt ?? new Date()) : null,
    },
  });
  revalidateTag(POSTS_TAG, { expire: 0 });
  return post;
}

export async function deletePost(id: string) {
  await prisma.post.delete({ where: { id } });
  revalidateTag(POSTS_TAG, { expire: 0 });
}
