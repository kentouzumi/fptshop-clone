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
- [x] Đăng nhập bằng số điện thoại + mã OTP (giống FPT Shop): thêm model
      OtpCode vào schema (đã prisma db push + generate), src/lib/otp.ts
      (normalizePhone, requestOtp, verifyOtp — hash mã bằng bcrypt, hết hạn
      5 phút, chặn gửi lại trong 60s, khóa sau 5 lần sai), API routes
      /api/auth/otp/{request,verify}. Trang /login có 2 tab: "Số điện thoại"
      (OTP, mặc định) và "Email" (giữ nguyên luồng cũ). Xác thực OTP đúng lần
      đầu sẽ tự tạo User mới bằng số điện thoại (chưa có UI đặt tên/mật khẩu
      sau đó). CHƯA nối SMS gateway thật — hiện chỉ console.log mã ở server
      và trả kèm `devCode` trong response khi NODE_ENV !== production để test;
      cần thay bằng Twilio/eSMS/SpeedSMS... trước khi lên production.
      Đã test qua dev server: gửi mã, chặn gửi lại sớm (429), sai mã (401),
      khóa sau 5 lần sai, chuẩn hóa số dạng +84, đúng mã tạo session — không lỗi
- [x] Trang quản trị (Admin) quản lý sản phẩm: guard requireAdmin() trong
      src/lib/auth.ts (chỉ role ADMIN/SUPER_ADMIN), src/app/admin/layout.tsx
      (redirect /login nếu không phải admin). Trang /admin/products (danh sách +
      xóa), /admin/products/new, /admin/products/[id]/edit dùng chung
      ProductForm. API: /api/admin/products (POST), /api/admin/products/[id]
      (PATCH/DELETE) — validate input qua src/lib/productInput.ts, check trùng
      slug. Upload ảnh: /api/admin/upload + src/lib/supabaseStorage.ts dùng
      @supabase/supabase-js với SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY (server-
      only, bucket "product-images"). CHƯA cấu hình 2 biến env này nên upload
      ảnh thật chưa hoạt động — form có ô nhập URL ảnh thủ công làm phương án
      tạm trong lúc chờ. Đã thêm remotePattern "*.supabase.co" vào
      next.config.ts cho next/image. Header hiện link "Quản trị" nếu user có
      role admin. Đã test qua dev server (tạo user admin test trực tiếp qua
      script, không đụng tài khoản thật): chặn truy cập khi chưa đăng nhập
      (redirect) và khi không phải admin (403), tạo/sửa/xóa sản phẩm, chặn
      trùng slug (409), upload báo lỗi rõ ràng khi chưa cấu hình Storage —
      không lỗi. Đã xóa user/session test.

- [x] Cấu hình SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY trong .env và tạo bucket
      public "product-images" (giới hạn 5MB, chỉ nhận image/jpeg,png,webp,gif) —
      upload ảnh admin đã hoạt động thật. Lỗi gặp phải lúc setup: SUPABASE_URL
      ban đầu bị copy nhầm thành URL REST API (`.../rest/v1/`) thay vì URL gốc
      project (`https://<ref>.supabase.co`), gây lỗi "Invalid path specified in
      request URL" khi upload — đã sửa. Đã test upload ảnh PNG thật lên Supabase
      Storage qua dev server (tạo admin test tạm), xác nhận ảnh trả về public
      URL truy cập được (200), đã dọn ảnh + tài khoản test.

- [x] User đã tự đưa tài khoản của mình lên role ADMIN qua Prisma Studio.
- [x] Trang chi tiết sản phẩm /products/[slug]: src/app/products/[slug]/page.tsx
      (Server Component: breadcrumb, mô tả, bảng thông số kỹ thuật gộp theo
      groupName, 4 sản phẩm cùng danh mục tái dùng getProducts()) +
      ProductGalleryAndBuy.tsx (Client Component: gallery ảnh + thumbnail,
      chọn variant đổi giá theo color/storage, nút "Thêm vào giỏ hàng" để
      disabled sẵn vì Cart chưa làm). Đã nối link từ card ở trang /products
      (trước đó card không dẫn đi đâu). Đã test qua dev server: sản phẩm nhiều
      variant (iPhone) và 1 variant (AirPods) đều render đúng giá/thông số,
      slug không tồn tại → 404, không lỗi.

- [x] Giỏ hàng: src/lib/cart.ts (getCartItemCount, getCartDetail, addToCart —
      dùng Cart/CartItem có sẵn, upsert cộng dồn quantity nếu thêm lại variant
      đã có). API: /api/cart/items (POST thêm), /api/cart/items/[id]
      (PATCH sửa số lượng, DELETE xóa — đều kiểm tra cartItem.cart.userId
      khớp user hiện tại, chặn sửa/xóa giỏ người khác). Trang /cart (redirect
      /login nếu chưa đăng nhập) + CartItemRow.tsx (client, nút +/-/xóa, tự
      router.refresh()). Nút "Thêm vào giỏ hàng" ở trang chi tiết sản phẩm giờ
      hoạt động thật (POST /api/cart/items, 401 thì redirect /login); nếu sản
      phẩm chưa có variant nào (vd sản phẩm tạo qua /admin chưa có variant) thì
      nút disabled "Chưa có phiên bản để mua" vì CartItem bắt buộc variantId.
      Header hiện "Giỏ hàng (n)" với n = tổng quantity. Nút "Thanh toán" ở
      /cart để disabled sẵn (Order/Payment chưa làm). Đã test qua dev server:
      chặn truy cập khi chưa đăng nhập (redirect + 401), thêm/cộng dồn số
      lượng, sửa số lượng, số lượng không hợp lệ (400), xóa item, chặn user
      khác sửa/xóa giỏ mình (404), header đếm đúng số lượng — không lỗi.

- [x] Thanh toán / tạo đơn hàng: src/lib/orders.ts (createOrderFromCart dùng
      $transaction — tạo Address từ form checkout, Order, OrderItem snapshot
      từ cart, Payment method COD status PENDING, OrderStatusHistory PENDING,
      rồi xóa CartItem; getOrderDetail/getOrdersForUser kiểm tra userId khớp).
      CHỈ hỗ trợ COD + giao hàng tận nơi (HOME_DELIVERY) — chưa tích hợp cổng
      thanh toán online thật (VNPay/Momo cần đăng ký merchant riêng) và chưa
      hỗ trợ STORE_PICKUP (bảng Store chưa có dữ liệu). Phí ship cố định
      30.000đ (SHIPPING_FEE trong lib/orders.ts), chưa áp dụng Coupon.
      API: POST /api/orders. Trang /checkout (form địa chỉ giao hàng +
      tóm tắt đơn), /orders/[id] (xác nhận + chi tiết đơn), /orders (danh sách
      đơn của user). Nút "Tiến hành thanh toán" ở /cart giờ dẫn tới /checkout
      thật. Header thêm link "Đơn hàng của tôi". Đã test qua dev server: giỏ
      trống → redirect /cart, thiếu thông tin → 400, chưa đăng nhập → 401, tạo
      đơn thành công (kiểm tra Order/OrderItem/Payment/OrderStatusHistory/
      Address đều đúng trong DB), giỏ hàng rỗng sau khi đặt, chặn user khác
      xem đơn của người khác (404) — không lỗi.

- [x] Hoàn thiện profile sau đăng nhập OTP: API PATCH /api/profile (sửa
      fullName, thêm/đổi email có check trùng, đặt/đổi mật khẩu — dùng chung
      hashPassword() trong lib/auth.ts) + trang /profile (ProfileForm.tsx: số
      điện thoại hiện read-only, họ tên, email, mật khẩu). Header: "Xin chào,
      {tên}" giờ là link tới /profile. Nhờ vậy user đăng nhập lần đầu bằng OTP
      (fullName mặc định = SĐT, không có email/mật khẩu) có thể tự đặt tên
      thật + thêm email/mật khẩu để sau này đăng nhập được cả bằng email.
      Đã test qua dev server: chặn truy cập chưa đăng nhập (redirect), họ tên
      quá ngắn (400), trùng email với user khác (409), cập nhật thành công rồi
      đăng nhập lại bằng đúng email/mật khẩu vừa đặt — không lỗi.

- [x] Trang chủ (src/app/page.tsx, trước đó vẫn là template mặc định của
      create-next-app): banner slider (HeroBanner.tsx, client, tự chuyển sau
      5s + chấm điều hướng, dữ liệu từ model Banner có sẵn — đã thêm seed
      idempotent theo position "home_slider" vì Banner không có unique key để
      upsert, seed.ts dùng count()===0 mới tạo), lưới danh mục, "Sản phẩm nổi
      bật" (getProducts featuredOnly:true — đã thêm tham số này vào
      lib/products.ts), "Sản phẩm mới" (getProducts mặc định). Tách
      src/components/ProductCard.tsx dùng chung cho /products,
      /products/[slug] (liên quan) và trang chủ (trước đó lặp code card 2 nơi,
      giờ dùng 3 nơi nên tách hẳn). Đổi title mặc định "Create Next App" trong
      layout.tsx thành "FPT Shop Clone". Đã test qua dev server: trang chủ +
      /products + /products/[slug] đều 200 sau refactor, banner/danh mục/sản
      phẩm nổi bật/sản phẩm mới render đúng — không lỗi.

- [x] Tìm kiếm/lọc/sắp xếp: ô tìm kiếm ở Header (form GET thuần tới
      /products?search=..., không cần JS). Trang /products thêm lọc theo
      thương hiệu (chip, giống category) và khoảng giá (5 mức cố định: dưới
      5tr, 5-15tr, 15-30tr, trên 30tr — dùng query minPrice/maxPrice), sắp xếp
      qua SortSelect.tsx (client, đổi URL bằng router.push): Mới nhất/Giá tăng
      dần/Giá giảm dần. lib/products.ts thêm brandSlug, minPrice, maxPrice,
      sort vào GetProductsParams; sort theo giá dùng orderBy trên
      Product.basePrice ở tầng DB (KHÔNG phải minPrice tính từ variant) —
      chấp nhận được vì basePrice luôn được đặt bằng giá variant rẻ nhất theo
      quy ước khi tạo sản phẩm, nhưng nếu sau này basePrice và giá variant lệch
      nhau thì thứ tự sắp xếp có thể không khớp chính xác 100% với khoảng giá
      hiển thị. API /api/products cũng nhận thêm brand/minPrice/maxPrice/sort.
      CHƯA làm autocomplete gợi ý khi gõ tìm kiếm (chỉ search cơ bản, không có
      dropdown gợi ý). Đã test qua dev server: tìm kiếm theo tên, lọc giá dưới
      5tr trả đúng 1 sản phẩm, sắp xếp giá tăng dần đúng thứ tự, kết hợp nhiều
      filter cùng lúc (category+brand+sort) vẫn 200 — không lỗi.

- [x] Đánh giá sản phẩm: thêm @@unique([productId, userId]) vào model Review
      trong schema (1 user chỉ đánh giá 1 lần/sản phẩm) — cần
      `prisma db push --accept-data-loss` (đã xin phép người dùng rõ ràng
      trước khi chạy vì Prisma CLI chặn AI agent chạy lệnh nguy hiểm khi chưa
      có PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION; bảng Review lúc đó đang
      rỗng nên không mất dữ liệu). src/lib/reviews.ts: getProductReviews (danh
      sách + điểm trung bình), hasUserPurchasedProduct (check OrderItem qua
      variant.productId để gắn nhãn "Đã mua hàng" — không yêu cầu đơn phải
      giao xong, chỉ cần có đơn chứa sản phẩm), getUserReviewForProduct,
      createReview. API: POST /api/reviews (bắt lỗi P2002 trả 409 khi đánh giá
      trùng). Trang chi tiết sản phẩm thêm section "Đánh giá sản phẩm":
      StarRating.tsx (hiển thị sao, dùng chung cho điểm trung bình + từng
      review), ReviewForm.tsx (client, chọn sao 1-5, tiêu đề tùy chọn, nội
      dung >= 10 ký tự) — chỉ hiện form nếu đã đăng nhập và chưa đánh giá sản
      phẩm này. CHƯA làm: vote "hữu ích" cho review (có model ReviewVote sẵn),
      ảnh đính kèm review (có model ReviewImage sẵn), hiển thị rating trên
      ProductCard ở trang danh sách. Đã test qua dev server (tạo user mua
      hàng thật qua Order status COMPLETED + user chưa mua, không đụng dữ
      liệu thật): rating ngoài 1-5 (400), nội dung quá ngắn (400), gửi đánh
      giá thành công gắn đúng isVerified true/false theo lịch sử mua hàng,
      chặn đánh giá lần 2 (409), trang hiển thị đúng điểm trung bình 4.0/5
      (2 đánh giá) và badge "Đã mua hàng" — không lỗi. Đã dọn dữ liệu test.

- [x] Wishlist (yêu thích): KHÔNG cần đổi schema (model WishlistItem đã có sẵn
      @@unique([userId, productId])). Tách mapProductToListItem() dùng chung
      trong src/lib/products.ts (trước đó logic map giá/ảnh sản phẩm chỉ nằm
      trong getProducts, giờ wishlist.ts cũng cần nên tách ra tránh lặp).
      src/lib/wishlist.ts: getWishlistCount, isInWishlist, addToWishlist
      (dùng upsert nên bấm 2 lần không lỗi), removeFromWishlist,
      getWishlistProducts. API: POST /api/wishlist, DELETE
      /api/wishlist/[productId]. Trang chi tiết sản phẩm thêm nút tim
      WishlistButton.tsx (client, toggle, truyền qua prop wishlistButton của
      ProductGalleryAndBuy — đặt cạnh nút "Thêm vào giỏ hàng"). Trang /wishlist
      liệt kê sản phẩm đã thích bằng ProductCard + RemoveWishlistButton.tsx.
      Header thêm "Yêu thích (n)". Đã test qua dev server: chặn thao tác khi
      chưa đăng nhập (401), thêm 2 lần không lỗi (idempotent), xóa đúng, trang
      /wishlist hiển thị đúng sản phẩm, nút trên trang chi tiết đổi trạng thái
      "♥ Đã yêu thích" đúng khi đã thêm — không lỗi.
      LƯU Ý QUAN TRỌNG phát hiện trong lúc test: sau khi `prisma db push` +
      `prisma generate` (như lúc thêm unique constraint cho Review ở mục
      trên), dev server ĐANG CHẠY SẴN từ trước đó vẫn giữ Prisma Client CŨ
      trong bộ nhớ (do lib/prisma.ts cố tình cache instance qua HMR để tránh
      hết connection) → gây lỗi "Unknown argument productId_userId" dù code
      và DB đều đúng. HMR của Next.js KHÔNG tự nạp lại Prisma Client (native
      binding) sau khi generate lại — bắt buộc phải tắt hẳn và chạy lại
      `npm run dev` (restart hẳn process, không chỉ save file) sau mỗi lần
      đổi schema.prisma. Đã restart dev server và xác nhận hết lỗi.

- [x] Admin quản lý đơn hàng: src/lib/orders.ts thêm ORDER_STATUS_TRANSITIONS
      (map trạng thái hiện tại -> danh sách trạng thái kế tiếp hợp lệ, chặn
      nhảy cóc kiểu PENDING -> DELIVERED), getAllOrdersForAdmin (lọc theo
      status + search theo mã đơn/tên/SĐT khách, phân trang 20/trang),
      getOrderDetailForAdmin (không giới hạn userId như bản khách hàng),
      updateOrderStatus (dùng $transaction: validate transition hợp lệ, update
      Order.status, tạo OrderStatusHistory, và TỰ ĐỘNG đánh dấu Payment COD
      đang PENDING thành PAID khi chuyển sang DELIVERED vì COD thu tiền lúc
      giao hàng). API: PATCH /api/admin/orders/[id] (requireAdmin guard, trả
      400 kèm thông báo tiếng Việt nếu transition không hợp lệ). Trang
      /admin/orders (danh sách: filter chip theo trạng thái, ô tìm kiếm,
      phân trang) và /admin/orders/[id] (thông tin khách hàng, địa chỉ giao,
      thanh toán, danh sách sản phẩm, lịch sử trạng thái, form đổi trạng thái
      OrderStatusUpdateForm.tsx chỉ hiện các lựa chọn hợp lệ tiếp theo). Thêm
      link "Đơn hàng" vào nav /admin/layout.tsx. Đã test qua dev server (tạo
      customer + admin + đơn hàng test bằng script riêng, không đụng dữ liệu
      thật): chặn truy cập khi chưa đăng nhập (403) và khi không phải admin
      (403), chặn chuyển trạng thái không hợp lệ kiểu PENDING -> SHIPPING
      (400), đi đúng luồng PENDING -> CONFIRMED -> PROCESSING -> SHIPPING ->
      DELIVERED, xác nhận Payment COD tự chuyển PENDING -> PAID khi
      DELIVERED, lịch sử trạng thái ghi đúng kèm ghi chú, tìm kiếm theo mã đơn
      trả đúng kết quả — không lỗi. Đã dọn dữ liệu test.

- [x] Sổ địa chỉ: src/lib/addresses.ts (getAddressesForUser, getAddress kiểm
      tra userId khớp, createAddress — địa chỉ đầu tiên tự động thành mặc
      định, updateAddress, setDefaultAddress, deleteAddress). API:
      /api/addresses (GET/POST), /api/addresses/[id] (PATCH sửa hoặc chỉ đổi
      isDefault, DELETE). Trang /addresses (danh sách + đặt mặc định + xóa),
      /addresses/new, /addresses/[id]/edit dùng chung AddressForm.tsx. Link
      "Sổ địa chỉ" thêm vào trang /profile. Checkout (CheckoutForm.tsx) giờ
      cho chọn 1 trong các địa chỉ đã lưu (mặc định chọn sẵn địa chỉ mặc
      định) hoặc "+ Nhập địa chỉ mới" — nhập mới sẽ tự lưu vào sổ địa chỉ
      (createOrderFromCart trong lib/orders.ts nhận addressId để TÁI SỬ DỤNG
      địa chỉ có sẵn thay vì luôn tạo bản ghi Address mới như trước).
      LỖI THẬT phát hiện lúc test: xóa địa chỉ đã dùng cho đơn hàng không bị
      chặn — quan hệ Order.addressId là optional nên Prisma mặc định
      onDelete: SetNull, xóa xong đơn hàng cũ vẫn còn nhưng addressId bị set
      về null, mất luôn thông tin giao hàng của đơn cũ một cách âm thầm (test
      DB xác nhận address.deleted thành công + order.addressId = null). Đã
      sửa bằng cách check thủ công trong deleteAddress(): tìm Order nào đang
      dùng addressId này trước, có thì chặn và trả lỗi rõ ràng (409) thay vì
      dựa vào ràng buộc DB. Đã test qua dev server (tạo 2 user test, không
      đụng dữ liệu thật): 401 khi chưa đăng nhập, tạo địa chỉ đầu tiên tự
      thành mặc định, đặt địa chỉ khác làm mặc định thì địa chỉ cũ tự bỏ mặc
      định, user khác không sửa/xóa được địa chỉ không phải của mình (chặn ở
      tầng service qua userId, không phải chỉ dựa vào ID đoán được), xóa địa
      chỉ mặc định thì địa chỉ còn lại tự lên làm mặc định, đặt hàng bằng
      địa chỉ đã lưu tái sử dụng đúng addressId, đặt hàng bằng địa chỉ mới tự
      lưu vào sổ địa chỉ, và sau khi sửa: xóa địa chỉ đã dùng cho đơn hàng bị
      chặn đúng (409) — không còn lỗi mất dữ liệu. Đã dọn dữ liệu test.

