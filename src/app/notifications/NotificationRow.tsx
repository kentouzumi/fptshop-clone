"use client";

import { useRouter } from "next/navigation";

export default function NotificationRow({
  id,
  title,
  content,
  isRead,
  createdAt,
}: {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}) {
  const router = useRouter();

  async function handleClick() {
    if (isRead) return;
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full rounded-lg border p-4 text-left ${
        isRead ? "border-zinc-200" : "border-accent bg-accent/10"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="font-medium">{title}</p>
        {!isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />}
      </div>
      <p className="mt-1 text-sm text-zinc-600">{content}</p>
      <p className="mt-1 text-xs text-zinc-400">{new Date(createdAt).toLocaleString("vi-VN")}</p>
    </button>
  );
}
