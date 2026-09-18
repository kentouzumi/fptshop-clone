import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getNotificationsForUser } from "@/lib/notifications";
import NotificationRow from "./NotificationRow";
import MarkAllReadButton from "./MarkAllReadButton";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const notifications = await getNotificationsForUser(user.id);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Thông báo</h1>
        {notifications.some((n) => !n.isRead) && <MarkAllReadButton />}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 p-8 text-center text-zinc-500">
          Bạn chưa có thông báo nào.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <NotificationRow
              key={n.id}
              id={n.id}
              title={n.title}
              content={n.content}
              isRead={n.isRead}
              createdAt={n.createdAt.toISOString()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
