import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { addToCart } from "@/lib/cart";

/** Trần số dòng mỗi lần gọi — combo mua kèm chỉ vài món, chặn gọi hàng loạt. */
const MAX_BULK_ITEMS = 10;

/**
 * Thêm NHIỀU biến thể vào giỏ trong 1 lần gọi (nút "mua cả combo").
 * Tách route riêng thay vì để client gọi POST /api/cart/items nhiều lần: 1 lần
 * bấm thì chỉ nên có 1 request, và client không phải tự gộp kết quả từng cái.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Vui lòng đăng nhập để thêm vào giỏ hàng." },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const rawIds = Array.isArray(body?.variantIds) ? body.variantIds : null;
  if (!rawIds || rawIds.length === 0) {
    return NextResponse.json({ error: "Chưa chọn sản phẩm nào." }, { status: 400 });
  }

  // Bỏ trùng: chọn 2 lần cùng 1 biến thể thì addToCart sẽ cộng dồn 2 lần, khách
  // không hề yêu cầu số lượng 2.
  const variantIds = [...new Set(rawIds.filter((v): v is string => typeof v === "string" && !!v))];
  if (variantIds.length === 0 || variantIds.length > MAX_BULK_ITEMS) {
    return NextResponse.json({ error: "Danh sách sản phẩm không hợp lệ." }, { status: 400 });
  }

  // KHÔNG dùng transaction: mỗi món độc lập với nhau, 1 món hết hàng không phải
  // lý do để bỏ luôn các món còn lại. Trả về danh sách lỗi để UI nói rõ món nào
  // không thêm được thay vì im lặng.
  let added = 0;
  const errors: string[] = [];
  for (const variantId of variantIds) {
    try {
      await addToCart(user.id, variantId, 1);
      added++;
    } catch (e) {
      errors.push((e as Error).message);
    }
  }

  if (added === 0) {
    return NextResponse.json({ error: errors[0] ?? "Không thêm được sản phẩm nào." }, { status: 400 });
  }
  return NextResponse.json({ added, errors });
}
