import { createClient } from "@supabase/supabase-js";

const BUCKET = "product-images";

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
  const supabase = getClient();
  const ext = file.name.split(".").pop() || "jpg";
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