- [x] Admin quản lý User/Category/Brand: thêm requireSuperAdmin() vào
      lib/auth.ts (chỉ SUPER_ADMIN được đổi vai trò người dùng — phân quyền
      chặt hơn requireAdmin() thường dùng cho các mục khác) và sửa
      getCurrentUser() để kiểm tra thêm user.isActive (trước đây chỉ check
      session hết hạn, user bị khóa vẫn dùng được session cũ tới khi hết hạn
      — giờ khóa tài khoản có hiệu lực ngay cả với phiên đang đăng nhập).
      src/lib/users.ts (getAllUsersForAdmin lọc theo role/search + phân
      trang, updateUserRole, setUserActive — cả 2 đều chặn tự thao tác lên
      chính mình để tránh tự khóa/tự hạ quyền bản thân). src/lib/categories.ts
      và src/lib/brands.ts (CRUD + parseXInput dùng chung, chặn trùng
      slug/tên, chặn xóa khi còn sản phẩm thuộc về, category còn chặn thêm
      khi còn danh mục con hoặc parentId trỏ vào chính nó). API:
      /api/admin/users/[id] (PATCH — chỉ đổi role HOẶC isActive mỗi lần,
      role yêu cầu SUPER_ADMIN riêng), /api/admin/categories(+[id]),
      /api/admin/brands(+[id]). Trang /admin/users (bảng người dùng, chip
      lọc theo role, tìm kiếm, dropdown đổi role chỉ hiện cho SUPER_ADMIN,
      nút khóa/mở khóa ẩn với chính mình), /admin/categories(+/new,/[id]/edit
      dùng chung CategoryForm.tsx có chọn danh mục cha), /admin/brands
      (+/new,/[id]/edit dùng chung BrandForm.tsx). Thêm link "Danh mục",
      "Thương hiệu", "Người dùng" vào nav /admin/layout.tsx. Đã test qua dev
      server (tạo SUPER_ADMIN + ADMIN thường + customer test, không đụng dữ
      liệu thật): ADMIN thường đổi role bị chặn (403) nhưng khóa tài khoản
      vẫn được, tài khoản vừa bị khóa lập tức không dùng được API dù session
      còn hạn (401), SUPER_ADMIN mở khóa + đổi role thành công, cả 2 đều
      không tự đổi role/tự khóa được chính mình (400), tạo category/brand
      trùng slug hoặc trùng tên brand bị chặn (409), xóa category/brand còn
      sản phẩm bị chặn (409) nhưng xóa cái rỗng thì được, category tự làm
      cha của chính nó bị chặn (409) — không lỗi. Đã dọn dữ liệu test.

- [x] Vote "hữu ích" cho đánh giá (dùng model ReviewVote có sẵn, chưa làm ảnh
      đính kèm đánh giá — vẫn còn trong mục chưa làm bên dưới). lib/reviews.ts:
      getProductReviews nhận thêm currentUserId để trả kèm helpfulCount/
      notHelpfulCount/myVote cho mỗi review (tính bằng cách include votes rồi
      lọc trong JS, không dùng relation count filter của Prisma cho đơn
      giản); voteReview(reviewId, userId, isHelpful) — chặn tự vote đánh giá
      của chính mình, bấm lại đúng lựa chọn cũ thì tự bỏ vote (toggle off),
      đổi lựa chọn thì update. API: POST /api/reviews/[id]/vote. Trang chi
      tiết sản phẩm thêm ReviewVoteButtons.tsx (client) dưới mỗi review —
      chưa đăng nhập bấm sẽ chuyển tới /login, review của chính mình thì nút
      bị disable kèm tooltip giải thích. Đã test qua dev server (tạo reviewer
      + 2 voter test, không đụng dữ liệu thật): 401 khi chưa đăng nhập, chặn
      tự vote (400), vote hữu ích/không hữu ích đúng số đếm, bấm lại vote cũ
      thì bỏ vote, đổi từ hữu ích sang không hữu ích đúng, trang render đúng
      2 nút kèm số đếm — không lỗi. Đã dọn dữ liệu test.

- [x] Ảnh đính kèm đánh giá: src/lib/supabaseStorage.ts tách hàm dùng chung
      uploadToBucket(file, folder?) rồi thêm uploadReviewImage() (lưu vào
      thư mục con "reviews/" trong CÙNG bucket "product-images" đã cấu hình
      sẵn — không cần tạo bucket mới trên Supabase Dashboard). API mới POST
      /api/reviews/upload-image (yêu cầu đăng nhập, không cần quyền admin
      như /api/admin/upload — khác nhau vì đây là user thường tự upload ảnh
      đánh giá của họ). lib/reviews.ts: createReview nhận thêm imageUrls[]
      (giới hạn MAX_REVIEW_IMAGES = 5, tạo kèm ReviewImage trong cùng lúc
      tạo Review), getProductReviews include thêm images. ReviewForm.tsx cho
      chọn nhiều ảnh (input multiple), upload ngay từng ảnh lên Storage và
      hiện thumbnail kèm nút xóa trước khi gửi đánh giá; trang chi tiết sản
      phẩm hiển thị ảnh đính kèm dưới nội dung mỗi đánh giá (bấm vào ảnh mở
      full-size ở tab mới). Đã test qua dev server (tạo user test, upload
      ảnh PNG thật lên Supabase, không đụng dữ liệu thật): chặn upload khi
      chưa đăng nhập (401), upload 2 ảnh thật thành công và public URL truy
      cập được (200), gửi đánh giá kèm 2 ảnh tạo đúng ReviewImage, gửi quá 5
      ảnh bị chặn (400 dù client đã giới hạn, server cũng tự kiểm tra lại),
      trang hiển thị đúng ảnh đã upload — không lỗi. Đã dọn ảnh trên Supabase
      Storage và dữ liệu test.

- [x] Autocomplete gợi ý khi gõ tìm kiếm: lib/products.ts thêm
      searchSuggestions(query, limit=6) — chỉ query khi >= 2 ký tự để tránh
      trả về quá nhiều kết quả khi gõ 1 ký tự, tìm theo tên sản phẩm ACTIVE
      (contains, insensitive), trả kèm ảnh + giá. API: GET
      /api/products/suggest?q=... . src/app/products/SearchAutocomplete.tsx
      (client) thay cho ô input thường trong ô tìm kiếm ở Header — debounce
      250ms, hủy kết quả trả về trễ (dùng requestIdRef so sánh id request mới
      nhất để tránh race condition khi gõ nhanh kết quả cũ về sau đè kết quả
      mới), dropdown gợi ý điều hướng được bằng bàn phím (mũi tên lên/xuống,
      Enter chọn gợi ý đang highlight, Escape đóng), bấm ra ngoài tự đóng.
      VẪN GIỮ hành vi cũ khi không chọn gợi ý nào: input vẫn nằm trong
      <form method="GET" action="/products"> nên bấm Enter (không có gợi ý
      nào đang highlight) hoặc bấm nút "Tìm" vẫn submit form bình thường tới
      /products?search=... không cần JS — autocomplete chỉ là lớp tăng cường
      thêm. Đã test qua dev server: query 1 ký tự trả về rỗng, query khớp
      tên trả đúng sản phẩm kèm ảnh/giá, query không khớp trả rỗng, thiếu
      tham số q không lỗi, trang chủ vẫn render đúng input name="search",
      search qua Enter (/products?search=...) vẫn hoạt động bình thường —
      không lỗi.

- [x] Hiển thị rating trên ProductCard: ProductListItem (lib/products.ts)
      thêm averageRating/reviewCount, mapProductToListItem() tính từ mảng
      reviews (chỉ lấy review isVisible:true) truyền kèm trong query — phải
      sửa CẢ 2 nơi gọi hàm này (getProducts trong products.ts VÀ
      getWishlistProducts trong wishlist.ts) vì cùng dùng chung 1 hàm map
      nên cả 2 query Prisma đều phải include thêm reviews, không chỉ sửa 1
      chỗ. ProductCard.tsx hiện StarRating + "(số lượng)" nếu reviewCount > 0,
      ngược lại hiện "Chưa có đánh giá" màu xám. Đã test qua dev server (tạo
      1 review test trên iPhone, không đụng dữ liệu thật): sản phẩm có review
      hiện đúng 4/5 sao (4 sao đầy 1 sao rỗng) trên card ở trang /products,
      các sản phẩm khác không có review hiện đúng "Chưa có đánh giá", trang
      chủ/wishlist/related-products đều không lỗi type sau khi đổi interface
      — không lỗi. Đã dọn dữ liệu test.

- [x] Áp dụng mã giảm giá: src/lib/coupons.ts — validateCoupon(client, code,
      subtotal) nhận cả prisma thường lẫn transaction client (tx) để dùng
      chung cho cả API preview và lúc tạo đơn thật; kiểm tra đủ: tồn tại
      (không phân biệt hoa/thường, tự uppercase), isActive, trong khoảng
      startsAt-endsAt, usageLimit, minOrderValue. 3 loại CouponType: PERCENT
      (tính % trên subtotal, giới hạn bởi maxDiscount nếu có), FIXED_AMOUNT
      (trừ thẳng, không vượt quá subtotal), FREE_SHIPPING (miễn phí ship,
      không giảm subtotal). API: POST /api/coupons/validate (dùng để xem
      trước mức giảm ở trang checkout, KHÔNG tăng usedCount). lib/orders.ts:
      createOrderFromCart nhận thêm couponCode — validate LẠI TRONG
      TRANSACTION lúc tạo đơn (không tin kết quả preview phía client) để
      tránh race condition (vd 2 đơn cùng cố dùng nốt lượt cuối của coupon
      có usageLimit), tự tăng usedCount trong cùng transaction, set
      discountTotal/couponId trên Order, shippingFee về 0 nếu FREE_SHIPPING.
      Checkout: CheckoutForm.tsx nhận thêm subtotal/shippingFee từ server để
      tính tổng tự cập nhật khi áp mã (không cần gọi lại server) — ô nhập mã
      + nút "Áp dụng" gọi /api/coupons/validate, hiện rõ số tiền giảm hoặc
      "Miễn phí vận chuyển" kèm giá gạch ngang, có nút "Xóa" để bỏ mã. ĐÃ
      CHUYỂN khối tóm tắt tổng tiền từ cột phải (checkout/page.tsx, vốn tính
      tĩnh phía server nên không phản ứng được khi áp mã) sang nằm trong
      chính CheckoutForm ở cột trái, ngay trên nút đặt hàng — cột phải giờ
      chỉ còn danh sách sản phẩm. Đã test qua dev server (tạo user + nhiều
      coupon test đủ loại, không đụng dữ liệu thật): PERCENT bị giới hạn
      đúng bởi maxDiscount, FIXED_AMOUNT trừ đúng, FREE_SHIPPING về ship=0,
      coupon hết hạn/vô hiệu hóa/hết lượt/chưa đạt minOrderValue/không tồn
      tại đều bị chặn với thông báo đúng, mã viết thường vẫn nhận diện được,
      tạo đơn thật với coupon thì Order.discountTotal/grandTotal/couponId và
      Coupon.usedCount đều đúng trong DB, cố tình gọi thẳng API tạo đơn với
      coupon đã hết hạn (bỏ qua bước preview) vẫn bị chặn ở tầng transaction
      và giỏ hàng không bị xóa — không lỗi. Đã dọn dữ liệu test.

- [x] Admin tạo/sửa/xóa variant sản phẩm: src/lib/variants.ts (parseVariantInput,
      getVariantsForProduct, createVariant/updateVariant — check trùng SKU
      qua @unique toàn hệ thống, deleteVariant). LỖI TIỀM ẨN đã chủ động kiểm
      tra trước khi cho xóa (áp dụng đúng bài học "không tin ràng buộc DB tự
      chặn" đã ghi ở mục Lưu ý quan trọng): OrderItem.variantId là quan hệ
      BẮT BUỘC (không optional) nên xóa thẳng 1 variant đã từng được đặt hàng
      sẽ vi phạm khóa ngoại — đã tự check orderItem.count trước, chặn với
      thông báo rõ ràng thay vì để lỗi 500 từ Postgres. CartItem.variantId
      cũng là quan hệ bắt buộc nhưng KHÔNG phải dữ liệu lịch sử nên
      deleteVariant() tự dọn CartItem liên quan trước khi xóa variant (an
      toàn, không mất gì quan trọng); Inventory có onDelete: Cascade sẵn nên
      tự xóa theo; ProductImage.variantId optional nên tự SetNull (ảnh không
      mất, chỉ gỡ liên kết với variant cụ thể). API:
      POST /api/admin/products/[id]/variants (tạo), PATCH/DELETE
      /api/admin/variants/[id]. UI: VariantsManager.tsx (client) nhúng vào
      trang /admin/products/[id]/edit — bảng liệt kê variant, nút "+ Thêm
      biến thể" mở form inline ngay trong bảng, mỗi dòng có Sửa (mở form
      inline tại chỗ)/Xóa. CHỈ có ở trang edit (không có ở trang tạo mới) vì
      variant cần productId đã tồn tại — luồng đúng là tạo sản phẩm trước,
      vào sửa để thêm variant. Đã test qua dev server (tạo admin + customer +
      product test, không đụng dữ liệu thật): chặn tạo variant khi không phải
      admin (403), tạo 2 variant thành công, trùng SKU bị chặn (409, cả lúc
      tạo lẫn lúc sửa), sửa giá thành công, xóa variant chỉ đang nằm trong
      giỏ hàng thành công VÀ tự dọn đúng CartItem liên quan (xác nhận giỏ
      hàng rỗng sau đó), xóa variant đã có trong đơn hàng bị chặn đúng (409)
      — không lỗi. (Lưu ý ngoài lề: lúc test có gặp việc màu "Đen"/"Trắng" bị
      lưu sai thành "?en"/"Tr?ng" khi gõ trực tiếp qua lệnh curl trong
      Bash tool — xác minh lại bằng script Node gọi fetch() trực tiếp thì lưu
      đúng UTF-8 bình thường, nên đây là lỗi encoding của curl/terminal lúc
      test chứ không phải bug thật của app, không cần sửa code). Đã dọn dữ
      liệu test.

- [x] Nút yêu thích trên ProductCard: đổi ProductCard.tsx từ Server Component
      thuần thành Client Component (cần state cục bộ + onClick, trước đó
      không cần vì chỉ hiển thị tĩnh) — thêm nút tim overlay góc trên-phải
      ảnh, bấm gọi thẳng POST/DELETE /api/wishlist như WishlistButton ở
      trang chi tiết, chưa đăng nhập thì redirect /login khi API trả 401.
      Nút nằm trong thẻ <Link> bọc cả card nên onClick phải
      preventDefault()+stopPropagation() để không bị điều hướng nhầm sang
      trang chi tiết khi bấm tim. lib/wishlist.ts thêm
      getWishlistedProductIds(userId, productIds[]) — 1 query duy nhất lấy
      cả danh sách thay vì gọi isInWishlist() từng sản phẩm (N+1 query), trả
      về Set để lookup O(1) khi render từng card. Đã cập nhật CẢ 4 nơi dùng
      ProductCard để truyền initialInWishlist: trang chủ (nổi bật + mới),
      /products, mục sản phẩm liên quan ở /products/[slug], và /wishlist
      (luôn true) — nhân tiện XÓA HẲN RemoveWishlistButton.tsx vì giờ nút tim
      ngay trên card đã thay thế được (bấm bỏ thích sẽ router.refresh() nên
      item tự biến mất khỏi trang /wishlist). Đã test qua dev server (tạo
      user test có sẵn 1 sản phẩm trong wishlist, không đụng dữ liệu thật):
      card đúng sản phẩm hiện ♥ đỏ + aria-label "Bỏ yêu thích", các sản phẩm
      khác hiện ♡ xám + "Thêm vào yêu thích", bấm bỏ thích (DELETE) rồi tải
      lại trang thì đúng chuyển về ♡, thêm lại (POST) thì trang /wishlist
      hiện đúng ♥, chưa đăng nhập gọi API trả 401 (client sẽ redirect login)
      — không lỗi. Đã dọn dữ liệu test.

