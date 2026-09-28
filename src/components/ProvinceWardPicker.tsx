"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ProvinceOption {
  code: number;
  name: string;
}

const SELECT_CLASS =
  "bg-white text-zinc-900 w-full rounded-lg border border-zinc-300 px-3 py-2 disabled:opacity-60";

/** Chuẩn hóa giống normalize() ở lib/vnAddress.ts để khớp được địa chỉ cũ nhập tay tự do. */
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

interface Props {
  provinces: ProvinceOption[];
  province: string;
  ward: string;
  onChange: (next: { province: string; ward: string }) => void;
}

/**
 * Chọn Tỉnh/Thành -> Phường/Xã theo đơn vị hành chính 2 cấp (từ 01/07/2025,
 * không còn cấp quận/huyện). Danh sách phường/xã tải theo yêu cầu qua
 * /api/address/wards để không nhét cả 3321 phường/xã vào bundle.
 */
export default function ProvinceWardPicker({ provinces, province, ward, onChange }: Props) {
  const [wards, setWards] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  // Chống race condition khi đổi tỉnh nhanh: chỉ nhận kết quả của request mới nhất.
  const requestIdRef = useRef(0);

  const selectedCode =
    provinces.find((p) => normalize(p.name) === normalize(province))?.code ?? null;

  const loadWards = useCallback(async (code: number) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const res = await fetch(`/api/address/wards?province=${code}`);
      const data = await res.json();
      if (requestId !== requestIdRef.current) return;
      setWards(Array.isArray(data.wards) ? data.wards : []);
    } catch {
      if (requestId === requestIdRef.current) setWards([]);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  // Nạp sẵn phường/xã khi mở form sửa địa chỉ đã có sẵn tỉnh/thành.
  useEffect(() => {
    // queueMicrotask: rule react-hooks/set-state-in-effect của eslint-config-next 16
    // cấm gọi setState đồng bộ ngay trong thân effect (xem ghi chú ở CompareProvider).
    queueMicrotask(() => {
      if (selectedCode === null) {
        setWards([]);
        return;
      }
      void loadWards(selectedCode);
    });
  }, [selectedCode, loadWards]);

  function handleProvinceChange(code: string) {
    const next = provinces.find((p) => String(p.code) === code);
    // Đổi tỉnh thì phường/xã cũ chắc chắn không còn hợp lệ -> xóa luôn.
    onChange({ province: next?.name ?? "", ward: "" });
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium">Tỉnh/Thành phố</label>
        <select
          className={SELECT_CLASS}
          value={selectedCode ?? ""}
          onChange={(e) => handleProvinceChange(e.target.value)}
          required
        >
          <option value="">-- Chọn tỉnh/thành --</option>
          {provinces.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Phường/Xã</label>
        <select
          className={SELECT_CLASS}
          value={ward}
          onChange={(e) => onChange({ province, ward: e.target.value })}
          disabled={selectedCode === null || loading}
          required
        >
          <option value="">
            {selectedCode === null
              ? "-- Chọn tỉnh/thành trước --"
              : loading
                ? "Đang tải..."
                : "-- Chọn phường/xã --"}
          </option>
          {/* Địa chỉ cũ có thể lưu phường/xã không còn trong danh sách mới -> vẫn hiện để không mất dữ liệu. */}
          {ward && !wards.includes(ward) && <option value={ward}>{ward}</option>}
          {wards.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
