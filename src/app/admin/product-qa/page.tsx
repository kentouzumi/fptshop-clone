import Link from "next/link";
import { getQuestionsForAdmin } from "@/lib/productQa";
import QuestionRow from "./QuestionRow";

export const metadata = { title: "Hỏi đáp sản phẩm" };

function chip(active: boolean) {
  return active
    ? "rounded-full border border-accent bg-accent/10 px-3 py-1.5 text-xs font-medium text-zinc-900"
    : "rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:border-zinc-400";
}

export default async function AdminProductQaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const unansweredOnly = params.unanswered === "1";
  const questions = await getQuestionsForAdmin({ unansweredOnly, search: params.search });

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Hỏi đáp sản phẩm</h1>
      <p className="mb-4 text-sm text-zinc-500">
        Câu hỏi khách đặt dưới trang sản phẩm. Trả lời ở đây sẽ hiện ngay cho khách với nhãn
        &quot;Nhân viên tư vấn&quot;.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href="/admin/product-qa" className={chip(!unansweredOnly)}>
          Tất cả
        </Link>
        <Link href="/admin/product-qa?unanswered=1" className={chip(unansweredOnly)}>
          Chưa trả lời
        </Link>
        <form method="GET" action="/admin/product-qa" className="ml-auto flex gap-2">
          {unansweredOnly && <input type="hidden" name="unanswered" value="1" />}
          <input
            type="text"
            name="search"
            defaultValue={params.search ?? ""}
            placeholder="Tìm theo nội dung hoặc tên sản phẩm"
            className="input max-w-xs text-sm"
          />
          <button type="submit" className="btn-secondary text-sm">
            Tìm
          </button>
        </form>
      </div>

      {questions.length === 0 ? (
        <p className="card p-6 text-sm text-zinc-500">Không có câu hỏi nào khớp bộ lọc.</p>
      ) : (
        <ul className="space-y-3">
          {questions.map((q) => (
            <li key={q.id} className="card p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <Link href={`/products/${q.product.slug}`} className="text-accent hover:underline">
                  {q.product.name}
                </Link>
                <span>·</span>
                <span>{q.user?.fullName ?? "Khách"}</span>
                <span>·</span>
                <span>{q.createdAt.toLocaleString("vi-VN")}</span>
                {!q.isVisible && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
                    Đang ẩn
                  </span>
                )}
                {q.answers.length === 0 && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700">
                    Chưa trả lời
                  </span>
                )}
              </div>

              <p className="text-sm text-zinc-900">{q.content}</p>

              {q.answers.length > 0 && (
                <ul className="mt-3 space-y-2 border-l-2 border-zinc-200 pl-4">
                  {q.answers.map((a) => (
                    <li key={a.id} className="text-sm text-zinc-700">
                      {a.content}
                      <span className="ml-2 text-xs text-zinc-400">
                        {a.isStaff ? "Nhân viên tư vấn" : (a.user?.fullName ?? "Khách")} ·{" "}
                        {a.createdAt.toLocaleDateString("vi-VN")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <QuestionRow
                questionId={q.id}
                isVisible={q.isVisible}
                hasAnswer={q.answers.length > 0}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
