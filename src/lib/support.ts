import { prisma } from "@/lib/prisma";
import { TicketCategory, TicketStatus } from "@prisma/client";
import { createNotification } from "@/lib/notifications";

export interface TicketInput {
  fullName: string;
  phone: string;
  email: string | null;
  category: TicketCategory;
  subject: string;
  content: string;
}

export function parseTicketInput(body: unknown): TicketInput | null {
  const b = body as Record<string, unknown>;
  const fullName = typeof b?.fullName === "string" ? b.fullName.trim() : "";
  const phone = typeof b?.phone === "string" ? b.phone.trim() : "";
  const email = typeof b?.email === "string" && b.email.trim() ? b.email.trim() : null;
  const category = Object.values(TicketCategory).includes(b?.category as TicketCategory)
    ? (b.category as TicketCategory)
    : null;
  const subject = typeof b?.subject === "string" ? b.subject.trim() : "";
  const content = typeof b?.content === "string" ? b.content.trim() : "";

  if (!fullName || !phone || !category || subject.length < 3 || content.length < 10) return null;

  return { fullName, phone, email, category, subject, content };
}

export async function createTicket(userId: string, input: TicketInput) {
  return prisma.supportTicket.create({ data: { userId, ...input } });
}

export async function getTicketsForUser(userId: string) {
  return prisma.supportTicket.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export async function getTicketDetail(id: string, userId?: string) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: { replies: { orderBy: { createdAt: "asc" } } },
  });
  if (!ticket) return null;
  if (userId && ticket.userId !== userId) return null;
  return ticket;
}

export async function getAllTicketsForAdmin(status?: TicketStatus) {
  return prisma.supportTicket.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export async function addReply(ticketId: string, isStaff: boolean, content: string) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error("Không tìm thấy yêu cầu hỗ trợ.");

  const reply = await prisma.ticketReply.create({ data: { ticketId, isStaff, content } });

  if (isStaff && ticket.status === "OPEN") {
    await prisma.supportTicket.update({ where: { id: ticketId }, data: { status: "IN_PROGRESS" } });
  }

  if (isStaff && ticket.userId) {
    await createNotification(
      ticket.userId,
      "SYSTEM",
      `Phản hồi mới cho yêu cầu "${ticket.subject}"`,
      content.slice(0, 200)
    );
  }

  return reply;
}

export async function updateTicketStatus(id: string, status: TicketStatus) {
  return prisma.supportTicket.update({ where: { id }, data: { status } });
}

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  ORDER_ISSUE: "Vấn đề đơn hàng",
  TECHNICAL_SUPPORT: "Hỗ trợ kỹ thuật",
  COMPLAINT: "Khiếu nại",
  WARRANTY: "Bảo hành",
  OTHER: "Khác",
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Mới",
  IN_PROGRESS: "Đang xử lý",
  RESOLVED: "Đã giải quyết",
  CLOSED: "Đã đóng",
};
