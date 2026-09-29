/**
 * Khối "Trả góp 0%" hiện ở trang chi tiết đơn (của khách, của khách tra cứu
 * không đăng nhập, và của admin).
 *
 * Thuần trình bày, nhận prop dạng số/chuỗi nên dùng được ở CẢ Server Component
 * lẫn Client Component — OrderLookupForm là client, nếu component này đụng
 * Prisma thì sẽ kéo Prisma vào bundle trình duyệt.
 */

function formatPrice(value: number) {
  return value.toLocaleString("vi-VN") + "₫";
}

export interface InstallmentPlanView {
  provider: string;
  months: number;
  downPayment: number;
  monthlyAmount: number;
  approved: boolean;
}

export default function InstallmentPlanCard({ plan }: { plan: InstallmentPlanView }) {
  return (
    <div className="card mt-4 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold text-zinc-900">Trả góp 0%</p>
        <span
          className={
            plan.approved
              ? "rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
              : "rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800"
          }
        >
          {plan.approved ? "Hồ sơ đã duyệt" : "Chờ duyệt hồ sơ"}
        </span>
      </div>

      <dl className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-zinc-500">Nhà cấp vốn</dt>
          <dd className="font-medium text-zinc-900">{plan.provider}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-zinc-500">Trả trước</dt>
          <dd className="font-medium text-zinc-900">{formatPrice(plan.downPayment)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-zinc-500">Góp hàng tháng × {plan.months}</dt>
          <dd className="font-semibold text-accent">{formatPrice(plan.monthlyAmount)}</dd>
        </div>
        <div className="flex justify-between border-t border-zinc-100 pt-1.5">
          <dt className="text-zinc-500">Lãi suất</dt>
          <dd className="font-medium text-zinc-900">0%</dd>
        </div>
      </dl>

      {!plan.approved && (
        <p className="mt-3 text-xs text-zinc-500">
          Hồ sơ đang chờ {plan.provider} duyệt. Đơn hàng sẽ được xử lý ngay sau khi hồ sơ được
          duyệt.
        </p>
      )}
    </div>
  );
}
