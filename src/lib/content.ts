import { prisma } from "@/lib/prisma";
import { revalidateTag, unstable_cache } from "next/cache";

const STATIC_PAGES_TAG = "static-pages";
const FAQ_TAG = "faq";

export interface StaticPageInput {
  slug: string;
  title: string;
  content: string;
}

export function parseStaticPageInput(body: unknown): StaticPageInput | null {
  const b = body as Record<string, unknown>;
  const slug = typeof b?.slug === "string" ? b.slug.trim() : "";
  const title = typeof b?.title === "string" ? b.title.trim() : "";
  const content = typeof b?.content === "string" ? b.content.trim() : "";

  if (!/^[a-z0-9-]+$/.test(slug) || title.length < 2 || content.length === 0) return null;
  return { slug, title, content };
}

export const getStaticPage = unstable_cache(
  async (slug: string) => prisma.staticPage.findUnique({ where: { slug } }),
  ["static-page-by-slug"],
  { tags: [STATIC_PAGES_TAG] }
);

export async function getAllStaticPagesForAdmin() {
  return prisma.staticPage.findMany({ orderBy: { title: "asc" } });
}

export async function createStaticPage(input: StaticPageInput) {
  const existing = await prisma.staticPage.findUnique({ where: { slug: input.slug } });
  if (existing) throw new Error("Slug này đã tồn tại.");
  const page = await prisma.staticPage.create({ data: input });
  revalidateTag(STATIC_PAGES_TAG, { expire: 0 });
  return page;
}

export async function updateStaticPage(id: string, input: StaticPageInput) {
  const existing = await prisma.staticPage.findFirst({ where: { slug: input.slug, NOT: { id } } });
  if (existing) throw new Error("Slug này đã tồn tại.");
  const page = await prisma.staticPage.update({ where: { id }, data: input });
  revalidateTag(STATIC_PAGES_TAG, { expire: 0 });
  return page;
}

export async function deleteStaticPage(id: string) {
  await prisma.staticPage.delete({ where: { id } });
  revalidateTag(STATIC_PAGES_TAG, { expire: 0 });
}

export interface FaqInput {
  question: string;
  answer: string;
  sortOrder: number;
}

export function parseFaqInput(body: unknown): FaqInput | null {
  const b = body as Record<string, unknown>;
  const question = typeof b?.question === "string" ? b.question.trim() : "";
  const answer = typeof b?.answer === "string" ? b.answer.trim() : "";
  const sortOrder = Number.isFinite(Number(b?.sortOrder)) ? Number(b.sortOrder) : 0;

  if (question.length < 3 || answer.length === 0) return null;
  return { question, answer, sortOrder };
}

export const getAllFaqItems = unstable_cache(
  async () => prisma.faqItem.findMany({ orderBy: { sortOrder: "asc" } }),
  ["all-faq-items"],
  { tags: [FAQ_TAG] }
);

export async function createFaqItem(input: FaqInput) {
  const item = await prisma.faqItem.create({ data: input });
  revalidateTag(FAQ_TAG, { expire: 0 });
  return item;
}

export async function updateFaqItem(id: string, input: FaqInput) {
  const item = await prisma.faqItem.update({ where: { id }, data: input });
  revalidateTag(FAQ_TAG, { expire: 0 });
  return item;
}

export async function deleteFaqItem(id: string) {
  await prisma.faqItem.delete({ where: { id } });
  revalidateTag(FAQ_TAG, { expire: 0 });
}
