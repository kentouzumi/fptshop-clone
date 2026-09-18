import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "session_token";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 ngày

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: { userId, refreshToken: token, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { refreshToken: token } });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Header.tsx (nhúng ở layout.tsx, chạy trên MỌI trang) VÀ hầu hết page.tsx cần
// đăng nhập đều tự gọi getCurrentUser() riêng — không cache() thì mỗi trang tốn
// ÍT NHẤT 2 lần round-trip DB chỉ để tra cùng 1 session token trong cùng 1
// request. cache() của React dedupe các lệnh gọi giống hệt nhau (cùng tham số,
// ở đây không có tham số nào) trong CÙNG 1 lượt render server — chỉ query DB
// đúng 1 lần dù gọi getCurrentUser() bao nhiêu lần trong 1 request.
export const getCurrentUser = cache(async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { refreshToken: token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date() || !session.user.isActive) {
    return null;
  }

  return session.user;
});

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    return null;
  }
  return user;
}

export async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return null;
  }
  return user;
}
