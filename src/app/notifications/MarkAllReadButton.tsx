"use client";

import { useRouter } from "next/navigation";

export default function MarkAllReadButton() {
  const router = useRouter();

  async function handleClick() {
    await fetch("/api/notifications", { method: "PATCH" });
    router.refresh();
  }

  return (
    <button onClick={handleClick} className="text-sm text-black underline">
      Đánh dấu tất cả đã đọc
    </button>
  );
}
