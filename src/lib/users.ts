import { prisma } from "@/lib/prisma";
import { Prisma, UserRole } from "@prisma/client";

const USER_LIST_PAGE_SIZE = 20;

export async function getAllUsersForAdmin(params: {
  search?: string;
  role?: UserRole;
  page?: number;
}) {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = USER_LIST_PAGE_SIZE;

  const where: Prisma.UserWhereInput = {
    ...(params.role ? { role: params.role } : {}),
    ...(params.search
      ? {
          OR: [
            { fullName: { contains: params.search, mode: "insensitive" as const } },
            { phone: { contains: params.search } },
            { email: { contains: params.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function updateUserRole(actorId: string, targetId: string, role: UserRole) {
  if (actorId === targetId) {
    throw new Error("Không thể tự đổi vai trò của chính mình.");
  }
  return prisma.user.update({ where: { id: targetId }, data: { role } });
}

export async function setUserActive(actorId: string, targetId: string, isActive: boolean) {
  if (actorId === targetId) {
    throw new Error("Không thể tự khóa tài khoản của chính mình.");
  }
  return prisma.user.update({ where: { id: targetId }, data: { isActive } });
}
