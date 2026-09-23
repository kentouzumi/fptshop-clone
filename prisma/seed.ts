import "dotenv/config";
import { PrismaClient, ProductStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

// Cửa hàng chỉ còn ĐÚNG 3 danh mục: Điện thoại, Laptop, Tivi. Trước đó danh
// mục thứ 3 là "Điện máy" (nhóm tổng cho mọi thiết bị gia dụng) và có thêm
// "Phụ kiện" — user yêu cầu thu hẹp lại để mỗi danh mục là MỘT loại sản phẩm
// thuần nhất, nhờ đó bộ lọc theo thông số kỹ thuật của từng danh mục mới có
// ý nghĩa (xem CATEGORY_FILTER_SPECS trong src/lib/products.ts: thông số dùng
// làm bộ lọc được khai báo riêng cho từng danh mục, và MỌI sản phẩm trong
// danh mục đó phải có đủ các thông số này thì bộ lọc mới lọc đúng).
async function main() {
  // Danh mục "Tivi" kế thừa chính bản ghi "Điện máy" cũ (đổi slug/tên, giữ
  // nguyên id) để không phải di chuyển sản phẩm sang category mới.
  await prisma.category.updateMany({
    where: { slug: "dien-may" },
    data: { slug: "tivi", name: "Tivi", sortOrder: 3 },
  });

  const [dienThoai, laptopCategory, tivi] = await Promise.all([
    prisma.category.upsert({
      where: { slug: "dien-thoai" },
      update: { parentId: null, sortOrder: 1 },
      create: { name: "Điện thoại", slug: "dien-thoai", sortOrder: 1 },
    }),
    prisma.category.upsert({
      where: { slug: "laptop" },
      update: { parentId: null, sortOrder: 2 },
      create: { name: "Laptop", slug: "laptop", sortOrder: 2 },
    }),
    prisma.category.upsert({
      where: { slug: "tivi" },
      update: { parentId: null, sortOrder: 3 },
      create: { name: "Tivi", slug: "tivi", sortOrder: 3 },
    }),
  ]);

  const brandDefs = [
    { slug: "apple", name: "Apple" },
    { slug: "samsung", name: "Samsung" },
    { slug: "xiaomi", name: "Xiaomi" },
    { slug: "dell", name: "Dell" },
    { slug: "oppo", name: "OPPO" },
    { slug: "asus", name: "Asus" },
    { slug: "lg", name: "LG" },
    { slug: "philips", name: "Philips" },
    { slug: "tcl", name: "TCL" },
  ];
  const brands: Record<string, string> = {};
  for (const b of brandDefs) {
    const row = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: {},
      create: { name: b.name, slug: b.slug },
    });
    brands[b.slug] = row.id;
  }

  // Ảnh sản phẩm: các sản phẩm CŨ (điện thoại/laptop) đã có ảnh THẬT gắn sẵn
  // theo từng biến thể trong DB từ các đợt trước — `imageUrl` dưới đây CHỈ
  // dùng khi tạo mới (nhánh `create`), nên chạy lại seed không ghi đè ảnh cũ.
  // Riêng 6 tivi là sản phẩm mới, ảnh thật lấy từ trang chính hãng (LG, TCL,
  // Xiaomi, Samsung, Philips) rồi tải lên Supabase Storage.
  // THÔNG SỐ KỸ THUẬT: mỗi sản phẩm CHỈ giữ đúng những thông số được dùng làm
  // BỘ LỌC của danh mục đó (xem CATEGORY_FILTER_SPECS trong src/lib/products.ts)
  // — không còn các thông số chỉ để tham khảo (camera, pin, cổng kết nối, công
  // suất loa, hệ điều hành...). Nhờ vậy bảng thông số ở trang chi tiết và bộ
  // lọc ở sidebar luôn khớp nhau 1-1: thấy dòng nào trong bảng là lọc được
  // theo dòng đó. Thêm/bớt thông số thì phải sửa ĐỒNG THỜI cả 2 nơi.
  const products = [
    // ===================== ĐIỆN THOẠI =====================
    // Bộ lọc: Hiệu năng và Pin / Dung lượng ROM / RAM / Tần số quét.
    // "Hiệu năng và Pin" là thông số dạng NHÃN (1 sản phẩm có thể có nhiều
    // dòng) thay vì 1 con số — gom 2 khía cạnh người mua quan tâm nhất (sức
    // mạnh chip + pin/sạc) thành các mức chọn được, giống cách FPT Shop thật
    // gộp nhóm này. Dung lượng ROM cũng có thể nhiều dòng nếu sản phẩm bán
    // nhiều phiên bản bộ nhớ, để lọc theo phiên bản nào cũng ra đúng sản phẩm.
    {
      name: "iPhone 15 Pro Max",
      slug: "iphone-15-pro-max",
      description: "iPhone 15 Pro Max với chip A17 Pro, khung viền Titan và camera 48MP.",
      categoryId: dienThoai.id,
      brandId: brands.apple,
      basePrice: 29990000,
      isFeatured: true,
      imageUrl: "https://placehold.co/600x600.png?text=iPhone+15+Pro+Max",
      attributes: [
        { groupName: "Cấu hình", attrName: "Hiệu năng và Pin", attrValue: "Chip cao cấp (flagship)" },
        // iPhone 15 Pro Max KHÔNG có bản 128GB (chỉ bản Pro 6.1 inch mới có),
        // khởi điểm từ 256GB — xem Apple Tech Specs.
        { groupName: "Cấu hình", attrName: "Dung lượng ROM", attrValue: "256GB" },
        { groupName: "Cấu hình", attrName: "Dung lượng ROM", attrValue: "512GB" },
        { groupName: "Cấu hình", attrName: "RAM", attrValue: "8GB" },
        { groupName: "Màn hình", attrName: "Tần số quét", attrValue: "120Hz" },
      ],
      variants: [
        { sku: "IP15PM-256-TN", color: "Titan Tự Nhiên", storage: "256GB", price: 29990000 },
        { sku: "IP15PM-512-TX", color: "Titan Xanh", storage: "512GB", price: 32990000 },
      ],
    },
    {
      name: "Samsung Galaxy S24 Ultra",
      slug: "samsung-galaxy-s24-ultra",
      description: "Galaxy S24 Ultra tích hợp Galaxy AI, bút S Pen và camera 200MP.",
      categoryId: dienThoai.id,
      brandId: brands.samsung,
      basePrice: 26990000,
      isFeatured: true,
      imageUrl: "https://placehold.co/600x600.png?text=Galaxy+S24+Ultra",
      attributes: [
        { groupName: "Cấu hình", attrName: "Hiệu năng và Pin", attrValue: "Chip cao cấp (flagship)" },
        { groupName: "Cấu hình", attrName: "Hiệu năng và Pin", attrValue: "Pin từ 5000mAh" },
        { groupName: "Cấu hình", attrName: "Dung lượng ROM", attrValue: "512GB" },
        { groupName: "Cấu hình", attrName: "RAM", attrValue: "12GB" },
        { groupName: "Màn hình", attrName: "Tần số quét", attrValue: "120Hz" },
      ],
      variants: [
        { sku: "S24U-256-BLK", color: "Đen", storage: "512GB", price: 26990000 },
        { sku: "S24U-512-GRY", color: "Xám", storage: "512GB", price: 26990000 },
      ],
    },
    {
      name: "Xiaomi Redmi Note 13",
      slug: "xiaomi-redmi-note-13",
      description: "Redmi Note 13 màn hình AMOLED 120Hz, pin 5000mAh, giá tốt.",
      categoryId: dienThoai.id,
      brandId: brands.xiaomi,
      basePrice: 4990000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=Redmi+Note+13",
      attributes: [
        { groupName: "Cấu hình", attrName: "Hiệu năng và Pin", attrValue: "Chip tầm trung" },
        { groupName: "Cấu hình", attrName: "Hiệu năng và Pin", attrValue: "Pin từ 5000mAh" },
        { groupName: "Cấu hình", attrName: "Dung lượng ROM", attrValue: "128GB" },
        { groupName: "Cấu hình", attrName: "Dung lượng ROM", attrValue: "256GB" },
        { groupName: "Cấu hình", attrName: "RAM", attrValue: "8GB" },
        { groupName: "Màn hình", attrName: "Tần số quét", attrValue: "120Hz" },
      ],
      variants: [
        { sku: "RN13-128-BLK", color: "Đen", storage: "128GB", price: 4990000 },
        { sku: "RN13-256-BLU", color: "Xanh Dương", storage: "256GB", price: 5990000 },
      ],
    },
    {
      name: "OPPO Reno11 5G",
      slug: "oppo-reno11-5g",
      description: "OPPO Reno11 5G camera chân dung AI, sạc nhanh SUPERVOOC 67W.",
      categoryId: dienThoai.id,
      brandId: brands.oppo,
      basePrice: 9990000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=OPPO+Reno11+5G",
      attributes: [
        { groupName: "Cấu hình", attrName: "Hiệu năng và Pin", attrValue: "Chip tầm trung" },
        { groupName: "Cấu hình", attrName: "Hiệu năng và Pin", attrValue: "Pin từ 5000mAh" },
        { groupName: "Cấu hình", attrName: "Hiệu năng và Pin", attrValue: "Sạc nhanh từ 60W" },
        { groupName: "Cấu hình", attrName: "Dung lượng ROM", attrValue: "256GB" },
        { groupName: "Cấu hình", attrName: "RAM", attrValue: "8GB" },
        { groupName: "Màn hình", attrName: "Tần số quét", attrValue: "120Hz" },
      ],
      variants: [
        { sku: "OPPO-RENO11-256-GRN", color: "Xanh Ngọc", storage: "256GB", price: 9990000 },
      ],
    },

    // ===================== LAPTOP =====================
    // Bộ lọc: CPU / RAM / Card đồ họa / Ổ cứng / Kích thước màn hình / Tần số quét.
    // "Card đồ họa" cố ý dùng giá trị ở mức PHÂN LOẠI ("Card tích hợp" /
    // "Card rời ...") chứ không phải tên chip cụ thể — lọc theo tên chip thì
    // mỗi giá trị chỉ ứng với đúng 1 máy, không thu hẹp được gì.
    {
      name: "MacBook Air M3",
      slug: "macbook-air-m3",
      description: "MacBook Air M3 mỏng nhẹ, màn hình Liquid Retina, pin tới 18 giờ.",
      categoryId: laptopCategory.id,
      brandId: brands.apple,
      basePrice: 27990000,
      isFeatured: true,
      imageUrl: "https://placehold.co/600x600.png?text=MacBook+Air+M3",
      attributes: [
        { groupName: "Cấu hình", attrName: "CPU", attrValue: "Apple M3" },
        { groupName: "Cấu hình", attrName: "RAM", attrValue: "8GB" },
        { groupName: "Cấu hình", attrName: "Card đồ họa", attrValue: "Card tích hợp" },
        { groupName: "Cấu hình", attrName: "Ổ cứng", attrValue: "256GB SSD" },
        { groupName: "Màn hình", attrName: "Kích thước màn hình", attrValue: "13.6 inch" },
        { groupName: "Màn hình", attrName: "Tần số quét", attrValue: "60Hz" },
      ],
      variants: [{ sku: "MBA-M3-8-256", color: "Bạc", storage: "8GB/256GB", price: 27990000 }],
    },
    {
      name: "Dell XPS 13",
      slug: "dell-xps-13",
      description: "Dell XPS 13 viền màn hình siêu mỏng, vỏ nhôm nguyên khối.",
      categoryId: laptopCategory.id,
      brandId: brands.dell,
      basePrice: 32990000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=Dell+XPS+13",
      attributes: [
        { groupName: "Cấu hình", attrName: "CPU", attrValue: "Intel Core i7" },
        { groupName: "Cấu hình", attrName: "RAM", attrValue: "16GB" },
        { groupName: "Cấu hình", attrName: "Card đồ họa", attrValue: "Card tích hợp" },
        { groupName: "Cấu hình", attrName: "Ổ cứng", attrValue: "512GB SSD" },
        { groupName: "Màn hình", attrName: "Kích thước màn hình", attrValue: "13.4 inch" },
        { groupName: "Màn hình", attrName: "Tần số quét", attrValue: "60Hz" },
      ],
      variants: [{ sku: "XPS13-16-512", color: "Bạc", storage: "16GB/512GB", price: 32990000 }],
    },
    {
      name: "Asus Zenbook 14 OLED",
      slug: "asus-zenbook-14-oled",
      description: "Asus Zenbook 14 OLED màn hình 2.8K 120Hz, chip Intel Core Ultra.",
      categoryId: laptopCategory.id,
      brandId: brands.asus,
      basePrice: 22990000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=Asus+Zenbook+14+OLED",
      attributes: [
        { groupName: "Cấu hình", attrName: "CPU", attrValue: "Intel Core Ultra 7" },
        { groupName: "Cấu hình", attrName: "RAM", attrValue: "16GB" },
        { groupName: "Cấu hình", attrName: "Card đồ họa", attrValue: "Card tích hợp" },
        { groupName: "Cấu hình", attrName: "Ổ cứng", attrValue: "512GB SSD" },
        { groupName: "Màn hình", attrName: "Kích thước màn hình", attrValue: "14 inch" },
        { groupName: "Màn hình", attrName: "Tần số quét", attrValue: "120Hz" },
      ],
      variants: [{ sku: "ASUS-ZB14-16-512", color: "Đen", storage: "16GB/512GB", price: 22990000 }],
    },

    // ===================== TIVI =====================
    // Bộ lọc: Loại tivi / Kích thước màn hình / Độ phân giải / Tần số quét.
    // "Loại tivi" phân biệt Smart Tivi (hệ điều hành riêng của hãng: Tizen của
    // Samsung, webOS của LG) với Google Tivi (chạy Google TV) — đúng cách các
    // siêu thị điện máy VN phân loại, và là thứ người mua hỏi đầu tiên.
    {
      name: "Samsung Smart Tivi QLED 4K Q60D 65 inch",
      slug: "samsung-qled-4k-q60d-65-inch",
      description:
        "Smart Tivi QLED 4K Q60D 65 inch với công nghệ Quantum Dot, thiết kế AirSlim mỏng và hệ điều hành Tizen.",
      categoryId: tivi.id,
      brandId: brands.samsung,
      basePrice: 18990000,
      isFeatured: true,
      imageUrl:
        "https://uotajmwqhjcfnfexbjax.supabase.co/storage/v1/object/public/product-images/catalog/2995a2e0-ab12-4cc4-a4ea-eaef893ccbf6.jpg",
      attributes: [
        { groupName: "Tổng quan", attrName: "Loại tivi", attrValue: "Smart Tivi" },
        { groupName: "Màn hình", attrName: "Kích thước màn hình", attrValue: "65 inch" },
        { groupName: "Màn hình", attrName: "Độ phân giải", attrValue: "4K UHD (3840 x 2160)" },
        { groupName: "Màn hình", attrName: "Tần số quét", attrValue: "60Hz" },
      ],
      variants: [{ sku: "TV-SS-Q60D-65", color: "Đen", storage: null, price: 18990000 }],
    },
    {
      name: "LG Smart Tivi UHD 4K UQ8000 55 inch",
      slug: "lg-uhd-4k-uq8000-55-inch",
      description:
        "Smart Tivi LG UHD 4K 55 inch với bộ xử lý α5 AI 4K Gen5, hệ điều hành webOS và điều khiển bằng giọng nói.",
      categoryId: tivi.id,
      brandId: brands.lg,
      basePrice: 11490000,
      isFeatured: true,
      imageUrl:
        "https://uotajmwqhjcfnfexbjax.supabase.co/storage/v1/object/public/product-images/catalog/a2325deb-5e84-4854-9334-c77282dfc161.jpg",
      attributes: [
        { groupName: "Tổng quan", attrName: "Loại tivi", attrValue: "Smart Tivi" },
        { groupName: "Màn hình", attrName: "Kích thước màn hình", attrValue: "55 inch" },
        { groupName: "Màn hình", attrName: "Độ phân giải", attrValue: "4K UHD (3840 x 2160)" },
        // LG ghi "60Hz Native" trên trang hãng, nhưng để nguyên chữ "Native"
        // thì bộ lọc tách thành 2 mức riêng ("60Hz" và "60Hz Native") dù cùng
        // là 60Hz — chuẩn hóa về "60Hz" cho gộp đúng nhóm.
        { groupName: "Màn hình", attrName: "Tần số quét", attrValue: "60Hz" },
      ],
      variants: [{ sku: "TV-LG-UQ8000-55", color: "Đen", storage: null, price: 11490000 }],
    },
    {
      name: "TCL Google Tivi QLED 4K C655 50 inch",
      slug: "tcl-google-tivi-qled-4k-c655-50-inch",
      description:
        "Google Tivi TCL QLED 4K 50 inch, bộ xử lý AiPQ, âm thanh Onkyo và hỗ trợ Dolby Vision, HDR10+.",
      categoryId: tivi.id,
      brandId: brands.tcl,
      basePrice: 10490000,
      isFeatured: false,
      imageUrl:
        "https://uotajmwqhjcfnfexbjax.supabase.co/storage/v1/object/public/product-images/catalog/14c52550-ee7f-4e38-af86-dc5cd52d5b12.jpg",
      attributes: [
        { groupName: "Tổng quan", attrName: "Loại tivi", attrValue: "Google Tivi" },
        { groupName: "Màn hình", attrName: "Kích thước màn hình", attrValue: "50 inch" },
        { groupName: "Màn hình", attrName: "Độ phân giải", attrValue: "4K UHD (3840 x 2160)" },
        { groupName: "Màn hình", attrName: "Tần số quét", attrValue: "60Hz" },
      ],
      variants: [{ sku: "TV-TCL-C655-50", color: "Đen", storage: null, price: 10490000 }],
    },
    {
      name: "Xiaomi Google Tivi A Pro 43 inch",
      slug: "xiaomi-google-tivi-a-pro-43-inch",
      description:
        "Google Tivi Xiaomi A Pro 43 inch, màn hình 4K viền mỏng, âm thanh Dolby Audio và DTS:X.",
      categoryId: tivi.id,
      brandId: brands.xiaomi,
      basePrice: 6490000,
      isFeatured: false,
      imageUrl:
        "https://uotajmwqhjcfnfexbjax.supabase.co/storage/v1/object/public/product-images/catalog/3e7dc851-3484-43ba-9586-1d9100c3d7ba.jpg",
      attributes: [
        { groupName: "Tổng quan", attrName: "Loại tivi", attrValue: "Google Tivi" },
        { groupName: "Màn hình", attrName: "Kích thước màn hình", attrValue: "43 inch" },
        { groupName: "Màn hình", attrName: "Độ phân giải", attrValue: "4K UHD (3840 x 2160)" },
        { groupName: "Màn hình", attrName: "Tần số quét", attrValue: "60Hz" },
      ],
      variants: [{ sku: "TV-MI-APRO-43", color: "Đen", storage: null, price: 6490000 }],
    },
    {
      name: "Xiaomi Google Tivi A Pro 55 inch",
      slug: "xiaomi-google-tivi-a-pro-55-inch",
      description:
        "Google Tivi Xiaomi A Pro 55 inch, màn hình 4K tràn viền, hỗ trợ HDR10 và điều khiển bằng giọng nói.",
      categoryId: tivi.id,
      brandId: brands.xiaomi,
      basePrice: 9490000,
      isFeatured: false,
      imageUrl:
        "https://uotajmwqhjcfnfexbjax.supabase.co/storage/v1/object/public/product-images/catalog/034b32fa-a166-4447-b588-57e72b6735f3.jpg",
      attributes: [
        { groupName: "Tổng quan", attrName: "Loại tivi", attrValue: "Google Tivi" },
        { groupName: "Màn hình", attrName: "Kích thước màn hình", attrValue: "55 inch" },
        { groupName: "Màn hình", attrName: "Độ phân giải", attrValue: "4K UHD (3840 x 2160)" },
        { groupName: "Màn hình", attrName: "Tần số quét", attrValue: "60Hz" },
      ],
      variants: [{ sku: "TV-MI-APRO-55", color: "Đen", storage: null, price: 9490000 }],
    },
    {
      name: "Philips Google Tivi LED 6900 Series 43 inch",
      slug: "philips-google-tivi-led-6900-43-inch",
      description:
        "Google Tivi Philips 6900 Series 43 inch màn hình Full HD, Pixel Plus HD và âm thanh Dolby Atmos.",
      categoryId: tivi.id,
      brandId: brands.philips,
      basePrice: 6990000,
      isFeatured: false,
      imageUrl:
        "https://uotajmwqhjcfnfexbjax.supabase.co/storage/v1/object/public/product-images/catalog/8d8bb6cd-b47f-4779-a8d3-89fd5c8264c5.jpg",
      attributes: [
        { groupName: "Tổng quan", attrName: "Loại tivi", attrValue: "Google Tivi" },
        { groupName: "Màn hình", attrName: "Kích thước màn hình", attrValue: "43 inch" },
        { groupName: "Màn hình", attrName: "Độ phân giải", attrValue: "Full HD (1920 x 1080)" },
        { groupName: "Màn hình", attrName: "Tần số quét", attrValue: "60Hz" },
      ],
      variants: [{ sku: "TV-PHI-6900-43", color: "Đen", storage: null, price: 6990000 }],
    },
  ];

  for (const p of products) {
    // `update` đồng bộ lại categoryId/brandId/basePrice/isFeatured mỗi lần
    // chạy seed (không phải `{}` no-op) — cần thiết để sản phẩm đã tồn tại
    // từ các lần seed trước THỰC SỰ quay lại đúng category/giá trong code.
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        categoryId: p.categoryId,
        brandId: p.brandId,
        basePrice: p.basePrice,
        isFeatured: p.isFeatured,
        // Đồng bộ luôn cả `description`: mô tả cũng chứa thông số (tên bộ xử
        // lý, chuẩn HDR...) nên sửa thông số mà quên mô tả là sai lệch ngay
        // trên trang chi tiết — đã gặp thật với "Pixel Precise HD" của Philips.
        description: p.description,
      },
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        categoryId: p.categoryId,
        brandId: p.brandId,
        status: ProductStatus.ACTIVE,
        basePrice: p.basePrice,
        isFeatured: p.isFeatured,
        images: { create: [{ url: p.imageUrl, sortOrder: 0 }] },
      },
    });

    // ProductAttribute không có unique key tự nhiên để upsert từng dòng —
    // xóa hết rồi tạo lại theo ĐÚNG mảng `attributes` trong code mỗi lần
    // chạy seed (kể cả sản phẩm đã tồn tại từ trước, không chỉ lúc tạo mới)
    // để bảng "thông số kỹ thuật" dùng làm filter luôn khớp code — nếu chỉ
    // set attributes lúc `create` như trước, sửa/thêm thông số cho sản phẩm
    // ĐÃ CÓ SẴN sẽ không có tác dụng gì (giống lỗi `update: {}` no-op đã
    // từng gặp với categoryId).
    await prisma.productAttribute.deleteMany({ where: { productId: product.id } });
    if (p.attributes.length > 0) {
      await prisma.productAttribute.createMany({
        data: p.attributes.map((a, i) => ({ ...a, productId: product.id, sortOrder: i })),
      });
    }

    for (const v of p.variants) {
      // `update: {}` có chủ đích: màu của một số biến thể đã được sửa tay cho
      // khớp với ảnh thật lấy từ trang chính hãng (xem CLAUDE.md) — ghi đè lại
      // theo code sẽ làm lệch màu so với ảnh đang gắn cho chính biến thể đó.
      await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: {},
        create: {
          productId: product.id,
          sku: v.sku,
          color: v.color,
          storage: v.storage,
          price: v.price,
        },
      });
    }
  }

  const bannerCount = await prisma.banner.count({ where: { position: "home_slider" } });
  if (bannerCount === 0) {
    await prisma.banner.createMany({
      data: [
        {
          imageUrl: "https://placehold.co/1200x400.png?text=Khuyen+Mai+iPhone+15",
          linkUrl: "/products?category=dien-thoai",
          position: "home_slider",
          sortOrder: 1,
        },
        {
          imageUrl: "https://placehold.co/1200x400.png?text=Laptop+Giam+Gia",
          linkUrl: "/products?category=laptop",
          position: "home_slider",
          sortOrder: 2,
        },
        {
          imageUrl: "https://placehold.co/1200x400.png?text=Tivi+Chinh+Hang",
          linkUrl: "/products?category=tivi",
          position: "home_slider",
          sortOrder: 3,
        },
      ],
    });
  }

  // Tồn kho MVP (xem lib/inventory.ts — chặn bán vượt tồn kho lúc đặt hàng):
  // mỗi biến thể có 1 dòng Inventory tại MỖI cửa hàng đang hoạt động, số
  // lượng mặc định đủ dùng để demo. Dùng `update: {}` (không phải ghi đè
  // `quantity`) để chạy lại seed nhiều lần KHÔNG làm mất số lượng admin đã
  // tự chỉnh tay qua Prisma Studio sau lần seed trước — chỉ tạo mới dòng nào
  // còn thiếu (vd biến thể mới thêm sau này chưa có tồn kho ở cửa hàng nào).
  const [allVariants, activeStores] = await Promise.all([
    prisma.productVariant.findMany({ select: { id: true } }),
    prisma.store.findMany({ where: { isActive: true }, select: { id: true } }),
  ]);
  const DEFAULT_STOCK_PER_STORE = 20;
  for (const store of activeStores) {
    for (const variant of allVariants) {
      await prisma.inventory.upsert({
        where: { storeId_variantId: { storeId: store.id, variantId: variant.id } },
        update: {},
        create: { storeId: store.id, variantId: variant.id, quantity: DEFAULT_STOCK_PER_STORE },
      });
    }
  }

  console.log(
    `Seed xong: ${products.length} sản phẩm, 3 danh mục (Điện thoại/Laptop/Tivi), ` +
      `tồn kho cho ${allVariants.length} biến thể x ${activeStores.length} cửa hàng.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
