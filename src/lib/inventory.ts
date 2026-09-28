import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

// ============================================================
// Quản lý tồn kho cho ADMIN (khác 3 hàm trên — dùng lúc đặt/hủy đơn tự
// động) — admin tự xem/sửa số lượng từng biến thể tại từng cửa hàng qua
// /admin/inventory.

export interface InventoryStoreInfo {
  id: string;
  name: string;
  isActive: boolean;
}

export interface InventoryRow {
  variantId: string;
  sku: string;
  color: string | null;
  storage: string | null;
  isActive: boolean;
  productName: string;
  productSlug: string;
  // key = storeId — thiếu key nghĩa là chưa có dòng Inventory nào cho tổ
  // hợp (biến thể, cửa hàng) đó (coi như tồn kho = 0, chưa từng được seed).
  quantityByStore: Record<string, number>;
}

export async function getInventoryForAdmin(): Promise<{
  stores: InventoryStoreInfo[];
  rows: InventoryRow[];
}> {
  const [stores, variants] = await Promise.all([
    prisma.store.findMany({ orderBy: { id: "asc" } }),
    prisma.productVariant.findMany({
      include: {
        product: { select: { name: true, slug: true } },
        inventories: { select: { storeId: true, quantity: true } },
      },
      orderBy: [{ product: { name: "asc" } }, { sku: "asc" }],
    }),
  ]);

  const rows: InventoryRow[] = variants.map((v) => ({
    variantId: v.id,
    sku: v.sku,
    color: v.color,
    storage: v.storage,
    isActive: v.isActive,
    productName: v.product.name,
    productSlug: v.product.slug,
    quantityByStore: Object.fromEntries(v.inventories.map((inv) => [inv.storeId, inv.quantity])),
  }));

  return {
    stores: stores.map((s) => ({ id: s.id, name: s.name, isActive: s.isActive })),
    rows,
  };
}

// Admin đặt LẠI số lượng tuyệt đối (không phải cộng/trừ dồn như
// reserveStockOrThrow/releaseStock ở trên) cho 1 biến thể tại 1 cửa hàng —
// dùng upsert vì có thể chưa từng có dòng Inventory nào cho tổ hợp này
// (vd biến thể mới thêm sau lần seed ban đầu).
export async function setInventoryQuantity(
  storeId: string,
  variantId: string,
  quantity: number
) {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error("Số lượng phải là số nguyên >= 0.");
  }

  const [store, variant] = await Promise.all([
    prisma.store.findUnique({ where: { id: storeId } }),
    prisma.productVariant.findUnique({ where: { id: variantId } }),
  ]);
  if (!store || !variant) {
    throw new Error("Không tìm thấy cửa hàng hoặc biến thể.");
  }

  return prisma.inventory.upsert({
    where: { storeId_variantId: { storeId, variantId } },
    update: { quantity },
    create: { storeId, variantId, quantity },
  });
}

// ============================================================================
// Hiển thị tồn kho CHO KHÁCH (trang chi tiết sản phẩm)
// ============================================================================

/** Dưới ngưỡng này thì hiện thẳng con số để tạo cảm giác khan hàng thật. */
export const LOW_STOCK_DISPLAY_THRESHOLD = 5;


export interface VariantStockInfo {
  /** Tổng tồn kho ở MỌI cửa hàng đang hoạt động. */
  total: number;
  /** Tồn kho tại kho phục vụ GIAO TẬN NƠI (cửa hàng đầu tiên đang hoạt động). */
  deliverable: number;
  /** Các cửa hàng đang còn hàng — dùng cho "nhận tại cửa hàng". */
  stores: { name: string; quantity: number }[];
}

export interface ProductStock {
  /**
   * Không còn cửa hàng nào đang hoạt động -> hệ thống KHÔNG quản lý tồn kho,
   * mọi biến thể đều bán được. Đây là trường hợp DUY NHẤT fail-open, khớp
   * đúng với reserveStockOrThrow() ở trên.
   */
  untracked: boolean;
  byVariant: Record<string, VariantStockInfo>;
}

/**
 * Tồn kho của TỪNG biến thể trong 1 sản phẩm, để trang chi tiết hiện đúng
 * "còn hàng / chỉ còn N / hết hàng" thay vì để khách bỏ vào giỏ rồi mới bị
 * chặn lúc đặt hàng.
 *
 * `deliverable` tách riêng khỏi `total` là điểm quan trọng: một biến thể có
 * thể hết hàng ở KHO GIAO HÀNG (cửa hàng đầu tiên — xem resolveInventoryStoreId)
 * nhưng vẫn còn ở cửa hàng khác. Lúc đó đơn giao tận nơi bị chặn còn đơn nhận
 * tại cửa hàng thì không — gộp chung 1 con số sẽ nói dối khách đúng ở trường
 * hợp này.
 *
 * Biến thể KHÔNG có dòng Inventory nào = HẾT HÀNG (không phải "không giới
 * hạn"): reserveStockOrThrow() đọc `inventory?.quantity ?? 0` nên cũng chặn
 * đơn — 2 bên phải hiểu giống nhau.
 *
 * KHÔNG cache: tồn kho thay đổi theo từng đơn hàng, hiện số cũ còn tệ hơn
 * không hiện gì.
 */
