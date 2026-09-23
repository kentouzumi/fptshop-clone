import { getInventoryForAdmin } from "@/lib/inventory";
import InventoryManager from "./InventoryManager";

export default async function AdminInventoryPage() {
  const { stores, rows } = await getInventoryForAdmin();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Tồn kho</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Số lượng được lưu ngay khi bạn rời khỏi ô nhập (không cần nút Lưu
          riêng). Đây là số lượng THẬT dùng để chặn đặt hàng vượt tồn kho —
          xem lib/inventory.ts.
        </p>
      </div>
      <InventoryManager stores={stores} rows={rows} />
    </div>
  );
}
