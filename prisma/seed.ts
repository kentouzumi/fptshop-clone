import "dotenv/config";
import { PrismaClient, ProductStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

// User yêu cầu: các danh mục gộp nhiều tên (vd "Thiết bị bếp, Máy rửa bát,
// Máy hút mùi") phải để MỖI TÊN là 1 danh mục CHỌN ĐƯỢC RIÊNG, nhưng mega
// menu ở Header vẫn "giữ nguyên thế" (vẫn hiện y hệt 1 dòng gộp như cũ) —
// tức bản thân dòng đó không còn là 1 category duy nhất mà là 1 NHÓM
// (parent) chứa nhiều category con (children), mỗi tên tách riêng là 1
// child category độc lập, còn parent chỉ dùng để GOM hiển thị, không tự
// gán sản phẩm trực tiếp nữa. Dùng ĐÚNG quan hệ parent/children đã có sẵn
// trong schema.prisma từ đầu dự án (Category.parentId) nhưng chưa từng
// dùng tới cho tới bây giờ.
interface CategoryGroupDef {
  slug: string;
  name: string;
  sortOrder: number;
  children: { name: string; slug: string }[];
}

const CATEGORY_GROUPS: CategoryGroupDef[] = [
  {
    slug: "tivi-may-lanh-dieu-hoa",
    name: "Tivi, Máy lạnh - Điều hòa",
    sortOrder: 4,
    children: [
      { name: "Tivi", slug: "tivi" },
      { name: "Máy lạnh - Điều hòa", slug: "may-lanh-dieu-hoa" },
    ],
  },
  {
    slug: "tu-lanh-tu-dong-tu-mat",
    name: "Tủ lạnh, Tủ đông, Tủ mát",
    sortOrder: 5,
    children: [
      { name: "Tủ lạnh", slug: "tu-lanh" },
      { name: "Tủ đông", slug: "tu-dong" },
      { name: "Tủ mát", slug: "tu-mat" },
    ],
  },
  {
    slug: "may-giat-may-say-tu-say",
    name: "Máy giặt, Máy sấy, Tủ sấy",
    sortOrder: 6,
    children: [
      { name: "Máy giặt", slug: "may-giat" },
      { name: "Máy sấy", slug: "may-say" },
      { name: "Tủ sấy", slug: "tu-say" },
    ],
  },
  {
    slug: "dong-ho-may-tinh-bang",
    name: "Đồng hồ, Máy tính bảng",
    sortOrder: 7,
    children: [
      { name: "Đồng hồ", slug: "dong-ho" },
      { name: "Máy tính bảng", slug: "may-tinh-bang" },
    ],
  },
  {
    slug: "pc-man-hinh-linh-kien",
    name: "PC, Màn hình, Linh kiện",
    sortOrder: 8,
    children: [
      { name: "PC", slug: "pc" },
      { name: "Màn hình", slug: "man-hinh" },
      { name: "Linh kiện", slug: "linh-kien" },
    ],
  },
  {
    slug: "may-in-may-chieu-phan-mem",
    name: "Máy in, Máy chiếu, Phần mềm",
    sortOrder: 9,
    children: [
      { name: "Máy in", slug: "may-in" },
      { name: "Máy chiếu", slug: "may-chieu" },
      { name: "Phần mềm", slug: "phan-mem" },
    ],
  },
  {
    slug: "robot-hut-bui-may-loc-khi",
    name: "Robot hút bụi, Máy hút bụi, Máy lọc khí",
    sortOrder: 10,
    children: [
      { name: "Robot hút bụi", slug: "robot-hut-bui" },
      { name: "Máy hút bụi", slug: "may-hut-bui" },
      { name: "Máy lọc khí", slug: "may-loc-khi" },
    ],
  },
  {
    slug: "may-hut-am-thiet-bi-suoi-am",
    name: "Máy hút ẩm, Thiết bị sưởi ấm",
    sortOrder: 11,
    children: [
      { name: "Máy hút ẩm", slug: "may-hut-am" },
      { name: "Thiết bị sưởi ấm", slug: "thiet-bi-suoi-am" },
    ],
  },
  {
    slug: "may-massage-may-say-toc",
    name: "Máy massage, Máy sấy tóc",
    sortOrder: 12,
    children: [
      { name: "Máy massage", slug: "may-massage" },
      { name: "Máy sấy tóc", slug: "may-say-toc" },
    ],
  },
  {
    slug: "cham-soc-suc-khoe-do-dung-gia-dinh",
    name: "Chăm sóc sức khỏe, Đồ dùng gia đình",
    sortOrder: 13,
    children: [
      { name: "Chăm sóc sức khỏe", slug: "cham-soc-suc-khoe" },
      { name: "Đồ dùng gia đình", slug: "do-dung-gia-dinh" },
    ],
  },
  {
    slug: "quat-quat-dieu-hoa-may-loc-nuoc",
    name: "Quạt, Quạt điều hòa, Máy lọc nước",
    sortOrder: 14,
    children: [
      { name: "Quạt", slug: "quat" },
      { name: "Quạt điều hòa", slug: "quat-dieu-hoa" },
      { name: "Máy lọc nước", slug: "may-loc-nuoc" },
    ],
  },
  {
    slug: "may-nuoc-nong-cay-nuoc-nong-lanh",
    name: "Máy nước nóng, Cây nước nóng lạnh",
    sortOrder: 15,
    children: [
      { name: "Máy nước nóng", slug: "may-nuoc-nong" },
      { name: "Cây nước nóng lạnh", slug: "cay-nuoc-nong-lanh" },
    ],
  },
  {
    slug: "dien-gia-dung-sinh-to-xay-vat-ep",
    name: "Điện gia dụng, Sinh tố - xay vắt ép",
    sortOrder: 16,
    children: [
      { name: "Điện gia dụng", slug: "dien-gia-dung" },
      { name: "Sinh tố - xay vắt ép", slug: "sinh-to-xay-vat-ep" },
    ],
  },
  {
    slug: "am-sieu-toc-noi-com-dien",
    name: "Ấm siêu tốc, Nồi cơm điện",
    sortOrder: 17,
    children: [
      { name: "Ấm siêu tốc", slug: "am-sieu-toc" },
      { name: "Nồi cơm điện", slug: "noi-com-dien" },
    ],
  },
  {
    slug: "thiet-bi-bep-may-rua-bat-may-hut-mui",
    name: "Thiết bị bếp, Máy rửa bát, Máy hút mùi",
    sortOrder: 18,
    children: [
      { name: "Thiết bị bếp", slug: "thiet-bi-bep" },
      { name: "Máy rửa bát", slug: "may-rua-bat" },
      { name: "Máy hút mùi", slug: "may-hut-mui" },
    ],
  },
  {
    slug: "noi-chien-lo-vi-song-bep-nuong-dien",
    name: "Nồi chiên, Lò vi sóng, Bếp nướng điện",
    sortOrder: 19,
    children: [
      { name: "Nồi chiên", slug: "noi-chien" },
      { name: "Lò vi sóng", slug: "lo-vi-song" },
      { name: "Bếp nướng điện", slug: "bep-nuong-dien" },
    ],
  },
  {
    slug: "noi-ap-suat-noi-lau-dien-bep-dien",
    name: "Nồi áp suất, Nồi lẩu điện, Bếp điện",
    sortOrder: 20,
    children: [
      { name: "Nồi áp suất", slug: "noi-ap-suat" },
      { name: "Nồi lẩu điện", slug: "noi-lau-dien" },
      { name: "Bếp điện", slug: "bep-dien" },
    ],
  },
  {
    slug: "noi-chao-do-dung-nha-bep",
    name: "Nồi, Chảo, Đồ dùng nhà bếp",
    sortOrder: 21,
    children: [
      { name: "Nồi", slug: "noi" },
      { name: "Chảo", slug: "chao" },
      { name: "Đồ dùng nhà bếp", slug: "do-dung-nha-bep" },
    ],
  },
  {
    slug: "camera-thiet-bi-mang",
    name: "Camera, Thiết bị mạng, Smart Home",
    sortOrder: 22,
    children: [
      { name: "Camera", slug: "camera" },
      { name: "Thiết bị mạng", slug: "thiet-bi-mang" },
      { name: "Smart Home", slug: "smart-home" },
    ],
  },
  {
    slug: "thiet-bi-choi-game-ban-ghe-xe-dap",
    name: "Thiết bị chơi game, Bàn ghế, Xe đạp",
    sortOrder: 23,
    children: [
      { name: "Thiết bị chơi game", slug: "thiet-bi-choi-game" },
      { name: "Bàn ghế", slug: "ban-ghe" },
      { name: "Xe đạp", slug: "xe-dap" },
    ],
  },
];

async function main() {
  const [dienThoai, laptop, phuKien] = await Promise.all([
    prisma.category.upsert({
      where: { slug: "dien-thoai" },
      update: {},
      create: { name: "Điện thoại", slug: "dien-thoai", sortOrder: 1 },
    }),
    prisma.category.upsert({
      where: { slug: "laptop" },
      update: {},
      create: { name: "Laptop", slug: "laptop", sortOrder: 2 },
    }),
    prisma.category.upsert({
      where: { slug: "phu-kien" },
      update: { sortOrder: 3 },
      create: { name: "Phụ kiện", slug: "phu-kien", sortOrder: 3 },
    }),
  ]);

  // Chạy tuần tự (không Promise.all) vì mỗi group cần .id của parent vừa
  // tạo để gán parentId cho children ngay sau đó — không parallelize được.
  // childCategories tra theo slug CON (vd "tivi", "may-rua-bat") để dùng
  // gán categoryId cho sản phẩm ở mảng `products` bên dưới.
  const childCategories: Record<string, { id: string }> = {};
  for (const group of CATEGORY_GROUPS) {
    const parent = await prisma.category.upsert({
      where: { slug: group.slug },
      update: { sortOrder: group.sortOrder },
      create: { name: group.name, slug: group.slug, sortOrder: group.sortOrder },
    });

    for (let i = 0; i < group.children.length; i++) {
      const child = group.children[i];
      const created = await prisma.category.upsert({
        where: { slug: child.slug },
        update: { parentId: parent.id, sortOrder: i + 1 },
        create: { name: child.name, slug: child.slug, parentId: parent.id, sortOrder: i + 1 },
      });
      childCategories[child.slug] = created;
    }
  }

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
      attributes: [{ groupName: "Pin", attrName: "Dung lượng", attrValue: "5000 mAh" }],
      variants: [{ sku: "RN13-128-BLK", color: "Đen", storage: "128GB", price: 4990000 }],
    },
    {
      name: "MacBook Air M3",
      slug: "macbook-air-m3",
      description: "MacBook Air M3 mỏng nhẹ, hiệu năng mạnh mẽ cho công việc và sáng tạo.",
      categoryId: laptop.id,
      brandId: apple.id,
      basePrice: 27990000,
      isFeatured: true,
      imageUrl: "https://placehold.co/600x600.png?text=MacBook+Air+M3",
      attributes: [{ groupName: "Vi xử lý", attrName: "Chip", attrValue: "Apple M3" }],
      variants: [{ sku: "MBA-M3-8-256", color: "Bạc", storage: "8GB/256GB", price: 27990000 }],
    },
    {
      name: "Dell XPS 13",
      slug: "dell-xps-13",
      description: "Dell XPS 13 thiết kế cao cấp, màn hình InfinityEdge sắc nét.",
      categoryId: laptop.id,
      brandId: dell.id,
      basePrice: 32990000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=Dell+XPS+13",
      attributes: [{ groupName: "Vi xử lý", attrName: "CPU", attrValue: "Intel Core i7 thế hệ 13" }],
      variants: [{ sku: "XPS13-16-512", color: "Bạc", storage: "16GB/512GB", price: 32990000 }],
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
      name: "OPPO Reno11 5G",
      slug: "oppo-reno11-5g",
      description: "OPPO Reno11 5G camera chân dung AI, thiết kế mỏng nhẹ.",
      categoryId: dienThoai.id,
      brandId: oppo.id,
      basePrice: 9990000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=OPPO+Reno11+5G",
      attributes: [{ groupName: "Camera", attrName: "Camera sau", attrValue: "50MP + 8MP + 2MP" }],
      variants: [{ sku: "OPPO-RENO11-256-GRN", color: "Xanh Ngọc", storage: "256GB", price: 9990000 }],
    },
    {
      name: "Asus Zenbook 14 OLED",
      slug: "asus-zenbook-14-oled",
      description: "Asus Zenbook 14 OLED màn hình OLED sắc nét, mỏng nhẹ cho dân văn phòng.",
      categoryId: laptop.id,
      brandId: asus.id,
      basePrice: 22990000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=Asus+Zenbook+14",
      attributes: [{ groupName: "Vi xử lý", attrName: "CPU", attrValue: "Intel Core Ultra 5" }],
      variants: [{ sku: "ASUS-ZB14-16-512", color: "Đen", storage: "16GB/512GB", price: 22990000 }],
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
      name: "Samsung Smart Tivi Crystal UHD 55 inch",
      slug: "samsung-crystal-uhd-55-inch",
      description: "Smart Tivi Samsung Crystal UHD 55 inch 4K, hệ điều hành Tizen.",
      categoryId: childCategories["tivi"].id,
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
      categoryId: childCategories["tivi"].id,
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
      categoryId: childCategories["tu-lanh"].id,
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
      categoryId: childCategories["may-giat"].id,
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
      categoryId: childCategories["dong-ho"].id,
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
      categoryId: childCategories["may-tinh-bang"].id,
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
      categoryId: childCategories["man-hinh"].id,
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
      categoryId: childCategories["man-hinh"].id,
      brandId: asus.id,
      basePrice: 4490000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=Asus+TUF+Gaming+24",
      attributes: [{ groupName: "Màn hình", attrName: "Tần số quét", attrValue: "165Hz" }],
      variants: [{ sku: "ASUS-VG249Q3A", color: "Đen", storage: null, price: 4490000 }],
    },
    {
      name: "Philips Nồi chiên không dầu",
      slug: "philips-noi-chien-khong-dau",
      description: "Nồi chiên không dầu Philips công nghệ Rapid Air, dung tích 4.1L.",
      categoryId: childCategories["noi-chien"].id,
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
      categoryId: childCategories["noi-com-dien"].id,
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
      categoryId: childCategories["robot-hut-bui"].id,
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
      categoryId: childCategories["may-loc-khi"].id,
      brandId: philips.id,
      basePrice: 3990000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=Philips+May+Loc+Khong+Khi",
      attributes: [{ groupName: "Diện tích", attrName: "Phù hợp phòng", attrValue: "Đến 40m²" }],
      variants: [{ sku: "PHILIPS-AC-40", color: "Trắng", storage: null, price: 3990000 }],
    },
    {
      name: "TP-Link Archer AX55 WiFi 6",
      slug: "tp-link-archer-ax55",
      description: "Router WiFi 6 TP-Link Archer AX55, tốc độ cao, phủ sóng rộng.",
      categoryId: childCategories["thiet-bi-mang"].id,
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
      categoryId: childCategories["camera"].id,
      brandId: xiaomi.id,
      basePrice: 590000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=Xiaomi+Camera+Mi+360",
      attributes: [{ groupName: "Độ phân giải", attrName: "Camera", attrValue: "2K" }],
      variants: [{ sku: "XIAOMI-CAM-360", color: "Trắng", storage: null, price: 590000 }],
    },
    {
      name: "HP LaserJet Pro M15w",
      slug: "hp-laserjet-pro-m15w",
      description: "Máy in laser HP LaserJet Pro M15w, in không dây qua WiFi, nhỏ gọn.",
      categoryId: childCategories["may-in"].id,
      brandId: hp.id,
      basePrice: 2690000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=HP+LaserJet+M15w",
      attributes: [{ groupName: "Kết nối", attrName: "WiFi", attrValue: "Có" }],
      variants: [{ sku: "HP-M15W", color: "Trắng", storage: null, price: 2690000 }],
    },
    {
      name: "Kangaroo Máy hút ẩm KG150",
      slug: "kangaroo-may-hut-am-kg150",
      description: "Máy hút ẩm Kangaroo KG150, phù hợp phòng đến 30m², chống ẩm mốc.",
      categoryId: childCategories["may-hut-am"].id,
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
      categoryId: childCategories["may-say-toc"].id,
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
      categoryId: childCategories["cham-soc-suc-khoe"].id,
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
      categoryId: childCategories["may-loc-nuoc"].id,
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
      categoryId: childCategories["may-nuoc-nong"].id,
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
      categoryId: childCategories["sinh-to-xay-vat-ep"].id,
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
      categoryId: childCategories["may-hut-mui"].id,
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
      categoryId: childCategories["noi-ap-suat"].id,
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
      categoryId: childCategories["chao"].id,
      brandId: sunhouse.id,
      basePrice: 290000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=Sunhouse+Chao+Chong+Dinh",
      attributes: [{ groupName: "Đường kính", attrName: "Kích thước", attrValue: "28cm" }],
      variants: [{ sku: "SUNHOUSE-CHAO28", color: "Đen", storage: null, price: 290000 }],
    },
    {
      name: "Logitech G304 Chuột chơi game không dây",
      slug: "logitech-g304-chuot-choi-game",
      description: "Chuột chơi game không dây Logitech G304, cảm biến HERO 12000 DPI.",
      categoryId: childCategories["thiet-bi-choi-game"].id,
      brandId: logitech.id,
      basePrice: 690000,
      isFeatured: false,
      imageUrl: "https://placehold.co/600x600.png?text=Logitech+G304",
      attributes: [{ groupName: "Cảm biến", attrName: "DPI tối đa", attrValue: "12000 DPI" }],
      variants: [{ sku: "LOGITECH-G304", color: "Đen", storage: null, price: 690000 }],
    },
  ];

  for (const p of products) {
    // `update` đồng bộ lại categoryId/brandId/basePrice/isFeatured mỗi lần
    // chạy seed (không phải `{}` no-op) — cần thiết để các sản phẩm đã tồn
    // tại từ lần seed trước THỰC SỰ chuyển sang category con mới tách ra.
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
        attributes: { create: p.attributes },
      },
    });

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

  // Dọn 3 category gộp cũ từ lần seed trước (dien-may, dien-gia-dung-nha-bep,
  // cham-soc-nha-cua-suc-khoe) — nay đã được thay bằng cấu trúc group/children
  // ở trên (vd dien-may -> nhóm "tivi-may-lanh-dieu-hoa" + 2 nhóm khác). Bọc
  // check tồn tại trước để chạy lại seed nhiều lần không lỗi "record not found".
  for (const slug of ["dien-may", "dien-gia-dung-nha-bep", "cham-soc-nha-cua-suc-khoe"]) {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      await prisma.category.delete({ where: { slug } });
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
          imageUrl: "https://placehold.co/1200x400.png?text=Phu+Kien+Chinh+Hang",
          linkUrl: "/products?category=phu-kien",
          position: "home_slider",
          sortOrder: 3,
        },
      ],
    });
  }

  console.log(`Seed xong: ${products.length} sản phẩm, ${CATEGORY_GROUPS.length} nhóm danh mục.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
