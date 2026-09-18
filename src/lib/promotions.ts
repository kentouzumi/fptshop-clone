import { prisma } from "@/lib/prisma";

export interface PromotionInput {
  title: string;
  description: string | null;
  bannerUrl: string | null;
  linkUrl: string | null;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  sortOrder: number;
}

export function parsePromotionInput(body: unknown): PromotionInput | null {
  const b = body as Record<string, unknown>;
  const title = typeof b?.title === "string" ? b.title.trim() : "";
  const description =
    typeof b?.description === "string" && b.description.trim() ? b.description.trim() : null;
  const bannerUrl = typeof b?.bannerUrl === "string" && b.bannerUrl.trim() ? b.bannerUrl.trim() : null;
  const linkUrl = typeof b?.linkUrl === "string" && b.linkUrl.trim() ? b.linkUrl.trim() : null;
  const startsAt = new Date(String(b?.startsAt));
  const endsAt = new Date(String(b?.endsAt));
  const isActive = b?.isActive !== false;
  const sortOrder = Number.isFinite(Number(b?.sortOrder)) ? Number(b.sortOrder) : 0;

  if (
    title.length < 2 ||
    Number.isNaN(startsAt.getTime()) ||
    Number.isNaN(endsAt.getTime()) ||
    endsAt < startsAt
  ) {
    return null;
  }

  return { title, description, bannerUrl, linkUrl, startsAt, endsAt, isActive, sortOrder };
}

export async function getActivePromotions() {
  const now = new Date();
  return prisma.promotion.findMany({
    where: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getAllPromotionsForAdmin() {
  return prisma.promotion.findMany({ orderBy: [{ sortOrder: "asc" }, { startsAt: "desc" }] });
}

export async function createPromotion(input: PromotionInput) {
  return prisma.promotion.create({ data: input });
}

export async function updatePromotion(id: string, input: PromotionInput) {
  return prisma.promotion.update({ where: { id }, data: input });
}

export async function deletePromotion(id: string) {
  await prisma.promotion.delete({ where: { id } });
}
