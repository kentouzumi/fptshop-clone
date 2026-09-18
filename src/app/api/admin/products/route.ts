import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { parseProductInput } from "@/lib/productInput";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const { isValid, values } = parseProductInput(body);

  if (!isValid) {
    return NextResponse.json(
      { error: "Vui lòng nhập đầy đủ thông tin hợp lệ (tên, slug chỉ gồm a-z 0-9 -, mô tả, danh mục, giá >= 0)." },
      { status: 400 }
    );
  }

  const existing = await prisma.product.findUnique({ where: { slug: values.slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug này đã tồn tại." }, { status: 409 });
  }

  const product = await prisma.product.create({
    data: {
      name: values.name,
      slug: values.slug,
      description: values.description,
      categoryId: values.categoryId,
      brandId: values.brandId,
      basePrice: values.basePrice,
      status: values.status,
      isFeatured: values.isFeatured,
      images: values.imageUrl ? { create: [{ url: values.imageUrl, sortOrder: 0 }] } : undefined,
    },
  });

  return NextResponse.json(product, { status: 201 });
}
