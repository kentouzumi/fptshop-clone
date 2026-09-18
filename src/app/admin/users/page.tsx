import Link from "next/link";
import { UserRole } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { getAllUsersForAdmin } from "@/lib/users";
import UserRoleSelect from "./UserRoleSelect";
import ToggleActiveButton from "./ToggleActiveButton";

const ROLE_FILTERS: { label: string; value: UserRole | "" }[] = [
  { label: "Tất cả", value: "" },
  { label: "Khách hàng", value: "CUSTOMER" },
  { label: "Nhân viên", value: "STAFF" },
  { label: "Admin", value: "ADMIN" },
  { label: "Super Admin", value: "SUPER_ADMIN" },
];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; search?: string; page?: string }>;
}) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const role =
    sp.role && Object.values(UserRole).includes(sp.role as UserRole)
      ? (sp.role as UserRole)
      : undefined;
  const search = sp.search?.trim() || undefined;
  const page = sp.page ? Number(sp.page) : 1;

  const { users, total, totalPages } = await getAllUsersForAdmin({ role, search, page });
  const isSuperAdmin = admin!.role === "SUPER_ADMIN";

  function buildHref(overrides: { role?: string; page?: number }) {
    const params = new URLSearchParams();
    const nextRole = overrides.role !== undefined ? overrides.role : role ?? "";
    if (nextRole) params.set("role", nextRole);
    if (search) params.set("search", search);
    const nextPage = overrides.page ?? 1;
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `/admin/users?${qs}` : "/admin/users";
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Quản lý người dùng ({total})</h1>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {ROLE_FILTERS.map((f) => (
            <Link
              key={f.value || "all"}
              href={buildHref({ role: f.value })}
              className={`rounded-full border px-3 py-1 text-sm ${
                (role ?? "") === f.value
                  ? "border-black bg-black text-white"
                  : "border-zinc-300 text-zinc-600 hover:border-black"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        <form action="/admin/users" method="GET" className="flex">
          {role && <input type="hidden" name="role" value={role} />}
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Tên, SĐT hoặc email..."
            className="w-64 rounded-l-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-black"
          />
          <button
            type="submit"
            className="rounded-r-lg border border-l-0 border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:text-black"
          >
            Tìm
          </button>
        </form>
      </div>

      {!isSuperAdmin && (
        <p className="mb-4 text-sm text-zinc-500">
          Chỉ SUPER_ADMIN mới được đổi vai trò người dùng — bạn chỉ có thể khóa/mở khóa tài khoản.
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-2">Họ tên</th>
              <th className="px-4 py-2">SĐT</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Vai trò</th>
              <th className="px-4 py-2">Trạng thái</th>
              <th className="px-4 py-2">Ngày tạo</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === admin!.id;
              return (
                <tr key={u.id} className="border-t border-zinc-100">
                  <td className="px-4 py-2">{u.fullName}</td>
                  <td className="px-4 py-2">{u.phone ?? "-"}</td>
                  <td className="px-4 py-2">{u.email ?? "-"}</td>
                  <td className="px-4 py-2">
                    {isSuperAdmin && !isSelf ? (
                      <UserRoleSelect userId={u.id} role={u.role} />
                    ) : (
                      u.role
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {u.isActive ? (
                      <span className="text-green-600">Hoạt động</span>
                    ) : (
                      <span className="text-red-600">Đã khóa</span>
                    )}
                  </td>
                  <td className="px-4 py-2">{new Date(u.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td className="px-4 py-2 text-right">
                    {!isSelf && <ToggleActiveButton userId={u.id} isActive={u.isActive} />}
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                  Không có người dùng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={buildHref({ page: p })}
              className={`rounded px-3 py-1 text-sm ${
                p === page ? "bg-black text-white" : "border border-zinc-300 text-zinc-600"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
