import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const OTP_LENGTH = 6;
const OTP_TTL_MS = 5 * 60 * 1000; // 5 phút
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 giây
const MAX_ATTEMPTS = 5;

export function normalizePhone(raw: string): string | null {
  let phone = raw.replace(/[^\d+]/g, "");

  if (phone.startsWith("+84")) phone = "0" + phone.slice(3);
  else if (phone.startsWith("84") && phone.length === 11) phone = "0" + phone.slice(2);

  return /^0\d{9}$/.test(phone) ? phone : null;
}

function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(OTP_LENGTH, "0");
}

export async function requestOtp(phone: string) {
  const recent = await prisma.otpCode.findFirst({
    where: {
      phone,
      createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) },
    },
    orderBy: { createdAt: "desc" },
  });

  if (recent) {
    throw new Error("Vui lòng đợi ít nhất 60 giây trước khi gửi lại mã.");
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);

  await prisma.otpCode.create({
    data: { phone, codeHash, expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  });

  // TODO: tích hợp nhà cung cấp SMS thật (Twilio, eSMS, SpeedSMS...) ở đây.
  // Hiện tại chỉ log ra console server để test luồng khi chưa có SMS gateway.
  console.log(`[OTP] Mã xác thực cho ${phone}: ${code}`);

  return { code };
}

export async function verifyOtp(
  phone: string,
  code: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const otp = await prisma.otpCode.findFirst({
    where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return {
      ok: false,
      error: "Mã đã hết hạn hoặc không tồn tại. Vui lòng gửi lại mã.",
    };
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    return {
      ok: false,
      error: "Bạn đã nhập sai quá số lần cho phép. Vui lòng gửi lại mã.",
    };
  }

  const isValid = await bcrypt.compare(code, otp.codeHash);
  if (!isValid) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, error: "Mã xác thực không đúng." };
  }

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });

  return { ok: true };
}
