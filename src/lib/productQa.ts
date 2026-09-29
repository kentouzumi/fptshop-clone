import { prisma } from "@/lib/prisma";
import { Prisma, UserRole } from "@prisma/client";
import { revalidateTag, unstable_cache } from "next/cache";

export const PRODUCT_QA_TAG = "product-qa";

// Re-export để các nơi gọi phía server vẫn import được từ đây như cũ; định
// nghĩa thật nằm ở lib/qaLimits.ts (file thuần, không Prisma) vì client
// component cần dùng.
import {
  MIN_QUESTION_LENGTH,
  MAX_QUESTION_LENGTH,
  MIN_ANSWER_LENGTH,
  MAX_ANSWER_LENGTH,
} from "@/lib/qaLimits";

export { MIN_QUESTION_LENGTH, MAX_QUESTION_LENGTH, MIN_ANSWER_LENGTH, MAX_ANSWER_LENGTH };

export interface QaAnswerView {
  id: string;
  content: string;
  isStaff: boolean;
  authorName: string;
  createdAt: Date;
}

export interface QaQuestionView {
  id: string;
  content: string;
  authorName: string;
  createdAt: Date;
  answers: QaAnswerView[];
}

/**
 * Chỉ hiện HỌ + chữ cái đầu của tên cuối ("Nguyễn Văn A" -> "Nguyễn Văn A.").
 * Câu hỏi hiện công khai cho mọi khách, không cần lộ tên đầy đủ của người hỏi.
 * Tài khoản đã xóa (userId null nhờ quan hệ optional) hiện "Khách".
 */
function displayName(fullName: string | null | undefined): string {
  const name = (fullName ?? "").trim();
  if (!name) return "Khách";
  const parts = name.split(/\s+/);
  if (parts.length === 1) return parts[0];
  return [...parts.slice(0, -1), parts[parts.length - 1][0] + "."].join(" ");
}

export const getProductQa = unstable_cache(
  async (productId: string): Promise<QaQuestionView[]> => {
    const questions = await prisma.productQuestion.findMany({
      where: { productId, isVisible: true },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { fullName: true } },
        answers: {
          orderBy: [{ isStaff: "desc" }, { createdAt: "asc" }],
          include: { user: { select: { fullName: true } } },
        },
      },
    });

    return questions.map((q) => ({
      id: q.id,
      content: q.content,
      authorName: displayName(q.user?.fullName),
      createdAt: q.createdAt,
      answers: q.answers.map((a) => ({
        id: a.id,
        content: a.content,
        isStaff: a.isStaff,
        // Câu trả lời của nhân viên hiện tên shop thay vì tên cá nhân nhân
        // viên — khách quan tâm "shop trả lời", không cần biết ai trả lời.
        authorName: a.isStaff ? "Nhân viên tư vấn" : displayName(a.user?.fullName),
        createdAt: a.createdAt,
      })),
    }));
  },
  ["product-qa"],
  { tags: [PRODUCT_QA_TAG], revalidate: 60 }
);

export async function askQuestion(productId: string, userId: string, content: string) {
  const text = content.trim();
  if (text.length < MIN_QUESTION_LENGTH) {
    throw new Error(`Câu hỏi phải từ ${MIN_QUESTION_LENGTH} ký tự.`);
  }
  if (text.length > MAX_QUESTION_LENGTH) {
    throw new Error(`Câu hỏi tối đa ${MAX_QUESTION_LENGTH} ký tự.`);
  }

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) throw new Error("Không tìm thấy sản phẩm.");

  const question = await prisma.productQuestion.create({
    data: { productId, userId, content: text },
  });
  revalidateTag(PRODUCT_QA_TAG, { expire: 0 });
  return question;
}

/**
 * Trả lời câu hỏi. `isStaff` KHÔNG nhận từ client mà suy ra từ vai trò người
 * đang đăng nhập — nếu để client tự khai thì khách nào cũng gắn được nhãn
 * "Nhân viên tư vấn" cho câu trả lời của mình.
 */
export async function answerQuestion(
  questionId: string,
  userId: string,
  role: UserRole,
  content: string
) {
  const text = content.trim();
  if (text.length < MIN_ANSWER_LENGTH) {
    throw new Error(`Câu trả lời phải từ ${MIN_ANSWER_LENGTH} ký tự.`);
  }
  if (text.length > MAX_ANSWER_LENGTH) {
    throw new Error(`Câu trả lời tối đa ${MAX_ANSWER_LENGTH} ký tự.`);
  }

  const question = await prisma.productQuestion.findUnique({
    where: { id: questionId },
    select: { id: true, isVisible: true },
  });
  if (!question) throw new Error("Không tìm thấy câu hỏi.");
  if (!question.isVisible) throw new Error("Câu hỏi này đã bị ẩn.");

  const answer = await prisma.productAnswer.create({
    data: {
      questionId,
      userId,
      content: text,
      isStaff: role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN,
    },
  });
  revalidateTag(PRODUCT_QA_TAG, { expire: 0 });
  return answer;
}

// ---------------- Admin ----------------

export interface AdminQaQuery {
  /** true = chỉ câu chưa có câu trả lời nào (việc cần làm). */
  unansweredOnly?: boolean;
  search?: string;
}

export async function getQuestionsForAdmin(params: AdminQaQuery = {}) {
  const search = params.search?.trim();
  const where: Prisma.ProductQuestionWhereInput = {
    ...(params.unansweredOnly ? { answers: { none: {} } } : {}),
    ...(search
      ? {
          OR: [
            { content: { contains: search, mode: "insensitive" } },
            { product: { name: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  return prisma.productQuestion.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      product: { select: { name: true, slug: true } },
      user: { select: { fullName: true, email: true } },
      answers: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { fullName: true } } },
      },
    },
  });
}

export async function countUnansweredQuestions() {
  return prisma.productQuestion.count({ where: { isVisible: true, answers: { none: {} } } });
}

/** Ẩn/hiện câu hỏi (spam, nội dung không phù hợp) thay vì xóa hẳn. */
export async function setQuestionVisible(id: string, isVisible: boolean) {
  const question = await prisma.productQuestion.update({ where: { id }, data: { isVisible } });
  revalidateTag(PRODUCT_QA_TAG, { expire: 0 });
  return question;
}
