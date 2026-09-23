"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ConfirmBankTransferButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!confirm("Xác nhận đã kiểm tra tài khoản ngân hàng và nhận được đúng số tiền chuyển khoản?")) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/confirm-bank-transfer`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Xác nhận thất bại.");
        return;
      }
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={submitting}
        className="btn-primary !px-4 !py-1.5 text-xs"
      >
        {submitting ? "Đang xác nhận..." : "Xác nhận đã nhận tiền chuyển khoản"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
