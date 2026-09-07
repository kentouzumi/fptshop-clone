# Dự án: Website thương mại điện tử (clone chức năng FPT Shop)

## Stack
- Next.js (App Router, TypeScript, Tailwind CSS)
- Prisma ORM 7.10.0 (@prisma/client 7.10.0) — dùng prisma.config.ts, KHÔNG dùng url trong schema.prisma
- Database: PostgreSQL trên Supabase, kết nối qua Session Pooler (IPv4) vì direct connection chỉ hỗ trợ IPv6

## Tiến độ đã hoàn thành
- [x] Tạo project Next.js
- [x] Cài Prisma 7 (lưu ý: bản 8 hiện là beta CLI khác, phải pin @prev)
- [x] Viết schema.prisma đầy đủ ~30 model: User, Product, ProductVariant, Order,
      Cart, Coupon, Review, Warranty, TradeInRequest, Store/Inventory...
- [x] npx prisma db push thành công, database đã đồng bộ

## Việc tiếp theo cần làm
- [x] Viết file kết nối Prisma Client dùng chung (src/lib/prisma.ts), dùng driver
      adapter @prisma/adapter-pg + pg (Prisma 7 bắt buộc dùng adapter) — đã test
      kết nối tới Supabase Session Pooler thành công
- [x] Viết seed data mẫu (prisma/seed.ts): 3 category, 4 brand, 6 product kèm
      variant/image/attribute — chạy bằng `npx prisma db seed --config prisma7.config.ts`
      (cần tsx, đã cài devDependency), script dùng upsert nên chạy lại an toàn
- [x] Trang danh sách sản phẩm (API + giao diện):
      src/lib/products.ts (query dùng chung, lọc theo category/search + phân trang),
      src/app/api/products/route.ts (GET), src/app/products/page.tsx (Server
      Component: filter theo category, grid sản phẩm, phân trang) — đã test
      bằng dev server (curl API + kiểm tra HTML), không lỗi
- [x] Chức năng đăng ký/đăng nhập: tự viết (không dùng NextAuth), dùng bcryptjs
      hash mật khẩu + model Session có sẵn (session token ngẫu nhiên lưu DB,
      cookie httpOnly). Gồm src/lib/auth.ts (hashPassword, verifyPassword,
      createSession, destroySession, getCurrentUser), API routes
      /api/auth/{register,login,logout}, trang /register, /login, và
      src/components/Header.tsx hiển thị trạng thái đăng nhập trong layout —
      đã test full flow qua dev server (đăng ký, trùng email, sai mật khẩu,
      đăng xuất, đăng nhập lại), không lỗi

## Lưu ý quan trọng
- Không chạy `npm audit fix --force` — dễ đổi version Prisma linh tinh
- Mật khẩu Supabase có ký tự đặc biệt phải URL-encode trong DATABASE_URL