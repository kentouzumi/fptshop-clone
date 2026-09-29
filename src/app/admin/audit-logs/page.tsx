import Link from "next/link";
import {
  getAuditLogsForAdmin,
  getAuditFilterOptions,
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_LABELS,
} from "@/lib/audit";

export const metadata = { title: "Nhật ký thao tác" };

function buildHref(
  current: Record<string, string | undefined>,
  patch: Record<string, string | undefined>
) {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...current, ...patch })) {
    if (v) next.set(k, v);
  }
  const qs = next.toString();
  return qs ? `/admin/audit-logs?${qs}` : "/admin/audit-logs";
}

function chip(active: boolean) {
  return active
    ? "rounded-full border border-accent bg-accent/10 px-3 py-1.5 text-xs font-medium text-zinc-900"
    : "rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:border-zinc-400";
}

/**
 * Hiện metadata dạng "khóa: giá trị" thay vì đổ nguyên JSON ra màn hình —
 * JSON thô đọc được nhưng chiếm cả dòng và che mất các cột còn lại.
 */
function renderMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return null;
  const entries = Object.entries(metadata as Record<string, unknown>).filter(
    ([, v]) => v !== null && v !== undefined && v !== ""
  );
  if (entries.length === 0) return null;
  return (
    <span className="text-xs text-zinc-500">
      {entries.map(([k, v]) => `${k}: ${String(v)}`).join(" · ")}
    </span>
  );
}

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  // Bỏ "page" khỏi bộ lọc hiện tại (đổi filter nào cũng quay về trang 1).
  const currentFilters = { ...params };
  delete currentFilters.page;

  const [{ logs, total, page, totalPages }, options] = await Promise.all([
    getAuditLogsForAdmin({
      action: params.action,
      entityType: params.entityType,
      search: params.search,
      page: Number(params.page ?? "1"),
    }),
    getAuditFilterOptions(),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Nhật ký thao tác</h1>
      <p className="mb-5 text-sm text-zinc-500">
        Ghi lại các thay đổi quan trọng do quản trị viên thực hiện: sửa giá sản phẩm, đổi trạng thái
        đơn hàng, chỉnh tồn kho, khóa tài khoản, duyệt thanh toán. {total} bản ghi.
      </p>

      <div className="mb-4 space-y-3">
        {options.actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Link href={buildHref(currentFilters, { action: undefined })} className={chip(!params.action)}>
              Tất cả thao tác
            </Link>
            {options.actions.map((a) => (
              <Link
                key={a}
                href={buildHref(currentFilters, { action: a })}
                className={chip(params.action === a)}
              >
                {AUDIT_ACTION_LABELS[a] ?? a}
              </Link>
            ))}
          </div>
        )}
        {options.entityTypes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildHref(currentFilters, { entityType: undefined })}
              className={chip(!params.entityType)}
            >
              Mọi đối tượng
            </Link>
            {options.entityTypes.map((e) => (
              <Link
                key={e}
                href={buildHref(currentFilters, { entityType: e })}
                className={chip(params.entityType === e)}
              >
                {AUDIT_ENTITY_LABELS[e] ?? e}
              </Link>
            ))}
          </div>
        )}
        <form method="GET" action="/admin/audit-logs" className="flex gap-2">
          {Object.entries(currentFilters).map(([k, v]) =>
            k === "search" || !v ? null : <input key={k} type="hidden" name={k} value={v} />
          )}
          <input
            type="text"
            name="search"
            defaultValue={params.search ?? ""}
            placeholder="Tên/email người thao tác, hoặc ID đối tượng"
            className="input max-w-md text-sm"
          />
          <button type="submit" className="btn-secondary text-sm">
            Tìm
          </button>
        </form>
      </div>

      {logs.length === 0 ? (
        <p className="card p-6 text-sm text-zinc-500">Chưa có bản ghi nào khớp bộ lọc.</p>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 text-left text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Thời điểm</th>
                <th className="px-4 py-2.5 font-medium">Người thao tác</th>
                <th className="px-4 py-2.5 font-medium">Thao tác</th>
                <th className="px-4 py-2.5 font-medium">Đối tượng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-zinc-500">
                    {log.createdAt.toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-2.5">
                    {/* userId là quan hệ optional: giữ lại bản ghi kể cả khi
                        tài khoản admin đã bị xóa sau đó — nhật ký mà mất theo
                        người thao tác thì mất hẳn ý nghĩa truy vết. */}
                    {log.user ? (
                      <>
                        <span className="text-zinc-900">{log.user.fullName}</span>
                        {log.user.email && (
                          <span className="block text-xs text-zinc-400">{log.user.email}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-zinc-400">(tài khoản đã xóa)</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-zinc-900">
                      {AUDIT_ACTION_LABELS[log.action] ?? log.action}
                    </span>
                    <span className="block">{renderMetadata(log.metadata)}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    <span className="text-zinc-600">
                      {AUDIT_ENTITY_LABELS[log.entityType] ?? log.entityType}
                    </span>
                    <span className="block font-mono text-zinc-400">{log.entityId}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={buildHref(currentFilters, { page: n === 1 ? undefined : String(n) })}
              className={chip(n === page)}
            >
              {n}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
