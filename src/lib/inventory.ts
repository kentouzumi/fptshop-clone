import { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export interface StockCheckItem {
  variantId: string;
  quantity: number;
  productName: string;
}

// Tồn kho MVP: mỗi Inventory là 1 dòng (storeId, variantId, quantity) — KHÔNG
// dùng field `reserved` có sẵn trong schema (giữ nguyên luôn = 0) vì đơn
// giản hóa thành trừ kho NGAY LÚC TẠO ĐƠN thay vì tách 2 bước "giữ chỗ rồi
// mới xuất kho thật lúc giao hàng" — đủ dùng để chặn bán vượt tồn kho, không
// cần thêm state machine riêng cho `reserved` ở quy mô demo này.
//
// STORE_PICKUP: trừ đúng tại kho của cửa hàng khách chọn nhận hàng (rõ ràng,
// không mơ hồ). HOME_DELIVERY: dự án không có khái niệm "kho trung tâm"
// riêng — coi CỬA HÀNG ĐẦU TIÊN (sort theo `id` để LUÔN ra cùng 1 cửa hàng
// mỗi lần gọi, không phụ thuộc thứ tự trả về ngẫu nhiên của DB) trong số các
// cửa hàng đang hoạt động là kho tổng dùng chung cho giao hàng tận nơi. Nếu
// không còn cửa hàng nào đang hoạt động (trường hợp hiếm, admin xóa hết) thì
// BỎ QUA kiểm tra tồn kho cho đơn đó thay vì chặn toàn bộ HOME_DELIVERY —
// tránh 1 cấu hình thiếu sót làm sập cả luồng đặt hàng.
async function resolveInventoryStoreId(
  tx: Tx,
  isStorePickup: boolean,
  pickupStoreId: string | null
): Promise<string | null> {
  if (isStorePickup) return pickupStoreId;

  const warehouseStore = await tx.store.findFirst({
    where: { isActive: true },
    orderBy: { id: "asc" },
    select: { id: true },
  });
  return warehouseStore?.id ?? null;
}

// Kiểm tra VÀ trừ tồn kho cho toàn bộ sản phẩm trong 1 đơn hàng — PHẢI gọi
// bên trong transaction tạo đơn (rollback tự động nếu bất kỳ dòng nào thiếu
// hàng, không trừ dở dang). Ném lỗi rõ ràng nêu tên sản phẩm + số lượng còn
// lại nếu không đủ hàng.
export async function reserveStockOrThrow(
  tx: Tx,
  items: StockCheckItem[],
  options: { isStorePickup: boolean; pickupStoreId: string | null }
): Promise<void> {
  const storeId = await resolveInventoryStoreId(tx, options.isStorePickup, options.pickupStoreId);
  if (!storeId) return; // Không có cửa hàng nào để quản lý tồn kho — bỏ qua kiểm tra.

  for (const item of items) {
    const inventory = await tx.inventory.findUnique({
      where: { storeId_variantId: { storeId, variantId: item.variantId } },
    });
    const available = inventory?.quantity ?? 0;

    if (available < item.quantity) {
      throw new Error(
        `Sản phẩm "${item.productName}" chỉ còn ${available} trong kho, không đủ số lượng bạn đặt (${item.quantity}).`
      );
    }

    await tx.inventory.update({
      where: { storeId_variantId: { storeId, variantId: item.variantId } },
      data: { quantity: { decrement: item.quantity } },
    });
  }
}

// Hoàn lại tồn kho khi đơn hàng bị hủy (CANCELLED) — tính lại ĐÚNG cửa hàng
// đã trừ lúc tạo đơn bằng cùng 1 hàm suy luận (`resolveInventoryStoreId`),
// không cần lưu thêm field nào mới vì kết quả suy luận luôn ổn định (cùng
// input deliveryMethod/pickupStoreId sẽ luôn ra cùng 1 storeId).
export async function releaseStock(
  tx: Tx,
  items: StockCheckItem[],
  options: { isStorePickup: boolean; pickupStoreId: string | null }
): Promise<void> {
  const storeId = await resolveInventoryStoreId(tx, options.isStorePickup, options.pickupStoreId);
  if (!storeId) return;

  for (const item of items) {
    // Dùng upsert vì có thể admin đã lỡ xóa dòng Inventory này sau khi đơn
    // được tạo — tạo lại với đúng số lượng hoàn trả thay vì lỗi "not found".
    await tx.inventory.upsert({
      where: { storeId_variantId: { storeId, variantId: item.variantId } },
      update: { quantity: { increment: item.quantity } },
      create: { storeId, variantId: item.variantId, quantity: item.quantity },
    });
  }
}
