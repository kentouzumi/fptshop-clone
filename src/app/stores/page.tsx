import { getActiveStores } from "@/lib/stores";

export default async function StoresPage() {
  const stores = await getActiveStores();

  const grouped = new Map<string, typeof stores>();
  for (const s of stores) {
    const list = grouped.get(s.province) ?? [];
    list.push(s);
    grouped.set(s.province, list);
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Hệ thống cửa hàng</h1>

      {stores.length === 0 ? (
        <p className="text-zinc-500">Chưa có cửa hàng nào.</p>
      ) : (
        <div className="space-y-8">
          {[...grouped.entries()].map(([province, list]) => (
            <div key={province}>
              <h2 className="mb-3 text-lg font-semibold">{province}</h2>
              <div className="space-y-3">
                {list.map((s) => (
                  <div key={s.id} className="rounded-lg border border-zinc-200 p-4">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-sm text-zinc-600">
                      {s.address}, {s.district}, {s.province}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-4 text-sm text-zinc-500">
                      {s.phone && <span>SĐT: {s.phone}</span>}
                      {s.openHours && <span>Giờ mở cửa: {s.openHours}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
