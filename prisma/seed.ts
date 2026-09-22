import "dotenv/config";
import { PrismaClient, ProductStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

// User yêu cầu ĐƠN GIẢN HÓA LẠI danh mục — sau khi trải qua 3 lần mở rộng
// (4 -> 9 -> 23 danh mục cấp cao + 52 danh mục con dùng parentId), user thấy
// rối và yêu cầu CHỈ GIỮ ĐÚNG 4 danh mục cấp cao: Điện thoại, Laptop, Điện
// máy, Phụ kiện — không còn danh mục con/parentId nào nữa (dù field
// Category.parentId trong schema vẫn giữ nguyên, không xóa, phòng khi cần
// dùng lại sau). "Điện máy" đóng vai trò danh mục TỔNG cho mọi thiết bị điện
// tử/gia dụng không phải điện thoại/laptop/phụ kiện thuần túy (tivi, tủ
// lạnh, máy giặt, đồ gia dụng nhà bếp...) — đúng cách dùng từ "điện máy"
// ngoài đời (siêu thị điện máy bán tivi/tủ lạnh/máy giặt/gia dụng chung 1
// nơi), tránh phải tách thêm nhiều danh mục nhỏ lẻ như trước.
async function main() {
  const [dienThoai, laptopCategory, dienMay, phuKien] = await Promise.all([
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
      where: { slug: "dien-may" },
      update: { parentId: null, sortOrder: 3 },
      create: { name: "Điện máy", slug: "dien-may", sortOrder: 3 },
    }),
    prisma.category.upsert({
      where: { slug: "phu-kien" },
      update: { parentId: null, sortOrder: 4 },
      create: { name: "Phụ kiện", slug: "phu-kien", sortOrder: 4 },
    }),
  ]);

  const [apple, samsung, xiaomi, dell, oppo, asus, jbl, sony] = await Promise.all([
    prisma.brand.upsert({
      where: { slug: "apple" },
      update: {},
      create: { name: "Apple", slug: "apple" },
    }),
    prisma.brand.upsert({
      where: { slug: "samsung" },
      update: {},
      create: { name: "Samsung", slug: "samsung" },
    }),
    prisma.brand.upsert({
      where: { slug: "xiaomi" },
      update: {},
      create: { name: "Xiaomi", slug: "xiaomi" },
    }),
    prisma.brand.upsert({
      where: { slug: "dell" },
      update: {},
      create: { name: "Dell", slug: "dell" },
    }),
    prisma.brand.upsert({
      where: { slug: "oppo" },
      update: {},
      create: { name: "OPPO", slug: "oppo" },
    }),
    prisma.brand.upsert({
      where: { slug: "asus" },
      update: {},
      create: { name: "Asus", slug: "asus" },
    }),
    prisma.brand.upsert({
      where: { slug: "jbl" },
      update: {},
      create: { name: "JBL", slug: "jbl" },
    }),
    prisma.brand.upsert({
      where: { slug: "sony" },
      update: {},
      create: { name: "Sony", slug: "sony" },
    }),
  ]);

  const [lg, philips, tplink] = await Promise.all([
    prisma.brand.upsert({
      where: { slug: "lg" },
      update: {},
      create: { name: "LG", slug: "lg" },
    }),
    prisma.brand.upsert({
      where: { slug: "philips" },
      update: {},
      create: { name: "Philips", slug: "philips" },
    }),
    prisma.brand.upsert({
      where: { slug: "tp-link" },
      update: {},
      create: { name: "TP-Link", slug: "tp-link" },
    }),
  ]);

  const [hp, sunhouse, kangaroo, logitech] = await Promise.all([
    prisma.brand.upsert({
      where: { slug: "hp" },
      update: {},
      create: { name: "HP", slug: "hp" },
    }),
    prisma.brand.upsert({
      where: { slug: "sunhouse" },
      update: {},
      create: { name: "Sunhouse", slug: "sunhouse" },
    }),
    prisma.brand.upsert({
      where: { slug: "kangaroo" },
      update: {},
      create: { name: "Kangaroo", slug: "kangaroo" },
    }),
    prisma.brand.upsert({
      where: { slug: "logitech" },
      update: {},
      create: { name: "Logitech", slug: "logitech" },
    }),
  ]);

  const products = [
    {
      name: "iPhone 15 Pro Max",
      slug: "iphone-15-pro-max",
      description: "iPhone 15 Pro Max với chip A17 Pro, khung viền Titan và camera 48MP.",
      categoryId: dienThoai.id,
      brandId: apple.id,
      basePrice: 29990000,
      isFeatured: true,
      imageUrl: "https://placehold.co/600x600.png?text=iPhone+15+Pro+Max",
      attributes: [
        { groupName: "Màn hình", attrName: "Kích thước", attrValue: "6.7 inch" },
        { groupName: "Camera", attrName: "Camera sau", attrValue: "48MP + 12MP + 12MP" },
        { groupName: "Cấu hình", attrName: "RAM", attrValue: "8GB" },
        { groupName: "Cấu hình", attrName: "Bộ nhớ trong", attrValue: "256GB" },
        { groupName: "Cấu hình", attrName: "Hệ điều hành", attrValue: "iOS 17" },
      ],
      variants: [
        { sku: "IP15PM-128-TN", color: "Titan Tự Nhiên", storage: "128GB", price: 29990000 },
        { sku: "IP15PM-256-TX", color: "Titan Xanh", storage: "256GB", price: 32990000 },
      ],
    },
    {
      name: "Samsung Galaxy S24 Ultra",
      slug: "samsung-galaxy-s24-ultra",
      description: "Galaxy S24 Ultra tích hợp Galaxy AI, bút S Pen và camera 200MP.",
      categoryId: dienThoai.id,
      brandId: samsung.id,
      basePrice: 26990000,
      isFeatured: true,
      imageUrl: "https://placehold.co/600x600.png?text=Galaxy+S24+Ultra",
      attributes: [
        { groupName: "Màn hình", attrName: "Kích thước", attrValue: "6.8 inch" },
        { groupName: "Camera", attrName: "Camera sau", attrValue: "200MP + 12MP + 50MP + 10MP" },
        { groupName: "Cấu hình", attrName: "RAM", attrValue: "12GB" },
        { groupName: "Cấu hình", attrName: "Bộ nhớ trong", attrValue: "256GB" },
        { groupName: "Cấu hình", attrName: "Hệ điều hành", attrValue: "Android 14" },
      ],
      variants: [
        { sku: "S24U-256-BLK", color: "Đen", storage: "256GB", price: 26990000 },
        { sku: "S24U-512-GRY", color: "Xám", storage: "512GB", price: 30990000 },
      ],
    },
    {
      name: "Xiaomi Redmi Note 13",
      slug: "xiaomi-redmi-note-13",
      description: "Redmi Note 13 màn hình AMOLED 120Hz, pin 5000mAh, giá tốt.",
      categoryId: dienThoai.id,
      brandId: xiaomi.id,
      basePrice: 4990000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=Redmi+Note+13",
      attributes: [
        { groupName: "Pin", attrName: "Dung lượng", attrValue: "5000 mAh" },
        { groupName: "Cấu hình", attrName: "RAM", attrValue: "8GB" },
        { groupName: "Cấu hình", attrName: "Bộ nhớ trong", attrValue: "128GB" },
        { groupName: "Cấu hình", attrName: "Hệ điều hành", attrValue: "Android 13" },
      ],
      variants: [{ sku: "RN13-128-BLK", color: "Đen", storage: "128GB", price: 4990000 }],
    },
    {
      name: "OPPO Reno11 5G",
      slug: "oppo-reno11-5g",
      description: "OPPO Reno11 5G camera chân dung AI, thiết kế mỏng nhẹ.",
      categoryId: dienThoai.id,
      brandId: oppo.id,
      basePrice: 9990000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=OPPO+Reno11+5G",
      attributes: [
        { groupName: "Camera", attrName: "Camera sau", attrValue: "50MP + 8MP + 2MP" },
        { groupName: "Cấu hình", attrName: "RAM", attrValue: "8GB" },
        { groupName: "Cấu hình", attrName: "Bộ nhớ trong", attrValue: "256GB" },
        { groupName: "Cấu hình", attrName: "Hệ điều hành", attrValue: "Android 14" },
      ],
      variants: [{ sku: "OPPO-RENO11-256-GRN", color: "Xanh Ngọc", storage: "256GB", price: 9990000 }],
    },
    {
      name: "MacBook Air M3",
      slug: "macbook-air-m3",
      description: "MacBook Air M3 mỏng nhẹ, hiệu năng mạnh mẽ cho công việc và sáng tạo.",
      categoryId: laptopCategory.id,
      brandId: apple.id,
      basePrice: 27990000,
      isFeatured: true,
      imageUrl: "https://placehold.co/600x600.png?text=MacBook+Air+M3",
      attributes: [
        { groupName: "Vi xử lý", attrName: "Chip", attrValue: "Apple M3" },
        { groupName: "Cấu hình", attrName: "RAM", attrValue: "8GB" },
        { groupName: "Cấu hình", attrName: "Ổ cứng", attrValue: "256GB SSD" },
        { groupName: "Cấu hình", attrName: "Hệ điều hành", attrValue: "macOS" },
      ],
      variants: [{ sku: "MBA-M3-8-256", color: "Bạc", storage: "8GB/256GB", price: 27990000 }],
    },
    {
      name: "Dell XPS 13",
      slug: "dell-xps-13",
      description: "Dell XPS 13 thiết kế cao cấp, màn hình InfinityEdge sắc nét.",
      categoryId: laptopCategory.id,
      brandId: dell.id,
      basePrice: 32990000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=Dell+XPS+13",
      attributes: [
        { groupName: "Vi xử lý", attrName: "CPU", attrValue: "Intel Core i7 thế hệ 13" },
        { groupName: "Cấu hình", attrName: "RAM", attrValue: "16GB" },
        { groupName: "Cấu hình", attrName: "Ổ cứng", attrValue: "512GB SSD" },
        { groupName: "Cấu hình", attrName: "Hệ điều hành", attrValue: "Windows 11" },
      ],
      variants: [{ sku: "XPS13-16-512", color: "Bạc", storage: "16GB/512GB", price: 32990000 }],
    },
    {
      name: "Asus Zenbook 14 OLED",
      slug: "asus-zenbook-14-oled",
      description: "Asus Zenbook 14 OLED màn hình OLED sắc nét, mỏng nhẹ cho dân văn phòng.",
      categoryId: laptopCategory.id,
      brandId: asus.id,
      basePrice: 22990000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=Asus+Zenbook+14",
      attributes: [
        { groupName: "Vi xử lý", attrName: "CPU", attrValue: "Intel Core Ultra 5" },
        { groupName: "Cấu hình", attrName: "RAM", attrValue: "16GB" },
        { groupName: "Cấu hình", attrName: "Ổ cứng", attrValue: "512GB SSD" },
        { groupName: "Cấu hình", attrName: "Hệ điều hành", attrValue: "Windows 11" },
      ],
      variants: [{ sku: "ASUS-ZB14-16-512", color: "Đen", storage: "16GB/512GB", price: 22990000 }],
    },
    {
      name: "AirPods Pro 2",
      slug: "airpods-pro-2",
      description: "AirPods Pro 2 chống ồn chủ động, âm thanh không gian cá nhân hóa.",
      categoryId: phuKien.id,
      brandId: apple.id,
      basePrice: 5990000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=AirPods+Pro+2",
      attributes: [{ groupName: "Tính năng", attrName: "Chống ồn", attrValue: "Chủ động (ANC)" }],
      variants: [{ sku: "APP2-WHT", color: "Trắng", storage: null, price: 5990000 }],
    },
    {
      name: "JBL Tune 510BT",
      slug: "jbl-tune-510bt",
      description: "Tai nghe không dây JBL Tune 510BT, âm bass mạnh mẽ, pin 40 giờ.",
      categoryId: phuKien.id,
      brandId: jbl.id,
      basePrice: 1290000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=JBL+Tune+510BT",
      attributes: [{ groupName: "Pin", attrName: "Thời lượng", attrValue: "40 giờ" }],
      variants: [{ sku: "JBL-T510BT-BLK", color: "Đen", storage: null, price: 1290000 }],
    },
    {
      name: "Logitech G304 Chuột chơi game không dây",
      slug: "logitech-g304-chuot-choi-game",
      description: "Chuột chơi game không dây Logitech G304, cảm biến HERO 12000 DPI.",
      categoryId: phuKien.id,
      brandId: logitech.id,
      basePrice: 690000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=Logitech+G304",
      attributes: [{ groupName: "Cảm biến", attrName: "DPI tối đa", attrValue: "12000 DPI" }],
      variants: [{ sku: "LOGITECH-G304", color: "Đen", storage: null, price: 690000 }],
    },
    {
      name: "TP-Link Archer AX55 WiFi 6",
      slug: "tp-link-archer-ax55",
      description: "Router WiFi 6 TP-Link Archer AX55, tốc độ cao, phủ sóng rộng.",
      categoryId: phuKien.id,
      brandId: tplink.id,
      basePrice: 1590000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=TP-Link+Archer+AX55",
      attributes: [{ groupName: "Chuẩn WiFi", attrName: "Phiên bản", attrValue: "WiFi 6 (802.11ax)" }],
      variants: [{ sku: "TPLINK-AX55", color: "Đen", storage: null, price: 1590000 }],
    },
    {
      name: "Xiaomi Camera an ninh Mi 360",
      slug: "xiaomi-camera-an-ninh-mi-360",
      description: "Camera an ninh Xiaomi Mi 360, xoay 360 độ, đàm thoại 2 chiều, cảnh báo chuyển động.",
      categoryId: phuKien.id,
      brandId: xiaomi.id,
      basePrice: 590000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=Xiaomi+Camera+Mi+360",
      attributes: [{ groupName: "Độ phân giải", attrName: "Camera", attrValue: "2K" }],
      variants: [{ sku: "XIAOMI-CAM-360", color: "Trắng", storage: null, price: 590000 }],
    },
    {
      name: "Samsung Smart Tivi Crystal UHD 55 inch",
      slug: "samsung-crystal-uhd-55-inch",
      description: "Smart Tivi Samsung Crystal UHD 55 inch 4K, hệ điều hành Tizen.",
      categoryId: dienMay.id,
      brandId: samsung.id,
      basePrice: 11990000,
      isFeatured: true,
      imageUrl: "https://placehold.co/600x600.png?text=Samsung+Crystal+UHD+55",
      attributes: [{ groupName: "Màn hình", attrName: "Kích thước", attrValue: "55 inch" }],
      variants: [{ sku: "SS-UHD55-2024", color: "Đen", storage: null, price: 11990000 }],
    },
    {
      name: "Sony Bravia 43 inch Google TV",
      slug: "sony-bravia-43-inch-google-tv",
      description: "Sony Bravia 43 inch Google TV, xử lý hình ảnh X1, âm thanh sống động.",
      categoryId: dienMay.id,
      brandId: sony.id,
      basePrice: 9490000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=Sony+Bravia+43",
      attributes: [{ groupName: "Màn hình", attrName: "Kích thước", attrValue: "43 inch" }],
      variants: [{ sku: "SONY-BRAVIA-43", color: "Đen", storage: null, price: 9490000 }],
    },
    {
      name: "LG Tủ lạnh Inverter 375L",
      slug: "lg-tu-lanh-inverter-375l",
      description: "Tủ lạnh LG Inverter 375L ngăn đông trên, tiết kiệm điện.",
      categoryId: dienMay.id,
      brandId: lg.id,
      basePrice: 10490000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=LG+Tu+Lanh+375L",
      attributes: [{ groupName: "Dung tích", attrName: "Thể tích", attrValue: "375 lít" }],
      variants: [{ sku: "LG-TL-375L", color: "Bạc", storage: null, price: 10490000 }],
    },
    {
      name: "LG Máy giặt cửa trước Inverter 9kg",
      slug: "lg-may-giat-inverter-9kg",
      description: "Máy giặt LG Inverter 9kg cửa trước, công nghệ giặt hơi nước diệt khuẩn.",
      categoryId: dienMay.id,
      brandId: lg.id,
      basePrice: 8290000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=LG+May+Giat+9kg",
      attributes: [{ groupName: "Khối lượng giặt", attrName: "Trọng lượng", attrValue: "9 kg" }],
      variants: [{ sku: "LG-MG-9KG", color: "Đen", storage: null, price: 8290000 }],
    },
    {
      name: "Apple Watch Series 9",
      slug: "apple-watch-series-9",
      description: "Apple Watch Series 9 chip S9, màn hình sáng hơn, theo dõi sức khỏe toàn diện.",
      categoryId: dienMay.id,
      brandId: apple.id,
      basePrice: 10990000,
      isFeatured: true,
      imageUrl: "https://placehold.co/600x600.png?text=Apple+Watch+Series+9",
      attributes: [{ groupName: "Màn hình", attrName: "Kích thước", attrValue: "45mm" }],
      variants: [{ sku: "AWS9-45-BLK", color: "Đen", storage: null, price: 10990000 }],
    },
    {
      name: "Samsung Galaxy Tab S9",
      slug: "samsung-galaxy-tab-s9",
      description: "Galaxy Tab S9 màn hình Dynamic AMOLED 2X, kèm bút S Pen.",
      categoryId: dienMay.id,
      brandId: samsung.id,
      basePrice: 15990000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=Galaxy+Tab+S9",
      attributes: [{ groupName: "Màn hình", attrName: "Kích thước", attrValue: "11 inch" }],
      variants: [{ sku: "TABS9-128-GRY", color: "Xám", storage: "128GB", price: 15990000 }],
    },
    {
      name: "Dell UltraSharp U2724D",
      slug: "dell-ultrasharp-u2724d",
      description: "Màn hình Dell UltraSharp 27 inch QHD, chuẩn màu chính xác cho dân thiết kế.",
      categoryId: dienMay.id,
      brandId: dell.id,
      basePrice: 7990000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=Dell+UltraSharp+27",
      attributes: [{ groupName: "Màn hình", attrName: "Độ phân giải", attrValue: "2560x1440 (QHD)" }],
      variants: [{ sku: "DELL-U2724D", color: "Bạc", storage: null, price: 7990000 }],
    },
    {
      name: "Asus TUF Gaming VG249Q3A",
      slug: "asus-tuf-gaming-vg249q3a",
      description: "Màn hình gaming Asus TUF 24 inch 165Hz, thời gian phản hồi 1ms.",
      categoryId: dienMay.id,
      brandId: asus.id,
      basePrice: 4490000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=Asus+TUF+Gaming+24",
      attributes: [{ groupName: "Màn hình", attrName: "Tần số quét", attrValue: "165Hz" }],
      variants: [{ sku: "ASUS-VG249Q3A", color: "Đen", storage: null, price: 4490000 }],
    },
    {
      name: "HP LaserJet Pro M15w",
      slug: "hp-laserjet-pro-m15w",
      description: "Máy in laser HP LaserJet Pro M15w, in không dây qua WiFi, nhỏ gọn.",
      categoryId: dienMay.id,
      brandId: hp.id,
      basePrice: 2690000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=HP+LaserJet+M15w",
      attributes: [{ groupName: "Kết nối", attrName: "WiFi", attrValue: "Có" }],
      variants: [{ sku: "HP-M15W", color: "Trắng", storage: null, price: 2690000 }],
    },
    {
      name: "Philips Nồi chiên không dầu",
      slug: "philips-noi-chien-khong-dau",
      description: "Nồi chiên không dầu Philips công nghệ Rapid Air, dung tích 4.1L.",
      categoryId: dienMay.id,
      brandId: philips.id,
      basePrice: 1990000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=Philips+Noi+Chien",
      attributes: [{ groupName: "Dung tích", attrName: "Thể tích", attrValue: "4.1 lít" }],
      variants: [{ sku: "PHILIPS-NC41", color: "Đen", storage: null, price: 1990000 }],
    },
    {
      name: "Philips Nồi cơm điện tử",
      slug: "philips-noi-com-dien-tu",
      description: "Nồi cơm điện tử Philips lòng nồi chống dính cao cấp, nấu đa năng.",
      categoryId: dienMay.id,
      brandId: philips.id,
      basePrice: 1290000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=Philips+Noi+Com+Dien",
      attributes: [{ groupName: "Dung tích", attrName: "Thể tích", attrValue: "1.8 lít" }],
      variants: [{ sku: "PHILIPS-NCD18", color: "Đỏ", storage: null, price: 1290000 }],
    },
    {
      name: "Xiaomi Robot hút bụi lau nhà",
      slug: "xiaomi-robot-hut-bui-lau-nha",
      description: "Robot hút bụi lau nhà Xiaomi, lực hút mạnh mẽ, điều khiển qua app.",
      categoryId: dienMay.id,
      brandId: xiaomi.id,
      basePrice: 5990000,
      isFeatured: true,
      imageUrl: "https://placehold.co/600x600.png?text=Xiaomi+Robot+Hut+Bui",
      attributes: [{ groupName: "Tính năng", attrName: "Chức năng", attrValue: "Hút bụi + lau nhà" }],
      variants: [{ sku: "XIAOMI-ROBOT-VAC", color: "Trắng", storage: null, price: 5990000 }],
    },
    {
      name: "Philips Máy lọc không khí",
      slug: "philips-may-loc-khong-khi",
      description: "Máy lọc không khí Philips lọc bụi mịn PM2.5, khử mùi, kháng khuẩn.",
      categoryId: dienMay.id,
      brandId: philips.id,
      basePrice: 3990000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=Philips+May+Loc+Khong+Khi",
      attributes: [{ groupName: "Diện tích", attrName: "Phù hợp phòng", attrValue: "Đến 40m²" }],
      variants: [{ sku: "PHILIPS-AC-40", color: "Trắng", storage: null, price: 3990000 }],
    },
    {
      name: "Kangaroo Máy hút ẩm KG150",
      slug: "kangaroo-may-hut-am-kg150",
      description: "Máy hút ẩm Kangaroo KG150, phù hợp phòng đến 30m², chống ẩm mốc.",
      categoryId: dienMay.id,
      brandId: kangaroo.id,
      basePrice: 3290000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=Kangaroo+May+Hut+Am",
      attributes: [{ groupName: "Công suất hút ẩm", attrName: "Lít/ngày", attrValue: "12L/ngày" }],
      variants: [{ sku: "KGR-HA-KG150", color: "Trắng", storage: null, price: 3290000 }],
    },
    {
      name: "Philips Máy sấy tóc BHC010",
      slug: "philips-may-say-toc-bhc010",
      description: "Máy sấy tóc Philips BHC010, công suất 1200W, gọn nhẹ.",
      categoryId: dienMay.id,
      brandId: philips.id,
      basePrice: 390000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=Philips+May+Say+Toc",
      attributes: [{ groupName: "Công suất", attrName: "Watt", attrValue: "1200W" }],
      variants: [{ sku: "PHILIPS-BHC010", color: "Hồng", storage: null, price: 390000 }],
    },
    {
      name: "Xiaomi Cân điện tử Mi Body Scale",
      slug: "xiaomi-can-dien-tu-mi-body-scale",
      description: "Cân điện tử Xiaomi Mi Body Scale, đo chỉ số cơ thể, kết nối app sức khỏe.",
      categoryId: dienMay.id,
      brandId: xiaomi.id,
      basePrice: 390000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=Xiaomi+Can+Dien+Tu",
      attributes: [{ groupName: "Kết nối", attrName: "Bluetooth", attrValue: "Có" }],
      variants: [{ sku: "XIAOMI-SCALE", color: "Trắng", storage: null, price: 390000 }],
    },
    {
      name: "Kangaroo Máy lọc nước RO",
      slug: "kangaroo-may-loc-nuoc-ro",
      description: "Máy lọc nước Kangaroo RO 10 lõi lọc, loại bỏ tạp chất, nước tinh khiết.",
      categoryId: dienMay.id,
      brandId: kangaroo.id,
      basePrice: 4990000,
      isFeatured: true,
      imageUrl: "https://placehold.co/600x600.png?text=Kangaroo+May+Loc+Nuoc",
      attributes: [{ groupName: "Số lõi lọc", attrName: "Lõi", attrValue: "10 lõi" }],
      variants: [{ sku: "KGR-RO-10", color: "Trắng", storage: null, price: 4990000 }],
    },
    {
      name: "Kangaroo Máy nước nóng KG69",
      slug: "kangaroo-may-nuoc-nong-kg69",
      description: "Máy nước nóng trực tiếp Kangaroo KG69, chống giật, làm nóng nhanh.",
      categoryId: dienMay.id,
      brandId: kangaroo.id,
      basePrice: 1090000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=Kangaroo+May+Nuoc+Nong",
      attributes: [{ groupName: "Công suất", attrName: "Watt", attrValue: "4500W" }],
      variants: [{ sku: "KGR-NN-KG69", color: "Trắng", storage: null, price: 1090000 }],
    },
    {
      name: "Sunhouse Máy xay sinh tố SHD5341",
      slug: "sunhouse-may-xay-sinh-to-shd5341",
      description: "Máy xay sinh tố Sunhouse SHD5341, cối xay inox, xay đá dễ dàng.",
      categoryId: dienMay.id,
      brandId: sunhouse.id,
      basePrice: 590000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=Sunhouse+May+Xay",
      attributes: [{ groupName: "Công suất", attrName: "Watt", attrValue: "500W" }],
      variants: [{ sku: "SUNHOUSE-SHD5341", color: "Đỏ", storage: null, price: 590000 }],
    },
    {
      name: "Sunhouse Máy hút mùi SHB6822",
      slug: "sunhouse-may-hut-mui-shb6822",
      description: "Máy hút mùi Sunhouse SHB6822 dạng áp tường, khử mùi hiệu quả cho bếp.",
      categoryId: dienMay.id,
      brandId: sunhouse.id,
      basePrice: 2490000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=Sunhouse+May+Hut+Mui",
      attributes: [{ groupName: "Kích thước", attrName: "Chiều rộng", attrValue: "70cm" }],
      variants: [{ sku: "SUNHOUSE-SHB6822", color: "Đen", storage: null, price: 2490000 }],
    },
    {
      name: "Sunhouse Nồi áp suất điện SHD8616",
      slug: "sunhouse-noi-ap-suat-dien-shd8616",
      description: "Nồi áp suất điện Sunhouse SHD8616, nấu nhanh, an toàn với van xả áp tự động.",
      categoryId: dienMay.id,
      brandId: sunhouse.id,
      basePrice: 1190000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=Sunhouse+Noi+Ap+Suat",
      attributes: [{ groupName: "Dung tích", attrName: "Thể tích", attrValue: "5 lít" }],
      variants: [{ sku: "SUNHOUSE-SHD8616", color: "Bạc", storage: null, price: 1190000 }],
    },
    {
      name: "Sunhouse Chảo chống dính đáy từ",
      slug: "sunhouse-chao-chong-dinh-day-tu",
      description: "Chảo chống dính Sunhouse đáy từ, dùng được cho mọi loại bếp.",
      categoryId: dienMay.id,
      brandId: sunhouse.id,
      basePrice: 290000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=Sunhouse+Chao+Chong+Dinh",
      attributes: [{ groupName: "Đường kính", attrName: "Kích thước", attrValue: "28cm" }],
      variants: [{ sku: "SUNHOUSE-CHAO28", color: "Đen", storage: null, price: 290000 }],
    },
  ];

  for (const p of products) {
    // `update` đồng bộ lại categoryId/brandId/basePrice/isFeatured mỗi lần
    // chạy seed (không phải `{}` no-op) — cần thiết để sản phẩm đã tồn tại
    // từ các lần seed trước THỰC SỰ quay lại đúng 1 trong 4 category mới.
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        categoryId: p.categoryId,
        brandId: p.brandId,
        basePrice: p.basePrice,
        isFeatured: p.isFeatured,
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

  // Dọn TOÀN BỘ cấu trúc danh mục con/nhóm gộp từ 2 lần mở rộng trước (23
  // danh mục cấp cao + 52 danh mục con) — user yêu cầu quay lại chỉ đúng 4
  // danh mục phẳng ở trên. Toàn bộ 34 sản phẩm đã được gán lại categoryId
  // vào 1 trong 4 category mới ở vòng lặp ngay trên nên các category cũ này
  // chắc chắn không còn sản phẩm nào tham chiếu tới, xóa an toàn. Xóa
  // CATEGORY CON trước (parentId khác null) rồi mới xóa tới các category
  // "nhóm" cấp cao cũ theo đúng slug — thứ tự này cần thiết vì nếu xóa cha
  // trước, quan hệ parentId optional sẽ mặc định SetNull (không cascade),
  // khiến category con bị mồ côi thành cấp cao mới thay vì bị xóa theo.
  await prisma.category.deleteMany({ where: { parentId: { not: null } } });

  const OLD_GROUP_SLUGS = [
    "tivi-may-lanh-dieu-hoa",
    "tu-lanh-tu-dong-tu-mat",
    "may-giat-may-say-tu-say",
    "dong-ho-may-tinh-bang",
    "pc-man-hinh-linh-kien",
    "may-in-may-chieu-phan-mem",
    "robot-hut-bui-may-loc-khi",
    "may-hut-am-thiet-bi-suoi-am",
    "may-massage-may-say-toc",
    "cham-soc-suc-khoe-do-dung-gia-dinh",
    "quat-quat-dieu-hoa-may-loc-nuoc",
    "may-nuoc-nong-cay-nuoc-nong-lanh",
    "dien-gia-dung-sinh-to-xay-vat-ep",
    "am-sieu-toc-noi-com-dien",
    "thiet-bi-bep-may-rua-bat-may-hut-mui",
    "noi-chien-lo-vi-song-bep-nuong-dien",
    "noi-ap-suat-noi-lau-dien-bep-dien",
    "noi-chao-do-dung-nha-bep",
    "camera-thiet-bi-mang",
    "thiet-bi-choi-game-ban-ghe-xe-dap",
  ];
  await prisma.category.deleteMany({ where: { slug: { in: OLD_GROUP_SLUGS } } });

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
          imageUrl: "https://placehold.co/1200x400.png?text=Phu+Kien+Chinh+Hang",
          linkUrl: "/products?category=phu-kien",
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
    `Seed xong: ${products.length} sản phẩm, 4 danh mục (Điện thoại/Laptop/Điện máy/Phụ kiện), ` +
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
