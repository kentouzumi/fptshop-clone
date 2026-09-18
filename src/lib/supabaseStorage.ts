import { createClient } from "@supabase/supabase-js";

const BUCKET = "product-images";

// Allowlist tường minh (KHÔNG chỉ check tiền tố "image/") — "image/svg+xml" cũng
// khớp tiền tố đó nhưng SVG là file XML có thể nhúng <script>, mở trực tiếp ảnh
// (vd bấm xem ảnh đánh giá ở tab mới) có thể chạy được script trong đó (stored
// XSS qua upload). Chỉ 4 định dạng ảnh raster này KHÔNG có khả năng chứa script.
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function isAllowedImageType(type: string): boolean {
  return ALLOWED_IMAGE_TYPES.has(type);
}

function getClient() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Chưa cấu hình SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY trong .env. " +
        "Lấy 2 giá trị này tại Supabase Dashboard > Project Settings > API, " +
        `và tạo bucket public tên "${BUCKET}" trong mục Storage.`
    );
  }

  return createClient(url, serviceKey);
}

async function uploadToBucket(file: File, folder?: string): Promise<string> {
  if (!isAllowedImageType(file.type)) {
    throw new Error("Định dạng ảnh không được hỗ trợ. Chỉ nhận JPEG/PNG/WEBP/GIF.");
  }

  const supabase = getClient();
  // Lấy đuôi file từ MIME TYPE đã validate ở trên, KHÔNG dùng file.name (tên file
  // do client tự đặt, không đáng tin — vd tên không có dấu chấm sẽ khiến
  // file.name.split(".").pop() trả về nguyên cả tên file làm đuôi).
  const ext = EXT_BY_TYPE[file.type];
  const path = folder ? `${folder}/${crypto.randomUUID()}.${ext}` : `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    throw new Error(`Upload ảnh thất bại: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadProductImage(file: File): Promise<string> {
  return uploadToBucket(file);
}

export async function uploadReviewImage(file: File): Promise<string> {
  return uploadToBucket(file, "reviews");
}
