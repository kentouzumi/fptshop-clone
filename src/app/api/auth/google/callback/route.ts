import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { exchangeCodeForAccessToken, getGoogleUserInfo } from "@/lib/googleOAuth";

const STATE_COOKIE_NAME = "google_oauth_state";

function loginError(request: Request, error: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE_NAME)?.value;
  cookieStore.delete(STATE_COOKIE_NAME);

  if (!code || !state || !expectedState || state !== expectedState) {
    return loginError(request, "invalid_state");
  }

  let email: string;
  let name: string | undefined;
  try {
    const accessToken = await exchangeCodeForAccessToken(code);
    const info = await getGoogleUserInfo(accessToken);
    if (!info.verified_email) {
      return loginError(request, "email_not_verified");
    }
    email = info.email.toLowerCase();
    name = info.name;
  } catch {
    return loginError(request, "google_failed");
  }

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: { email, fullName: name?.trim() || email, emailVerified: new Date() },
    });
  } else if (!user.emailVerified) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
  }

  if (!user.isActive) {
    return loginError(request, "account_locked");
  }

  await createSession(user.id);

  return NextResponse.redirect(new URL("/", request.url));
}