- [x] Nhóm tính năng "Nhóm 1" (8 tính năng dùng các model có sẵn trong schema
      nhưng trước đó chưa có UI nào — Bảo hành, Thu cũ đổi mới, Điểm thành
      viên, Hỗ trợ khách hàng, Thông báo, Khuyến mãi, Danh sách cửa hàng,
      Trang tĩnh/FAQ). Làm cùng lúc trong 1 phiên nên test có phần nhẹ hơn
      các tính năng trước (không test exhaustive mọi edge case như thường lệ)
      nhưng đã verify được luồng chính + các hook quan trọng. Chi tiết:

      + src/lib/notifications.ts: createNotification/getNotificationsForUser/
        getUnreadNotificationCount/markNotificationRead/markAllNotificationsRead.
        API /api/notifications (PATCH đánh dấu tất cả đã đọc),
        /api/notifications/[id] (PATCH đánh dấu 1 cái). Trang /notifications,
        Header hiện "Thông báo (n)".

      + src/lib/stores.ts: CRUD Store (parseStoreInput, getActiveStores,
        getAllStoresForAdmin, create/update/deleteStore — deleteStore chặn
        nếu còn Order.pickupStoreId trỏ tới, dù hiện chưa ai dùng
        STORE_PICKUP). Trang public /stores (nhóm theo tỉnh/thành),
        /admin/stores(+/new,/[id]/edit).

      + src/lib/content.ts: CRUD StaticPage (slug/title/content, chặn trùng
        slug) + FaqItem (question/answer/sortOrder). Trang public /faq
        (dạng <details> accordion), /pages/[slug] (render StaticPage theo
        slug). Admin /admin/static-pages, /admin/faq — dùng chung 1 trang
        quản lý dạng list + form thêm/sửa hiện inline ngay trong bảng (giống
        VariantsManager) thay vì tách trang new/edit riêng, vì đây là loại
        nội dung đơn giản không cần trang riêng.

      + src/lib/promotions.ts: CRUD Promotion (title/description/bannerUrl/
        linkUrl/startsAt/endsAt/isActive/sortOrder), getActivePromotions()
        lọc theo isActive + đang trong khoảng startsAt-endsAt. Trang chủ
        thêm section "Khuyến mãi" (khác Banner đã dùng cho hero slider) hiện
        ngay dưới banner nếu có khuyến mãi đang chạy. Admin /admin/promotions
        (list+form inline, input datetime-local cho ngày).

      + src/lib/loyalty.ts: quy tắc MVP tự đặt (không theo chính sách FPT
        Shop thật) — 1 điểm / 10.000đ giá trị đơn hàng, mốc hạng SILVER=500đ/
        GOLD=2000đ/DIAMOND=5000đ điểm. awardPointsForOrder(tx, userId,
        orderId, grandTotal) được gọi TỰ ĐỘNG bên trong updateOrderStatus()
        (lib/orders.ts) khi đơn chuyển sang DELIVERED — dùng chung transaction
        với việc update trạng thái đơn để đảm bảo tính điểm và đổi trạng thái
        đơn là atomic (không bị tính điểm 2 lần nếu retry, không bị mất điểm
        nếu 1 trong 2 lỗi). Trang /loyalty hiện điểm/hạng + lịch sử giao dịch
        điểm. CHƯA làm UI đổi điểm lấy ưu đãi (REDEEM) — chỉ có chiều tích
        điểm (EARN).

      + src/lib/warranty.ts: createWarrantiesForOrder(tx, orderId) cũng được
        gọi TỰ ĐỘNG trong updateOrderStatus() khi DELIVERED — tạo 1 Warranty
        (hạn 12 tháng kể từ ngày giao, con số tự chọn cho MVP) cho MỖI
        OrderItem của đơn và gán orderItem.warrantyId. createWarrantyClaim()
        kiểm tra warranty thuộc đúng user gọi + còn hiệu lực (status ACTIVE
        và chưa quá endDate) trước khi cho gửi yêu cầu. Trang /warranty (danh
        sách bảo hành theo từng sản phẩm đã mua kèm nút gửi yêu cầu bảo hành
        nếu còn hiệu lực), API POST /api/warranty/claims. Admin
        /admin/warranty-claims (danh sách toàn bộ yêu cầu + đổi trạng thái
        RECEIVED/IN_PROGRESS/REPAIRED/REPLACED/REJECTED qua dropdown).

      + src/lib/tradeIn.ts: TRADE_IN_STATUS_TRANSITIONS (QUOTED->CONFIRMED/
        CANCELLED -> RECEIVED/CANCELLED -> COMPLETED/CANCELLED) chặn nhảy
        cóc giống ORDER_STATUS_TRANSITIONS. User gửi yêu cầu chỉ cần mô tả
        máy + tình trạng (quotedPrice mặc định 0 = "chưa báo giá" vì DB bắt
        buộc field này có giá trị), admin tự nhập giá báo sau qua ô riêng
        (không gộp chung với đổi trạng thái, có thể sửa giá nhiều lần trước
        khi CONFIRMED). Trang /trade-in (form gửi yêu cầu + danh sách yêu cầu
        của mình), /admin/trade-in (input giá + dropdown trạng thái mỗi
        dòng).

      + src/lib/support.ts: SupportTicket có userId optional trong schema
        (thiết kế ban đầu hỗ trợ khách vãng lai không cần tài khoản) nhưng
        MVP này CHỈ cho user đã đăng nhập tạo/xem ticket (đơn giản hóa, không
        làm tra cứu ticket bằng mã cho khách vãng lai) — ghi rõ hạn chế này
        để không nhầm là bug. addReply(ticketId, isStaff, content): nếu
        isStaff=true và ticket đang OPEN thì tự chuyển IN_PROGRESS, đồng thời
        tạo Notification loại SYSTEM cho khách (enum NotificationType không
        có giá trị TICKET riêng nên tái dùng SYSTEM, ghi rõ quyết định này).
        Trang /support (tạo yêu cầu nếu đã đăng nhập + danh sách yêu cầu của
        mình, khách vãng lai chỉ thấy link sang /faq và lời nhắc đăng nhập),
        /support/[id] (thread hội thoại + form trả lời, kiểm tra
        ticket.userId khớp user hiện tại mới cho xem/trả lời). Admin
        /admin/support (danh sách + lọc theo trạng thái), /admin/support/[id]
        (thread + form trả lời dưới vai nhân viên + đổi trạng thái).

      + Header.tsx thêm link công khai "Cửa hàng", "Hỗ trợ" và (khi đã đăng
        nhập) "Thông báo (n)". Trang /profile thêm mục liên kết nhanh tới
        Sổ địa chỉ/Đơn hàng/Bảo hành/Thu cũ đổi mới/Điểm thành viên/Yêu cầu
        hỗ trợ — dùng làm "hub" cho các trang tài khoản thay vì nhét hết vào
        nav trên cùng (nav đã khá dài). Admin nav thêm Cửa hàng/Khuyến mãi/
        Bảo hành/Thu cũ đổi mới/Hỗ trợ/Trang tĩnh/FAQ, đã đổi thành
        flex-wrap vì quá nhiều mục.

      Đã test qua dev server (tạo admin+customer test, 1 đơn hàng test đi
      hết luồng PENDING->...->DELIVERED, không đụng dữ liệu thật): toàn bộ
      trang public/customer/admin mới đều render đúng (200) và guard đăng
      nhập/quyền admin đều đúng (redirect/403); CRUD Store/FAQ/StaticPage/
      Promotion qua admin đều hoạt động và hiển thị đúng ở trang public
      tương ứng; QUAN TRỌNG NHẤT — xác nhận đơn hàng chuyển DELIVERED tự
      động: tính đúng 3002 điểm cho đơn 30.020.000đ (lên hạng Vàng ngay vì
      >= 2000), tạo đúng 1 Warranty hạn 12 tháng gắn vào OrderItem, và tạo
      đủ 4 Notification (1 cho mỗi lần đổi trạng thái); gửi yêu cầu bảo hành
      thành công + chặn user khác claim bảo hành không phải của mình (400);
      trade-in: chặn nhảy cóc trạng thái QUOTED->RECEIVED (400), cho phép
      QUOTED->CONFIRMED, admin sửa giá báo thành công; support ticket: chặn
      user khác xem/trả lời ticket không phải của mình (404), admin trả lời
      tự chuyển OPEN->IN_PROGRESS và tạo đúng Notification cho khách, đánh
      dấu tất cả thông báo đã đọc làm mất số đếm ở Header — không lỗi. Đã
      dọn sạch dữ liệu test (kể cả Warranty/LoyaltyTransaction/Notification
      phát sinh từ hook tự động).

- [x] Thanh toán online qua VNPay: thêm PaymentMethod.VNPAY vào schema
      (prisma db push — chỉ thêm giá trị enum, không mất dữ liệu). Cổng VNPay
      là cổng trung gian nhận nhiều loại thẻ (ATM nội địa/QR/Visa-Mastercard)
      qua CÙNG 1 luồng tích hợp nên chỉ cần 1 PaymentMethod chung, không tách
      theo loại thẻ khách chọn bên trong trang VNPay. src/lib/vnpay.ts (thuần
      logic ký/xác thực, KHÔNG đụng DB): createVnpayPaymentUrl() build tham
      số vnp_* theo tài liệu VNPay (sort key alphabet, encode
      application/x-www-form-urlencoded rồi HMAC-SHA512 bằng
      VNPAY_HASH_SECRET), verifyVnpayCallback() xác thực chữ ký lúc nhận kết
      quả về. src/lib/orders.ts thêm: createOrderFromCart nhận paymentMethod
      ("COD"|"VNPAY", mặc định COD) — nếu VNPAY thì tạo Payment method VNPAY
      kèm 1 vnp_TxnRef duy nhất (`${orderCode}-${Date.now()}`, lưu vào
      Payment.transactionRef để đối chiếu lúc callback vì VNPay không gửi lại
      orderId của hệ thống mình); generatePaymentUrlForOrder(orderId, userId,
      ipAddr) tạo URL thanh toán cho đơn đã có sẵn — dùng cả lúc đặt hàng lần
      đầu lẫn lúc "Thanh toán lại" (mỗi lần gọi sinh txnRef MỚI vì VNPay không
      cho tái dùng txnRef cũ, và tự đưa Payment từ FAILED về PENDING trước khi
      tạo giao dịch mới); handleVnpayCallback(query) verify chữ ký + tìm
      Payment theo transactionRef + kiểm tra amount khớp, nếu thành công thì
      trong 1 transaction: đánh dấu Payment PAID + paidAt, và nếu Order đang
      PENDING thì tự chuyển sang CONFIRMED (kèm OrderStatusHistory +
      Notification) — coi thanh toán online thành công tương đương xác nhận
      đơn ngay (khác COD chỉ xác nhận thủ công qua admin). Hàm này IDEMPOTENT
      (check payment.status !== PENDING trước khi xử lý) vì có thể bị gọi 2
      lần (cả return URL lẫn IPN cùng trỏ vào 1 giao dịch, hoặc VNPay tự động
      gọi lại IPN nếu lần trước timeout).

      API: POST /api/orders nhận thêm paymentMethod, nếu VNPAY thì sau khi
      tạo đơn gọi luôn generatePaymentUrlForOrder và trả kèm paymentUrl để
      client redirect (chặn từ đầu nếu VNPay chưa cấu hình, trả 400 rõ ràng).
      POST /api/orders/[id]/pay ("Thanh toán lại", check ownership qua
      userId). GET /api/payments/vnpay/return (redirect trình duyệt, verify
      xong redirect tiếp về /orders/[id]?payment=success|failed — dùng cho cả
      mục đích cập nhật trạng thái luôn vì đây là cách DUY NHẤT test được khi
      chạy local). GET /api/payments/vnpay/ipn (server-to-server, response
      đúng format {RspCode, Message} theo tài liệu VNPay: "00" thành công,
      "02" đã xử lý rồi, "04" sai số tiền, "97" sai chữ ký, "01" không tìm
      thấy giao dịch — đây mới là nguồn xác nhận ĐÁNG TIN CẬY theo khuyến cáo
      VNPay vì return URL có thể không được gọi nếu khách tắt tab giữa
      chừng, nhưng CHỈ hoạt động nếu URL này public để VNPay gọi tới được,
      tức là KHÔNG dùng được với localhost thuần — cần ngrok/cloudflared
      tunnel để có URL public tạm thời lúc test đầy đủ bằng IPN thật; hiện
      tại chỉ dựa vào return URL để test/demo local).

      UI: /checkout thêm lựa chọn phương thức thanh toán (radio COD/VNPay —
      VNPay tự disable kèm nhãn "chưa khả dụng" nếu chưa cấu hình
      VNPAY_TMN_CODE/VNPAY_HASH_SECRET, dùng isVnpayConfigured() từ
      lib/vnpay.ts), chọn VNPay thì sau khi tạo đơn JS tự
      window.location.href sang paymentUrl thay vì router.push. Trang
      /orders/[id] hiện banner theo query ?payment=success|failed, hiện đúng
      trạng thái thanh toán (PAID/FAILED/chưa thanh toán) thay vì dòng chữ
      cứng "COD" như trước, và có nút "Thanh toán lại qua VNPay"
      (RetryPaymentButton.tsx) nếu Payment đang PENDING hoặc FAILED.

      CHƯA cấu hình VNPAY_TMN_CODE/VNPAY_HASH_SECRET thật trong .env (để
      trống, xem TODO ngay trong file) — cần tự đăng ký tài khoản merchant
      sandbox MIỄN PHÍ tại https://sandbox.vnpayment.vn/devreg/ để lấy 2 giá
      trị này (mình không tự tạo được vì đây là thông tin merchant riêng của
      từng người). CHƯA làm Momo (cùng nhóm yêu cầu ban đầu, nhưng ưu tiên
      VNPay trước vì phổ biến hơn trong tài liệu/dự án học tập tiếng Việt —
      có thể làm thêm sau theo đúng pattern của lib/vnpay.ts nếu cần). Đã
      test qua dev server bằng cách tự cấp tạm VNPAY_TMN_CODE/HASH_SECRET giả
      + tự ký lại các tham số vnp_* giả lập VNPay gọi về (dùng đúng thuật
      toán HMAC-SHA512 y hệt code thật, không mock hàm) để verify được toàn
      bộ luồng thật với DB thật: tạo đơn VNPay trả đúng paymentUrl kèm chữ ký
      hợp lệ, giả lập callback thành công cập nhật đúng Payment PAID + Order
      CONFIRMED + đúng 1 Notification (không lặp khi gọi lại return URL lần
      2 hoặc gọi thêm IPN cho cùng giao dịch — IPN trả đúng "02"), giả lập
      callback thất bại (vnp_ResponseCode=24) giữ Order PENDING + Payment
      FAILED, "Thanh toán lại" từ đơn FAILED tạo đúng txnRef mới và hoàn tất
      thành công ở lần thử thứ 2, IPN từ chối đúng khi sai chữ ký (97) và khi
      số tiền không khớp (04), COD vẫn hoạt động bình thường không bị ảnh
      hưởng. LỖI THẬT phát hiện lúc test: generatePaymentUrlForOrder() ban
      đầu chỉ cho phép "Thanh toán lại" khi Payment đang PENDING, nhưng thanh
      toán thất bại lại set Payment thành FAILED — vô tình tự chặn đúng use
      case chính của nút "Thanh toán lại" (test retry trả lỗi 400 dù đúng ra
      phải cho phép). Đã sửa cho phép cả PENDING lẫn FAILED, và tự đưa
      FAILED về PENDING trước khi tạo txnRef mới. Đã dọn sạch dữ liệu test
      (đơn hàng, payment, notification, user, session) và trả
      VNPAY_TMN_CODE/HASH_SECRET về rỗng trong .env sau khi test xong.

      ĐÃ BỊ THAY THẾ HOÀN TOÀN — xem mục "Chuyển thanh toán online sang MoMo"
      (nằm cuối file, sau phần đổi auth sang Google OAuth). Lý do: sau khi
      user tự đăng ký được tài khoản merchant sandbox thật (có TMN_CODE/
      HASH_SECRET thật) và deploy lên Vercel, trang VNPay sandbox liên tục
      báo lỗi hệ thống chung chung ("Kết nối hệ thống tạm thời bị gián đoạn")
      khi thao tác trên dashboard merchant thật — không ổn định để demo/dùng
      tiếp, user quyết định đổi sang MoMo. Toàn bộ src/lib/vnpay.ts, 2 route
      /api/payments/vnpay/{return,ipn}, và các biến VNPAY_* trong .env đã bị
      XÓA HẲN. Giá trị enum `VNPAY` trong PaymentMethod (schema.prisma) được
      GIỮ LẠI (không xóa) vì các đơn hàng test cũ (đã dọn) không còn nhưng để
      lại không có tác hại, tránh phải chạy thêm 1 lần `prisma db push`.

- [x] Giao hàng tận cửa hàng (STORE_PICKUP): KHÔNG cần đổi schema (Order đã
      có sẵn pickupStoreId + DeliveryMethod từ trước). lib/orders.ts:
      CheckoutInput thêm deliveryMethod ("HOME_DELIVERY"|"STORE_PICKUP",
      mặc định HOME_DELIVERY) + pickupStoreId. createOrderFromCart(): nếu
      STORE_PICKUP thì shippingFee ép về 0 (ghi đè sau bước tính coupon vì
      FREE_SHIPPING coupon cũng chỉ đưa về 0, không xung đột), validate store
      tồn tại + isActive NGAY TRONG transaction, addressId để null (Address
      là quan hệ optional trên Order nên không cần tạo/chọn địa chỉ) — khác
      hẳn nhánh HOME_DELIVERY vẫn giữ nguyên yêu cầu địa chỉ như cũ. API
      POST /api/orders parse thêm deliveryMethod/pickupStoreId, CHỈ bắt buộc
      nhập địa chỉ (addressId hoặc newAddress) khi deliveryMethod là
      HOME_DELIVERY — bỏ qua validate địa chỉ hoàn toàn khi STORE_PICKUP.
      getOrderDetail/getOrderDetailForAdmin/updateOrderStatus đều include
      thêm quan hệ pickupStore.

      UI: /checkout thêm lựa chọn "Hình thức nhận hàng" (radio Giao tận nơi/
      Nhận tại cửa hàng — tự disable kèm nhãn "chưa có cửa hàng" nếu
      getActiveStores() trả về rỗng, y hệt cách vnpayAvailable tự disable ở
      mục VNPay), chọn "Nhận tại cửa hàng" thì ẩn hẳn phần chọn/nhập địa chỉ,
      hiện danh sách cửa hàng active (radio, dùng chung style với ô chọn địa
      chỉ đã lưu) và phí vận chuyển tự hiện "Miễn phí" bất kể có coupon hay
      không. Trang /orders/[id] và /admin/orders/[id] hiện khối "Nhận tại
      cửa hàng" (tên + địa chỉ + SĐT cửa hàng) thay cho khối "Giao đến" khi
      deliveryMethod là STORE_PICKUP.

      QUYẾT ĐỊNH PHẠM VI (MVP, không theo đúng luồng FPT Shop thật): luồng
      trạng thái đơn hàng (ORDER_STATUS_TRANSITIONS) dùng CHUNG cho cả 2
      hình thức giao hàng, tức đơn STORE_PICKUP vẫn phải đi qua trạng thái
      SHIPPING ("Đang giao") trước khi DELIVERED dù về logic nhận tại cửa
      hàng không thực sự có bước "giao hàng" — chấp nhận được vì đơn giản
      hóa state machine, không rẽ nhánh theo deliveryMethod. Thêm 2 cửa hàng
      mẫu thật vào DB (FPT Shop Cầu Giấy - Hà Nội, FPT Shop Quận 1 - TP.HCM)
      để tính năng dùng thử được ngay, quản lý tiếp qua /admin/stores. Đã
      test qua dev server (tạo user + cart test riêng, không đụng dữ liệu
      thật): tạo đơn STORE_PICKUP thành công không cần địa chỉ, DB đúng
      addressId=null/pickupStoreId đúng/shippingFee=0/deliveryMethod=
      STORE_PICKUP, thiếu pickupStoreId bị chặn (400) ở tầng API, chọn cửa
      hàng không tồn tại bị chặn (400) ở tầng transaction và giỏ hàng KHÔNG
      bị xóa (rollback đúng — xác nhận lại bằng cách đặt hàng HOME_DELIVERY
      ngay sau đó bằng cùng giỏ hàng vẫn thành công), trang chi tiết đơn
      (khách hàng lẫn admin) hiển thị đúng thông tin cửa hàng — không lỗi.
      Đã dọn dữ liệu test (giữ lại 2 cửa hàng mẫu vì là dữ liệu thật hữu ích).

