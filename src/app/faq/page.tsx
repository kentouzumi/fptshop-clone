import { getAllFaqItems } from "@/lib/content";

export default async function FaqPage() {
  const items = await getAllFaqItems();

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Câu hỏi thường gặp</h1>

      {items.length === 0 ? (
        <p className="text-zinc-500">Chưa có câu hỏi nào.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <details key={item.id} className="rounded-lg border border-zinc-200 p-4">
              <summary className="cursor-pointer font-medium">{item.question}</summary>
              <p className="mt-2 whitespace-pre-line text-sm text-zinc-700">{item.answer}</p>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
