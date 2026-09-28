import vnAdmin from "@/data/vnAdmin.json";

/**
 * Danh sách đơn vị hành chính Việt Nam theo cấu trúc 2 CẤP (tỉnh/thành -> phường/xã)
 * có hiệu lực từ 01/07/2025 — cấp quận/huyện đã bị bỏ, nên form địa chỉ chỉ còn
 * chọn Tỉnh/Thành phố rồi tới Phường/Xã. Cột `district` trên model Address vẫn giữ
 * trong schema (để không phải đổi DB và không làm hỏng địa chỉ/đơn hàng cũ đã có
 * giá trị) nhưng KHÔNG còn được thu thập nữa — địa chỉ mới lưu chuỗi rỗng, và mọi
 * nơi hiển thị dùng formatAddressLine() để tự bỏ qua phần trống.
 * Nguồn dữ liệu: provinces.open-api.vn (API v2), tải về và rút gọn thành
 * src/data/vnAdmin.json để không phụ thuộc dịch vụ ngoài lúc chạy.
 */
export interface Province {
  code: number;
  name: string;
  wards: string[];
}

export const PROVINCES: Province[] = vnAdmin as Province[];

/** Chỉ tên + mã, dùng để truyền xuống client (danh sách đầy đủ 3321 phường/xã quá nặng). */
export const PROVINCE_OPTIONS: { code: number; name: string }[] = PROVINCES.map((p) => ({
  code: p.code,
  name: p.name,
}));

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/^(thanh pho|tinh|tp\.?)\s+/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const PROVINCE_BY_NORMALIZED_NAME = new Map(PROVINCES.map((p) => [normalize(p.name), p]));

export function findProvinceByCode(code: number): Province | null {
  return PROVINCES.find((p) => p.code === code) ?? null;
}

/**
 * Tra tỉnh/thành theo TÊN. Chuẩn hóa bỏ dấu + bỏ tiền tố "Thành phố"/"Tỉnh" nên
 * địa chỉ cũ lưu dạng tự do ("Hà Nội", "TP.HCM"...) vẫn khớp được với tên chính thức.
 */
export function findProvinceByName(name: string): Province | null {
  return PROVINCE_BY_NORMALIZED_NAME.get(normalize(name)) ?? null;
}

export function getWards(provinceCode: number): string[] {
  return findProvinceByCode(provinceCode)?.wards ?? [];
}

export function isValidWard(provinceName: string, wardName: string): boolean {
  const province = findProvinceByName(provinceName);
  if (!province) return false;
  const target = normalize(wardName);
  return province.wards.some((w) => normalize(w) === target);
}

/** Ghép các phần địa chỉ, tự bỏ qua phần rỗng (vd `district` của địa chỉ kiểu mới). */
export function formatAddressLine(parts: (string | null | undefined)[]): string {
  return parts.map((p) => p?.trim()).filter((p): p is string => !!p).join(", ");
}

// ---------------------------------------------------------------------------
// Phí vận chuyển theo khu vực
// ---------------------------------------------------------------------------

export type ShippingZone = 1 | 2 | 3;

export const SHIPPING_FEE_BY_ZONE: Record<ShippingZone, number> = {
  1: 20000, // nội thành nơi có cửa hàng
  2: 30000, // đồng bằng / thành phố trung ương còn lại
  3: 45000, // miền núi, vùng xa
};

export const SHIPPING_ZONE_LABEL: Record<ShippingZone, string> = {
  1: "Nội thành (có cửa hàng)",
  2: "Tỉnh/thành đồng bằng",
  3: "Miền núi, vùng xa",
};

/** Phí mặc định khi không nhận ra tỉnh/thành (địa chỉ cũ nhập tay tự do). */
export const DEFAULT_SHIPPING_FEE = SHIPPING_FEE_BY_ZONE[2];

// Phân vùng theo MÃ tỉnh (ổn định) thay vì theo tên (tên có thể viết nhiều kiểu).
const ZONE_1_CODES = new Set([1, 79]); // Hà Nội, TP. Hồ Chí Minh
const ZONE_3_CODES = new Set([4, 8, 11, 12, 14, 15, 20, 52, 66, 68]);

export function getShippingZone(provinceName: string): ShippingZone | null {
  const province = findProvinceByName(provinceName);
  if (!province) return null;
  if (ZONE_1_CODES.has(province.code)) return 1;
  if (ZONE_3_CODES.has(province.code)) return 3;
  return 2;
}

export function getShippingFee(provinceName: string | null | undefined): number {
  if (!provinceName) return DEFAULT_SHIPPING_FEE;
  const zone = getShippingZone(provinceName);
  return zone === null ? DEFAULT_SHIPPING_FEE : SHIPPING_FEE_BY_ZONE[zone];
}

/** Phí ship + nhãn khu vực tính sẵn cho cả 34 tỉnh/thành, dùng để truyền xuống client. */
export const PROVINCE_SHIPPING_OPTIONS = PROVINCES.map((p) => {
  const zone = (getShippingZone(p.name) ?? 2) as ShippingZone;
  return {
    code: p.code,
    name: p.name,
    shippingFee: SHIPPING_FEE_BY_ZONE[zone],
    zoneLabel: SHIPPING_ZONE_LABEL[zone],
  };
});

export function getShippingZoneLabel(provinceName: string | null | undefined): string {
  const zone = provinceName ? getShippingZone(provinceName) : null;
  return zone === null ? SHIPPING_ZONE_LABEL[2] : SHIPPING_ZONE_LABEL[zone];
}
