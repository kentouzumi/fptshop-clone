"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRequestOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Không gửi được mã xác thực.");
        return;
      }

      setDevCode(data.devCode ?? null);
      setStep("otp");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Xác thực thất bại.");
        return;
      }

      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col px-6 py-16">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Đăng nhập</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Nhập số điện thoại, chúng tôi sẽ gửi mã xác thực. Chưa có tài khoản? Mã xác thực đúng
        lần đầu sẽ tự tạo tài khoản mới cho bạn.
      </p>

      <div className="card p-6">
        {step === "phone" ? (
          <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Số điện thoại</label>
              <input
                type="tel"
                placeholder="09xxxxxxxx"
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary mt-1 w-full">
              {loading ? "Đang gửi..." : "Gửi mã xác thực"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <p className="text-sm text-zinc-600">
              Mã xác thực đã được gửi tới <span className="font-medium text-zinc-900">{phone}</span>.
            </p>
            {devCode && (
              <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs text-amber-700">
                (Chế độ dev, chưa nối SMS thật) Mã của bạn: <b>{devCode}</b>
              </p>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Mã xác thực (6 số)</label>
              <input
                inputMode="numeric"
                maxLength={6}
                className="input text-center text-lg tracking-[0.5em]"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="btn-primary mt-1 w-full"
            >
              {loading ? "Đang xác thực..." : "Xác nhận"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError(null);
              }}
              className="text-sm text-zinc-500 hover:text-zinc-900"
            >
              Đổi số điện thoại
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
