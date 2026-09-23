import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { parseProductInput } from "@/lib/productInput";
import { PRODUCTS_TAG } from "@/lib/products";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const { isValid, values } = parseProductInput(body);

  if (!isValid) {
    return NextResponse.json(
      { error: "Vui lòng nhập đầy đủ thông tin hợp lệ (tên, slug chỉ gồm a-z 0-9 -, mô tả, danh mục, giá >= 0)." },
      { status: 400 }
    );
  }

  const existing = await prisma.product.findFirst({
    where: { slug: values.slug, NOT: { id } },
  });
  if (existing) {
    return NextResponse.json({ error: "Slug này đã tồn tại." }, { status: 409 });
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: values.name,
      slug: values.slug,
      description: values.description,
      categoryId: values.categoryId,
      brandId: values.brandId,
      basePrice: values.basePrice,
      status: values.status,
      isFeatured: values.isFeatured,
    },
  });

  // Chỉ thay thế ảnh CẤP SẢN PHẨM (variantId: null) — không đụng tới ảnh đã
  // gắn riêng cho từng biến thể (variantId khác null, hiện chỉ gán được qua
  // script/Prisma Studio, xem ProductGalleryAndBuy.tsx).
  await prisma.productImage.deleteMany({ where: { productId: id, variantId: null } });
  if (values.images.length) {
    await prisma.productImage.createMany({
      data: values.images.map((url, i) => ({ productId: id, url, sortOrder: i })),
    });
  }

  // ProductAttribute không có unique key tự nhiên để upsert từng dòng nên
  // đồng bộ bằng cách xóa hết rồi tạo lại theo đúng danh sách mới gửi lên
  // (cùng pattern đã dùng ở prisma/seed.ts).
  await prisma.productAttribute.deleteMany({ where: { productId: id } });
  if (values.attributes.length) {
    await prisma.productAttribute.createMany({
      data: values.attributes.map((a, i) => ({ productId: id, ...a, sortOrder: i })),
    });
  }

  revalidateTag(PRODUCTS_TAG, { expire: 0 });
  return NextResponse.json(product);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }

  const { id } = await params;
  await prisma.product.delete({ where: { id } });

  revalidateTag(PRODUCTS_TAG, { expire: 0 });
  return NextResponse.json({ ok: true });
}
