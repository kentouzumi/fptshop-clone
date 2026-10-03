/**
 * Định dạng ngày AN TOÀN cho dữ liệu có thể đã đi qua `unstable_cache`.
 *
 * VÌ SAO CẦN FILE NÀY — cái bẫy đã làm 500 toàn bộ trang Tin tức trên
 * production: `unstable_cache` SERIALIZE giá trị trả về ra JSON. Khi cache
 * MISS thì hàm trả về giá trị vừa tính, `publishedAt` là `Date` thật nên
 * `.toLocaleDateString()` chạy bình thường. Nhưng khi cache HIT thì giá trị
 * được đọc lại từ store đã JSON hoá, `Date` lúc đó là một CHUỖI — gọi method
 * của Date trên nó ném `TypeError: x.toLocaleDateString is not a function` và
 * cả trang thành 500.
 *
 * Nguy hiểm ở chỗ TypeScript KHÔNG bắt được: kiểu trả về của hàm vẫn khai là
 * `Date` nên `tsc` hoàn toàn sạch, và lúc mới viết tính năng thì cache còn
 * lạnh (luôn MISS) nên test cũng pass. Lỗi chỉ lộ ra sau khi cache ấm lên.
 * `?.` cũng không cứu được vì chuỗi không phải null — nó đi tiếp rồi mới chết.
 *
 * QUY TẮC: dữ liệu lấy từ BẤT KỲ hàm nào bọc `unstable_cache` thì phải đi qua
 * các hàm dưới đây trước khi gọi method của Date, đừng tin kiểu khai báo.
 */
export type DateLike = Date | string | null | undefined;

/** Trả về `Date` hợp lệ, hoặc `null` nếu rỗng/không parse được. */
export function toDate(value: DateLike): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Ngày dạng Việt Nam (31/12/2026). Chuỗi rỗng nếu không có ngày hợp lệ. */
export function formatVnDate(value: DateLike): string {
  return toDate(value)?.toLocaleDateString("vi-VN") ?? "";
}

/** Ngày + giờ dạng Việt Nam. Chuỗi rỗng nếu không có ngày hợp lệ. */
export function formatVnDateTime(value: DateLike): string {
  return toDate(value)?.toLocaleString("vi-VN") ?? "";
}

/**
 * Dạng ISO cho metadata/JSON-LD. Trả `undefined` (KHÔNG phải chuỗi rỗng) khi
 * không có ngày — Next.js và schema.org đều coi `undefined` là "bỏ qua field
 * này", còn chuỗi rỗng sẽ khai ra một ngày không hợp lệ.
 */
export function toIsoString(value: DateLike): string | undefined {
  return toDate(value)?.toISOString();
}
