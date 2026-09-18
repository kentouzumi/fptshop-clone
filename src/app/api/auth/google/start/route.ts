import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getGoogleAuthUrl, isGoogleOAuthConfigured } from "@/lib/googleOAuth";

const STATE_COOKIE_NAME = "google_oauth_state";

export async function GET(request: Request) {
  if (!isGoogleOAuthConfigured()) {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "not_configured");
    return NextResponse.redirect(url);
  }

  // "state" chống CSRF: sinh ngẫu nhiên, lưu vào cookie, đối chiếu lại đúng
  // giá trị này ở callback trước khi tin bất kỳ "code" nào Google gửi về.
  const state = randomBytes(16).toString("hex");

  const res = NextResponse.redirect(getGoogleAuthUrl(state));
  res.cookies.set(STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 300, // 5 phút — đủ thời gian người dùng chọn tài khoản Google
  });
  return res;
}
