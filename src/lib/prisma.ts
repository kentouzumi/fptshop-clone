import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  // `globalForPrisma` bên dưới KHÔNG có tác dụng trên Vercel (chỉ cache khi
  // NODE_ENV !== production), nên MỖI serverless instance tự mở một pool
  // riêng. Mặc định của node-postgres là 10 kết nối/pool — 20 instance chạy
  // song song là 200 kết nối tới Supabase, đúng cách đã đụng
  // EMAXCONNSESSION trước đây. Một instance xử lý rất ít request đồng thời
  // nên không cần nhiều; để 5 là đủ cho các trang gọi nhiều query song song
  // (vd /admin gọi 13 query trong 1 Promise.all) mà vẫn chặn được việc
  // nhân kết nối theo số instance. Hạ DB_POOL_MAX nếu vẫn đụng trần pooler.
  max: Number(process.env.DB_POOL_MAX ?? 5),
  // Thả kết nối rỗi sớm (serverless không nên giữ kết nối chờ) và thà lỗi
  // rõ ràng còn hơn treo vô hạn khi pooler đã đầy.
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
