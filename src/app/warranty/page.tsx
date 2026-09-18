import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getWarrantiesForUser, CLAIM_STATUS_LABELS } from "@/lib/warranty";
import WarrantyClaimForm from "./WarrantyClaimForm";

export default async function WarrantyPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const warranties = await getWarrantiesForUser(user.id);
  const now = new Date();

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Bảo hành của tôi</h1>

      {warranties.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 p-8 text-center text-zinc-500">
          Bạn chưa có sản phẩm nào được kích hoạt bảo hành. Bảo hành sẽ được tự động kích hoạt
          khi đơn hàng giao thành công.
        </div>
      ) : (
        <div className="space-y-4">
          {warranties.map((w) => {
            const isExpired = w.warranty.endDate < now || w.warranty.status !== "ACTIVE";
            return (
              <div key={w.orderItemId} className="rounded-lg border border-zinc-200 p-4">
                <p className="font-medium">
                  {w.productName}
                  {w.variantLabel && ` (${w.variantLabel})`}
                </p>
                <p className="text-xs text-zinc-500">Đơn hàng: {w.orderCode}</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Bảo hành: {new Date(w.warranty.startDate).toLocaleDateString("vi-VN")} -{" "}
                  {new Date(w.warranty.endDate).toLocaleDateString("vi-VN")}{" "}
                  {isExpired ? (
                    <span className="text-red-600">(Hết hạn)</span>
                  ) : (
                    <span className="text-green-600">(Còn hiệu lực)</span>
                  )}
                </p>

                {w.warranty.claims.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-zinc-100 pt-3">
                    {w.warranty.claims.map((c) => (
                      <div key={c.id} className="text-sm">
                        <p>{c.issue}</p>
                        <p className="text-xs text-zinc-500">
                          {CLAIM_STATUS_LABELS[c.status]} ·{" "}
                          {new Date(c.createdAt).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {!isExpired && (
                  <div className="mt-3">
                    <WarrantyClaimForm warrantyId={w.warranty.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
