"use client";

import { useState } from "react";

export default function RetryPaymentButton({ orderId }: { orderId: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/pay`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Không thể tạo lại giao dịch thanh toán.");
        return;
      }
      window.location.href = data.paymentUrl;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3">
      <button type="button" onClick={handleClick} disabled={submitting} className="btn-primary !px-4 !py-2 text-sm">
        {submitting ? "Đang chuyển hướng..." : "Thanh toán lại qua MoMo"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
