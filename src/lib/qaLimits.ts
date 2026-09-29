/**
 * Giới hạn độ dài câu hỏi/câu trả lời.
 *
 * Tách riêng khỏi lib/productQa.ts (vốn import Prisma) để CLIENT COMPONENT
 * dùng được mà không kéo Prisma vào bundle trình duyệt — ProductQaSection.tsx
 * cần đúng các con số này để hiện bộ đếm ký tự và khóa nút gửi. Cùng lý do đã
 * tách lib/orderLabels.ts và lib/relationLabels.ts.
 *
 * Server vẫn kiểm tra lại trong askQuestion()/answerQuestion(): đây chỉ là
 * lớp tiện dụng phía giao diện, không phải lớp chặn.
 */
export const MIN_QUESTION_LENGTH = 10;
export const MAX_QUESTION_LENGTH = 500;
export const MIN_ANSWER_LENGTH = 2;
export const MAX_ANSWER_LENGTH = 1000;
