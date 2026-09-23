import { NextResponse } from "next/server";
import { verifySepayAuth } from "@/lib/sepay";
import { confirmBankTransferPayment, findPendingBankTransferOrderByTransaction } from "@/lib/orders";

// SePay gọi POST tới đây MỖI KHI tài khoản ngân hàng thật của shop có biến
// động số dư (cả tiền vào lẫn tiền ra) — xem lib/sepay.ts để biết cách cấu
// hình. Route này CHỈ xử lý tiền VÀO khớp đúng 1 đơn BANK_TRANSFER đang chờ,
// mọi trường hợp khác (tiền ra, không khớp đơn nào) đều trả 200 "bỏ qua" chứ
// KHÔNG phải lỗi — SePay gọi webhook cho MỌI giao dịch trên tài khoản, phần
// lớn trong số đó vốn dĩ không liên quan gì tới đơn hàng nào cả.
export async function POST(request: Request) {
  if (!verifySepayAuth(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const transferType = (body as Record<string, unknown>).transferType;
  const content = String(
    (body as Record<string, unknown>).content ?? (body as Record<string, unknown>).description ?? ""
  );
  const code = String((body as Record<string, unknown>).code ?? "");
  const amount = Number((body as Record<string, unknown>).transferAmount ?? 0);
  const sepayTxnId = (body as Record<string, unknown>).id;

  if (transferType !== "in" || (!content && !code) || !amount) {
    return NextResponse.json({ ok: true, matched: false });
  }

  const orderId = await findPendingBankTransferOrderByTransaction(`${content} ${code}`, amount);
  if (!orderId) {
    return NextResponse.json({ ok: true, matched: false });
  }

  try {
    await confirmBankTransferPayment(orderId, {
      note: `Tự động xác nhận qua webhook SePay (giao dịch #${sepayTxnId ?? "?"})`,
    });
    return NextResponse.json({ ok: true, matched: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
