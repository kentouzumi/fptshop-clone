import { prisma } from "@/lib/prisma";

export interface StoreInput {
  name: string;
  province: string;
  district: string;
  address: string;
  phone: string | null;
  openHours: string | null;
  isActive: boolean;
}

export function parseStoreInput(body: unknown): StoreInput | null {
  const b = body as Record<string, unknown>;
  const name = typeof b?.name === "string" ? b.name.trim() : "";
  const province = typeof b?.province === "string" ? b.province.trim() : "";
  const district = typeof b?.district === "string" ? b.district.trim() : "";
  const address = typeof b?.address === "string" ? b.address.trim() : "";
  const phone = typeof b?.phone === "string" && b.phone.trim() ? b.phone.trim() : null;
  const openHours =
    typeof b?.openHours === "string" && b.openHours.trim() ? b.openHours.trim() : null;
  const isActive = b?.isActive !== false;

  if (!name || !province || !district || !address) return null;

  return { name, province, district, address, phone, openHours, isActive };
}

export async function getActiveStores() {
  return prisma.store.findMany({
    where: { isActive: true },
    orderBy: [{ province: "asc" }, { name: "asc" }],
  });
}

export async function getAllStoresForAdmin() {
  return prisma.store.findMany({ orderBy: [{ province: "asc" }, { name: "asc" }] });
}

export async function createStore(input: StoreInput) {
  return prisma.store.create({ data: input });
}

export async function updateStore(id: string, input: StoreInput) {
  return prisma.store.update({ where: { id }, data: input });
}

export async function deleteStore(id: string) {
  const orderCount = await prisma.order.count({ where: { pickupStoreId: id } });
  if (orderCount > 0) {
    throw new Error("Không thể xóa vì cửa hàng này đã được chọn làm điểm nhận hàng cho đơn hàng.");
  }
  await prisma.store.delete({ where: { id } });
}