export async function getProductStockInfo(productId: string): Promise<ProductStock> {
  const [stores, rows] = await Promise.all([
    prisma.store.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: { id: true, name: true },
    }),
    prisma.inventory.findMany({
      where: { variant: { productId } },
      select: { variantId: true, storeId: true, quantity: true },
    }),
  ]);

  const activeStoreIds = new Set(stores.map((s) => s.id));
  // Cùng quy ước với resolveInventoryStoreId(): cửa hàng đầu tiên theo id là
  // kho dùng cho giao hàng tận nơi.
  const warehouseId = stores[0]?.id ?? null;
  const storeNameById = new Map(stores.map((s) => [s.id, s.name]));

  const byVariant: Record<string, VariantStockInfo> = {};
  for (const row of rows) {
    // Bỏ qua tồn kho ở cửa hàng đã ngừng hoạt động — đơn hàng cũng không lấy
    // từ đó, hiện ra sẽ thành hứa hàng không giao được.
    if (!activeStoreIds.has(row.storeId)) continue;

    const entry = (byVariant[row.variantId] ??= { total: 0, deliverable: 0, stores: [] });
    entry.total += row.quantity;
    if (row.storeId === warehouseId) entry.deliverable = row.quantity;
    if (row.quantity > 0) {
      entry.stores.push({ name: storeNameById.get(row.storeId) ?? "", quantity: row.quantity });
    }
  }

  return { untracked: warehouseId === null, byVariant };
}

export const EMPTY_VARIANT_STOCK: VariantStockInfo = { total: 0, deliverable: 0, stores: [] };

/**
 * Trả về tập id của các sản phẩm ĐÃ HẾT HÀNG trong danh sách truyền vào.
 *
 * TÁCH RIÊNG khỏi `getProducts()` (vốn `unstable_cache` với `revalidate: 60`)
 * và CỐ Ý KHÔNG CACHE: tồn kho đổi theo từng đơn, hiện "còn hàng" cho máy vừa
 * hết đúng là thứ tính năng này sinh ra để tránh. Đổi lại mỗi trang có danh
 * sách sản phẩm tốn thêm 2 query, nhưng cả 2 đều là query gọn theo `in` trên
 * cột đã đánh index.
 *
 * Quy ước "hết hàng" khớp CHÍNH XÁC với điều kiện chặn của
 * `reserveStockOrThrow()`, để card không bao giờ nói khác trang chi tiết:
 * - Không còn cửa hàng nào hoạt động -> KHÔNG đánh dấu gì (fail-open, vì lúc
 *   đặt hàng cũng bỏ qua kiểm tra tồn kho).
 * - Sản phẩm không có biến thể đang bán -> không đánh dấu (không mua được vì
 *   lý do khác, nút mua đã tự disable ở trang chi tiết).
 * - Ngược lại: hết hàng khi MỌI biến thể đang bán đều bằng 0 ở MỌI cửa hàng
 *   đang hoạt động. Còn hàng ở 1 cửa hàng lẻ vẫn mua được qua "Nhận tại cửa
 *   hàng" nên không tính là hết.
 */
export async function getOutOfStockProductIds(productIds: string[]): Promise<Set<string>> {
  if (productIds.length === 0) return new Set();

  const [activeStoreCount, variants] = await Promise.all([
    prisma.store.count({ where: { isActive: true } }),
    prisma.productVariant.findMany({
      where: { productId: { in: productIds }, isActive: true },
      select: {
        productId: true,
        inventories: {
          where: { store: { isActive: true } },
          select: { quantity: true },
        },
      },
    }),
  ]);

  if (activeStoreCount === 0) return new Set();

  // Biến thể chưa có dòng Inventory nào -> tổng 0, khớp với việc
  // reserveStockOrThrow() đọc `inventory?.quantity ?? 0` rồi chặn.
  const hasStockByProduct = new Map<string, boolean>();
  for (const variant of variants) {
    const total = variant.inventories.reduce((sum, row) => sum + row.quantity, 0);
    hasStockByProduct.set(
      variant.productId,
      (hasStockByProduct.get(variant.productId) ?? false) || total > 0
    );
  }

  const outOfStock = new Set<string>();
  for (const [productId, hasStock] of hasStockByProduct) {
    if (!hasStock) outOfStock.add(productId);
  }
  return outOfStock;
}
