import "dotenv/config";
import { PrismaClient, ProductStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // sortOrder đặt lại theo đúng thứ tự 4 mục chính trong sidebar "Danh mục"
  // thật của fptshop.com.vn (Điện thoại/Laptop/Điện máy/Phụ kiện) — dùng
  // `update` thay vì `update: {}` cho dien-may/phu-kien để lần seed lại sau
  // này (dữ liệu đã tồn tại từ trước) vẫn tự sửa đúng thứ tự nếu có lệch.
  const [dienThoai, laptop, dienMay, phuKien] = await Promise.all([
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
      where: { slug: "dien-may" },
      update: { sortOrder: 3 },
      create: { name: "Điện máy", slug: "dien-may", sortOrder: 3 },
    }),
    prisma.category.upsert({
      where: { slug: "phu-kien" },
      update: { sortOrder: 4 },
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
      attributes: [
        { groupName: "Pin", attrName: "Dung lượng", attrValue: "5000 mAh" },
      ],
      variants: [
        { sku: "RN13-128-BLK", color: "Đen", storage: "128GB", price: 4990000 },
      ],
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
      attributes: [
        { groupName: "Vi xử lý", attrName: "Chip", attrValue: "Apple M3" },
      ],
      variants: [
        { sku: "MBA-M3-8-256", color: "Bạc", storage: "8GB/256GB", price: 27990000 },
      ],
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
      attributes: [
        { groupName: "Vi xử lý", attrName: "CPU", attrValue: "Intel Core i7 thế hệ 13" },
      ],
      variants: [
        { sku: "XPS13-16-512", color: "Bạc", storage: "16GB/512GB", price: 32990000 },
      ],
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
      attributes: [
        { groupName: "Tính năng", attrName: "Chống ồn", attrValue: "Chủ động (ANC)" },
      ],
      variants: [{ sku: "APP2-WHT", color: "Trắng", storage: null, price: 5990000 }],
    },
    // 5 sản phẩm thêm để mega menu "Danh mục" ở Header có dữ liệu thật đủ
    // phong phú (nhiều thương hiệu/danh mục hơn) thay vì chỉ 3 danh mục cũ —
    // xem CategoryMegaMenu.tsx: cột thương hiệu bên phải suy ra TỪ chính dữ
    // liệu Product thật (brand nào có sản phẩm trong danh mục nào), không
    // phải danh sách brand cố định, nên cần sản phẩm thật để hiện đúng.
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
      ],
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
      attributes: [
        { groupName: "Vi xử lý", attrName: "CPU", attrValue: "Intel Core Ultra 5" },
      ],
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
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
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

  console.log(`Seed xong: ${products.length} sản phẩm.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