- [x] Làm đẹp giao diện toàn site theo hướng hiện đại/tối giản (giữ nguyên
      tông màu đen-trắng-zinc hiện có, không đổi sang màu cam/đỏ FPT Shop
      thật — theo yêu cầu của user khi được hỏi). KHÔNG đụng logic nghiệp vụ
      ở bất kỳ file nào, chỉ đổi className/JSX trình bày. Chi tiết:

      + globals.css: sửa 1 LỖI THẬT phát hiện lúc rà lại — body đang set
        `font-family: Arial, Helvetica, sans-serif` CỨNG, đè mất hoàn toàn
        biến --font-geist-sans mà layout.tsx đã nạp qua next/font (nghĩa là
        suốt từ đầu dự án, font Geist Sans được cấu hình nhưng KHÔNG BAO GIỜ
        thực sự hiển thị, toàn site chạy Arial mặc định của trình duyệt) —
        đã sửa dùng đúng var(--font-sans). Bỏ khối `@media
        (prefers-color-scheme: dark)` vì không có component nào trong app
        được thiết kế dark-aware (toàn bộ dùng bg-white/border-zinc-* cứng),
        để nguyên sẽ khiến nền lật sang tối trong khi chữ/card vẫn sáng, vỡ
        giao diện với user bật dark mode hệ điều hành — chủ động ép site
        light-only cho nhất quán. Thêm @layer components định nghĩa class
        dùng chung: .card (bo góc 2xl, viền nhạt, shadow rất nhẹ), .btn-
        primary/.btn-secondary (nút bo tròn pill), .input (ô nhập có ring
        khi focus thay vì chỉ đổi border), .chip/.chip-active/.chip-inactive
        (dùng cho các bộ lọc dạng pill) — dùng lại được ở mọi trang thay vì
        lặp cụm className dài. Thêm @layer base cho transition mượt trên mọi
        a/button và style :focus-visible rõ ràng hơn (phục vụ bàn phím/
        accessibility, trước đó dùng outline mặc định của trình duyệt).

      + src/components/Footer.tsx (mới) + nối vào layout.tsx: trước đó site
        không có footer nào. layout.tsx cũng đổi bg-white lộ ra khoảng trắng
        thành bg-zinc-50 cho toàn bộ nền trang (card nổi bật hơn trên nền
        hơi xám thay vì trắng trên trắng).

      + src/components/Header.tsx: viết lại hoàn toàn. Trước đó nav khi đã
        đăng nhập nhồi 8 link chữ liền nhau (Sản phẩm/Cửa hàng/Hỗ trợ/Yêu
        thích/Giỏ hàng/Thông báo/Đơn hàng/Quản trị/tên user/Đăng xuất) rất
        rối. Giờ tách 2 tầng: tầng trên (logo + ô tìm kiếm + cụm icon Yêu
        thích/Giỏ hàng/Thông báo dạng SVG có chấm đỏ báo số lượng + khu vực
        tài khoản dạng avatar tròn chữ cái đầu tên), tầng dưới là thanh nav
        phụ mỏng (Sản phẩm/Cửa hàng/Hỗ trợ/FAQ/Đơn hàng của tôi). Header giờ
        sticky top-0 kèm backdrop-blur. src/app/products/SearchAutocomplete.tsx
        thêm icon kính lúp trong ô input, dropdown gợi ý bo góc lớn hơn +
        giá tiền tô đỏ cho dễ nhìn.

      + Trang chủ, ProductCard, trang /products, trang chi tiết sản phẩm
        (+ProductGalleryAndBuy/WishlistButton), /cart (+CartItemRow),
        /checkout (+CheckoutForm — viết lại toàn bộ nhóm radio chọn hình
        thức nhận hàng/địa chỉ/thanh toán thành dạng "thẻ chọn" bo góc thay
        vì viền mảnh, mỗi nhóm lựa chọn nằm trong 1 .card riêng cho rõ phân
        đoạn), /orders(+[id], +RetryPaymentButton — thêm badge màu theo
        trạng thái đơn PENDING/CONFIRMED/.../CANCELLED thay vì chữ đen trơn),
        /login, /register, /profile (+ProfileForm — chuyển danh sách link
        nhanh "Sổ địa chỉ/Đơn hàng/Bảo hành/..." từ list gạch chân thành
        lưới thẻ bo góc) đều được áp lại theo bộ class ở trên: bo góc lớn
        hơn (xl/2xl thay vì lg), shadow nhẹ + nổi lên khi hover
        (hover:-translate-y-0.5 hover:shadow-lg) thay vì chỉ đổi border,
        ảnh sản phẩm zoom nhẹ khi hover card.

      + Admin: TÁCH nav ngang (flex-wrap 12 link, tràn nhiều dòng khi đủ
        tính năng) thành sidebar dọc cố định bên trái — src/app/admin/
        AdminSidebarNav.tsx (client component, dùng usePathname() để tô
        đậm mục đang active) nhóm 12 mục quản trị thành 4 nhóm theo chức
        năng (Bán hàng/Marketing/Chăm sóc khách hàng/Hệ thống) thay vì để
        phẳng 1 hàng — dễ định vị hơn khi danh sách quản trị đã khá dài sau
        các đợt thêm tính năng trước. Sidebar ẩn dưới md (chỉ hiện đủ tốt
        trên desktop vì admin gần như luôn dùng trên máy tính), thay bằng
        AdminMobileNav (cùng file, thanh chip cuộn ngang) để không hoàn
        toàn mất điều hướng trên mobile. admin/layout.tsx đổi sang layout 2
        cột (sidebar + nội dung) thay vì cột đơn full-width. Do khối lượng
        ~12 trang quản trị quá lớn để làm hết trong 1 lượt, CHỈ hand-polish
        sâu 2 trang tiêu biểu (danh sách sản phẩm, danh sách + chi tiết đơn
        hàng — badge trạng thái màu theo từng status, bảng dùng .card, nút
        theo .btn-primary) làm mẫu; các trang admin còn lại (danh mục,
        thương hiệu, người dùng, cửa hàng, khuyến mãi, bảo hành, thu cũ đổi
        mới, hỗ trợ, trang tĩnh, FAQ) CHƯA được polish riêng — vẫn dùng
        style bảng/form cũ, chỉ hưởng lợi gián tiếp từ các thay đổi nền
        (font đúng, sidebar mới, transition mượt hơn toàn cục qua
        @layer base). Đây là điểm có thể làm tiếp nếu cần đồng bộ hết.

      Đã test qua dev server: `tsc --noEmit` và `eslint` sạch sau khi sửa
      toàn bộ ~25 file; smoke-test 200 cho các trang public chính (/, 
      /products, /login, /register, /faq, /stores) và trang admin
      (/admin/products, /admin/orders, /admin/stores) qua session admin
      test tạo riêng; kiểm tra log dev server không phát sinh lỗi/warning
      mới. KHÔNG kiểm tra bằng mắt qua trình duyệt thật (môi trường không
      có màn hình) — chỉ xác nhận HTML trả về đúng 200 và không có runtime
      error phía server; các chi tiết thị giác tinh tế (căn chỉnh, màu sắc
      thực tế trên trình duyệt) nên được user tự xem lại qua
      `npm run dev` để xác nhận hợp mắt.

