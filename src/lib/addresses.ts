import { prisma } from "@/lib/prisma";

export interface AddressInput {
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  streetDetail: string;
  label?: string | null;
}

export function parseAddressInput(body: unknown): AddressInput | null {
  const b = body as Record<string, unknown>;
  const recipientName = typeof b?.recipientName === "string" ? b.recipientName.trim() : "";
  const phone = typeof b?.phone === "string" ? b.phone.trim() : "";
  const province = typeof b?.province === "string" ? b.province.trim() : "";
  const district = typeof b?.district === "string" ? b.district.trim() : "";
  const ward = typeof b?.ward === "string" ? b.ward.trim() : "";
  const streetDetail = typeof b?.streetDetail === "string" ? b.streetDetail.trim() : "";
  const label = typeof b?.label === "string" && b.label.trim() ? b.label.trim() : null;

  if (!recipientName || !phone || !province || !district || !ward || !streetDetail) {
    return null;
  }

  return { recipientName, phone, province, district, ward, streetDetail, label };
}

export async function getAddressesForUser(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { id: "desc" }],
  });
}

export async function getAddress(userId: string, addressId: string) {
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== userId) return null;
  return address;
}

export async function createAddress(userId: string, input: AddressInput, makeDefault: boolean) {
  const count = await prisma.address.count({ where: { userId } });
  const shouldBeDefault = makeDefault || count === 0;

  return prisma.$transaction(async (tx) => {
    if (shouldBeDefault) {
      await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    }
    return tx.address.create({ data: { userId, ...input, isDefault: shouldBeDefault } });
  });
}

export async function updateAddress(
  userId: string,
  addressId: string,
  input: AddressInput,
  makeDefault: boolean
) {
  const existing = await getAddress(userId, addressId);
  if (!existing) {
    throw new Error("Không tìm thấy địa chỉ.");
  }

  return prisma.$transaction(async (tx) => {
    if (makeDefault && !existing.isDefault) {
      await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    }
    return tx.address.update({
      where: { id: addressId },
      data: { ...input, isDefault: makeDefault || existing.isDefault },
    });
  });
}

export async function setDefaultAddress(userId: string, addressId: string) {
  const existing = await getAddress(userId, addressId);
  if (!existing) {
    throw new Error("Không tìm thấy địa chỉ.");
  }

  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } }),
    prisma.address.update({ where: { id: addressId }, data: { isDefault: true } }),
  ]);
}

export async function deleteAddress(userId: string, addressId: string) {
  const existing = await getAddress(userId, addressId);
  if (!existing) {
    throw new Error("Không tìm thấy địa chỉ.");
  }

  // Order.addressId là quan hệ optional (onDelete mặc định SetNull) nên nếu xóa
  // thẳng sẽ âm thầm làm mất địa chỉ giao hàng của đơn hàng cũ - phải chặn trước.
  const usedByOrder = await prisma.order.findFirst({ where: { addressId } });
  if (usedByOrder) {
    throw new Error("Không thể xóa vì địa chỉ này đã được dùng cho đơn hàng.");
  }

  await prisma.address.delete({ where: { id: addressId } });

  if (existing.isDefault) {
    const next = await prisma.address.findFirst({ where: { userId } });
    if (next) {
      await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }
}
