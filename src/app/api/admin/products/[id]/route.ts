import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { parseProductInput } from "@/lib/productInput";

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

  if (values.imageUrl) {
    await prisma.productImage.deleteMany({ where: { productId: id, sortOrder: 0 } });
    await prisma.productImage.create({
      data: { productId: id, url: values.imageUrl, sortOrder: 0 },
    });
  }

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

  return NextResponse.json({ ok: true });
}
