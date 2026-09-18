import { prisma } from "@/lib/prisma";

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

export async function getStaticPage(slug: string) {
  return prisma.staticPage.findUnique({ where: { slug } });
}

export async function getAllStaticPagesForAdmin() {
  return prisma.staticPage.findMany({ orderBy: { title: "asc" } });
}

export async function createStaticPage(input: StaticPageInput) {
  const existing = await prisma.staticPage.findUnique({ where: { slug: input.slug } });
  if (existing) throw new Error("Slug này đã tồn tại.");
  return prisma.staticPage.create({ data: input });
}

export async function updateStaticPage(id: string, input: StaticPageInput) {
  const existing = await prisma.staticPage.findFirst({ where: { slug: input.slug, NOT: { id } } });
  if (existing) throw new Error("Slug này đã tồn tại.");
  return prisma.staticPage.update({ where: { id }, data: input });
}

export async function deleteStaticPage(id: string) {
  await prisma.staticPage.delete({ where: { id } });
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

export async function getAllFaqItems() {
  return prisma.faqItem.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function createFaqItem(input: FaqInput) {
  return prisma.faqItem.create({ data: input });
}

export async function updateFaqItem(id: string, input: FaqInput) {
  return prisma.faqItem.update({ where: { id }, data: input });
}

export async function deleteFaqItem(id: string) {
  await prisma.faqItem.delete({ where: { id } });
}