- [x] Áp bảng màu "Đêm Hổ Phách" (Amber Night) làm theme chính thức của site
      — trước đó chỉ demo 5 hướng phong cách trong 1 artifact riêng (Sổ Mẫu
      Phong Cách) để user chọn, đã chốt hướng này. Nền tím than đậm, chữ kem
      ấm, 1 điểm nhấn hổ phách (#ffb454) dùng cho giá tiền/nút chính/trạng
      thái được chọn.

      CÁCH LÀM (đòn bẩy quan trọng nhất): thay vì sửa className ở từng file
      trong ~90 file đã dùng sẵn thang màu zinc-*/white/black của Tailwind,
      ĐỊNH NGHĨA LẠI thẳng các token màu đó trong globals.css qua khối
      `@theme` của Tailwind v4 (--color-white, --color-black, --color-zinc-
      50..950). Vì toàn bộ codebase từ trước tới giờ dùng thang zinc theo
      đúng 1 quy ước ngữ nghĩa nhất quán (zinc-50 = nền trang, white = bề
      mặt card, zinc-900 = chữ nhấn mạnh nhất, black = màu nút hành động
      chính) nên chỉ cần "đảo ngược độ sáng, giữ nguyên thứ bậc" là mọi
      className có sẵn (bg-white, border-zinc-200, text-zinc-500, bg-black
      text-white...) tự động lên đúng màu mới — không phải sửa tay từng
      file. Đã audit kỹ trước khi làm (grep toàn bộ usage của black/white/
      red-600/green/blue) để chắc mỗi utility chỉ được dùng cho ĐÚNG 1 vai
      trò ngữ nghĩa trước khi remap (vd bg-black/text-white chỉ dùng cho
      nút chính & chip active ở mọi nơi, không lẫn với người dùng thật).

      Font: next/font/google đổi từ Geist Sans/Mono sang Unbounded (heading,
      qua rule `h1,h2,h3{font-family:...}` trong @layer base — áp dụng toàn
      site chỉ bằng 1 rule vì mọi trang đều dùng thẻ heading thật, không
      phải div giả) + Plus Jakarta Sans (chữ thường) + JetBrains Mono (giữ
      cho các input font-mono sẵn có: SKU, slug). LƯU Ý QUAN TRỌNG: đã tự
      kiểm tra bằng cách viết 1 file .tsx tạm gọi next/font/google với
      subsets:["vietnamese"] rồi chạy `tsc --noEmit` — TypeScript của
      Next.js sẽ báo lỗi type ngay nếu subset không tồn tại cho font đó
      (không cần đoán/tra cứu ngoài). Nhờ vậy phát hiện Sora (font định dùng
      ban đầu theo đúng bản demo) KHÔNG hỗ trợ subset "vietnamese" — nếu
      dùng sẽ vỡ dấu tiếng Việt toàn site — nên đổi sang Plus Jakarta Sans
      (đã xác nhận hỗ trợ) thay vì bê nguyên lựa chọn từ bản demo.

      LỖI THẬT phát hiện lúc rà lại sau khi remap: `bg-zinc-50` trong
      codebase cũ thực ra được dùng cho 2 vai trò ngữ nghĩa KHÁC NHAU dù
      cùng 1 class — (1) nền toàn trang (layout.tsx) và (2) lớp phủ mờ nhạt
      bên trong card (thead bảng, hover row, banner "thêm mới" trong các
      Manager, dải màu nhóm thông số kỹ thuật...). Ở theme sáng cũ 2 vai trò
      này tình cờ hợp lý vì cùng nằm gần đầu thang sáng, nhưng khi đảo thang
      màu, "nền trang" phải là màu ĐẬM NHẤT còn "lớp phủ trong card" phải
      NHẠT HƠN card 1 chút — hai yêu cầu ngược nhau nên không thể dùng
      chung 1 token nữa. Đã tự grep lại toàn bộ usage của bg-zinc-50 (19 chỗ
      ở 15 file), xác nhận đúng là bug rồi sửa tay các chỗ dùng sai (vai trò
      2) sang bg-zinc-100, chỉ giữ layout.tsx (vai trò 1) và ô input đã
      disable ở ProfileForm (nền tối hơn hợp lý cho trạng thái disabled).
      Tương tự đã sửa CheckoutForm.tsx: trạng thái "đã chọn" của radio-card
      (chọn địa chỉ/cửa hàng/thanh toán) trước đó dùng bg-zinc-50 làm nền
      nhấn — cùng lỗi hệt trên, đã đổi sang bg-accent/10 + viền/ring màu
      hổ phách cho đúng ý "được chọn = nổi bật" thay vì trông như bị lõm/tối
      hơn xung quanh.

      Giá tiền: đổi từ text-red-600 (đỏ) sang text-accent (hổ phách) ở ~10
      vị trí hiển thị giá thật sự (ProductCard, giỏ hàng, checkout, chi
      tiết/danh sách đơn hàng cả khách lẫn admin, gợi ý tìm kiếm, giá báo
      thu cũ, điểm thành viên) — CÓ CHỌN LỌC, không đổi hàng loạt vì
      text-red-600 còn được dùng rất nhiều cho thông báo lỗi/nút xóa/trạng
      thái "thất bại"/"đã khóa" là các màu ngữ nghĩa (semantic) cần giữ
      nguyên màu đỏ, tách biệt với màu nhấn thương hiệu.

      Đã test qua dev server: `tsc --noEmit` + `eslint` sạch; xác nhận đúng
      giá trị hex đã biên dịch vào CSS thật (không chỉ tin code nguồn) bằng
      cách tải file CSS Turbopack sinh ra và grep trực tiếp; smoke-test 200
      cho toàn bộ trang public/customer (kể cả các trang yêu cầu đăng nhập,
      test qua session tạo riêng) và admin, dev server log không phát sinh
      lỗi/warning mới. Đã dọn dữ liệu test. Vẫn CHƯA xem trực tiếp qua trình
      duyệt (môi trường không có màn hình) — nhờ user tự mở `npm run dev`
      xác nhận màu sắc/độ tương phản thực tế hợp mắt, báo lại nếu chỗ nào
      chưa ổn để chỉnh tiếp.

- [x] Sửa lỗi mất chữ trong ô nhập liệu sau khi đổi theme "Đêm Hổ Phách"
      (user báo lại). NGUYÊN NHÂN: các thẻ `<input>`/`<textarea>`/`<select>`
      KHÔNG được reset nền trong suốt bởi Tailwind preflight (khác với
      `<button>` — preflight chỉ ép `background-color:transparent` cho
      button, không áp dụng cho input/textarea/select) nên khi không có
      class `bg-*` tường minh, các control này giữ nguyên nền trắng mặc
      định của trình duyệt/OS. Một loạt file — chủ yếu các trang admin CHƯA
      được polish ở đợt trước (ProductForm, CategoryForm, BrandForm,
      StoreForm, FaqManager, PromotionsManager, StaticPagesManager,
      VariantsManager, UserRoleSelect, ClaimStatusSelect,
      TradeInAdminRow, AdminTicketPanel, ô tìm kiếm ở admin/orders và
      admin/users) và vài trang khách hàng (AddressForm, ReviewForm,
      NewTicketForm, ReplyForm, TradeInForm, WarrantyClaimForm) — chỉ set
      border-zinc-300 mà không set bg-*, nên khi chữ đổi sang màu kem sáng
      (do remap zinc-900), chữ NGƯỜI DÙNG GÕ VÀO trở nên vô hình trên nền
      trắng mặc định đó (không phải lỗi ở phần đã polish, các file dùng
      class `.input` dùng chung từ đầu — CheckoutForm, ProfileForm, login,
      register, SortSelect, SearchAutocomplete — đều an toàn vì `.input` đã
      có sẵn bg-white từ lúc định nghĩa).

      CÁCH TÌM: grep toàn bộ codebase theo đúng 20 biến thể className lặp
      lại có `border-zinc-300` mà thiếu `bg-white`, xác nhận từng biến thể
      là input/textarea/select (cần sửa) hay button/anchor (an toàn, bỏ
      qua) bằng cách xem context xung quanh trước khi sửa — không sửa mù
      theo tên class vì cùng 1 cụm class đôi khi là input, đôi khi là nút
      "Hủy". Đã thêm `bg-white text-zinc-900` vào đúng ~45 chỗ input/
      textarea/select bị thiếu qua 20 file. Nhân tiện thêm `color-scheme:
      dark` vào :root trong globals.css để các control gốc trình duyệt
      (thanh cuộn, icon lịch của input datetime-local, mũi tên select) tự
      vẽ theo giao diện tối thay vì mặc định sáng.

      Đã test qua dev server (tạo session SUPER_ADMIN test riêng, không
      đụng dữ liệu thật): smoke-test 200 toàn bộ trang chứa form vừa sửa
      (tạo/sửa sản phẩm, danh mục, thương hiệu, cửa hàng, FAQ, khuyến mãi,
      trang tĩnh, người dùng, đơn hàng, hỗ trợ, bảo hành, thu cũ đổi mới),
      tải thẳng HTML đã render và xác nhận đúng class bg-white/text-zinc-900
      có mặt trên từng input/select thực tế (không chỉ tin code nguồn) —
      không lỗi. Đã dọn dữ liệu test.

- [x] Ẩn ô Slug + sửa nút chọn tệp không hiện rõ (user báo lại sau khi dùng
      thử form tạo sản phẩm). Cả 2 đều là feedback UX chứ không phải bug do
      đổi theme:

      + Ẩn ô nhập Slug thủ công ở ProductForm/CategoryForm/BrandForm (3 form
        admin dùng chung 1 kiểu: input tên -> tự sinh slug qua slugify()
        nếu chưa "chạm" vào ô slug). Vì ô slug giờ không còn hiển thị nên
        không còn khái niệm "người dùng tự gõ tay đè lên slug tự sinh" —
        đơn giản hóa luôn state slugTouched thành dùng thẳng biến isEdit có
        sẵn: tạo mới thì LUÔN tự sinh slug theo tên đang gõ, sửa thì LUÔN
        giữ nguyên slug cũ dù đổi tên (tránh vỡ URL cũ đang được index/chia
        sẻ) — xóa hẳn state/setter không dùng nữa thay vì để lại code chết.
        ĐÁNH ĐỔI CÓ CHỦ Ý: nếu 2 sản phẩm/danh mục/thương hiệu trùng tên
        (hiếm) sẽ trùng slug và bị chặn 409 ("Slug này đã tồn tại.") — vì ô
        slug đã ẩn nên admin không tự sửa tay được nữa, chỉ có thể đổi lại
        Tên cho khác đi rồi lưu lại lần nữa. CHƯA đụng tới
        StaticPagesManager (trang tĩnh) vì file này không dùng chung
        pattern slugify tự động như 3 form trên (slug ở đó có ý nghĩa
        khác — quyết định trực tiếp URL /pages/slug — và code không có sẵn
        cơ chế tự sinh), để nguyên hiển thị.

      + Nút chọn tệp (`<input type="file">`) chỉ thấy chữ "No file chosen"
        không thấy nút: phần nút bấm của input file thực chất là 1
        pseudo-element riêng (`::file-selector-button`, tên cũ webkit là
        `::-webkit-file-upload-button`) — trình duyệt tự vẽ theo
        color-scheme hệ thống (vừa set `color-scheme: dark` ở mục sửa lỗi
        mất chữ phía trên) nên nút này lặn vào nền tối, KHÁC với input/
        select/textarea thường vốn chỉ cần thêm bg-white là xong. Thêm
        class dùng chung `.file-input` trong globals.css style riêng
        `::file-selector-button` thành nút pill viền rõ ràng (giống
        .btn-secondary) — áp cho cả 2 chỗ dùng input file trong toàn bộ
        codebase: ProductForm.tsx (ảnh sản phẩm) và ReviewForm.tsx (ảnh
        đính kèm đánh giá).

      Đã test qua dev server (session SUPER_ADMIN test riêng): xác nhận
      nhãn "Slug (đường dẫn URL)" không còn xuất hiện trong HTML render
      thật ở cả 3 trang tạo mới (sản phẩm/danh mục/thương hiệu), class
      "file-input" có mặt đúng chỗ, rule `::file-selector-button` có trong
      CSS đã biên dịch; `tsc`/`eslint` sạch (xác nhận không còn biến
      slugTouched/setSlugTouched chết sau khi dọn). Đã dọn dữ liệu test.

- [x] So sánh sản phẩm (mục "So sánh sản phẩm" trong Nhóm 2 của gap-analysis
      trước đó). KHÔNG cần thêm model/bảng nào trong schema — trước khi làm
      đã tự tra cứu hành vi thật trên fptshop.com.vn (WebFetch trang danh
      sách): nút "Thêm vào so sánh" nằm dưới mỗi sản phẩm, KHÔNG yêu cầu
      đăng nhập → nghĩa là danh sách so sánh không thể lưu theo User trong
      DB (khách vãng lai không có userId), nên toàn bộ tính năng được thiết
      kế thuần phía CLIENT, lưu vào localStorage trình duyệt (giống hành vi
      thật của FPT Shop và hầu hết trang điện máy VN khác — mất khi xóa dữ
      liệu trình duyệt, không đồng bộ giữa các thiết bị, chấp nhận được vì
      đây vốn là tính năng "tiện lợi tạm thời" chứ không phải dữ liệu cần
      lưu trữ lâu dài).

      src/lib/compare.ts: chỉ chứa `MAX_COMPARE_ITEMS = 4` và type
      `CompareItem` thuần (không có logic, không "use client") — dùng chung
      được cho CẢ client (CompareProvider) LẪN server (API route so sánh)
      mà không bị Next.js coi là kéo client bundle vào server code.
      src/components/CompareProvider.tsx: React Context bọc toàn bộ app
      (nhúng ở layout.tsx) quản lý mảng CompareItem[], đọc/ghi
      localStorage — đọc localStorage trong useEffect (không phải lúc khởi
      tạo state) để tránh hydration mismatch vì HTML server render không
      biết gì về localStorage của trình duyệt; có cờ `isReady` để mọi nơi
      hiển thị trạng thái "đã chọn" đều đợi đọc xong localStorage rồi mới
      hiển thị, tránh nhấp nháy sai trạng thái. addItem() chặn 2 điều kiện
      TRƯỚC khi thêm: (1) khác danh mục với sản phẩm đầu tiên đã chọn (dùng
      categorySlug, xem bên dưới) — vì so sánh thông số điện thoại với
      laptop là vô nghĩa, chọn cách khóa theo sản phẩm ĐẦU TIÊN thay vì có
      danh sách category cố định để không phải hard-code; (2) vượt quá
      MAX_COMPARE_ITEMS. Cả 2 chỉ enforce ở CLIENT (localStorage tự do sửa
      được qua devtools) — CHẤP NHẬN ĐƯỢC vì đây chỉ là dữ liệu hiển thị
      công khai (sản phẩm), không có rủi ro bảo mật/toàn vẹn dữ liệu như
      các nghiệp vụ khác (coupon, order...) nên không cần enforce lại ở
      server như các tính năng trước — quyết định phạm vi có chủ đích,
      khác với nguyên tắc "không tin client" áp dụng cho coupon/order.

      GHI CHÚ KỸ THUẬT (tại sao setState nằm trong `queueMicrotask()` thay
      vì gọi thẳng trong effect): bản eslint-config-next 16 mới bật rule
      `react-hooks/set-state-in-effect` (một phần react-compiler eslint
      plugin), báo lỗi build nếu gọi setState đồng bộ ngay trong thân
      effect. Đọc localStorage lúc mount VẪN PHẢI nằm trong effect (không
      thể đọc lúc khởi tạo state vì gây hydration mismatch như trên), nên
      bọc phần setState trong `queueMicrotask()` để thỏa mãn rule mà hành
      vi thực tế không đổi (vẫn chạy gần như ngay lập tức, trước khi user
      kịp tương tác) — áp dụng ở cả CompareProvider (đọc localStorage) và
      ComparePage (setLoading(true) trước khi fetch).

      src/lib/products.ts: thêm `categorySlug` vào ProductListItem (trước
      đó chỉ có `category` là TÊN hiển thị, không có slug để so sánh danh
      mục — phải sửa query Prisma ở CẢ getProducts() (products.ts) LẪN
      getWishlistProducts() (wishlist.ts) vì cả 2 dùng chung
      mapProductToListItem()). Thêm getProductsForCompare(ids[]) +
      CompareProductDetail — TÁI SỬ DỤNG đúng logic gom nhóm attributeGroups
      theo groupName đã viết cho trang chi tiết sản phẩm (không viết lại),
      trả về đúng THỨ TỰ ids truyền vào (không phải thứ tự DB) để bảng so
      sánh không tự đảo cột khi reload trang, tự lọc bỏ sản phẩm
      DISCONTINUED/đã xóa.

      API: GET /api/products/compare?ids=a,b,c (tự cắt bớt nếu vượt
      MAX_COMPARE_ITEMS dù client đã giới hạn, phòng trường hợp gọi thẳng
      API). UI: src/components/CompareToggle.tsx (nút toggle dùng chung 2
      nơi qua prop `variant`: "chip" — hàng nhỏ dưới giá trong ProductCard,
      đúng như hành vi FPT Shop thật "nút so sánh dưới mỗi sản phẩm trong
      danh sách"; "button" — nút pill to cạnh nút Yêu thích ở trang chi
      tiết sản phẩm, dùng ProductGalleryAndBuy.tsx prop `compareButton`
      giống hệt cách wishlistButton đã làm trước đó). Bấm sai danh mục/quá
      giới hạn hiện `alert()` (nhất quán với cách các nút xóa trong admin
      trước giờ vẫn dùng alert(), không cần thêm thư viện toast mới).
      src/components/CompareFloatingBar.tsx: thanh nổi cố định đáy màn
      hình (nhúng ở layout.tsx, hiện mọi trang) — thumbnail + tên từng sản
      phẩm đã chọn (bấm × bỏ riêng từng cái), đếm n/4, nút "Xóa tất cả",
      nút "So sánh ngay" dẫn tới /compare — giống đúng cơ chế thật đã xác
      nhận qua WebFetch (thanh nổi xuất hiện ngay khi thêm, không cần rời
      trang đang xem).

      Trang /compare (Client Component vì phải đọc localStorage): bảng so
      sánh dạng cột (mỗi sản phẩm 1 cột, ảnh/tên/giá/rating ở hàng đầu),
      hàng thông số nhóm theo groupName với header xám giống trang chi
      tiết sản phẩm — vì các sản phẩm có thể có bộ thuộc tính KHÁC NHAU
      (vd sản phẩm A có nhóm "Camera", sản phẩm B không có), đã viết
      buildComparisonRows() gộp UNION toàn bộ groupName + attrName xuất
      hiện ở BẤT KỲ sản phẩm nào trong danh sách (giữ thứ tự xuất hiện lần
      đầu), ô nào sản phẩm không có giá trị hiện "—" thay vì để trống hoặc
      lỗi. Cột đầu (tên thông số) dùng `sticky left-0` để cuộn ngang trên
      màn hình nhỏ vẫn thấy được đang xem thông số nào. Tự đối chiếu lại
      localStorage nếu API trả về ít sản phẩm hơn danh sách đã lưu (sản
      phẩm bị xóa/ngừng bán sau khi thêm vào so sánh) — tự gọi removeItem()
      dọn luôn, tránh thanh nổi hiện "trống" mãi ở lần sau.

      QUYẾT ĐỊNH PHẠM VI: không làm đồng bộ danh sách so sánh qua tài khoản
      (vd user đăng nhập trên máy khác thấy lại đúng danh sách) vì bản thân
      tính năng gốc trên FPT Shop cũng không cần đăng nhập — làm vậy sẽ lệch
      khỏi đúng hành vi đã xác minh thực tế.

      Đã test: `tsc --noEmit` + `eslint` sạch (kể cả rule mới
      set-state-in-effect nêu trên). Gọi trực tiếp GET
      /api/products/compare với dữ liệu seed thật (3 điện thoại, trong đó
      có sản phẩm không có attribute nào và 2 sản phẩm có nhóm
      attributeGroups khác nhau — Màn hình/Camera vs Pin) xác nhận đúng thứ
      tự theo ids truyền vào và đúng dữ liệu attributeGroups từng sản phẩm.
      Smoke-test 200 cho /compare, /products, /products/[slug], / sau khi
      nhúng CompareProvider/CompareFloatingBar vào layout.tsx toàn site.
      CHƯA xem trực tiếp qua trình duyệt thật (môi trường không có màn
      hình) nên CHƯA tự tay xác nhận được: thanh nổi bấm thêm/bớt sản phẩm
      mượt mà, alert cảnh báo khác danh mục/quá 4 sản phẩm hiện đúng lúc,
      dữ liệu localStorage còn giữ được sau khi tải lại trang trình duyệt
      thật — nhờ user tự mở `npm run dev` trải nghiệm thử và báo lại nếu có
      chỗ nào chưa mượt.

- [x] Bỏ đăng ký tài khoản + đăng nhập email/mật khẩu, chuyển hẳn sang CHỈ
      đăng nhập bằng số điện thoại + mã OTP (theo yêu cầu user). Đây là thay
      đổi kiến trúc auth, không phải thêm tính năng mới — OTP đã có sẵn từ
      trước (xem mục "Đăng nhập bằng số điện thoại + mã OTP"), giờ trở thành
      con đường DUY NHẤT để đăng nhập/tạo tài khoản.

      ĐÃ XÓA HẲN (không chỉ ẩn UI — tránh để lại code chết theo đúng nguyên
      tắc "chắc chắn không dùng thì xóa hẳn"): trang /register + API
      POST /api/auth/register; API POST /api/auth/login (đăng nhập email/
      mật khẩu); hàm hashPassword()/verifyPassword() trong lib/auth.ts (hết
      nơi gọi sau khi xóa 2 route trên); field mật khẩu trong ProfileForm.tsx
      + logic set passwordHash trong PATCH /api/profile (không còn ý nghĩa
      vì không còn đường nào dùng mật khẩu để đăng nhập nữa); prop
      `hasPassword` truyền vào ProfileForm; tab "Email" + link "Đăng ký" ở
      trang /login (login/page.tsx giờ chỉ còn đúng 1 luồng: nhập SĐT ->
      "Gửi mã xác thực" -> nhập mã 6 số -> "Xác nhận", KHÔNG còn state
      `method`/tabs); link "Đăng ký" ở Header.tsx (giờ chỉ còn 1 nút "Đăng
      nhập" cho khách chưa đăng nhập).

      GIỮ NGUYÊN (cân nhắc có chủ đích, không xóa theo yêu cầu): field
      `email`/`passwordHash` trên model User trong schema.prisma — KHÔNG
      drop cột dù `passwordHash` giờ không còn cách nào set/dùng được nữa
      (vẫn nullable, không ai ghi vào), vì đây là thay đổi schema không cần
      thiết cho yêu cầu (chỉ tốn thêm 1 lần `prisma db push` + restart dev
      server) và giữ lại không có tác hại gì (cột null không ảnh hưởng
      logic khác) — nếu sau này cần khôi phục đăng nhập email/mật khẩu thì
      không phải sửa schema. Field `email` trên ProfileForm VẪN giữ lại
      (không phải để đăng nhập nữa mà chỉ là thông tin liên hệ tùy chọn —
      đổi placeholder từ "Thêm email để có thể đăng nhập bằng email" thành
      "Dùng để nhận thông báo/hóa đơn" cho đúng vai trò mới). API
      /api/auth/otp/verify (lib/otp.ts) KHÔNG cần sửa gì — logic tự tạo User
      mới ở lần xác thực OTP đầu tiên (`prisma.user.create` nếu chưa tồn
      tại theo `phone`) vốn đã đóng vai trò "đăng ký" từ trước, giờ đơn
      giản là con đường duy nhất còn lại thay vì 1 trong 2 con đường.

      Đã test qua dev server (restart lại process vì lúc đầu `.next/dev/
      types/validator.ts` còn cache đường dẫn tới 3 route đã xóa gây lỗi
      tsc giả, restart xong tự hết): `/register` trả 404, Header/trang chủ
      không còn chữ "Đăng ký" ở đâu, trang /login không còn chữ
      "Email"/"Mật khẩu"/tab nào — chỉ còn form SĐT. Test full luồng thật
      với 1 số điện thoại test ngẫu nhiên qua dev server (không đụng dữ
      liệu thật): gửi mã trả đúng devCode, xác thực đúng mã tự tạo User
      mới (`fullName` mặc định = SĐT), có session, vào được /profile (200,
      không còn field "Đặt mật khẩu"/"Đổi mật khẩu"), PATCH /api/profile chỉ
      gửi fullName/email vẫn thành công, đăng xuất thành công. `tsc`/
      `eslint` sạch. Đã xóa user/session test.

- [x] Chuẩn bị deploy lên Vercel (miễn phí, gói Hobby — chỉ dành cho dự án
      cá nhân/phi thương mại theo điều khoản Vercel, không sao vì đây là
      project học tập). Vì DB (Supabase Postgres) và ảnh (Supabase Storage)
      đã là dịch vụ ngoài từ đầu nên KHÔNG bị khóa vào Vercel — deploy ở
      nền tảng Node.js nào cũng được, chỉ khác cấu hình.

      package.json: thêm script `"postinstall": "prisma generate"`. LÝ DO:
      Prisma Client (`node_modules/@prisma/client`) được generate ra chứ
      không commit vào git (.gitignore loại `/node_modules`), nên môi
      trường deploy nào chạy `npm install` xong mà không tự generate lại sẽ
      thiếu Prisma Client, build vỡ. Vercel không tự chạy generate giúp —
      phải khai báo tường minh qua postinstall. Đã xác nhận `npx prisma
      generate` (không cần `--config prisma7.config.ts`) tự tìm thấy đúng
      `prisma7.config.ts` (Prisma 7 tự nhận diện file khớp mẫu
      `prisma*.config.ts` trong thư mục gốc, không bắt buộc đặt tên đúng
      `prisma.config.ts`).

      Đã chạy thử `npm run build` đầy đủ (giống hệt lệnh Vercel sẽ chạy) —
      build thành công, toàn bộ ~85 route đều là Dynamic (route nào cũng
      dùng cookies()/session hoặc query DB theo request nên Next.js không
      cố static-generate route nào lúc build — tức là không có rủi ro build
      bị treo do thiếu kết nối DB lúc build, khác với site có trang tĩnh
      thật sự cần fetch DB trước khi build xong).

      Danh sách biến môi trường cần khai báo thủ công trên Vercel dashboard
      (Project Settings -> Environment Variables, KHÔNG commit .env vào
      git): DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
      VNPAY_TMN_CODE, VNPAY_HASH_SECRET, VNPAY_URL. Riêng
      VNPAY_RETURN_URL PHẢI đổi từ `http://localhost:3000/...` (giá trị
      dev hiện tại) sang domain thật Vercel cấp
      (`https://<tên-app>.vercel.app/api/payments/vnpay/return`) sau khi
      deploy lần đầu và biết domain — đây cũng là lúc IPN của VNPay (mục
      "Thanh toán online qua VNPay" ở trên, trước đó ghi chú KHÔNG test
      được với localhost) LẦN ĐẦU TIÊN dùng thật được vì domain Vercel là
      URL public thật.

      QUAN TRỌNG — CHƯA COMMIT/PUSH: kiểm tra `git log origin/master` thì
      remote GitHub hiện chỉ có đúng 2 commit đầu tiên (tạo project +
      Prisma/seed/trang sản phẩm) — TOÀN BỘ khối lượng tính năng đã làm từ
      đó tới giờ (giỏ hàng, thanh toán, VNPay, mọi trang admin, theme Đêm
      Hổ Phách, so sánh sản phẩm, đổi auth sang OTP-only...) vẫn chỉ nằm ở
      working tree, CHƯA có commit nào. Vercel deploy từ git nên PHẢI commit
      + push hết chỗ này lên GitHub trước khi import project vào Vercel —
      chưa tự làm bước này vì commit/push là hành động cần user xác nhận
      trước (theo quy tắc chỉ commit khi được yêu cầu rõ ràng).

- [x] Deploy thành công lên Vercel (https://fptshop-clone.vercel.app), đã push
      commit lên `origin/master` và import project qua Vercel dashboard. Gặp
      2 LỖI THẬT lúc deploy, cả 2 đều chỉ lộ ra ở production chứ không tái
      hiện được lúc test local:

      1. Trang chủ/`/products`/`/stores` (mọi trang có query DB) trả 500.
         NGUYÊN NHÂN: `.env` local lưu giá trị bọc trong dấu ngoặc kép (vd
         `DATABASE_URL="postgresql://..."`) — dotenv/Next.js tự bóc dấu `"`
         khi đọc file `.env`, nhưng lúc dán tay giá trị đó vào ô Environment
         Variables trên Vercel dashboard thì dấu `"` bị dán luôn thành 1
         phần của giá trị thật, phá vỡ connection string. Đã sửa: dán lại
         KHÔNG có dấu ngoặc kép ở đầu/cuối.

      2. Sau khi sửa lỗi (1), vẫn 500 với lỗi khác:
         `(EMAXCONNSESSION) max clients reached in session mode - max
         clients are limited to pool_size: 15`. NGUYÊN NHÂN: DATABASE_URL
         đang trỏ vào Supabase **Session Pooler** (port 5432) — phù hợp khi
         chạy local vì `npm run dev` chỉ có 1 process giữ 1 pool kết nối
         duy nhất, nhưng Vercel chạy serverless: nhiều instance function có
         thể được spawn song song, MỖI instance tự tạo 1 `PrismaClient`/
         `pg.Pool` riêng (biến cache instance qua `globalThis` trong
         lib/prisma.ts chỉ có tác dụng khi `NODE_ENV !== "production"`,
         KHÔNG áp dụng trên Vercel) — chỉ cần 2 instance chạy cùng lúc là
         đã vượt giới hạn 15 connection của Session Pooler. Đã sửa bằng
         cách đổi `DATABASE_URL` trên Vercel sang **Transaction Pooler**
         (port 6543, lấy từ Supabase Dashboard -> Project Settings ->
         Database -> Connection string -> tab "Transaction") — pooler mode
         này chỉ giữ 1 connection thật trong lúc chạy đúng 1 câu query rồi
         trả ngay lại pool, chịu được nhiều instance serverless chạy song
         song với cùng 1 giới hạn pool_size nhỏ. Local `.env` vẫn giữ
         nguyên Session Pooler (không bắt buộc đổi vì local luôn chỉ có 1
         process). LƯU Ý: `@prisma/adapter-pg` (driver adapter dùng `pg`
         thay vì query engine gốc của Prisma) tương thích tốt với
         Transaction Pooler vì phát query dạng unnamed prepared statement —
         nếu dùng Prisma Client thường (không qua driver adapter) thì có
         thể cần thêm `?pgbouncer=true` vào connection string, dự án này
         không cần vì đã dùng driver adapter từ đầu.

      Đã xác minh lại toàn bộ sau khi sửa: `/`, `/products`, `/stores`,
      `/faq` đều 200 kèm đúng dữ liệu thật (không chỉ tin status code, đã
      grep nội dung HTML thấy đúng tên sản phẩm/cửa hàng), theme "Đêm Hổ
      Phách" build đúng vào CSS production, guard đăng nhập (`/checkout`,
      `/admin/products`) redirect đúng khi chưa đăng nhập.

      PHÁT HIỆN THÊM (chưa phải bug, là hệ quả tất yếu của môi trường
      production): gọi `/api/auth/otp/request` trên production không còn
      trả về `devCode` (đúng thiết kế — chỉ trả khi `NODE_ENV !==
      "production"`) — nghĩa là trước khi nối SMS gateway thật, KHÔNG ai
      đăng nhập được trên bản production vì không có cách nào thấy mã OTP.
      Đây chính là lý do làm tiếp mục SMS bên dưới ngay sau đó.

- [x] Gửi OTP qua SMS thật bằng SpeedSMS (thay cho mock console.log trước
      giờ). Chọn SpeedSMS theo yêu cầu của user (so với Twilio/eSMS đã nêu
      trong ghi chú TODO cũ) — lý do chọn: nhà cung cấp Việt Nam, đăng ký
      nhanh bằng tài khoản cá nhân, không cần giấy phép kinh doanh, phù hợp
      project cá nhân/học tập.

      src/lib/sms.ts (mới, thuần logic gọi API, không đụng DB):
      `isSmsConfigured()` check biến env `SPEEDSMS_ACCESS_TOKEN`,
      `sendOtpSms(localPhone, code)` gọi
      `POST https://api.speedsms.vn/index.php/sms/send` — xác thực bằng
      HTTP Basic Auth (access token làm username, password để trống, theo
      đúng tài liệu API của SpeedSMS), body `sms_type: 2` (loại "CSKH" —
      cố tình chọn loại này vì KHÔNG cần đăng ký brandname trước như loại
      3/5, phù hợp để bắt đầu ngay không cần chờ duyệt hồ sơ thương hiệu).
      Tự đổi định dạng số điện thoại: `normalizePhone()` ở lib/otp.ts trả
      dạng nội địa "0912345678" nhưng SpeedSMS yêu cầu dạng quốc tế không
      dấu "+" ("84912345678") — có hàm `toInternationalPhone()` riêng xử
      lý. Nội dung SMS CỐ Ý viết KHÔNG dấu tiếng Việt (theo đúng bảng giá
      SpeedSMS: tin có dấu giới hạn 70 ký tự/tin trước khi bị tính thành 2
      tin, không dấu được tới 160 ký tự — tránh phát sinh chi phí/rủi ro bị
      cắt đôi tin ngoài ý muốn).

      lib/otp.ts: `requestOtp()` đổi thứ tự thao tác — GỬI SMS TRƯỚC, chỉ
      tạo bản ghi `OtpCode` trong DB (kích hoạt cooldown 60s) NẾU gửi SMS
      thành công (hoặc chưa cấu hình SMS thì vẫn tạo bình thường + log
      console như cũ) — tránh trường hợp gửi SMS lỗi nhưng vẫn lỡ tạo bản
      ghi, khiến user bị khóa cooldown 60 giây cho 1 mã mà họ chẳng bao giờ
      nhận được. Thêm 2 class lỗi riêng `OtpCooldownError`/`SmsSendError`
      (trước đó chỉ ném `Error` chung chung) để API route phân biệt được
      trả đúng status code (429 cho cooldown, 502 cho lỗi gửi SMS — trước
      đây lỡ trả 429 cho MỌI lỗi, sai ngữ nghĩa HTTP). Trả kèm `smsSent:
      boolean` để route quyết định có lộ `devCode` hay không.

      API /api/auth/otp/request: chỉ trả `devCode` khi VỪA `NODE_ENV !==
      "production"` VỪA `smsSent === false` — nghĩa là một khi đã cấu hình
      SPEEDSMS_ACCESS_TOKEN (kể cả lúc chạy local), `devCode` sẽ TỰ ĐỘNG
      biến mất khỏi response vì SMS thật đã gửi thành công, không cần thiết
      phải lộ mã qua API nữa — tránh tình trạng dev quen dùng devCode mà
      quên rằng production đã không còn kênh dự phòng này.

      .env: thêm `SPEEDSMS_ACCESS_TOKEN` (để trống — lấy tại
      https://connect.speedsms.vn, mục Cài đặt > Hồ sơ, sau khi đăng ký
      tài khoản). Để trống thì toàn bộ hành vi CŨ được giữ nguyên (mock
      console.log + trả devCode ở dev) — không phá luồng test hiện có.

      Đã test qua dev server (không cấu hình token, xác nhận hành vi cũ
      không đổi): gọi `/api/auth/otp/request` với số test ngẫu nhiên vẫn
      trả đúng `{"ok":true,"devCode":"..."}` y hệt trước khi sửa. `tsc`/
      `eslint` sạch. CHƯA test được luồng gửi SMS THẬT (cần user tự đăng
      ký tài khoản SpeedSMS + điền `SPEEDSMS_ACCESS_TOKEN` vì đây là thông
      tin tài khoản riêng, không tự tạo hộ được) — sau khi có token cần
      test: gửi thử 1 số điện thoại thật nhận được SMS, xác nhận cooldown
      không bị kích hoạt sai khi gửi lỗi (vd token sai), xác nhận devCode
      biến mất khỏi response khi gửi SMS thành công. Đã dọn dữ liệu test
      OTP record tạo ra lúc test hành vi cũ.

      ĐÃ BỊ THAY THẾ HOÀN TOÀN — xem mục "Chuyển sang Firebase Phone
      Authentication" ngay bên dưới. Lý do: tài khoản SpeedSMS đăng ký được
      nhưng không có gói dịch vụ nào active (bảng gói trong Cài đặt trống,
      nút đăng ký gói Basic 0đ không bấm được), thử cả 2 sản phẩm của
      SpeedSMS (API SMS thường /sms/send và sản phẩm 2FA/Verification
      /pin/create+/pin/verify) đều gặp lỗi "sender not found" — xác nhận qua
      curl trực tiếp (bỏ qua hẳn code của app) vẫn cùng lỗi, nên chắc chắn là
      vấn đề ở phía tài khoản SpeedSMS chứ không phải bug code. Toàn bộ
      src/lib/sms.ts, src/lib/otp.ts, 2 API route /api/auth/otp/{request,
      verify}, và 2 biến env SPEEDSMS_ACCESS_TOKEN/SPEEDSMS_APP_ID đã bị XÓA
      HẲN (không giữ lại code chết) khi chuyển sang Firebase.

- [x] Chuyển sang Firebase Phone Authentication để gửi OTP thật (thay hẳn
      SpeedSMS — xem lý do bỏ SpeedSMS ở mục ngay trên). Cân nhắc thêm trước
      khi chọn: eSMS.vn (nhà cung cấp SMS Việt Nam khác) cũng bị loại vì tài
      liệu chính thức của họ ghi rõ bắt buộc đăng ký Brandname + template
      trước khi dùng API — cùng rào cản pháp lý chống spam SMS của VN áp
      dụng cho MỌI nhà cung cấp SMS trong nước, không riêng SpeedSMS, nên
      không có nhà cung cấp VN nào dùng được ngay cho project cá nhân không
      có giấy phép kinh doanh. Twilio Verify cũng bị loại vì tài khoản dùng
      thử (trial) bắt buộc PHẢI tự "verify" số điện thoại người nhận trong
      dashboard Twilio trước thì mới gửi được — không gửi được cho số bất kỳ
      ngay từ đầu, cùng kiểu rào cản "cần duyệt trước" đã gặp với SpeedSMS/
      eSMS. Firebase Phone Auth không có rào cản nào trong 2 loại trên: gửi
      được cho số thật bất kỳ ngay khi tạo xong project, miễn phí, và do
      chính Google vận hành hạ tầng gửi SMS (không phải nhà mạng VN duyệt).

      KHÁC BIỆT KIẾN TRÚC quan trọng so với SpeedSMS/mock cũ: trước đây toàn
      bộ việc sinh mã + gửi SMS + xác thực đều do SERVER của app tự làm
      (gọi API SpeedSMS hoặc tự lưu bảng OtpCode). Với Firebase Phone Auth,
      việc gửi SMS + xác thực mã diễn ra ở TRÌNH DUYỆT qua Firebase JS SDK
      (kèm reCAPTCHA vô hình bắt buộc để chống spam) — server của app không
      bao giờ thấy mã OTP, chỉ nhận lại 1 idToken (JWT do Firebase ký) sau
      khi trình duyệt xác thực xong, rồi TỰ VERIFY lại chữ ký idToken đó
      bằng Firebase Admin SDK để lấy số điện thoại ĐÃ ĐƯỢC XÁC THỰC (không
      tin số điện thoại do client tự gửi lên dưới dạng text thường).

      src/lib/phone.ts (mới, tách ra từ lib/otp.ts cũ vì giờ cả client
      (login/page.tsx) lẫn server (API verify) đều cần dùng): normalizePhone()
      giữ nguyên y hệt logic cũ (chuẩn hóa về dạng nội địa "0912345678" để
      khớp quy ước lưu User.phone có sẵn), thêm toE164() đổi sang dạng quốc
      tế "+84912345678" mà Firebase Phone Auth bắt buộc phải dùng khi gọi
      signInWithPhoneNumber().

      src/lib/firebaseClient.ts (mới, "use client"): getFirebaseAuth() khởi
      tạo Firebase App phía trình duyệt từ 3 biến NEXT_PUBLIC_FIREBASE_*
      (API key/authDomain/projectId — các giá trị này vốn công khai theo
      thiết kế của Firebase, không phải bí mật cần giấu, bảo mật thật nằm ở
      danh sách "Authorized domains" chứ không phải giấu config).

      src/lib/firebaseAdmin.ts (mới, chỉ chạy server): getFirebaseAdminAuth()
      khởi tạo Firebase Admin App từ service account (FIREBASE_PROJECT_ID/
      FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY) — dùng để verifyIdToken()
      xác thực chữ ký token gửi lên từ client. FIREBASE_PRIVATE_KEY lưu
      trong .env dưới dạng 1 dòng có "\n" theo nghĩa đen (không phải xuống
      dòng thật, vì .env không hỗ trợ multi-line), code tự `.replace(/\\n/g,
      "\n")` lại thành PEM hợp lệ trước khi dùng.

      src/app/api/auth/firebase/verify/route.ts (mới, thay hẳn 2 route
      /api/auth/otp/{request,verify} đã xóa): nhận `{ idToken }`, verify chữ
      ký qua Firebase Admin, lấy `decoded.phone_number` (đã được Firebase xác
      thực, KHÔNG phải giá trị client tự khai), tìm/tạo User theo đúng logic
      cũ y hệt (tạo mới nếu chưa có phone, fullName mặc định = SĐT — vẫn
      đóng vai trò "đăng ký" ẩn như trước), rồi createSession() y hệt luồng
      cũ trong lib/auth.ts (không đổi gì ở tầng session/cookie).

      src/app/login/page.tsx: viết lại toàn bộ luồng gửi/xác thực mã sang
      chạy qua Firebase JS SDK thay vì gọi 2 API cũ. Bước 1 (nhập SĐT):
      tạo mới 1 `RecaptchaVerifier` (size "invisible") MỖI LẦN gửi — verifier
      đã dùng 1 lần hoặc hết hạn sẽ lỗi nếu tái sử dụng cho lần gửi tiếp
      theo, nên không cache lại. Gọi `signInWithPhoneNumber()`, lưu
      `ConfirmationResult` trả về vào 1 `useRef` (không phải state — không
      cần re-render khi có, và object này không serialize được nên không
      thể để trong state an toàn qua các lần render). Bước 2 (nhập mã): gọi
      `confirmationRef.current.confirm(code)` (Firebase tự xác thực mã,
      KHÔNG gọi lên server của app), lấy `idToken` từ kết quả rồi POST sang
      `/api/auth/firebase/verify` để tạo session. Thêm 1 `<div
      id="recaptcha-container">` ẩn trong trang — bắt buộc phải tồn tại
      trong DOM trước khi gọi `signInWithPhoneNumber()`. Bỏ hẳn state/UI
      `devCode` (không còn ý nghĩa — Firebase không có "chế độ dev lộ mã"
      kiểu app tự làm trước đây; muốn test không tốn SMS thật thì dùng tính
      năng "Phone numbers for testing" trong Firebase Console, chưa cấu
      hình vì không bắt buộc).

      GIỮ NGUYÊN, KHÔNG ĐỤNG: model `OtpCode` trong schema.prisma (cùng
      quyết định như đã giữ `passwordHash`/`email` lúc bỏ đăng nhập email —
      bảng giờ hoàn toàn không còn code nào ghi/đọc vào nữa nhưng để lại
      không có tác hại, không cần thêm 1 lần `prisma db push` chỉ để xóa 1
      bảng rỗng); toàn bộ src/lib/auth.ts (createSession/destroySession/
      getCurrentUser/requireAdmin/requireSuperAdmin) không đổi gì.

      ĐÃ XÓA: src/lib/otp.ts, src/lib/sms.ts, src/app/api/auth/otp/{request,
      verify}/route.ts, dependency `bcryptjs`+`@types/bcryptjs` (hết nơi
      dùng sau khi xóa lib/otp.ts — trước đó chỉ dùng để hash mã OTP trong
      bảng OtpCode).

      THÊM dependency: `firebase` (SDK phía client) + `firebase-admin` (SDK
      phía server, dùng Node.js runtime — API route Next.js mặc định chạy
      Node runtime nên không cần khai báo `export const runtime` gì thêm).

      CHƯA CẤU HÌNH (cần user tự tạo project Firebase — xem hướng dẫn chi
      tiết ngay trong .env cạnh 6 biến FIREBASE_*/NEXT_PUBLIC_FIREBASE_*):
      để trống thì `RecaptchaVerifier`/`signInWithPhoneNumber` ở client sẽ
      lỗi ngay (Firebase config rỗng), và `getFirebaseAdminAuth()` ở server
      throw lỗi rõ ràng "Thiếu cấu hình Firebase Admin..." — CHƯA có nhánh
      fallback mock như SpeedSMS trước đây (khác quyết định trước: lúc đó
      giữ fallback vì SMS gateway là bổ sung thêm cho luồng OtpCode tự viết
      sẵn có; giờ OTP tự viết đã bị xóa hẳn nên không còn gì để fallback về).
      Trên Vercel, nhớ thêm domain `fptshop-clone.vercel.app` vào
      "Authorized domains" (Authentication > Settings) — thiếu bước này thì
      `signInWithPhoneNumber` sẽ báo lỗi domain không được phép ngay trên
      production dù đã điền đủ env vars.

      Đã test qua dev server (chưa có Firebase project thật, chỉ xác nhận
      không phá vỡ luồng còn lại): `tsc --noEmit` + `eslint` sạch sau khi
      xóa 4 file cũ + thêm 5 file mới, `npm run build` thành công (đủ 85
      route, có `/api/auth/firebase/verify` thay cho 2 route otp cũ đã
      biến mất khỏi danh sách route), `/login` trả 200 và HTML render đúng
      `<div id="recaptcha-container">`, không còn chữ "Đăng ký" ở đâu.
      CHƯA test được luồng thật (cần user tự tạo Firebase project + điền 6
      biến env vì đây là thông tin project riêng) — sau khi có project cần
      test: gửi OTP tới số thật nhận được SMS qua Firebase, xác nhận
      reCAPTCHA vô hình không chặn luồng bình thường, xác nhận tạo
      User mới đúng ở lần xác thực đầu tiên, đăng nhập lại lần 2 với cùng số
      không tạo User trùng, và trên Vercel sau khi thêm Authorized domain.

      ĐÃ BỊ THAY THẾ HOÀN TOÀN — xem mục "Chuyển sang Twilio Verify" ngay bên
      dưới. Lý do bỏ Firebase: gửi SMS thật đòi hỏi nâng cấp project lên gói
      Blaze (`auth/billing-not-enabled` ở Spark), nhưng billing account
      Google Cloud của user ("ttt") bị khóa "not in good standing" và không
      tự "Reopen" được — vấn đề nằm ở hồ sơ thanh toán Google, ngoài tầm code.
      Thử dùng "Phone numbers for testing" (né được billing) để tạm test thì
      lại dính bug khác của chính script reCAPTCHA của Google (`Cannot read
      properties of null (reading 'style')` trong recaptcha__en.js) — thử
      thêm `auth.settings.appVerificationDisabledForTesting = true` để né
      script reCAPTCHA thật vẫn không dứt điểm được, user quyết định bỏ hẳn
      Firebase. Toàn bộ src/lib/firebaseClient.ts, src/lib/firebaseAdmin.ts,
      API route /api/auth/firebase/verify, và dependency `firebase`+
      `firebase-admin` đã bị XÓA HẲN khi chuyển sang Twilio.

- [x] Chuyển sang Twilio Verify để gửi OTP thật (thay hẳn Firebase — xem lý
      do bỏ Firebase ở mục ngay trên). Twilio dùng hệ thống billing riêng của
      Twilio/Stripe (không qua Google Cloud Billing) nên né được đúng vấn đề
      "not in good standing" đã gặp — user tự đăng ký tài khoản Twilio, không
      gặp lại lỗi billing tương tự lúc đăng ký.

      QUAY LẠI kiến trúc server-driven y hệt bản SpeedSMS trước đây (khác hẳn
      Firebase — Firebase bắt buộc gửi/xác thực mã ở client qua SDK kèm
      reCAPTCHA; Twilio Verify giống SpeedSMS 2FA: server tự gọi API tạo mã +
      xác thực mã, không cần JS SDK ở client, không cần reCAPTCHA). Nhờ vậy
      phục hồi lại gần như nguyên vẹn code trước khi có Firebase: src/lib/
      otp.ts (requestOtp/verifyOtp + fallback bảng OtpCode khi chưa cấu hình
      + 2 class lỗi OtpCooldownError/SmsSendError), 2 API route /api/auth/otp/
      {request,verify}, và trang /login dạng form 2 bước gọi thẳng 2 API đó
      (không còn RecaptchaVerifier/ConfirmationResult gì cả).

      src/lib/sms.ts (viết lại cho Twilio, thay nội dung SpeedSMS cũ):
      `isSmsConfigured()` check đủ 3 biến TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/
      TWILIO_VERIFY_SERVICE_SID. `createOtpPin(e164Phone)` gọi
      `POST https://verify.twilio.com/v2/Services/{ServiceSid}/Verifications`
      (body `To`+`Channel=sms`), `verifyOtpPin(e164Phone, code)` gọi
      `.../VerificationCheck` (body `To`+`Code`, coi thành công khi
      `data.status === "approved"`) — cả 2 xác thực bằng HTTP Basic Auth
      (Account SID làm username, Auth Token làm password). KHÔNG dùng SDK
      `twilio` npm (gọi thẳng REST API qua `fetch` cho nhất quán với cách đã
      làm với SpeedSMS, tránh thêm dependency không cần thiết). Khác SpeedSMS
      (nhận số dạng nội địa "0912...") — Twilio Verify bắt buộc dạng quốc tế
      "+8491...", nên lib/otp.ts tự gọi `toE164()` (từ lib/phone.ts, viết lúc
      làm Firebase, vẫn tái sử dụng được nguyên vẹn) trước khi gọi sang
      lib/sms.ts.

      Cài lại dependency `bcryptjs`+`@types/bcryptjs` (đã gỡ lúc chuyển sang
      Firebase vì hết chỗ dùng — giờ cần lại cho nhánh fallback OtpCode tự
      viết trong lib/otp.ts, y hệt lý do dùng trước đây). Gỡ hẳn dependency
      `firebase`+`firebase-admin`.

      .env: thay 6 biến FIREBASE_*/NEXT_PUBLIC_FIREBASE_* bằng 3 biến
      TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_VERIFY_SERVICE_SID (để trống
      thì fallback y hệt hành vi cũ: log mã ra console + trả devCode ở dev).
      LƯU Ý tài khoản Twilio Trial (miễn phí): chỉ gửi được tới số đã tự
      "verify" thủ công trong Twilio Console (Phone Numbers > Verified Caller
      IDs) — gửi cho số bất kỳ (dùng thật cho người dùng) cần nâng cấp tài
      khoản trả phí, ghi rõ trong .env để user biết trước khi test.

      Đã test qua dev server (chưa cấu hình Twilio, xác nhận toàn bộ luồng
      fallback hoạt động lại đúng như trước khi có Firebase): gọi
      `/api/auth/otp/request` với số test trả đúng `{"ok":true,"devCode":
      "..."}`, dùng đúng mã đó gọi `/api/auth/otp/verify` tạo đúng User mới +
      session (kiểm tra qua response trả về id/phone/fullName), `/login` trả
      200 không còn `<div id="recaptcha-container">`. `tsc --noEmit` +
      `npm run build` (đủ 85 route, có lại `/api/auth/otp/{request,verify}`,
      hết `/api/auth/firebase/verify`) + `eslint` đều sạch. Đã dọn User/
      Session/OtpCode tạo ra lúc test. CHƯA test được luồng gửi SMS THẬT qua
      Twilio (cần user tự đăng ký tài khoản + tạo Verify Service + điền 3
      biến env, và tự verify số nhận trong Console nếu còn ở Trial) — sau khi
      có đủ cấu hình cần test: gửi OTP thật nhận được SMS, xác nhận devCode
      biến mất khỏi response khi đã cấu hình Twilio.

      ĐÃ BỊ THAY THẾ HOÀN TOÀN — xem mục "Chuyển hẳn sang đăng nhập bằng
      Google (OAuth)" ngay bên dưới. Lý do bỏ Twilio: tạo "Verify Service"
      (bắt buộc để dùng Twilio Verify) đòi hỏi phải nâng cấp/gắn thanh toán
      trước — cùng 1 kiểu rào cản "cần thẻ trước khi dùng" đã gặp ở CẢ 4 nhà
      cung cấp thử qua (SpeedSMS, eSMS, Firebase, Twilio), xác nhận đây là
      yêu cầu chung của toàn ngành SMS OTP (chống spam/lừa đảo) chứ không
      phải do chọn sai provider — nên user quyết định bỏ hẳn hướng SMS, đổi
      hẳn phương thức đăng nhập sang OAuth Google (không nhà cung cấp SMS
      nào bị dính líu nữa, Google OAuth Client miễn phí hoàn toàn, không cần
      thẻ). Toàn bộ src/lib/otp.ts, src/lib/sms.ts, src/lib/phone.ts, 2 route
      /api/auth/otp/{request,verify}, và dependency `bcryptjs`+
      `@types/bcryptjs` đã bị XÓA HẲN.

- [x] Chuyển hẳn sang đăng nhập bằng Google (OAuth 2.0), bỏ HOÀN TOÀN đăng
      nhập bằng số điện thoại + OTP (xem chuỗi lý do bỏ SMS ở mục ngay trên —
      SpeedSMS/eSMS/Firebase/Twilio đều bị chặn bởi rào cản đăng ký
      Brandname VN hoặc yêu cầu billing/thẻ thanh toán). Đây là thay đổi
      KIẾN TRÚC đăng nhập lần thứ 2 trong dự án (lần 1: email/mật khẩu ->
      SĐT/OTP; lần 2 này: SĐT/OTP -> Google OAuth) — `email` (đã có sẵn
      trong schema từ đầu, unique) giờ thay thế `phone` làm định danh đăng
      nhập chính.

      TỰ VIẾT OAuth 2.0 Authorization Code flow (KHÔNG dùng NextAuth/Auth.js
      hay SDK `google-auth-library` — nhất quán với cách toàn bộ dự án tự
      viết auth từ đầu bằng session token + cookie riêng, xem lib/auth.ts).
      src/lib/googleOAuth.ts (mới): `isGoogleOAuthConfigured()` check đủ 3
      biến GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/GOOGLE_REDIRECT_URI;
      `getGoogleAuthUrl(state)` build URL sang
      `https://accounts.google.com/o/oauth2/v2/auth` (scope
      userinfo.email + userinfo.profile, `prompt=select_account` để luôn
      cho chọn lại tài khoản thay vì tự động dùng tài khoản Google đã đăng
      nhập sẵn trên trình duyệt); `exchangeCodeForAccessToken(code)` POST
      sang `https://oauth2.googleapis.com/token` lấy access_token;
      `getGoogleUserInfo(accessToken)` GET
      `https://www.googleapis.com/oauth2/v2/userinfo` lấy email/name — CHỌN
      gọi endpoint userinfo thay vì tự parse+verify chữ ký `id_token` (JWT)
      trả về cùng lúc, vì access_token/id_token đến từ 1 lệnh gọi server-to-
      server trực tiếp tới Google (không phải do client gửi lên), nên không
      cần tự verify chữ ký như trường hợp Firebase idToken trước đây (lúc đó
      idToken đi qua trình duyệt trước khi tới server, cần verify để không
      tin nhầm giá trị client tự khai).

      API: `/api/auth/google/start` (GET) — sinh `state` ngẫu nhiên chống
      CSRF, lưu vào cookie httpOnly 5 phút, redirect 307 sang URL Google;
      chưa cấu hình đủ 3 biến thì redirect thẳng về `/login?error=
      not_configured` thay vì lỗi 500. `/api/auth/google/callback` (GET) —
      đối chiếu `state` trả về đúng cookie đã lưu (xóa cookie ngay sau khi
      đọc, dùng 1 lần), đổi `code` lấy access_token rồi lấy thông tin user,
      CHẶN nếu `verified_email !== true` (không tin email chưa được Google
      tự xác minh), tìm/tạo User theo `email` (logic tự tạo User mới ở lần
      đăng nhập đầu tiên giống hệt pattern cũ của OTP — `fullName` mặc định
      lấy từ `name` Google trả về, dự phòng dùng luôn email nếu thiếu),
      `createSession()` y hệt lib/auth.ts không đổi gì, cuối cùng redirect
      về `/`. Mọi lỗi ở giữa (state sai, Google trả lỗi, email chưa xác
      minh, tài khoản bị khóa) đều redirect về `/login?error=<mã lỗi>` kèm
      thông báo tiếng Việt tương ứng hiện ở trang login, không bao giờ crash
      500 giữa luồng OAuth.

      src/app/login/page.tsx: đổi hẳn từ Client Component (form nhập liệu)
      sang Server Component thuần — không còn state/JS nào cần thiết, chỉ là
      1 thẻ `<a href="/api/auth/google/start">` (điều hướng browser bình
      thường, không cần `fetch`/`onClick`), đọc `searchParams.error` để hiện
      thông báo lỗi tương ứng nếu quay lại từ luồng OAuth thất bại.

      src/app/profile: `email` chuyển từ "thông tin liên hệ tùy chọn có thể
      sửa" (thời OTP) sang **read-only** giống hệt cách `phone` từng read-
      only ở thời OTP — vì lý do TƯƠNG TỰ: email giờ là định danh đăng nhập
      khớp với tài khoản Google, cho sửa tự do trong `/api/profile` sẽ làm
      lệch giữa email lưu trong User và email Google trả về ở lần đăng nhập
      sau, dẫn tới KHÔNG tìm thấy User cũ nữa và vô tình tạo User trùng cho
      cùng 1 tài khoản Google thật (bug tương tự lớp bug "quan hệ optional
      tự SetNull" đã note ở mục Lưu ý quan trọng — chủ động ngăn trước thay
      vì để xảy ra rồi mới vá). `/api/profile` (PATCH) bỏ hẳn toàn bộ logic
      check trùng email/EMAIL_REGEX, giờ chỉ còn nhận và cập nhật `fullName`.

      GIỮ NGUYÊN, KHÔNG ĐỤNG: field `phone`/`passwordHash` trên model User
      (cùng quyết định như các lần đổi kiến trúc auth trước — cột giờ không
      còn code nào ghi vào nhưng để lại không có tác hại, không cần thêm 1
      lần `prisma db push`); model `OtpCode` (đã dead từ lúc chuyển sang
      Firebase, nay càng chắc chắn không cần nữa nhưng vẫn giữ nguyên lý do
      cũ); toàn bộ lib/auth.ts không đổi gì.

      .env: thay 3 biến TWILIO_* bằng 3 biến GOOGLE_CLIENT_ID/
      GOOGLE_CLIENT_SECRET/GOOGLE_REDIRECT_URI (hướng dẫn đầy đủ cách lấy 3
      giá trị này qua Google Cloud Console — OAuth consent screen + OAuth
      client ID — ngay trong .env). KHÁC các lần trước: KHÔNG có nhánh
      fallback mock nào nếu thiếu cấu hình (route `/api/auth/google/start`
      chỉ redirect về `/login?error=not_configured`) — vì đây không còn là
      "gateway phụ có thể tắt" như SMS mà là cách đăng nhập DUY NHẤT còn lại
      của cả hệ thống.

      Đã test qua dev server: `tsc --noEmit` sạch, `npm run build` thành
      công (đủ 85 route, có `/api/auth/google/{start,callback}` thay hẳn
      2 route `/api/auth/otp/*` đã biến mất), `eslint` sạch. Smoke-test:
      `/login` trả 200 kèm đúng nút "Đăng nhập bằng Google" trỏ tới
      `/api/auth/google/start`, `/register` và `/api/auth/otp/request` đều
      404 (xác nhận xóa sạch), gọi `/api/auth/google/start` khi chưa cấu
      hình 3 biến GOOGLE_* trả đúng 307 redirect về
      `/login?error=not_configured` thay vì lỗi 500. CHƯA test được luồng
      OAuth thật đầu-cuối (cần user tự tạo OAuth Client trên Google Cloud
      Console vì đây là thông tin project riêng) — sau khi có đủ cấu hình
      cần test: bấm "Đăng nhập bằng Google" → chọn tài khoản → tạo đúng User
      mới ở lần đầu (email/fullName đúng) → đăng nhập lại lần 2 với cùng
      tài khoản Google không tạo User trùng mà tìm lại đúng User cũ → trên
      Vercel sau khi thêm đúng Authorized redirect URI production.

      ĐÃ TEST LUỒNG THẬT THÀNH CÔNG (local): user tự tạo OAuth Client trên
      Google Cloud Console (project `fptshopclone`, OAuth consent screen ở
      chế độ External/Testing), đăng nhập thật bằng tài khoản Google cá nhân
      qua `/login` → tạo đúng User mới trong DB với `email` khớp tài khoản
      Google, `fullName` lấy đúng tên hiển thị Google trả về, `emailVerified`
      được set, `phone` là null (đúng dự kiến — không còn OTP nữa).

- [x] Chuyển thanh toán online từ VNPay sang MoMo (thay hẳn — xem lý do bỏ
      VNPay ở mục "Thanh toán online qua VNPay" phía trên: sandbox merchant
      thật liên tục báo lỗi hệ thống chung chung, không ổn định để demo).
      THÊM PaymentMethod.MOMO vào schema (giữ nguyên VNPAY cũ, không xóa —
      chỉ thêm giá trị enum, `prisma db push` không mất dữ liệu).

      ĐIỂM KHÁC BIỆT LỚN NHẤT so với VNPay: MoMo công bố sẵn 1 bộ **test
      credentials CÔNG KHAI** trong tài liệu dev chính thức của họ
      (partnerCode "MOMO", accessKey/secretKey cố định) — dùng thử được
      NGAY, không cần tự đăng ký tài khoản merchant sandbox nào cả (khác hẳn
      VNPay/ZaloPay đều bắt buộc đăng ký trước). Đã tự gọi thẳng endpoint
      thật `https://test-payment.momo.vn/v2/gateway/api/create` bằng script
      Node độc lập (không qua code app) với đúng bộ giá trị này TRƯỚC khi
      viết vào app — xác nhận nhận về `resultCode: 0` + `payUrl` hợp lệ,
      chắc chắn API hoạt động thật trước khi tích hợp (tránh lặp lại tình
      huống VNPay: đăng ký xong mới phát hiện sandbox không ổn định).

      src/lib/momo.ts (mới, thay src/lib/vnpay.ts): các hằng số
      MOMO_PARTNER_CODE/MOMO_ACCESS_KEY/MOMO_SECRET_KEY có sẵn GIÁ TRỊ MẶC
      ĐỊNH ngay trong code (chính là bộ test công khai nói trên) nên
      `isMomoConfigured()` luôn trả `true` kể cả khi .env để trống — khác
      hẳn `isVnpayConfigured()` cũ (mặc định rỗng, bắt buộc phải điền).
      `createMomoPaymentUrl()` build request theo đúng tài liệu MoMo "AIO
      onetime — captureWallet": raw string ký theo THỨ TỰ FIELD CỐ ĐỊNH
      (KHÁC VNPay — VNPay sort alphabet, MoMo thì không, phải đúng thứ tự
      tài liệu quy định), HMAC-SHA256 (VNPay dùng SHA512). `verifyMomoCallback()`
      dùng bộ field VÀ thứ tự KHÁC với lúc tạo giao dịch (2 raw string riêng
      biệt cho 2 chiều, đã đối chiếu đúng tài liệu).

      KHÁC BIỆT CƠ CHẾ CALLBACK quan trọng so với VNPay (cả 2 đều dùng
      chung 1 cặp return-URL/IPN nhưng truyền dữ liệu khác cách): VNPay gửi
      CẢ return URL lẫn IPN dưới dạng GET query string; MoMo redirectUrl
      (return, trình duyệt) vẫn là GET query string nhưng **ipnUrl (server-
      to-server) lại là POST kèm JSON body** — route
      `/api/payments/momo/ipn/route.ts` phải `request.json()` rồi tự đổi
      từng field sang string trước khi đưa vào `verifyMomoCallback()` dùng
      chung với route return (đang dùng `url.searchParams`). MoMo cũng
      KHÔNG yêu cầu response theo format cố định như VNPay (`{RspCode,
      Message}`) — chỉ cần trả mã 2xx (dùng 204 No Content) là coi như đã
      nhận, trả 400 nếu verify thất bại để MoMo có thể gọi lại.

      lib/orders.ts: đổi toàn bộ tên hàm/biến vnpay -> momo
      (generatePaymentUrlForOrder bỏ tham số `ipAddr` vì MoMo không cần,
      khác VNPay bắt buộc `vnp_IpAddr`), `handleVnpayCallback` ->
      `handleMomoCallback`, giữ nguyên 100% logic idempotent (check
      payment.status !== PENDING trước khi xử lý) và logic tự chuyển Order
      PENDING -> CONFIRMED + tạo Notification khi thanh toán thành công.
      CheckoutForm.tsx: đổi prop `vnpayAvailable` -> `momoAvailable`, nhãn
      "Thanh toán qua ví MoMo". orders/[id] + RetryPaymentButton.tsx: đổi
      nhãn/check method sang "MOMO". admin/orders/[id]/page.tsx: thêm nhãn
      MOMO vào PAYMENT_METHOD_LABELS cục bộ (giữ nguyên nhãn VNPAY cũ cho
      đơn hàng lịch sử nếu có).

      .env: thay toàn bộ khối VNPAY_* bằng MOMO_PARTNER_CODE/MOMO_ACCESS_KEY/
      MOMO_SECRET_KEY (để trống, vì đã có default công khai trong code) +
      MOMO_REDIRECT_URL/MOMO_IPN_URL (đặt sẵn URL production Vercel, ÁP DỤNG
      NGAY CẢ KHI TEST LOCAL — giống hệt quyết định trước đây với
      VNPAY_RETURN_URL — vì local và Vercel dùng CHUNG 1 database Supabase
      nên return URL trỏ production vẫn cập nhật đúng Payment/Order dù đang
      test từ máy local).

      Đã test qua dev server bằng ĐÚNG DB THẬT (không mock): tạo user +
      cart + session test riêng bằng script, gọi thẳng POST /api/orders với
      paymentMethod=MOMO qua curl — nhận về `paymentUrl` thật trỏ tới
      `test-payment.momo.vn` (link thật, bấm vào được), kiểm tra lại DB xác
      nhận Payment tạo đúng `method: "MOMO"`, `status: "PENDING"`,
      `transactionRef` khớp txnRef đã gửi cho MoMo. `tsc --noEmit` (phải
      chạy `prisma generate` lại trước vì thêm enum MOMO — bài học cũ ở mục
      "Lưu ý quan trọng" về việc phải restart/generate lại sau khi đổi
      schema), `npm run build` (đủ route, có `/api/payments/momo/{return,
      ipn}` thay `/api/payments/vnpay/*`), `eslint` đều sạch. Đã dọn sạch
      dữ liệu test (order, payment, address, session, user).

      CHƯA TEST được: luồng thanh toán THẬT đi hết (redirect sang trang
      MoMo, nhập thông tin ví test, quay lại return URL/nhận IPN) — vì cần
      có ứng dụng MoMo Test (tải riêng, có hướng dẫn trong tài liệu dev
      MoMo) để "thanh toán" trong môi trường sandbox, đây là bước user cần
      tự làm. Cũng CHƯA verify được chính xác 100% thứ tự field trong raw
      signature của `verifyMomoCallback()` bằng 1 callback thật từ MoMo (chỉ
      mới xác nhận đúng chiều tạo giao dịch qua gọi API thật) — nếu lúc test
      thật báo lỗi "invalid_signature" dù thanh toán thành công bên phía
      MoMo, cần đối chiếu lại thứ tự field trong tài liệu MoMo mới nhất tại
      https://developers.momo.vn.

- [x] Sửa lỗi hiệu năng: chuyển trang chậm (user báo lại sau khi test MoMo).
      Tìm được 2 nguyên nhân THẬT qua đọc code (không phải đoán):

      1. `getCurrentUser()` (lib/auth.ts) được gọi RIÊNG LẺ ở Header.tsx
         (nhúng layout.tsx, chạy trên MỌI trang) VÀ ở hầu hết page.tsx cần
         đăng nhập (đã đếm được 45 lượt gọi trong 40 file) — mỗi lượt gọi tự
         query lại bảng Session dù CÙNG 1 request chỉ có đúng 1 session
         token, nghĩa là MỌI trang tốn ít nhất 2 round-trip DB chỉ để tra
         cùng 1 thứ. Đã bọc `getCurrentUser` bằng `cache()` của React (import
         từ package "react", không phải Next.js) — dedupe tự động mọi lệnh
         gọi giống hệt nhau trong CÙNG 1 lượt render server, chỉ query DB
         đúng 1 lần dù gọi bao nhiêu lần. Không cần sửa bất kỳ file nào khác
         đang gọi `getCurrentUser()`/`requireAdmin()`/`requireSuperAdmin()`
         vì cả 2 hàm sau chỉ gọi lại hàm đã cache.

      2. Header.tsx gọi 3 query đếm (giỏ hàng/yêu thích/thông báo) TUẦN TỰ
         bằng 3 lệnh `await` liên tiếp dù cả 3 hoàn toàn độc lập với nhau
         (chỉ cùng cần `user.id`) — đổi sang chạy song song bằng
         `Promise.all`. Tương tự ở trang chi tiết sản phẩm
         (products/[slug]/page.tsx): 7 lượt `await` nối đuôi nhau (sản phẩm
         -> sản phẩm liên quan -> user hiện tại -> đánh giá -> review của
         user -> đã yêu thích chưa -> danh sách đã yêu thích cho sản phẩm
         liên quan) trong khi thực ra chỉ có 3 ĐỢT phụ thuộc dữ liệu thật sự
         (sản phẩm trước tiên; rồi (liên quan + user hiện tại) song song;
         rồi 4 query còn lại song song) — gom lại còn 3 lượt round-trip nối
         tiếp thay vì 7.

      ĐÃ XONG (user tự đổi trên Vercel dashboard sau đó): Vercel Function
      Region đổi sang khớp gần Supabase (`ap-south-1`, Mumbai) thay vì mặc
      định North America (iad1) — giảm độ trễ mạng cho mỗi round-trip DB.

      Đã test qua dev server: `tsc --noEmit` + `eslint` sạch, `npm run
      build` thành công, gọi thử `/`, `/products`, `/products/[slug]` đều
      200 và nội dung render đúng (không chỉ tin status code — đã grep thấy
      đúng tên sản phẩm/thương hiệu trong HTML trả về) sau khi đổi cấu trúc
      query. Do local dev có overhead riêng của Turbopack/HMR nên số liệu
      thời gian đo được ở local KHÔNG phản ánh đúng mức cải thiện thực tế
      trên Vercel (nơi có độ trễ mạng thật giữa serverless function và
      Supabase) — cần user tự cảm nhận lại trên production sau khi deploy.

- [x] Rà soát bảo mật theo yêu cầu user + vá 2 lỗ hổng tìm được. Đã kiểm tra
      có hệ thống (không đoán): toàn bộ 22 route admin đều có
      requireAdmin()/requireSuperAdmin() + trả 403 đúng; IDOR ở giỏ hàng/địa
      chỉ/thông báo/đánh giá/wishlist/hỗ trợ đều đối chiếu đúng userId; session
      cookie httpOnly+secure(production)+SameSite=Lax+token ngẫu nhiên 256-bit;
      Google OAuth có state chống CSRF + verify token ở server + check
      verified_email; MoMo verify chữ ký HMAC + đối chiếu số tiền với DB trước
      khi tin callback; giá đơn hàng luôn tính từ DB, không tin client; 100%
      Prisma ORM (không raw SQL); không dangerouslySetInnerHTML/eval; .env
      chưa từng lọt vào git history (đã grep toàn bộ log).

      2 LỖ HỔNG THẬT đã tìm và vá:

      1. Upload ảnh chấp nhận SVG (rủi ro XSS lưu trữ): 2 route upload
         (/api/admin/upload, /api/reviews/upload-image) chỉ check
         `file.type.startsWith("image/")` — "image/svg+xml" cũng khớp điều
         kiện này dù SVG là XML có thể nhúng `<script>`, mở trực tiếp ảnh (vd
         bấm xem ảnh đánh giá ở tab mới, dùng `<a target="_blank">`) có thể
         chạy được script trong đó. Lớp chặn DUY NHẤT trước đây là cấu hình
         MIME allowlist ở bucket Supabase (ngoài code, có thể bị đổi/quên) —
         giờ thêm allowlist tường minh NGAY TRONG CODE: `isAllowedImageType()`
         (lib/supabaseStorage.ts) chỉ chấp nhận đúng 4 giá trị
         jpeg/png/webp/gif, dùng chung cho cả 2 route lẫn hàm
         `uploadToBucket()` (validate lại 1 lần nữa ở tầng thấp nhất, không
         chỉ tin route đã check). NHÂN TIỆN sửa thêm 1 lỗ hổng nhỏ liên quan:
         đuôi file lưu trên Storage trước đây lấy từ `file.name` (tên file
         client tự đặt, không đáng tin — tên không có dấu chấm sẽ khiến
         `.split(".").pop()` trả về nguyên tên file làm đuôi) — đổi sang suy
         ra đuôi file từ chính MIME type đã validate (`EXT_BY_TYPE`), không
         còn phụ thuộc giá trị client tự khai. Đã test qua dev server bằng
         session thật: upload file .svg giả (chứa `<script>`) bị từ chối
         đúng 400, upload PNG hợp lệ vẫn thành công 200 kèm đúng URL Supabase.

      2. Thiếu HTTP security headers: không có CSP/X-Frame-Options/X-Content-
         Type-Options — dễ bị nhúng site vào iframe lừa đảo (clickjacking)
         hoặc browser đoán sai content-type. Thêm qua `headers()` trong
         next.config.ts (áp dụng cho MỌI route, không cần middleware riêng):
         Content-Security-Policy (script-src/style-src bắt buộc có
         'unsafe-inline' vì Next.js App Router tự chèn `<script>` inline để
         stream RSC payload lúc hydrate, không tắt được hành vi này ngoài
         dùng nonce — đổi lại vẫn giữ được `frame-ancestors 'none'`/
         `object-src 'none'`/`base-uri 'self'` chặn đúng các lớp tấn công
         quan trọng), X-Frame-Options: DENY, X-Content-Type-Options: nosniff,
         Referrer-Policy, Permissions-Policy (tắt camera/mic/geolocation vì
         không dùng). Đã test qua dev server: `curl -D` xác nhận đủ 5 header
         xuất hiện đúng trên mọi route, smoke-test lại `/`, `/products`,
         `/login`, `/faq`, `/stores` vẫn 200 sau khi thêm CSP (không bị chặn
         script/style nào — không có `style={{...}}` inline nào trong toàn
         bộ codebase nên style-src không cần nới thêm ngoài mức đã đặt).

      KHÔNG SỬA (rủi ro thấp/không áp dụng, ghi rõ lý do): `npm audit` báo 4
      lỗ hổng "high" nhưng đều nằm trong `mysql2`/`deepmerge-ts` — dependency
      CLI của Prisma dùng cho MySQL, project chỉ dùng PostgreSQL nên code đó
      không bao giờ chạy, rủi ro thực tế gần như 0; so sánh chữ ký HMAC bằng
      `===` thay vì `crypto.timingSafeEqual` (lib/momo.ts) — về lý thuyết có
      thể bị timing attack nhưng cần đo thời gian cực chính xác qua mạng,
      rủi ro thực tế rất thấp với quy mô project này, chưa ưu tiên sửa.

- [x] Thêm tầng cache cho dữ liệu ít đổi (user hỏi so với FPT Shop thật còn
      nâng cấp hiệu năng được không — trả lời: còn, vì trước đó CHƯA có tầng
      cache nào, mọi route đều Dynamic 100% nghĩa là mỗi lần vào trang đều
      query lại DB dù dữ liệu gần như không đổi giữa các request).

      DÙNG `unstable_cache` (Next.js Data Cache có sẵn, không cần thêm Redis
      hay dịch vụ ngoài nào) cho các query KHÔNG phụ thuộc user hiện tại:
      danh mục/thương hiệu đang active (lib/categories.ts: getActiveCategories,
      lib/brands.ts: getActiveBrands — dùng ở trang chủ + /products, tách
      riêng khỏi getAllCategoriesForAdmin/getAllBrandsForAdmin vẫn query trực
      tiếp không cache vì admin cần luôn thấy dữ liệu mới nhất), cửa hàng
      active (lib/stores.ts: getActiveStores — dùng ở /checkout + /stores),
      khuyến mãi đang chạy (lib/promotions.ts: getActivePromotions), FAQ
      (lib/content.ts: getAllFaqItems — dùng chung cho cả /faq public LẪN
      /admin/faq, cache tự invalidate đúng cả 2 nơi), trang tĩnh
      (getStaticPage theo slug), banner trang chủ (không có trang admin quản
      lý banner nên chỉ cache theo thời gian 5 phút, không có tag để
      invalidate), và quan trọng nhất: `getProducts()` (lib/products.ts) —
      danh sách sản phẩm dùng ở CẢ trang chủ lẫn /products với mọi tổ hợp
      filter/sort, đây là query nặng nhất và được gọi nhiều nhất trong app.

      CƠ CHẾ INVALIDATE: mỗi hàm cache được gán 1 cache tag (vd "categories",
      "products"), và mọi hàm tạo/sửa/xóa dữ liệu tương ứng
      (createCategory/updateCategory/deleteCategory, createBrand/..., 3 hàm
      trong variants.ts, và 3 route admin/products) đều gọi thêm
      `revalidateTag(tag, { expire: 0 })` ngay sau khi ghi DB thành công —
      xóa cache ngay lập tức, không đợi TTL, để admin luôn thấy đúng thay đổi
      của chính mình ngay khi vừa lưu (đã test thật, xem bên dưới). LƯU Ý
      QUAN TRỌNG về API: bản Next.js 16.3.4 dự án đang dùng đã đổi chữ ký
      `revalidateTag` từ 1 tham số (`revalidateTag(tag)`, hành vi cũ ở Next
      14/15) sang BẮT BUỘC 2 tham số
      (`revalidateTag(tag, profile | { expire })`) — thiếu tham số thứ 2 sẽ
      lỗi biên dịch TypeScript ngay (`tsc` báo "Expected 2 arguments, but got
      1"), không phải lỗi runtime âm thầm. `{ expire: 0 }` = xóa cache ngay
      (tương đương hành vi cũ), còn `"max"` = cho phép phục vụ dữ liệu cũ
      thêm 1 năm trong lúc load lại nền (stale-while-revalidate, KHÔNG dùng ở
      đây vì cần thấy đúng ngay sau khi admin sửa).

      RIÊNG `getProducts()`: KHÔNG chỉ dựa vào tag (khác 5 hàm còn lại ở
      trên) vì mutation ảnh hưởng tới nó nằm rải rác ở nhiều nơi hơn (tạo/
      sửa/xóa sản phẩm ở 2 route admin, tạo/sửa/xóa biến thể ở variants.ts —
      đã hook đủ revalidateTag ở cả 2 nhóm này) VÀ còn phụ thuộc dữ liệu
      Review (điểm đánh giá trung bình/số lượng review hiển thị trên
      ProductCard) mà KHÔNG hook revalidateTag khi có review mới (quyết định
      có chủ đích — thêm 1 dòng revalidateTag ở lib/reviews.ts không sai
      nhưng đổi thêm 1 file chỉ để giảm từ tối đa 60s xuống 0s cho riêng số
      liệu rating, không đáng — đã có sẵn `revalidate: 60` làm lưới an toàn
      chung). Vì vậy thêm `revalidate: 60` (giây) cùng với tag — chấp nhận
      độ trễ tối đa 1 phút cho các thay đổi KHÔNG được hook tag tường minh
      (chủ yếu là rating từ review mới), còn thay đổi CÓ hook tag (thêm/sửa/
      xóa sản phẩm hoặc biến thể) vẫn thấy ngay lập tức nhờ revalidateTag.
      Tương tự, `getActivePromotions()` cũng thêm `revalidate: 60` dù ĐÃ có
      tag — vì 1 khuyến mãi có thể tự hết hạn theo `endsAt` mà không cần
      admin thao tác gì, chỉ dựa vào tag sẽ khiến nó hiện "đang chạy" mãi tới
      lần admin sửa thứ khác.

      Đã test qua dev server bằng DB thật (không mock — tạo 1 SUPER_ADMIN
      test tạm qua script Node gọi thẳng Prisma, không đụng dữ liệu thật):
      `tsc --noEmit` + `eslint` sạch, `npm run build` thành công (đủ 85
      route, vẫn toàn bộ Dynamic vì cache nằm ở tầng data, không phải page-
      level), `/`, `/products`, `/faq`, `/stores` đều 200 và đúng nội dung
      thật (danh mục Apple/Samsung, cửa hàng Cầu Giấy/Quận 1...). QUAN TRỌNG
      NHẤT — xác nhận invalidate hoạt động thật bằng luồng thật: gọi
      `POST /api/admin/categories` tạo 1 danh mục test mới → gọi lại
      `GET /products` NGAY LẬP TỨC (không đợi, không restart server) → danh
      mục mới đã xuất hiện đúng trong HTML trả về, chứng minh
      `revalidateTag(..., { expire: 0 })` xóa cache ngay chứ không cần chờ
      TTL; xóa danh mục test đó đi → gọi lại `/products` lần nữa → danh mục
      biến mất đúng ngay lập tức. Đã dọn user/session test.

      QUYẾT ĐỊNH PHẠM VI: KHÔNG cache `searchSuggestions()` (autocomplete,
      cần cảm giác tức thời khi gõ, chi phí mỗi query đã rất rẻ vì giới hạn
      6 kết quả) và KHÔNG cache `getProductsForCompare()` (tần suất gọi thấp,
      không đáng công sức thêm cơ chế invalidate).

- [x] Nút "Danh mục" dạng mega menu ở Header (user gửi ảnh chụp màn hình
      fptshop.com.vn thật làm mẫu, yêu cầu chỉ cần di chuột vào là hiện ra).
      src/components/CategoryMegaMenu.tsx (mới, Client Component — cần state
      để đổi category đang hover ở cột trái): dùng thuần CSS `group-hover`
      để đóng/mở panel (KHÔNG dùng onMouseEnter/onMouseLeave + useState cho
      việc đóng/mở — dễ dính race condition khi chuột di chuyển giữa nút và
      panel qua 1 khoảng hở, nếu panel có `margin-top` sẽ tạo "vùng chết"
      khiến :hover của phần tử cha bị ngắt giữa chừng trước khi chuột tới
      panel). Panel đặt `top-full` sát ngay dưới nút, dùng padding-top BÊN
      TRONG panel để tạo khoảng cách thị giác thay vì margin bên ngoài — giữ
      panel luôn là 1 khối liền với nút trong cùng 1 vùng hover.

      KHÁC BẢN GỐC (đã lường trước, không phải thiếu sót): FPT Shop thật
      nhóm sub-category theo TỪNG thương hiệu trong từng danh mục (vd
      "Apple > iPhone 17/16/15 Series..."). Dữ liệu project này ĐANG chỉ có
      3 danh mục phẳng không có con (Điện thoại/Laptop/Phụ kiện — Category
      có sẵn quan hệ parent/children trong schema nhưng seed chưa tạo danh
      mục con nào) và Brand là danh sách chung không gắn categoryId (không
      biết Xiaomi/Dell có thuộc "Điện thoại" hay không theo dữ liệu thật) —
      nên cột phải hiển thị TOÀN BỘ brand đang active dưới dạng chip link
      thẳng tới `/products?category=<slug>&brand=<slug>` (tái dùng đúng
      filter category+brand đã có sẵn ở lib/products.ts) thay vì bịa thêm
      sub-category/gán brand-theo-category giả không có trong DB.

      Header.tsx: gọi thêm `getActiveCategories()`/`getActiveBrands()` (đã
      cache sẵn từ mục "Thêm tầng cache" ở trên, gần như miễn phí) SONG SONG
      với `getCurrentUser()` trong cùng 1 Promise.all (3 lệnh gọi này hoàn
      toàn độc lập) thay vì query riêng — không làm tăng thêm round-trip DB
      nào so với trước. Nút đặt giữa logo và ô tìm kiếm (đúng vị trí trong
      ảnh mẫu), ẩn dưới `md` (mega menu 2 cột cần đủ rộng, màn hình nhỏ đã
      có link "Sản phẩm" ở thanh nav phụ bên dưới làm lối vào thay thế).

      Đã test qua dev server: `tsc --noEmit`/`eslint`/`npm run build` sạch,
      tải HTML trang chủ xác nhận đúng cả 3 danh mục + 4 thương hiệu thật
      (Xiaomi/Samsung/Apple/Dell) render trong menu, đúng href
      `/products?category=dien-thoai&brand=apple` kiểu, gọi thẳng URL đó lẫn
      `/products?category=laptop` đều 200. CHƯA tự xem qua trình duyệt thật
      hiệu ứng hover mượt hay không (môi trường không có màn hình) — nhờ
      user tự mở `npm run dev` di chuột thử, báo lại nếu panel bị giật/đóng
      sai lúc di chuột từ nút xuống panel.

## Việc còn thiếu / cần làm tiếp
- [x] Tạo OAuth Client trên Google Cloud Console + điền 3 biến GOOGLE_* trong
      .env local — ĐÃ XONG, đăng nhập Google thật đã hoạt động (xem kết quả
      test ở mục "Chuyển hẳn sang đăng nhập bằng Google" ở trên).
- [ ] CHƯA làm cho Vercel: thêm Authorized redirect URI production
      (`https://fptshop-clone.vercel.app/api/auth/google/callback`) vào
      đúng OAuth Client trên Google Cloud Console (Credentials > sửa OAuth
      Client vừa tạo > Authorized redirect URIs > + Add URI), rồi điền 3
      biến GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/GOOGLE_REDIRECT_URI vào
      Environment Variables trên Vercel dashboard (GOOGLE_REDIRECT_URI dùng
      URL production, KHÔNG phải localhost). CHƯA làm thì đăng nhập trên
      production sẽ lỗi `redirect_uri_mismatch` từ Google dù local vẫn chạy
      bình thường.
- [ ] OAuth consent screen đang ở chế độ "Testing" — chỉ tài khoản nằm trong
      danh sách "Test users" (Audience > Test users) mới đăng nhập được.
      Muốn CHO NGƯỜI KHÁC đăng nhập được (vd khi demo cho người ngoài xem)
      cần bấm "Publish app" chuyển sang "In production" (không cần Google
      duyệt vì chỉ xin scope email/profile cơ bản).
- [ ] Test luồng thanh toán MoMo THẬT đi hết bằng ứng dụng MoMo Test (tải
      theo hướng dẫn tại developers.momo.vn) — chưa tự làm được vì cần thao
      tác trên app thật. Đặc biệt chú ý xác nhận IPN không báo
      "invalid_signature" — nếu có, đối chiếu lại thứ tự field ký trong
      verifyMomoCallback() (lib/momo.ts) với tài liệu MoMo mới nhất.
- [ ] Trên Vercel: thêm MOMO_REDIRECT_URL/MOMO_IPN_URL (dùng URL production,
      xem hướng dẫn trong .env) vào Environment Variables — 3 biến
      MOMO_PARTNER_CODE/ACCESS_KEY/SECRET_KEY để trống vẫn chạy được nhờ
      default công khai, không bắt buộc điền trừ khi có tài khoản merchant
      MoMo thật riêng.
- [ ] Polish CẤU TRÚC (không phải màu sắc — màu đã tự động đổi theo theme
      mới) cho phần còn lại của admin (danh mục, thương hiệu, người dùng,
      cửa hàng, khuyến mãi, bảo hành, thu cũ đổi mới, hỗ trợ, trang tĩnh,
      FAQ) — mới làm mẫu bố cục .card/.btn-primary ở danh sách sản phẩm +
      đơn hàng, xem mục "Làm đẹp giao diện toàn site" ở trên

## Lưu ý quan trọng
- Không chạy `npm audit fix --force` — dễ đổi version Prisma linh tinh
- Mật khẩu Supabase có ký tự đặc biệt phải URL-encode trong DATABASE_URL
- Đăng nhập DUY NHẤT qua Google OAuth (lib/googleOAuth.ts) — không còn SĐT/
  OTP/mật khẩu nào cả. Thiếu 1 trong 3 biến GOOGLE_CLIENT_ID/
  GOOGLE_CLIENT_SECRET/GOOGLE_REDIRECT_URI thì KHÔNG ai đăng nhập được, kể cả
  local (không có fallback mock). GOOGLE_REDIRECT_URI phải khớp CHÍNH XÁC 1
  URI đã khai trong Google Cloud Console (Credentials > OAuth client), đổi
  giá trị này khi deploy Vercel (xem hướng dẫn trong .env).
- Email trong User giờ là ĐỊNH DANH ĐĂNG NHẬP (khớp tài khoản Google) — KHÔNG
  cho user tự sửa email trong /profile nữa (khác trước đây), tránh lệch giữa
  email lưu trong DB và email Google trả về gây tạo User trùng ở lần đăng
  nhập sau.
- SUPABASE_URL trong .env phải là URL GỐC project (https://<ref>.supabase.co),
  KHÔNG phải URL REST API (.../rest/v1/) — nếu nhầm sẽ lỗi "Invalid path
  specified in request URL" khi upload ảnh (đã từng gặp, xem lib/supabaseStorage.ts)
- MỖI LẦN sửa prisma/schema.prisma (db push/migrate + generate xong) PHẢI tắt
  hẳn và chạy lại `npm run dev` — dev server đang chạy sẵn giữ Prisma Client
  cũ trong bộ nhớ (do lib/prisma.ts cache instance qua HMR), generate lại
  không tự nạp vào process đang sống, gây lỗi kiểu "Unknown argument ..."
  dù code và DB đều đúng (đã gặp thật khi thêm unique constraint cho Review)
- Quan hệ optional trong Prisma (field kiểu `String?` + relation không ghi rõ
  onDelete) mặc định là `onDelete: SetNull`, KHÔNG chặn xóa bản ghi cha —
  xóa xong con vẫn còn nhưng FK tự về null, dễ mất dữ liệu âm thầm (đã gặp
  thật: xóa Address đang được Order dùng, Order không lỗi nhưng addressId bị
  set null, mất thông tin giao hàng đơn cũ). Với quan hệ nào việc mất liên
  kết là không chấp nhận được (vd Address <-> Order) phải tự check thủ công
  trong code trước khi xóa (xem deleteAddress() trong lib/addresses.ts),
  không được tin tưởng ràng buộc DB sẽ tự chặn.
- Đã thêm tầng cache (`unstable_cache`) cho category/brand/store/promotion/
  FAQ/trang tĩnh/banner/danh sách sản phẩm — xem mục "Thêm tầng cache cho dữ
  liệu ít đổi". MỌI hàm tạo/sửa/xóa dữ liệu có cache tương ứng PHẢI gọi
  `revalidateTag(tag, { expire: 0 })` ngay sau khi ghi DB, nếu không admin sẽ
  thấy dữ liệu cũ tới khi hết TTL. Bản Next.js 16 project đang dùng bắt buộc
  `revalidateTag` nhận ĐỦ 2 tham số (thiếu tham số 2 lỗi biên dịch ngay, xem
  chi tiết ở mục trên) — khác hành vi 1 tham số quen thuộc ở Next 14/15, nhớ
  điều này nếu sau này thêm cache mới cho model khác.