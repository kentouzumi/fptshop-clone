const ERROR_MESSAGES: Record<string, string> = {
  not_configured: "Đăng nhập Google chưa được cấu hình.",
  invalid_state: "Phiên đăng nhập đã hết hạn hoặc không hợp lệ, vui lòng thử lại.",
  email_not_verified: "Email Google của bạn chưa được xác minh.",
  google_failed: "Không đăng nhập được bằng Google, vui lòng thử lại.",
  account_locked: "Tài khoản đã bị khóa.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col px-6 py-16">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Đăng nhập</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Đăng nhập bằng tài khoản Google. Chưa có tài khoản? Lần đầu đăng nhập sẽ tự tạo tài
        khoản mới cho bạn.
      </p>

      <div className="card p-6">
        {error && (
          <p className="mb-4 text-sm text-red-600">
            {ERROR_MESSAGES[error] ?? "Có lỗi xảy ra, vui lòng thử lại."}
          </p>
        )}

        <a
          href="/api/auth/google/start"
          className="btn-primary flex w-full items-center justify-center gap-2.5"
        >
          <GoogleIcon />
          Đăng nhập bằng Google
        </a>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C37.023 39.238 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}
