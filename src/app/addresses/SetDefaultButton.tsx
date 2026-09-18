"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetDefaultButton({ addressId }: { addressId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await fetch(`/api/addresses/${addressId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleClick} disabled={loading} className="text-sm text-blue-600 underline disabled:opacity-50">
      Đặt làm mặc định
    </button>
  );
}
