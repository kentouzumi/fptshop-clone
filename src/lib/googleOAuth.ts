const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

// OAuth 2.0 Authorization Code flow tự viết (không dùng NextAuth, giữ nhất
// quán với cách toàn bộ dự án tự viết auth từ đầu — xem lib/auth.ts). Chỉ gọi
// thẳng REST endpoint của Google bằng fetch, không cần thêm SDK nào.

export function isGoogleOAuthConfigured() {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REDIRECT_URI);
}

export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID ?? "",
    redirect_uri: GOOGLE_REDIRECT_URI ?? "",
    response_type: "code",
    scope:
      "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForAccessToken(code: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID ?? "",
      client_secret: GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: GOOGLE_REDIRECT_URI ?? "",
      grant_type: "authorization_code",
    }),
  });
  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.access_token) {
    throw new Error(data?.error_description ?? "Không đổi được mã xác thực Google.");
  }

  return data.access_token as string;
}

export async function getGoogleUserInfo(
  accessToken: string
): Promise<{ email: string; verified_email: boolean; name?: string }> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.email) {
    throw new Error("Không lấy được thông tin tài khoản Google.");
  }

  return { email: data.email, verified_email: Boolean(data.verified_email), name: data.name };
}
