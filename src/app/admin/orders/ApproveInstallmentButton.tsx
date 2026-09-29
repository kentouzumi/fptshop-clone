"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ApproveInstallmentButton({
  orderId,
  provider,
}: {
  orderId: string;
  provider: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    // Hỏi lại vì duyệt hồ sơ vừa đánh dấu đã thanh toán vừa đẩy đơn sang
    // "Đã xác nhận" — không có nút hoàn tác.
    if (!confirm(`Xác nhận ${provider} đã duyệt hồ sơ trả góp của đơn này?`)) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/approve-installment`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Duyệt hồ sơ thất bại.");
        return;
      }
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={submitting}
        className="btn-primary !px-4 !py-1.5 text-xs"
      >
        {submitting ? "Đang duyệt..." : "Duyệt hồ sơ trả góp"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
