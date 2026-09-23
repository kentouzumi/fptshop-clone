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

- [x] Nâng cấp mega menu "Danh mục" cho giống ảnh chụp fptshop.com.vn thật
      hơn + chèn thêm dữ liệu thật vào DB (user yêu cầu rõ "sửa code và
      database... chèn data vào database luôn"). 2 phần việc:

      1. THÊM DỮ LIỆU THẬT qua prisma/seed.ts (giữ nguyên pattern upsert
         idempotent có sẵn, không viết script rời): thêm category "Điện máy"
         (slug dien-may, sortOrder 3 — đổi lại thứ tự 4 category thành Điện
         thoại/Laptop/Điện máy/Phụ kiện đúng như 4 mục đầu trong sidebar
         "Danh mục" thật của FPT Shop mà ảnh user gửi cho thấy); thêm 4 brand
         mới (OPPO, Asus, JBL, Sony); thêm 5 sản phẩm mới để mỗi category có
         nhiều brand thật: OPPO Reno11 5G (Điện thoại), Asus Zenbook 14 OLED
         (Laptop), JBL Tune 510BT (Phụ kiện), Samsung Smart Tivi Crystal UHD
         55" + Sony Bravia 43" (Điện máy — cố tình dùng LẠI brand Samsung có
         sẵn thay vì tạo brand mới, vì Samsung thật ngoài đời cũng làm cả
         điện thoại lẫn tivi, nhân tiện dùng để test logic ở mục 2 xử lý
         đúng 1 brand xuất hiện ở NHIỀU category). Đã chạy
         `npx prisma db seed --config prisma7.config.ts` áp thật vào Supabase
         (không phải chỉ sửa code) — xác nhận qua query trực tiếp DB thấy
         đủ 4 category/12 sản phẩm.

      2. SỬA LOGIC brand hiển thị dưới mỗi category trong mega menu — bản
         trước (mục "Nút Danh mục dạng mega menu" ở trên) có 1 lỗ hổng thực
         tế đã lường trước nhưng chưa sửa: hiện TOÀN BỘ brand đang active
         dưới MỌI category (vd Dell — brand chỉ làm laptop — vẫn hiện dưới
         "Điện thoại", sai thực tế). Thêm `getBrandsByCategory()`
         (lib/products.ts) — query toàn bộ Product ACTIVE, group theo
         category.slug -> Set<brand> trong JS, trả về brand THẬT SỰ có sản
         phẩm trong từng category (không phải danh sách Brand cố định toàn
         hệ thống). Cache bằng `unstable_cache` DÙNG CHUNG PRODUCTS_TAG (không
         tạo tag riêng) vì mọi nơi tạo/sửa/xóa sản phẩm đã tự
         `revalidateTag(PRODUCTS_TAG, ...)` từ trước — không cần thêm code
         invalidate mới. CategoryMegaMenu.tsx đổi prop `brands: BrandItem[]`
         (danh sách phẳng) thành `brandsByCategory: Record<string,
         BrandItem[]>`, tra theo `active.slug`. Header.tsx đổi từ gọi
         `getActiveBrands()` (danh sách toàn cục, vẫn giữ nguyên dùng ở
         /products cho chip lọc brand — đúng chỗ vì filter đó không phụ
         thuộc category đang chọn) sang `getBrandsByCategory()`.

         NHÂN TIỆN thêm icon SVG inline (phone/laptop/tivi/tai nghe) cạnh
         tên từng category ở cột trái mega menu — khớp phong cách ảnh mẫu
         (mỗi mục sidebar có icon riêng), không cần tải asset ảnh ngoài.

      LỖI THẬT phát hiện lúc test (không phải bug code, là đặc tính của
      `unstable_cache` trong dev): sau khi chạy seed script (ghi thẳng vào
      DB qua Prisma, KHÔNG đi qua createCategory()/createProduct() của app)
      và load lại trang, category "Điện máy" mới KHÔNG xuất hiện dù DB đã
      đúng — vì seed script bỏ qua hoàn toàn lệnh `revalidateTag(...)` (nó
      chỉ được gọi bên trong các hàm mutation của app, không có lý do gì để
      seed script biết mà gọi). Cụ thể trong dev: xóa riêng
      `.next/cache/fetch-cache` KHÔNG đủ, phải xóa toàn bộ thư mục `.next`
      (bao gồm cache Turbopack) rồi khởi động lại mới thấy dữ liệu mới. RÚT
      RA QUY TẮC (ghi vào mục "Lưu ý quan trọng" bên dưới): bất cứ khi nào
      sửa dữ liệu TRỰC TIẾP qua script/Prisma Studio (bỏ qua các hàm
      mutation có gọi revalidateTag của app) cho model đã có cache, phải tự
      xóa `.next` (local) hoặc đợi hết TTL/redeploy (Vercel) thì thay đổi
      mới hiện ra — không phải bug, là hệ quả tất yếu của cache tag-based.

      KHÁC BẢN GỐC (vẫn còn, đã ghi ở mục trước, không lặp lại): không có
      sub-category thật theo từng brand (vd "Apple > iPhone 17/16/15
      Series") — cột phải mega menu vẫn dừng ở mức brand chip, KHÔNG bịa
      thêm tầng phân cấp sản phẩm/model cụ thể không tồn tại trong DB.

      Đã test qua dev server (sau khi xóa cache stale, dùng DB thật, không
      tạo dữ liệu test tạm nào — toàn bộ là dữ liệu seed thật, giữ nguyên):
      `tsc --noEmit`/`eslint`/`npm run build` sạch; trang chủ hiện đủ 4
      category theo đúng thứ tự Điện thoại/Laptop/Điện máy/Phụ kiện; gọi
      trực tiếp script Node group brand theo category từ DB thật xác nhận
      ĐÚNG logic cách ly: dien-thoai→[Apple,OPPO,Samsung,Xiaomi] (không có
      Dell), laptop→[Apple,Asus,Dell] (không có OPPO), dien-may→
      [Samsung,Sony], phu-kien→[Apple,JBL]; `/products?category=dien-may`,
      `?category=dien-may&brand=sony`, `?category=laptop&brand=asus`,
      `?category=phu-kien&brand=jbl` đều 200 và trả đúng đúng sản phẩm mong
      đợi (grep thấy tên sản phẩm thật trong HTML). CHƯA tự xem qua trình
      duyệt thật hiệu ứng hover 4 category + icon (môi trường không có màn
      hình) — nhờ user tự mở `npm run dev` (hoặc xem trên production sau
      khi Vercel deploy xong, không cần chạy lại seed vì Vercel dùng CHUNG
      Supabase DB với local) xác nhận trực quan.

- [x] Mở rộng từ 4 lên 9 danh mục + thêm 12 sản phẩm (user gửi tiếp 3 ảnh
      chụp sidebar "Danh mục" thật của fptshop.com.vn — dài hơn nhiều so với
      4 danh mục hiện có, và yêu cầu thẳng "làm thêm danh mục như trong ảnh
      đi... tự thêm vào mỗi danh mục 1 số sản phẩm giúp tôi"). Vẫn qua
      prisma/seed.ts (pattern upsert idempotent), đã chạy thật lên Supabase.

      5 danh mục mới (sortOrder 5-9, nối tiếp Điện thoại/Laptop/Điện máy/Phụ
      kiện cũ): "Đồng hồ, Máy tính bảng", "PC, Màn hình, Linh kiện", "Điện
      gia dụng, Nhà bếp", "Chăm sóc nhà cửa & sức khỏe", "Camera, Thiết bị
      mạng, Smart Home". QUYẾT ĐỊNH PHẠM VI: ảnh gốc có tới ~20 dòng danh
      mục nhỏ lẻ (vd tách riêng "Nồi chiên không dầu, Lò vi sóng, Bếp nướng
      điện" / "Nồi áp suất, Nồi lẩu điện, Bếp điện" / "Nồi, Chảo, Đồ dùng
      nhà bếp" thành 3 dòng riêng biệt) — KHÔNG tạo đúng từng dòng vì sẽ
      phải bịa thêm rất nhiều brand/sản phẩm giả chỉ để lấp đầy, không có
      giá trị thật cho demo; đã GOM lại thành 5 danh mục rộng hơn nhưng vẫn
      phủ đúng các mảng sản phẩm chính (thiết bị đeo, PC/màn hình, đồ gia
      dụng bếp, chăm sóc nhà cửa, mạng/an ninh) — mỗi danh mục có 2 sản
      phẩm thật đại diện thay vì để trống. "Chuyên trang thương hiệu" (Apple/
      Samsung/LG/Xiaomi/Garmin ở ảnh) KHÔNG tạo riêng vì đó là trang
      microsite theo brand của FPT thật, không phải category — chức năng
      tương đương đã có sẵn qua brand chip trong mega menu.

      Thêm 3 brand mới: LG (tủ lạnh/máy giặt, đưa vào "Điện máy" có sẵn —
      cố tình KHÔNG tạo category "Tivi" riêng vì "Điện máy" vốn đã đúng là
      tên umbrella FPT thật dùng cho cả nhóm tivi/tủ lạnh/máy giặt), Philips
      (đồ gia dụng + máy lọc không khí), TP-Link (router mạng). 12 sản phẩm
      mới: LG Tủ lạnh 375L + LG Máy giặt 9kg (Điện máy); Apple Watch Series
      9 + Samsung Galaxy Tab S9 (Đồng hồ/Máy tính bảng); Dell UltraSharp
      U2724D + Asus TUF Gaming VG249Q3A (PC/Màn hình — CHỦ Ý chọn màn hình
      chứ không phải thêm laptop, tránh trùng vai trò với category Laptop
      đã có); Philips Nồi chiên không dầu + Philips Nồi cơm điện tử (Điện
      gia dụng); Xiaomi Robot hút bụi + Philips Máy lọc không khí (Chăm sóc
      nhà cửa); TP-Link Archer AX55 + Xiaomi Camera an ninh Mi 360 (Camera/
      Thiết bị mạng). Database giờ có 23 sản phẩm / 9 category / 11 brand.

      Đã test qua dev server (xóa `.next` trước khi chạy lại — rút kinh
      nghiệm từ lỗi cache stale ở mục ngay trên): `tsc --noEmit`/`eslint`/
      `npm run build` sạch; script Node query trực tiếp DB xác nhận đúng cả
      9 category (thứ tự sortOrder 1-9) và đúng brand-per-category (Điện
      máy giờ có thêm LG bên cạnh Samsung/Sony, 5 category mới đều có brand
      đúng, không lẫn brand sai category); trang chủ hiện đủ 9 thẻ danh mục;
      gọi `/products?category=<slug>` và `?category=<slug>&brand=<slug>`
      cho cả 5 category mới (kể cả kết hợp brand) đều 200 và trả đúng đúng
      sản phẩm mong đợi (grep thấy tên sản phẩm thật + đúng categorySlug
      trong JSON RSC payload). CHƯA tự xem qua trình duyệt thật — nhờ user
      tự mở `npm run dev` hoặc xem trên production (Vercel dùng chung
      Supabase DB, không cần chạy lại seed) để xác nhận trực quan mega menu
      cuộn được với 9 mục và hiển thị đúng icon/brand cho từng mục.

- [x] Sửa lỗi console "eval() is not supported... Content-Security-Policy...
      unsafe-eval" (user báo lại khi chạy `npm run dev`). NGUYÊN NHÂN: CSP
      thêm lúc vá bảo mật (mục "Rà soát bảo mật" ở trên) chỉ có `script-src
      'self' 'unsafe-inline'`, không có `'unsafe-eval'` — React/Turbopack ở
      chế độ DEV dùng `eval()` để dựng lại call stack phục vụ Fast Refresh/
      debugging (dòng cảnh báo tự in "React will never use eval() in
      production mode" xác nhận đây chỉ là hạn chế của dev, không phải lỗi
      logic). CSP trong `next.config.ts` áp dụng cho MỌI môi trường
      (`headers()` không tự phân biệt dev/production), nên bản CSP nghiêm
      ngặt viết cho production vô tình chặn luôn tính năng debug của dev.

      SỬA: next.config.ts giờ build CSP động theo `process.env.NODE_ENV`
      (Next.js tự set `NODE_ENV=production` cho MỌI lần `next build` — kể
      cả Vercel Preview deployments — chỉ `next dev` mới có
      `NODE_ENV=development`, nên tách theo biến này không làm lỏng CSP
      production dù chỉ 1 chút): CHỈ khi dev mới thêm `'unsafe-eval'` vào
      script-src và `ws: wss:` vào connect-src (kênh WebSocket Hot Module
      Reload của dev server, cũng bị `connect-src 'self'` chặn). Production
      giữ NGUYÊN CSP nghiêm ngặt như cũ, không nới lỏng gì.

      Đã test: `tsc --noEmit`/`eslint` sạch; chạy `npm run dev` xong `curl
      -D` xác nhận header CSP có đủ `'unsafe-eval'` + `ws: wss:`; chạy
      `npm run build` + `next start` (mô phỏng đúng production) xong `curl
      -D` xác nhận CSP KHÔNG có 2 giá trị nới lỏng đó, `/` và `/products`
      vẫn 200 — production không bị ảnh hưởng bởi thay đổi này.

- [x] Tách 5 danh mục gộp thành đủ 23 danh mục nhỏ lẻ y hệt từng dòng trong
      ảnh sidebar thật (user chủ động yêu cầu làm lại sau khi được hỏi rõ:
      "giữ 5 danh mục gộp" hay "tách thành ~20 danh mục nhỏ lẻ" — chọn tách
      đầy đủ, chỉ đồng ý bỏ riêng "Chuyên trang thương hiệu" như quyết định
      cũ). Đây là thay đổi LỚN hơn hẳn 2 lần mở rộng category trước — không
      chỉ THÊM mà còn phải XÓA 3 category gộp cũ (dien-may,
      dien-gia-dung-nha-bep, cham-soc-nha-cua-suc-khoe) và DI CHUYỂN 8 sản
      phẩm đã tồn tại sang category mới tương ứng.

      LỖI TIỀM ẨN đã lường trước và sửa ngay trong seed.ts (không phải sửa
      sau khi gặp lỗi): vòng lặp upsert sản phẩm trước đó dùng `update: {}`
      (no-op) — nếu giữ nguyên, đổi `categoryId` của 1 sản phẩm ĐÃ TỒN TẠI
      trong mảng `products` sẽ KHÔNG có tác dụng gì (upsert rơi vào nhánh
      update vì slug đã có, mà update rỗng) — sản phẩm cũ vẫn kẹt ở category
      cũ dù code đã sửa categoryId. Đã sửa `update` thành đồng bộ lại
      `categoryId/brandId/basePrice/isFeatured` mỗi lần chạy seed (không chỉ
      lúc tạo mới) — nhờ vậy 8 sản phẩm di chuyển đúng: Samsung Tivi + Sony
      Bravia -> "Tivi, Máy lạnh - Điều hòa"; LG Tủ lạnh -> "Tủ lạnh, Tủ
      đông, Tủ mát"; LG Máy giặt -> "Máy giặt, Máy sấy, Tủ sấy"; Philips Nồi
      chiên -> "Nồi chiên, Lò vi sóng, Bếp nướng điện"; Philips Nồi cơm điện
      -> "Ấm siêu tốc, Nồi cơm điện"; Xiaomi Robot hút bụi + Philips Máy lọc
      không khí -> "Robot hút bụi, Máy hút bụi, Máy lọc khí". Sau khi 3
      category cũ chắc chắn còn 0 sản phẩm, seed.ts tự
      `prisma.category.delete()` (bọc check tồn tại trước để idempotent,
      chạy lại seed nhiều lần không lỗi "record not found").

      Thêm 11 sản phẩm mới (để 11 danh mục còn thiếu đều có ít nhất 1 sản
      phẩm thật, không hiện trống): HP LaserJet Pro M15w (Máy in), Kangaroo
      Máy hút ẩm KG150, Philips Máy sấy tóc BHC010, Xiaomi Cân điện tử Mi
      Body Scale, Kangaroo Máy lọc nước RO, Kangaroo Máy nước nóng KG69,
      Sunhouse Máy xay sinh tố SHD5341, Sunhouse Máy hút mùi SHB6822,
      Sunhouse Nồi áp suất điện SHD8616, Sunhouse Chảo chống dính đáy từ,
      Logitech G304. Thêm 4 brand mới: HP, Sunhouse, Kangaroo, Logitech —
      ƯU TIÊN chọn brand THẬT SỰ gắn với đúng ngành hàng ở thị trường VN
      (Sunhouse/Kangaroo là 2 thương hiệu gia dụng/nhà bếp phổ biến nhất VN,
      không nhét đại Apple/Samsung vào category không liên quan).

      SỬA THÊM CategoryMegaMenu.tsx: cột trái giờ có 23 mục nên PHẢI thêm
      `max-h-[420px] overflow-y-auto` (nếu không panel sẽ tràn quá chiều cao
      màn hình) — đúng hành vi "Lăn chuột xuống để khám phá" thấy trong ảnh
      mẫu gốc. Mở rộng panel từ 600px lên 640px (tên category giờ dài hơn:
      "Nồi áp suất, Nồi lẩu điện, Bếp điện"...). Thêm icon riêng cho 2 mục
      mới (Tủ lạnh, Máy giặt — vẽ SVG tủ lạnh/máy giặt đơn giản), đổi icon
      cũ "dien-may" (đã xóa category đó) thành icon dùng chung cho "Tivi,
      Máy lạnh - Điều hòa". 19 danh mục còn lại KHÔNG vẽ icon riêng (dùng
      DEFAULT_ICON chung) — không đáng công sức vẽ ~20 icon SVG riêng chỉ để
      trang trí, đúng tinh thần ưu tiên đã áp dụng xuyên suốt dự án.

      Database giờ có 34 sản phẩm / 23 category / 15 brand.

      Đã test qua dev server (xóa `.next` trước khi chạy lại, rút kinh
      nghiệm từ 2 lần trước): `tsc --noEmit`/`eslint`/`npm run build` sạch;
      script Node xác nhận ĐÚNG 23 category (không còn 3 category cũ), ĐÚNG
      brand-per-category cho toàn bộ 23 mục (vd "Nồi, Chảo, Đồ dùng nhà
      bếp" -> Sunhouse, "Thiết bị chơi game..." -> Logitech, không lẫn brand
      sai chỗ); trang chủ render đủ 23 thẻ danh mục (grep xác nhận từng
      href+tên); `/products?category=<slug>` và kèm `&brand=<slug>` cho 4
      category mới bất kỳ (tivi-may-lanh-dieu-hoa, noi-chao-do-dung-nha-bep
      +sunhouse, thiet-bi-choi-game...+logitech, may-in-may-chieu...+hp) đều
      200; xác nhận class `max-h-[420px] overflow-y-auto` có mặt đúng trong
      HTML render thật. CHƯA tự xem qua trình duyệt thật hiệu ứng cuộn 23
      mục (môi trường không có màn hình) — nhờ user tự mở `npm run dev` xác
      nhận cuộn mượt, icon hiển thị đúng, không bị vỡ layout ở màn hình nhỏ.

- [x] Cho phép chọn RIÊNG từng tên trong 1 dòng danh mục gộp (user lấy ví dụ
      "Thiết bị bếp, Máy rửa bát, Máy hút mùi" — yêu cầu "vẫn giữ nguyên thế
      nhưng chỉ có thể chọn Thiết bị bếp hoặc Máy rửa bát hoặc máy hút
      mùi"). Áp dụng chung cho TẤT CẢ 20/23 danh mục cấp cao có tên gộp
      nhiều phần bằng dấu phẩy (chỉ 3 danh mục atomic Điện thoại/Laptop/Phụ
      kiện là không đổi).

      DÙNG ĐÚNG quan hệ `Category.parentId` đã có sẵn trong schema từ đầu
      dự án nhưng CHƯA TỪNG dùng tới (mọi category trước giờ đều phẳng) —
      đây là dịp đầu tiên thực sự cần tới nó. Mỗi danh mục gộp cũ (vd
      "thiet-bi-bep-may-rua-bat-may-hut-mui") giờ là 1 category CHA thuần
      tổ chức (KHÔNG tự gán sản phẩm trực tiếp nữa), chứa N category CON —
      mỗi tên tách trong ngoặc phẩy là 1 con độc lập, CHỌN ĐƯỢC RIÊNG (có
      slug/URL/brand-filter riêng, y hệt category thường). Tổng cộng 52
      category con mới (prisma/seed.ts, định nghĩa qua mảng `CATEGORY_GROUPS`
      thay vì viết tay từng upsert như 2 lần trước — code ngắn gọn hơn hẳn
      cho 20×2-3 category con). 24 sản phẩm đã tồn tại được DI CHUYỂN sang
      đúng category con phù hợp (vd Samsung Tivi + Sony Bravia -> con
      "Tivi", không phải con "Máy lạnh - Điều hòa"). 28 category con còn lại
      CHƯA có sản phẩm — CHỦ ĐỘNG CHẤP NHẬN (không bịa thêm ~28 sản phẩm/
      brand giả chỉ để lấp đầy, vì lần này user CHỈ yêu cầu cơ chế CHỌN
      ĐƯỢC RIÊNG, không yêu cầu "thêm sản phẩm cho mỗi danh mục" như lần
      trước) — giống hệt cách 1 cửa hàng thật có category con chưa có hàng
      lúc mới mở rộng danh mục, không phải bug.

      lib/categories.ts: `getActiveCategories()` (dùng ở trang chủ +
      /products, KHÔNG đổi hành vi với 2 trang này) thêm filter `parentId:
      null` — nếu không sẽ hiện LẪN cả 52 category con vào lưới/chip vốn chỉ
      nên có 23 mục cấp cao. Thêm hàm mới `getActiveCategoriesWithChildren()`
      (cùng cache tag "categories" nên không cần thêm code revalidate mới)
      CHỈ dùng cho mega menu — include quan hệ `children`.

      CategoryMegaMenu.tsx: đổi hẳn cách render cột trái — category CÓ
      children giờ render TỪNG TÊN CON như 1 `<Link>` riêng nối nhau bằng
      ", " ngay trong CÙNG 1 dòng (không phải cả dòng là 1 link như trước) —
      đúng yêu cầu "vẫn giữ nguyên thế" (nhìn vẫn 1 dòng y hệt) nhưng "chỉ
      có thể chọn X hoặc Y hoặc Z" (từng tên là 1 lựa chọn riêng). Category
      KHÔNG có children (Điện thoại/Laptop/Phụ kiện) vẫn render như cũ.
      `active` (dùng để tra brand chip bên phải) giờ luôn là 1 category
      LÁ (leaf — con nếu có, hoặc chính nó nếu không có con), không bao giờ
      là category cha (cha không tự có sản phẩm/brand trực tiếp nữa).

      LỖI THẬT tự phát hiện VÀ TỰ SỬA ngay khi test (không đợi user báo):
      sau khi chuyển sản phẩm sang category con, category CHA (24 category
      từng có sản phẩm trực tiếp) còn 0 sản phẩm — nghĩa là link category
      cha cũ vẫn có ở LƯỚI TRANG CHỦ (không đổi, xem trên) giờ dẫn tới trang
      RỖNG dù trước đó có sản phẩm, hồi quy thật so với trước khi sửa. Sửa
      bằng cách đổi lib/products.ts `getProducts()`: khi lọc theo
      `categorySlug`, tự tra thêm `children` của category đó và MỞ RỘNG
      filter thành `categoryId IN [chính nó, ...toàn bộ id con]` — bấm vào
      danh mục cha giờ hiện ĐÚNG hợp của mọi sản phẩm thuộc các con (đúng
      hành vi duyệt danh mục thông thường trong thương mại điện tử: danh
      mục cha = union sản phẩm các danh mục con), category LÁ (không con)
      hành vi không đổi (chỉ 1 id trong mảng, y hệt trước).

      Đã test qua dev server (xóa `.next` trước, dùng DB thật): `tsc
      --noEmit`/`eslint`/`npm run build` sạch; script Node xác nhận cấu
      trúc DB đúng (75 category = 23 cấp cao + 52 con, mỗi category cha
      own:0 sản phẩm); trang chủ vẫn ĐÚNG 23 category cấp cao (grep chính
      xác trong section "Danh mục sản phẩm", không lẫn category con); mega
      menu hiện đúng 3 link riêng "Thiết bị bếp"/"Máy rửa bát"/"Máy hút mùi"
      (đúng ví dụ user đưa ra) thay vì 1 link gộp; `/products?category=`
      cho cả category cha (hiện union sản phẩm con), category con cụ thể
      (hiện đúng riêng của con đó), và kết hợp thêm `&brand=` (lọc đúng,
      không lẫn brand khác trong cùng union) đều test qua curl trả đúng kết
      quả mong đợi. CHƯA tự xem qua trình duyệt thật hiệu ứng hover/tương
      tác (môi trường không có màn hình) — nhờ user tự mở `npm run dev` xác
      nhận.

- [x] Thay bộ lọc dạng chip ngang ở /products bằng sidebar bên trái kiểu
      fptshop.com.vn thật (user gửi 3 ảnh chụp "Bộ lọc tìm kiếm" thật — các
      mục thu gọn/mở rộng, lưới hãng sản xuất, mức giá dạng checkbox + ô nhập
      khoảng giá tùy chỉnh + thanh kéo, và một loạt bộ lọc rất đặc thù cho
      điện thoại: Hệ điều hành/Dung lượng ROM/Kết nối/RAM/Thẻ nhớ/Màn hình/
      Chuẩn màn hình/Tần số quét/Camera/Tính năng đặc biệt).

      QUYẾT ĐỊNH PHẠM VI quan trọng (không làm đúng 100% ảnh): CHỈ dựng lại
      layout sidebar + 3 nhóm lọc dùng được cho MỌI danh mục bằng dữ liệu
      THẬT sẵn có (Danh mục, Hãng sản xuất, Mức giá) — KHÔNG bịa thêm các
      facet đặc thù điện thoại (Hệ điều hành/RAM/ROM/Kết nối/Camera...) vì
      dữ liệu `ProductAttribute` hiện tại (bảng thông số kỹ thuật) rất thưa
      và không đồng nhất giữa các sản phẩm (mỗi sản phẩm chỉ có 1-2 attribute
      với `groupName` khác nhau tùy tiện — vd TV chỉ có "Màn hình", máy giặt
      chỉ có "Khối lượng giặt", không có sản phẩm nào có đủ bộ RAM+ROM+Hệ
      điều hành+Camera... để lọc thật). Làm facet giả cho ~34 sản phẩm trải
      khắp 75 category (điện thoại lẫn nồi chiên lẫn máy hút bụi) sẽ vô nghĩa
      với đa số danh mục — không bịa thêm dữ liệu chỉ để lấp đầy giao diện,
      đúng tinh thần các quyết định phạm vi trước đó trong dự án. Cũng bỏ
      luôn thanh kéo (slider) 2 đầu mút mà ảnh có — ô nhập số "Từ/Đến" đã đủ
      chức năng tương đương, kéo-thả cần thêm client JS phức tạp cho giá trị
      thị giác không tương xứng.

      src/app/products/FilterSidebar.tsx (mới, Server Component — toàn bộ
      chỉ là `<Link>`/`<form method="GET">`, không cần JS): 3 nhóm lọc bọc
      trong `<details open>`/`<summary>` (thu gọn/mở rộng thuần CSS qua biến
      `group-open:rotate-180` cho mũi tên, không cần state/client component
      nào) — "Danh mục" (list chọn 1, ô vuông kiểu checkbox nhưng hành vi
      radio, tái dùng đúng logic category cũ), "Hãng sản xuất" (lưới 2 cột,
      hiện 6 hãng đầu + `<details>` lồng bên trong cho "Xem thêm" các hãng
      còn lại — vẫn thuần CSS, không JS), "Mức giá" (list mức giá cố định +
      form nhập khoảng giá tùy chỉnh, có input ẩn giữ lại category/brand/
      sort/search hiện tại khi submit).

      NÂNG CẤP THẬT đi kèm (không chỉ đổi giao diện): "Hãng sản xuất" đổi từ
      chọn ĐÚNG 1 hãng (như bộ lọc chip cũ) sang CHỌN ĐƯỢC NHIỀU HÃNG CÙNG
      LÚC (đúng ý nghĩa ô checkbox trong ảnh) — lưu dạng
      `?brand=apple,samsung` (nối bằng dấu phẩy) thay vì 1 slug. Sửa
      `GetProductsParams.brandSlug: string` (lib/products.ts) thành
      `brandSlugs?: string[]`, where-clause đổi từ `brand.slug` thành
      `brand.slug: { in: brandSlugs } }` (OR nhiều hãng); mỗi checkbox hãng
      trong sidebar là 1 `<Link>` tự tính href thêm/bớt đúng slug đó khỏi
      danh sách đang chọn (không cần JS vẫn toggle được nhờ tính href phía
      server dựa trên state hiện tại trong URL). `/api/products` (route.ts)
      cũng parse `brand` thành mảng qua `split(",")` cho đồng bộ. Trang
      /products/[slug] (sản phẩm liên quan) không đụng vì không dùng
      brandSlug filter.

      Đã test qua dev server (dùng DB thật, không mock): `tsc --noEmit`/
      `eslint`/`npm run build` sạch (đủ 85 route, không route nào đổi); HTML
      `/products` render đúng cả 3 tiêu đề nhóm "Bộ lọc tìm kiếm"/"Hãng sản
      xuất"/"Mức giá"; gọi `/api/products?brand=apple` trả đúng 5 sản phẩm
      toàn Apple, `/api/products?brand=apple,samsung` trả đúng hợp 8 sản
      phẩm (Apple ∪ Samsung, không lẫn hãng khác) — xác nhận OR nhiều hãng
      hoạt động đúng; kết hợp `category=dien-thoai&brand=apple,samsung` trả
      đúng giao của cả 2 điều kiện; checkbox hãng đã chọn render đúng class
      `border-accent bg-accent/10` (trạng thái "đã chọn" hiện rõ). CHƯA tự
      xem qua trình duyệt thật bố cục sidebar/hiệu ứng thu gọn-mở rộng (môi
      trường không có màn hình) — nhờ user tự mở `npm run dev` xác nhận thị
      giác khớp ảnh mẫu đủ tốt, đặc biệt trên mobile (sidebar xếp trên lưới
      sản phẩm, chưa test kỹ responsive ở màn hình rất nhỏ).

- [x] Admin thêm danh mục (user hỏi "có được không, nếu không thì thêm chức
      năng ấy"). TRẢ LỜI: tính năng NÀY ĐÃ CÓ SẴN từ trước (mục "Admin quản
      lý User/Category/Brand" ở trên) — /admin/categories/new vẫn hoạt động
      bình thường, kể cả chọn danh mục cha. Nhưng rà lại phát hiện 1 LỖ HỔNG
      THẬT phát sinh do thay đổi cấu trúc category gần đây (mục "Cho phép
      chọn RIÊNG từng tên trong 1 dòng danh mục gộp" — lần đầu tiên dự án có
      category CON): dropdown "Danh mục cha" ở CategoryForm trước đó liệt kê
      TOÀN BỘ 75 category (kể cả 52 category con) làm lựa chọn cha — admin
      có thể vô tình chọn 1 category CON làm cha cho category mới, tạo ra
      cấp thứ 3. Toàn bộ phần còn lại của app (mega menu
      `getActiveCategoriesWithChildren()`, lọc theo danh mục cha ở
      `getProducts()`) chỉ tra ĐÚNG 1 cấp `children`, không đệ quy — category
      cấp 3 đó sẽ tồn tại trong DB nhưng biến mất khỏi mega menu và khỏi kết
      quả duyệt danh mục cha, một dạng lỗi ngầm rất khó phát hiện bằng mắt.

      Đã sửa 3 lớp:
      1. admin/categories/new/page.tsx và admin/categories/[id]/edit/page.tsx:
         dropdown "Danh mục cha" giờ CHỈ liệt kê category CẤP CAO NHẤT
         (`where: { parentId: null }`) — không thể chọn category con làm cha
         qua UI nữa.
      2. lib/categories.ts: thêm `assertValidParent()` dùng CHUNG cho cả
         `createCategory()`/`updateCategory()` — validate lại ở SERVER (không
         tin dropdown đã lọc đúng, phòng trường hợp gọi thẳng API bỏ qua UI):
         chặn chọn 1 category đã CÓ parentId làm cha (409 "chỉ hỗ trợ tối đa
         2 cấp"). `updateCategory()` thêm chặn thứ 2: không cho gán parentId
         cho 1 category ĐANG LÀ CHA của category khác (childCount > 0) — nếu
         không, top-level category đang có con sẽ tự nhiên "chui" xuống làm
         con của category khác, biến các con hiện tại của nó thành cháu (cấp
         3) một cách âm thầm.
      3. lib/categories.ts `getAllCategoriesForAdmin()`: đổi từ trả về 1
         mảng phẳng sort theo `sortOrder+name` TOÀN CỤC (với 75 dòng, cách
         sort này trộn lẫn ngẫu nhiên category con của các cha khác nhau,
         gần như không đọc được) sang trả về ĐÚNG THỨ TỰ cha-rồi-tới-các-con
         (thêm field `depth`: 0 = cấp cao, 1 = con). admin/categories/page.tsx
         thụt lề + thêm ký hiệu "↳" cho category con dựa vào `depth`.

      Đã test qua dev server (tạo 1 SUPER_ADMIN test tạm + gọi thẳng API,
      không đụng dữ liệu thật): tạo 1 category cấp cao mới thành công, tạo 1
      category con hợp lệ dưới nó thành công; cố tạo cấp thứ 3 (chọn category
      con vừa tạo làm cha cho category khác) bị chặn đúng 409; cố PATCH biến
      1 category ĐANG LÀ CHA (dien-thoai) thành con bị chặn đúng 409 "không
      thể biến nó thành danh mục con"; trang /admin/categories render đúng
      thứ tự cha ngay trên các con của nó kèm ký hiệu "↳" (xác nhận qua grep
      HTML thật). `tsc --noEmit`/`eslint`/`npm run build` sạch. Đã xóa sạch 2
      category test + user/session test tạo ra lúc test (kể cả 1 user tạo dư
      do lần chạy script test đầu tiên bị lỗi giữa chừng).

- [x] Đơn giản hóa lại toàn bộ hệ thống danh mục + bộ lọc (user yêu cầu sau
      khi thấy 75 category quá rối): "bỏ danh mục và cái hãng sản xuất chỉ
      được chọn 1" trong bộ lọc /products, "sửa lại cái danh mục chỉ giữ lại
      điện thoại, laptop, điện máy và phụ kiện", và mega menu hover 1 category
      (vd Điện thoại) phải hiện thêm "danh mục con" kiểu iPhone/Samsung...

      1. QUAY VỀ ĐÚNG 4 DANH MỤC PHẲNG: viết lại hoàn toàn prisma/seed.ts —
         bỏ hẳn cấu trúc `CATEGORY_GROUPS` (20 nhóm cấp cao + 52 category
         con dùng parentId, làm ở 2 mục "Mở rộng...9 danh mục"/"Tách...23
         danh mục" trước đó), chỉ còn 4 category tạo trực tiếp: Điện thoại,
         Laptop, **Điện máy** (mới thêm lại — dùng làm danh mục TỔNG cho mọi
         thiết bị điện tử/gia dụng không phải điện thoại/laptop/phụ kiện,
         đúng nghĩa "điện máy" ngoài đời như siêu thị Điện Máy Xanh), Phụ
         kiện. Toàn bộ 34 sản phẩm được gán lại categoryId vào 1 trong 4 mục
         này (Điện thoại: 4 điện thoại; Laptop: 3 laptop; Phụ kiện: tai nghe/
         chuột/router/camera an ninh — đồ phụ kiện/ngoại vi nhỏ gọn, 5 sản
         phẩm; Điện máy: toàn bộ 22 sản phẩm còn lại — tivi/tủ lạnh/máy giặt/
         đồng hồ/tablet/PC-màn hình/máy in/đồ gia dụng bếp/robot hút bụi/máy
         lọc không khí...). Sau khi gán lại xong, script tự xóa (deleteMany)
         toàn bộ 52 category con (`parentId != null`) rồi tới 20 category
         nhóm cũ theo đúng slug — thứ tự bắt buộc phải xóa CON TRƯỚC vì
         parentId là quan hệ optional (mặc định `onDelete: SetNull`, không
         cascade), xóa cha trước sẽ khiến con mồ côi thành category cấp cao
         mới thay vì bị xóa theo. Đã chạy `npx prisma db seed --config
         prisma7.config.ts` áp thật lên Supabase — xác nhận qua script Node
         query trực tiếp: đúng 4 category (Điện thoại 5*/Laptop 3/Điện máy
         22/Phụ kiện 5 sản phẩm — *5 vì còn 1 sản phẩm test cũ "samsung s21
         max" sót lại từ phiên trước, xem ghi chú cuối mục), không còn
         category con nào.

         GIỮ NGUYÊN (không xóa): field `Category.parentId` trong schema và
         toàn bộ cơ chế cha/con ở lib/categories.ts (`assertValidParent()`,
         chặn biến 1 category đang có con thành con của cái khác, dropdown
         "Danh mục cha" ở admin chỉ cho chọn cấp cao nhất, `getAllCategories
         ForAdmin()` trả về kèm `depth` để admin/categories thụt lề) — đây
         là NĂNG LỰC CHUNG của admin CRUD category, không phải dữ liệu cụ
         thể của lần seed này, admin vẫn có thể tự tạo category con qua UI
         sau này nếu muốn. CHỈ xóa `getActiveCategoriesWithChildren()` (lib/
         categories.ts) vì hàm này SINH RA riêng cho mega menu hiển thị
         children — không còn nơi nào gọi sau khi Header quay lại dùng
         `getActiveCategories()` (phẳng) và CategoryMegaMenu bỏ hẳn logic
         tách nhiều tên trong 1 dòng.

      2. BỘ LỌC /products (FilterSidebar.tsx): xóa hẳn `<Section
         title="Danh mục">` — trang /products giờ chỉ còn điều hướng vào 1
         category qua mega menu/link sản phẩm, không có UI đổi category
         ngay trong bộ lọc nữa (page.tsx bỏ fetch `getActiveCategories()`
         và props `categories`/`selectedCategory` truyền cho sidebar, nhưng
         VẪN đọc đúng `?category=` từ URL để lọc sản phẩm — chỉ bỏ Ô CHỌN,
         không bỏ khả năng lọc). "Hãng sản xuất" đổi lại từ multi-select
         (mới thêm ở lần trước) về ĐÚNG 1 lựa chọn tại 1 thời điểm: bấm 1
         hãng sẽ THAY THẾ hoàn toàn hãng đang chọn (không cộng dồn), bấm lại
         đúng hãng đang chọn thì bỏ chọn — sửa trong `brandHref()` của
         FilterSidebar, không cần đổi lại `lib/products.ts` (vẫn giữ
         `brandSlugs: string[]` ở tầng data vì OR nhiều hãng vẫn là code
         đúng/vô hại, chỉ tầng UI không bao giờ gửi quá 1 phần tử nữa).

      3. MEGA MENU (CategoryMegaMenu.tsx): viết lại đơn giản hơn hẳn — cột
         trái giờ là list phẳng 4 category (bỏ hẳn logic render nhiều tên
         con trong 1 dòng vì không còn category con nào). Panel bên phải đổi
         tên từ "Thương hiệu {category}" thành **"Danh mục con"** theo đúng
         yêu cầu — dữ liệu vẫn là brand THẬT đang có sản phẩm trong category
         đó (tái dùng nguyên `getBrandsByCategory()` đã có sẵn, KHÔNG bịa
         thêm bảng category con mới): hover "Điện thoại" hiện đúng "Apple,
         OPPO, Samsung, Xiaomi" — khớp ví dụ user đưa ra ("iphone, samsung").
         QUYẾT ĐỊNH PHẠM VI: không tạo 2 danh sách riêng biệt "Thương hiệu"
         VÀ "Danh mục con" (dù user dùng chữ "ngoài thương hiệu thì thêm
         vào") vì dữ liệu thật của dự án không có khái niệm product-line
         (vd "dòng iPhone" tách biệt khỏi "hãng Apple") để lấp đầy 1 danh
         sách thứ 2 mà không trùng lặp y hệt danh sách brand — gộp làm 1,
         đổi tên cho đúng ý người dùng thay vì hiện 2 khối giống hệt nhau.

      Đã test qua dev server (dùng DB thật, không mock): `tsc --noEmit`/
      `eslint`/`npm run build` sạch; script Node xác nhận đúng 4 category
      không còn category con; trang chủ hiện đúng 4 thẻ danh mục (grep
      `category=dien-thoai|laptop|dien-may|phu-kien`, không còn category
      nào khác); mega menu hiện đúng chữ "Danh mục con"; `/products` không
      còn chữ "Tất cả danh mục" (xác nhận đã bỏ Section); link hãng trong
      sidebar luôn dạng `?brand=<1-slug>` (không bao giờ có dấu phẩy nối
      nhiều hãng); `/api/products?category=dien-may` trả đúng 22, kết hợp
      thêm `&brand=samsung` trả đúng 2 (Tab S9 + Tivi Samsung); script Node
      group brand-theo-category xác nhận đúng: dien-thoai→Apple/OPPO/
      Samsung/Xiaomi, laptop→Apple/Asus/Dell, phu-kien→Apple/JBL/Logitech/
      TP-Link/Xiaomi, dien-may→8 hãng đồ gia dụng/điện tử còn lại.

      LƯU Ý NGOÀI LỀ (đã báo cho user, chưa xóa vì không phải yêu cầu của
      lần này): DB có 1 sản phẩm rác từ phiên trước "samsung s21 max" (tên
      viết thường, gán brandId Apple — rõ ràng là dữ liệu test cũ bị sót lại
      khi thao tác thủ công, không phải bug hay dữ liệu seed) đang nằm
      trong danh mục Điện thoại — không đụng vào vì nằm ngoài phạm vi yêu
      cầu, đã nhắc lại để user tự quyết định có xóa hay không.

- [x] Xóa sản phẩm rác "samsung s21 max" sót lại từ phiên trước (user xác
      nhận xóa) — đã kiểm tra kỹ trước khi xóa (đúng nguyên tắc "không tin
      ràng buộc DB tự chặn" đã áp dụng xuyên suốt dự án): xác nhận KHÔNG có
      OrderItem nào tham chiếu tới variant của sản phẩm này (nếu có sẽ KHÔNG
      xóa, giữ nguyên như logic deleteVariant() ở lib/variants.ts) trước khi
      xóa theo đúng thứ tự CartItem/WishlistItem/Review liên quan/
      ProductAttribute/ProductImage/ProductVariant rồi mới tới Product. DB
      giờ đúng 34 sản phẩm sạch (không còn dữ liệu test lẫn vào dữ liệu thật).

- [x] Bảng lọc theo thông số kỹ thuật RIÊNG cho từng danh mục (user yêu cầu
      "mỗi danh mục có 1 bảng filter riêng ấy kiểu thông số"). ĐÂY LÀ HƯỚNG
      NGƯỢC LẠI với quyết định phạm vi đã ghi ở mục "Thay bộ lọc chip ngang
      ở /products bằng sidebar" (lúc đó từ chối làm facet theo thông số vì
      dữ liệu ProductAttribute quá thưa/không đồng nhất) — lần này user chủ
      động yêu cầu lại nên đã làm, đồng thời bổ sung thêm dữ liệu attribute
      thật để facet có ý nghĩa thay vì chỉ dựa vào dữ liệu thưa sẵn có.

      KHÔNG hard-code danh sách thông số theo từng category (vd không tự
      quyết "Điện thoại phải có RAM/ROM/Hệ điều hành") — `getAttributeFacets
      (categorySlug)` (lib/products.ts, cache theo PRODUCTS_TAG như
      getBrandsByCategory) suy ra HOÀN TOÀN từ dữ liệu ProductAttribute thật
      của các sản phẩm ACTIVE trong danh mục đó: group theo `attrName`, tính
      danh sách giá trị khác nhau + số sản phẩm mỗi giá trị, CHỈ giữ lại
      attrName nào xuất hiện ở >= 2 sản phẩm khác nhau (attrName chỉ 1 sản
      phẩm có thì lọc theo nó vô nghĩa — chắc chắn ra đúng 1 kết quả, thường
      do sản phẩm khác trong cùng danh mục có thông số không đồng nhất).

      Đã BỔ SUNG THÊM dữ liệu attribute thật cho 4 điện thoại (RAM, Bộ nhớ
      trong, Hệ điều hành) và 3 laptop (RAM, Ổ cứng, Hệ điều hành) trong
      prisma/seed.ts để 2 danh mục quan trọng nhất có facet phong phú, nhiều
      giá trị thật để lọc (vd RAM điện thoại: 8GB x3/12GB x1; Hệ điều hành:
      iOS 17/Android 13/Android 14). KHÔNG bịa thêm cho "Điện máy"/"Phụ
      kiện" (giữ nguyên attribute thưa sẵn có) vì đây là 2 danh mục TỔNG gộp
      nhiều loại thiết bị khác hẳn nhau (tivi/tủ lạnh/máy giặt/gia dụng —
      xem quyết định phạm vi ở mục "Đơn giản hóa lại danh mục" phía trên),
      ép mọi sản phẩm phải có cùng bộ thông số giả sẽ vô nghĩa/không trung
      thực với dữ liệu thật — kết quả: "Điện máy" vẫn TỰ NHIÊN có đúng 3
      facet thật sự dùng chung được giữa nhiều sản phẩm (Kích thước — tivi,
      Thể tích — nồi/nồi áp suất/nồi chiên, Watt — máy sấy tóc/máy nước
      nóng/máy xay), phần còn lại (thông số riêng của từng loại thiết bị,
      chỉ 1 sản phẩm có) tự động bị lọc bỏ theo ngưỡng >= 2 sản phẩm ở trên
      — không cần code riêng cho từng category, cơ chế chung tự xử lý đúng.

      LỖI TIỀM ẨN đã chủ động sửa ngay trong seed.ts (rút kinh nghiệm từ lỗi
      `update: {}` no-op đã gặp nhiều lần với categoryId trước đây):
      ProductAttribute không có unique key tự nhiên nên không upsert được
      từng dòng — đổi cách đồng bộ: xóa hết attribute cũ của sản phẩm rồi
      tạo lại đúng theo mảng `attributes` trong code, áp dụng cho MỌI sản
      phẩm mỗi lần chạy seed (không chỉ lúc tạo mới) — nếu chỉ set
      `attributes: { create: ... }` trong nhánh `create` như bản cũ, sửa/
      thêm attribute cho sản phẩm ĐÃ TỒN TẠI sẽ không có tác dụng gì.

      lib/products.ts: `GetProductsParams` thêm `attributeFilters?:
      Record<string, string[]>` (key = attrName thật, value = danh sách giá
      trị được chọn). Where-clause dùng `AND: [{ attributes: { some: {
      attrName, attrValue: { in: values } } } }, ...]` — BẮT BUỘC dùng mảng
      `AND` thay vì gộp chung 1 khóa `attributes` trong object literal, vì
      nhiều điều kiện `attributes: {...}` viết liên tiếp trong 1 object sẽ
      bị GHI ĐÈ (JS object chỉ giữ key cuối), phải tách thành nhiều phần tử
      mảng để Prisma AND đúng nhiều điều kiện trên CÙNG 1 quan hệ (AND giữa
      các attrName khác nhau, OR giữa các giá trị trong CÙNG 1 attrName).

      MÃ HÓA URL: mỗi facet 1 query riêng `spec_<slug-attrName>=<slug-giá-
      trị-1,slug-giá-trị-2>` (vd `spec_ram=8gb,12gb`) — slug hóa cả tên
      thuộc tính lẫn giá trị (dùng slugify cục bộ trong products.ts, theo
      đúng phong cách project đã dùng slugify riêng ở từng file thay vì 1
      util dùng chung — xem CategoryForm/BrandForm/ProductForm). Trang
      /products/page.tsx đổi kiểu `searchParams` từ liệt kê field cố định
      sang `Record<string, string | undefined>` GENERIC vì tên query
      "spec_*" giờ động theo từng danh mục, không khai báo trước được; giải
      mã lại thành `{ attrName thật: [giá trị thật] }` dựa vào facet đã tính
      (`getAttributeFacets`) trước khi gọi `getProducts()`. `currentFilters`
      cũng đổi thành TOÀN BỘ query hiện tại (trừ `page`) thay vì liệt kê 6
      field cố định như trước — cần thiết để giữ lại đúng mọi `spec_*` đang
      chọn khi bấm đổi 1 filter khác (brand/giá).

      FilterSidebar.tsx: mỗi facet 1 `<Section title={facet.attrName}>`
      riêng (đặt sau "Mức giá", chỉ hiện khi có category — không hiện ở
      "Tất cả sản phẩm" vì thông số điện thoại/máy giặt không liên quan gì
      nhau). Mỗi thông số CHO CHỌN NHIỀU giá trị cùng lúc (OR, vd chọn cả
      8GB lẫn 12GB) — khác "Hãng sản xuất" (chỉ chọn 1, theo yêu cầu trước
      đó) vì đây là hành vi faceted-search chuẩn, người dùng thường muốn
      xem gộp vài mức cùng lúc. Form nhập khoảng giá tùy chỉnh đổi từ liệt
      kê hidden input cố định (category/brand/sort/search) sang lặp qua
      TOÀN BỘ currentFilters — nếu không, submit form giá sẽ vô tình xóa mất
      mọi spec_* đang chọn (tên field động, không liệt kê tay được).

      QUYẾT ĐỊNH PHẠM VI: KHÔNG cập nhật `/api/products` (route.ts) để hỗ
      trợ `spec_*` — route này KHÔNG được trang /products dùng (page.tsx
      gọi thẳng `getProducts()` ở server, không fetch qua API riêng), chỉ
      tồn tại như 1 API JSON độc lập cho mục đích khác (test/tích hợp
      ngoài) — thêm hỗ trợ cho route này không phục vụ được UI thật nào nên
      không làm để tránh code thừa.

      Đã test qua dev server (dùng DB thật, không mock): `tsc --noEmit`/
      `eslint`/`npm run build` sạch; script Node xác nhận đúng 34 sản phẩm
      (đã trừ sản phẩm rác), đúng 12 attribute RAM/ROM/Hệ điều hành cho 4
      điện thoại; trang `/products?category=dien-thoai` hiện đúng 3 section
      "RAM"/"Bộ nhớ trong"/"Hệ điều hành" kèm số lượng đúng (8GB (3), 12GB
      (1), 256GB (3), 128GB (1), Android 14 (2), Android 13 (1), iOS 17
      (1)); `/products?category=dien-may` hiện ĐÚNG 3 facet thật dùng chung
      được (Kích thước/Thể tích/Watt), không hiện các thông số chỉ 1 sản
      phẩm có; lọc `spec_ram=8gb` loại đúng Samsung (12GB) khỏi kết quả;
      chọn `spec_ram=8gb,12gb` (OR) trả đủ cả 4; kết hợp `spec_ram=8gb` VÀ
      `spec_he-dieu-hanh=android-14` (AND giữa 2 thông số) trả ĐÚNG 1 kết
      quả (OPPO); checkbox hiện đúng trạng thái "đã chọn" khi có query
      tương ứng. CHƯA tự xem qua trình duyệt thật (môi trường không có màn
      hình) — nhờ user tự mở `npm run dev` xác nhận thị giác/thao tác chọn
      nhiều checkbox cùng lúc mượt mà.

- [x] Tách bộ chọn "Phiên bản" (gộp chung màu+dung lượng thành 1 nút kiểu
      "Titan Xanh / 256GB") thành 2 bộ chọn ĐỘC LẬP "Màu sắc" và "Dung
      lượng", và cho ảnh sản phẩm đổi theo màu đang chọn (user yêu cầu sau
      khi được demo thêm variant ở mục "Admin tạo/sửa/xóa variant sản phẩm").
      Trước khi làm, đã thêm 1 variant demo trực tiếp vào DB thật cho Xiaomi
      Redmi Note 13 (biến thể thứ 2 "Xanh Dương/256GB", bên cạnh "Đen/128GB"
      có sẵn) để user xem trước UI cũ, giờ nâng cấp tiếp lên UI mới trên
      cùng sản phẩm này.

      KHÔNG cần đổi schema — `ProductImage.variantId` (optional) đã có sẵn
      từ đầu dự án nhưng CHƯA TỪNG được dùng tới (mọi ảnh sản phẩm trước giờ
      đều gắn `variantId: null`, tức ảnh chung cho cả sản phẩm bất kể chọn
      biến thể nào) — đây là lần đầu tiên tận dụng field này.

      src/app/products/[slug]/ProductGalleryAndBuy.tsx (viết lại phần chọn
      biến thể):
      - `colors` = danh sách màu KHÁC NHAU suy từ toàn bộ variant (không phụ
        thuộc dung lượng).
      - `storagesForColor` = danh sách dung lượng CHỈ tính trong số variant
        thuộc ĐÚNG màu đang chọn — vì dữ liệu thật thường không phải ma
        trận đầy đủ (vd chỉ có "Đen/128GB" và "Xanh Dương/256GB", KHÔNG có
        "Đen/256GB") — nếu hiện tất cả dung lượng toàn cục sẽ cho chọn được
        tổ hợp không tồn tại. Bấm đổi màu (`handleSelectColor`) tự kiểm tra
        dung lượng đang chọn có còn hợp lệ với màu mới không, nếu không thì
        tự chuyển sang dung lượng đầu tiên hợp lệ của màu đó — đảm bảo LUÔN
        có 1 variant khớp, không bao giờ rơi vào trạng thái "không tìm thấy
        biến thể nào khớp".
      - `selectedVariant` suy ra từ cặp (màu, dung lượng) đang chọn thay vì
        là 1 state độc lập như bản cũ (chọn thẳng theo variant.id) — đơn
        giản hóa: chỉ còn 2 nguồn sự thật (màu, dung lượng), variant luôn
        là kết quả TÍNH RA từ 2 cái đó, không thể lệch pha.
      - Ảnh hiển thị: lọc `images` theo `variantId` thuộc bất kỳ variant nào
        CÙNG MÀU đang chọn (không cứng nhắc chỉ đúng 1 variant/dung lượng cụ
        thể — vì ảnh sản phẩm thực tế đổi theo màu, không đổi theo dung
        lượng); nếu màu đó chưa có ảnh riêng nào (variantId toàn null), rơi
        về đúng bộ ảnh chung của sản phẩm như hành vi cũ (không vỡ hiển thị
        với 32/34 sản phẩm còn lại chưa có ảnh gắn theo variant).

      src/app/products/[slug]/page.tsx: thêm `variantId: img.variantId` khi
      map `product.images` truyền xuống component (trước đó chỉ truyền
      `url`/`altText`).

      DEMO TRỰC QUAN: đã thêm 2 `ProductImage` mới cho 2 variant của Xiaomi
      Redmi Note 13 qua script (ảnh placehold.co nền đen chữ "Redmi Note 13
      Đen" cho variant Đen, nền xanh dương chữ "...Xanh Dương" cho variant
      Xanh Dương) để user thấy rõ ảnh đổi thật khi bấm đổi màu — 32 sản phẩm
      còn lại KHÔNG có ảnh theo variant (giữ nguyên ảnh chung như trước, chỉ
      đổi UI thành 2 mục chọn tách riêng, không có gì để "đổi ảnh" vì chưa
      gán ảnh riêng cho biến thể nào của chúng — đây không phải thiếu sót,
      admin có thể tự gán sau này qua tính năng upload ảnh có sẵn nếu muốn
      cho biến thể nào đó ảnh riêng, hiện ProductForm.tsx admin chưa có ô
      chọn "gắn ảnh này cho biến thể nào" nên phải làm qua script/Prisma
      Studio như demo này).

      Đã test qua dev server (xóa `.next` trước vì thêm dữ liệu trực tiếp
      qua script, dùng DB thật): `tsc --noEmit`/`eslint`/`npm run build`
      sạch; `/products/xiaomi-redmi-note-13` hiện đúng 2 mục "Màu sắc"
      (Đen/Xanh Dương) và "Dung lượng" (chỉ hiện "128GB" khi đang chọn màu
      Đen — đúng lọc theo màu, không lộ "256GB" của màu khác); ảnh mặc định
      đúng là ảnh riêng của màu Đen; `/products/airpods-pro-2` (sản phẩm chỉ
      có 1 biến thể, dung lượng null) hiện đúng CHỈ mục "Màu sắc" (1 nút
      "Trắng"), KHÔNG hiện mục "Dung lượng" thừa; `/products/iphone-15-pro-max`
      (2 biến thể, mỗi màu có dung lượng khác nhau y hệt Xiaomi) vẫn 200 và
      dữ liệu cả 2 tổ hợp đều đúng. CHƯA tự xem qua trình duyệt thật việc
      bấm đổi màu có chuyển ảnh mượt/đúng lúc không (môi trường không có màn
      hình) — nhờ user tự mở `npm run dev` bấm thử qua lại giữa 2 màu trên
      trang Xiaomi Redmi Note 13 để xác nhận ảnh đổi đúng.

- [x] Nâng "Màu sắc"/"Dung lượng" lên ĐỘC LẬP HOÀN TOÀN về giao diện (user
      hỏi lại ngay sau mục trên: "có thể sửa code để chọn màu riêng và chọn
      dung lượng riêng không"). Bản vừa làm ở trên vẫn còn 1 điểm chưa thật
      "riêng": danh sách dung lượng bị ẨN BỚT tùy theo màu đang chọn (màu
      "Đen" chỉ hiện đúng 1 nút "128GB", không thấy "256GB" đâu cả) — nhìn
      như 2 chiều vẫn còn ràng buộc nhau. Đổi cách làm đúng theo UX chuẩn
      của các trang bán điện thoại thật (Apple/Samsung...): CẢ 2 danh sách
      màu và dung lượng đều LUÔN hiện ĐỦ toàn bộ lựa chọn có trong dữ liệu
      (không ẩn/bớt nút nào cả) — người dùng bấm vào bên nào trước cũng
      được, không có thứ tự bắt buộc.

      Cái duy nhất còn "phụ thuộc" là TRẠNG THÁI của từng nút dung lượng:
      nút nào tạo thành tổ hợp (màu đang chọn, dung lượng đó) mà KHÔNG khớp
      variant thật nào trong DB sẽ tự động hiện mờ + gạch ngang +
      `disabled` (không bấm được, có `title` giải thích lý do khi rê chuột)
      — bắt buộc phải giữ lại ràng buộc này vì dữ liệu thật không phải ma
      trận đầy đủ (Xiaomi Redmi Note 13 chỉ có đúng 2 variant thật: "Đen/
      128GB" và "Xanh Dương/256GB", không hề có "Đen/256GB" hay "Xanh
      Dương/128GB" — cho chọn được các tổ hợp đó sẽ dẫn tới việc thêm vào
      giỏ hàng 1 SKU không tồn tại). `handleSelectColor()` vẫn tự tính lại
      xem dung lượng đang chọn còn hợp lệ với màu mới không, không hợp lệ
      thì tự chuyển sang dung lượng hợp lệ đầu tiên của màu đó — đảm bảo
      luôn có đúng 1 variant thật được chọn ngầm định, ngay cả khi người
      dùng chưa kịp bấm gì thêm sau khi đổi màu.

      Đã test qua dev server (dùng DB thật, không mock): `tsc --noEmit`/
      `eslint`/`npm run build` sạch; `/products/xiaomi-redmi-note-13` xác
      nhận CẢ 2 nút "128GB" và "256GB" cùng hiện ra dù đang chọn màu "Đen"
      (trước đó "256GB" bị ẩn hẳn) — nút "256GB" có đủ `disabled`, class mờ
      + gạch ngang, và `title="Không có màu Đen cho dung lượng này"` (grep
      thấy đúng trong HTML render thật, không chỉ đọc code nguồn). CHƯA tự
      xem qua trình duyệt thật hiệu ứng mờ/gạch ngang có rõ ràng dễ hiểu
      không (môi trường không có màn hình) — nhờ user tự mở `npm run dev`
      xác nhận trực quan đủ rõ để người dùng hiểu vì sao nút đó không bấm
      được.

- [x] Thêm nút mũi tên trái/phải để chuyển ảnh trên gallery sản phẩm (user
      gửi ảnh chụp gallery thật của fptshop.com.vn có 2 nút tròn "‹"/"›" 2
      bên ảnh chính + số đếm "7/8" + dải thumbnail dưới). TRƯỚC ĐÓ CHƯA CÓ —
      gallery cũ chỉ chọn ảnh được qua bấm thumbnail phía dưới, không có nút
      điều hướng ngay trên ảnh chính.

      src/app/products/[slug]/ProductGalleryAndBuy.tsx: thêm
      `goToPrevImage()`/`goToNextImage()` (lùi/tiến 1 ảnh trong
      `displayImages`, tự vòng lại đầu/cuối danh sách bằng phép modulo thay
      vì dừng khựng ở 2 đầu), 2 nút tròn nền trắng mờ (`bg-white/90`) đặt
      `absolute` 2 bên mép ảnh chính (giữa theo chiều dọc), và 1 badge đếm
      "hiện tại/tổng" (`bg-black/60`, góc dưới-trái) — bố cục phỏng theo
      đúng ảnh mẫu, CHỈ hiện khi `displayImages.length > 1` (sản phẩm 1 ảnh
      không cần nút điều hướng). KHÔNG làm thêm các phần tử khác trong ảnh
      mẫu không thuộc phạm vi "ảnh sản phẩm" — tab "Video"/"Nổi bật"/"Mở
      hộp"/"Thực tế" và badge "360°" trong ảnh gốc là các LOẠI NỘI DUNG khác
      hẳn ảnh tĩnh thường (video quay sản phẩm, ảnh chụp thực tế người dùng
      gửi lên, mô hình xoay 360°...), không có model DB nào tương ứng và
      không phải điều user hỏi ("hiển thị nhiều ảnh... chuyển bằng nút") —
      không bịa thêm tính năng ngoài phạm vi được hỏi.

      DEMO: thêm 5 `ProductImage` mới (ảnh chung, `variantId: null`) cho
      Samsung Galaxy S24 Ultra qua script — đặt `altText` đúng "Ảnh 1".."Ảnh
      5" như user yêu cầu, dùng placehold.co 5 sắc độ tím khác nhau để phân
      biệt được từng ảnh khi bấm chuyển qua script/kiểm tra (không cần ảnh
      thật, chỉ cần thấy rõ ảnh có đổi hay không). Chọn sản phẩm này (thay
      vì Xiaomi Redmi Note 13 đã dùng demo màu/ảnh-theo-variant trước đó) vì
      nó CHƯA có ảnh gắn riêng theo variant nào — đảm bảo 5 ảnh demo luôn
      hiện đủ bất kể đang chọn màu "Đen" hay "Xám" (nếu dùng lại sản phẩm cũ,
      ảnh riêng-theo-màu đã gán trước đó sẽ ĐÈ MẤT 5 ảnh demo này theo đúng
      logic ưu tiên ảnh-theo-variant đã làm ở mục trước).

      Đã test qua dev server (xóa `.next` trước vì thêm dữ liệu qua script,
      dùng DB thật): `tsc --noEmit`/`eslint`/`npm run build` sạch;
      `/products/samsung-galaxy-s24-ultra` render đủ cả 5 ảnh demo, badge
      đếm hiện đúng "1/5" lúc mới vào trang, 2 nút mũi tên có đủ
      `aria-label="Ảnh trước"`/`"Ảnh tiếp theo"` trong HTML thật. CHƯA tự
      xem qua trình duyệt thật việc bấm nút có chuyển ảnh mượt + số đếm tăng
      giảm đúng vòng lặp không (môi trường không có màn hình) — nhờ user tự
      mở `npm run dev` bấm thử qua lại 2 nút trên trang Samsung Galaxy S24
      Ultra để xác nhận.

- [x] Thêm hiệu ứng chuyển ảnh mượt cho gallery (user thấy nút mũi tên ở
      mục trên chuyển ảnh "khựng" ngay lập tức, muốn mượt hơn). NGUYÊN NHÂN:
      bản trước chỉ dùng ĐÚNG 1 thẻ `<Image>`, đổi thẳng prop `src` mỗi lần
      bấm nút — trình duyệt phải tải/vẽ lại ảnh mới ngay lập tức, không có
      trạng thái chuyển tiếp nào để CSS transition bám vào.

      SỬA: xếp CHỒNG toàn bộ `displayImages` thành nhiều thẻ `<Image fill>`
      (mỗi ảnh tự động `position: absolute` phủ kín khung nhờ prop `fill`,
      nằm chồng lên nhau đúng vị trí), chỉ ảnh có index trùng
      `activeImageIndex` được `opacity-100`, còn lại `opacity-0` — kèm
      `transition-opacity duration-300 ease-in-out` nên đổi ảnh giờ là 1
      cú crossfade (mờ dần ảnh cũ + hiện dần ảnh mới trong 300ms) thay vì
      cắt khựng. Chỉ ảnh đầu tiên (`i === 0`) được đánh dấu `priority`
      (React/Next.js chỉ nên ưu tiên tải trước 1 ảnh, không phải tất cả).

      ĐÁNH ĐỔI CÓ CHỦ Ý: vì mọi ảnh trong `displayImages` đều được render
      (chỉ ẩn bằng opacity, không unmount) nên trình duyệt tải HẾT toàn bộ
      ảnh của gallery ngay từ đầu thay vì tải dần từng ảnh khi lướt tới —
      chấp nhận được vì gallery 1 sản phẩm thường chỉ vài ảnh (không đáng kể
      so với lợi ích không bị giật khi chuyển ảnh). KHÔNG làm hiệu ứng trượt
      ngang (slide theo hướng bấm trái/phải) vì cần theo dõi thêm chiều
      chuyển động + có thể cần thư viện animation riêng (Framer Motion...)
      để mượt thật sự — chỉ dùng CSS thuần (`transition-opacity` có sẵn của
      Tailwind) cho hiệu ứng mờ dần, đúng tinh thần dự án ưu tiên không thêm
      dependency mới khi chưa thật cần thiết.

      Đã test qua dev server (dùng DB thật, không mock, tái sử dụng đúng 5
      ảnh demo "Ảnh 1".."Ảnh 5" đã thêm ở mục trên): `tsc --noEmit`/
      `eslint`/`npm run build` sạch; `/products/samsung-galaxy-s24-ultra`
      xác nhận có đủ 2 class `opacity-100`/`opacity-0` xuất hiện trong HTML
      thật (đúng 1 ảnh active, còn lại ẩn) và class
      `transition-opacity duration-300 ease-in-out` có mặt đúng trên từng
      thẻ ảnh. CHƯA tự xem qua trình duyệt thật hiệu ứng mờ dần có mượt/rõ
      ràng không (môi trường không có màn hình) — nhờ user tự mở
      `npm run dev` bấm nút chuyển ảnh để cảm nhận trực tiếp.

- [x] Rà soát lỗ hổng NGHIỆP VỤ (user yêu cầu chủ động) — tìm được 6 vấn đề,
      user chọn sửa 2 cái sau (còn lại ghi nhận, chưa sửa vì cần quyết định
      chính sách hoặc không có "fix code" thật sự):

      1. [Nghiêm trọng, KHÔNG sửa được bằng code] `lib/momo.ts` dùng bộ test
         credentials CÔNG KHAI do MoMo tự công bố — ai đọc tài liệu MoMo
         cũng tính được chữ ký hợp lệ, có thể tự gọi thẳng
         `/api/payments/momo/ipn` đánh dấu bất kỳ đơn MoMo nào của họ thành
         PAID mà không cần trả tiền. Không phải bug code (code làm đúng
         theo tài liệu MoMo) — chỉ hết khi nào có tài khoản merchant MoMo
         thật với secret riêng không công bố. CHƯA sửa.
      2. **[Đã sửa]** Không kiểm tra lại `variant.isActive`/`product.status`
         lúc tạo đơn — chỉ chặn lúc thêm vào giỏ.
      3. [Cao, CHƯA sửa] Không có kiểm soát tồn kho — model `Inventory` có
         sẵn trong schema nhưng chưa từng dùng, cần quyết định chính sách
         trước khi làm (có tồn kho theo cửa hàng hay theo tổng? trừ lúc đặt
         hay lúc giao?).
      4. [Trung bình, CHƯA sửa] Trả hàng (RETURNED) không hoàn tác điểm
         thành viên/vô hiệu hóa bảo hành đã cấp — cần quyết định chính sách.
      5. **[Đã sửa]** Đơn hàng "mồ côi" nếu tạo `paymentUrl` MoMo thất bại.
      6. [Thấp, CHƯA sửa] Giá đọc trước khi mở transaction lúc tạo đơn — cửa
         sổ race rất hẹp, rủi ro thực tế thấp.

      CHI TIẾT 2 CÁI ĐÃ SỬA:

      **Sửa #2 — kiểm tra lại tình trạng sản phẩm NGAY TRONG transaction tạo
      đơn** (lib/orders.ts, `createOrderFromCart`): thêm bước đọc lại
      `tx.productVariant.findMany(...)` (qua `tx`, không phải `prisma`, để
      nằm trong CÙNG transaction, không hở giữa lúc kiểm tra và lúc ghi đơn)
      ngay đầu transaction — nếu bất kỳ item nào trong giỏ có variant đã bị
      ẩn (`isActive: false`) HOẶC sản phẩm đã ngừng bán
      (`product.status !== ACTIVE`), ném lỗi rõ ràng nêu tên + màu/dung
      lượng sản phẩm, chặn tạo đơn ngay từ đầu (rollback toàn bộ transaction
      — giỏ hàng không bị xóa, coupon không bị trừ lượt).

      **Sửa #5 — không để "mất dấu" đơn hàng nếu bước lấy `paymentUrl` MoMo
      thất bại**: trước đó `POST /api/orders` gọi `createOrderFromCart()`
      (transaction ĐÃ commit: đơn+payment+lịch sử tạo xong, giỏ đã xóa) rồi
      NGAY SAU ĐÓ gọi `generatePaymentUrlForOrder()` (1 lệnh gọi HTTP riêng
      sang MoMo) — nếu bước 2 lỗi (mạng, MoMo tạm gián đoạn), route cũ trả
      thẳng lỗi 400 như thể CẢ VIỆC ĐẶT HÀNG thất bại, trong khi thực ra đơn
      đã nằm trong DB và giỏ đã trống — khách hoang mang tưởng chưa đặt
      được, mất dấu đơn hàng vừa tạo. Đã tách `try/catch` riêng cho từng
      bước: lỗi ở bước 1 (tạo đơn) mới trả 400 thật; lỗi ở bước 2 (lấy
      paymentUrl) trả **201** kèm `id`/`code` đơn hàng + `paymentUrl: null` +
      `paymentUrlError` — CheckoutForm.tsx nhận diện `paymentUrlError` để
      điều hướng sang `/orders/[id]?payment=link_failed` (cờ MỚI, tách biệt
      với `?payment=failed` cũ — cờ cũ dùng khi MoMo trả kết quả THẤT BẠI rõ
      ràng, còn cờ mới dùng khi CHƯA KỊP tạo được link thanh toán, ý nghĩa
      khác nhau) thay vì chỉ hiện lỗi rồi dừng. orders/[id]/page.tsx thêm
      banner riêng cho `link_failed` giải thích rõ "đơn đã tạo, chưa mất,
      bấm Thanh toán lại bên dưới" — nút "Thanh toán lại" (RetryPaymentButton,
      có sẵn từ trước cho Payment PENDING/FAILED) tự động hoạt động đúng vì
      Payment vẫn ở trạng thái PENDING sau lỗi này.

      Đã test qua dev server bằng DB thật (tạo 1 customer + session test
      riêng, không đụng dữ liệu thật, xóa sạch sau khi xong):
      - Sửa #2: thêm sản phẩm thật vào giỏ, ẩn variant (`isActive: false`)
        qua script mô phỏng admin thao tác sau khi khách đã bỏ vào giỏ —
        đặt hàng bị chặn đúng 400 kèm đúng tên sản phẩm; bật lại variant —
        đặt hàng thành công (201, kiểm chứng KHÔNG bị chặn oan); lặp lại với
        `product.status = DISCONTINUED` thay vì ẩn variant — cũng bị chặn
        đúng 400. Cả 2 nhánh đều đã khôi phục lại ACTIVE sau khi test.
      - Sửa #5: dùng `.env.local` tạm trỏ `MOMO_ENDPOINT` sang địa chỉ không
        tồn tại (mô phỏng MoMo sập/mất mạng — cách đáng tin cậy hơn hẳn so
        với thử export biến môi trường qua shell, vốn KHÔNG propagate được
        vào tiến trình `next dev` chạy nền trong lần thử đầu) — đặt hàng
        MOMO trả đúng 201 kèm `paymentUrl: null` + `paymentUrlError:"fetch
        failed"`; kiểm tra thẳng DB xác nhận Order status PENDING, Payment
        MOMO status PENDING (không bị kẹt ở trạng thái lạ), giỏ hàng đã
        trống; tải `/orders/[id]?payment=link_failed` xác nhận đúng banner
        cảnh báo + nút "Thanh toán lại" cùng hiện; xóa `.env.local` khôi
        phục MoMo endpoint thật, bấm "Thanh toán lại"
        (`POST /api/orders/[id]/pay`) cho ĐÚNG đơn hàng "mồ côi" đó — nhận
        đúng `paymentUrl` thật lần này, xác nhận toàn bộ luồng khép kín
        không mất đơn. (Gặp 1 trục trặc lúc test không liên quan tới code:
        `pkill -f "next dev"` trên Git Bash/Windows không kill được tiến
        trình Next.js thật — server cũ vẫn chạy ngầm giữ nguyên
        MOMO_ENDPOINT hỏng trong bộ nhớ khiến lần thử lại đầu tiên vẫn thấy
        lỗi cũ; phải dùng `taskkill //PID <pid> //F` mới dứt điểm — ghi chú
        lại vì có thể gặp lại khi cần restart dev server nhiều lần trên máy
        Windows này).

      `tsc --noEmit`/`eslint`/`npm run build` sạch sau cả 2 sửa.

- [x] Làm tiếp #1 (MoMo secret công khai) và #3 (không kiểm soát tồn kho) từ
      danh sách 6 lỗ hổng nghiệp vụ đã rà soát ở mục trên — user xác nhận bỏ
      qua #4 (hoàn điểm/bảo hành khi trả hàng, cần quyết định chính sách).

      **#1 — MoMo dùng secret công khai (KHÔNG "sửa" được hoàn toàn, chỉ hạ
      thấp rủi ro):**
      1. `lib/momo.ts`: đổi so sánh chữ ký từ `===` sang
         `crypto.timingSafeEqual` (chống timing attack — đo thời gian phản
         hồi để dò dần từng ký tự chữ ký đúng), kèm check độ dài bằng nhau
         trước (bắt buộc vì `timingSafeEqual` throw nếu 2 buffer khác độ
         dài thay vì trả `false`).
      2. Thêm `isUsingPublicMomoTestCredentials()` — nhận diện đang chạy
         bằng bộ secret mặc định công khai (không phải merchant thật).
      3. `src/lib/rateLimit.ts` (mới): rate limit kiểu sliding-window đơn
         giản lưu trong bộ nhớ tiến trình (không dùng Redis) — áp cho CẢ 2
         route `/api/payments/momo/{return,ipn}` (30 request/5 phút/IP) để
         tăng chi phí cho việc dò brute-force `transactionRef` (thứ duy
         nhất một kẻ tấn công còn thiếu để giả mạo callback thành công, vì
         secret đã công khai). GIỚI HẠN ĐÃ BIẾT: trên Vercel serverless
         nhiều instance, mỗi instance giữ bộ đếm riêng nên KHÔNG chặn tuyệt
         đối — chỉ tăng đáng kể chi phí tấn công so với không có gì.
      4. `admin/orders/[id]/page.tsx`: thêm banner cảnh báo màu vàng khi có
         thanh toán MoMo đã PAID TRONG LÚC vẫn đang dùng secret công khai —
         admin không bị nhầm tưởng đó là tiền thật đã về tài khoản.

      Đã CHỦ ĐỘNG tự giả mạo 1 callback MoMo thành công bằng đúng secret
      công khai (viết script Node độc lập tự tính lại chữ ký HMAC-SHA256
      y hệt thuật toán trong lib/momo.ts) để CHỨNG MINH lỗ hổng vẫn tồn tại
      về bản chất đúng như đã báo cáo (không thể "vá hết" bằng code khi vẫn
      dùng secret công khai) — gọi thẳng `/api/payments/momo/return` với
      chữ ký tự tính, xác nhận: (1) callback giả VẪN được chấp nhận (redirect
      `?payment=success`, đúng dự đoán — timingSafeEqual chỉ chống dò kiểu
      timing-attack, không chặn được người đã BIẾT trước toàn bộ secret),
      (2) banner cảnh báo hiện đúng ở trang admin sau đó. Đồng thời xác nhận
      rate limit hoạt động: gọi liên tiếp 35 lần `/api/payments/momo/ipn` —
      30 lần đầu trả 400 (chữ ký rỗng không hợp lệ, đúng), từ lần thứ 31 trở
      đi tự động chuyển sang 429 đúng như thiết kế.

      **#3 — Kiểm soát tồn kho (feature mới, dùng model `Inventory` có sẵn
      trong schema nhưng chưa từng được dùng):**

      src/lib/inventory.ts (mới): tồn kho MVP — mỗi biến thể có 1 dòng
      Inventory RIÊNG tại MỖI cửa hàng, trừ kho NGAY LÚC TẠO ĐƠN (không tách
      2 bước "giữ chỗ rồi mới xuất kho thật" — field `reserved` có sẵn trong
      schema CỐ Ý không dùng tới, giữ nguyên = 0, đơn giản hóa cho quy mô
      demo). `reserveStockOrThrow()`: STORE_PICKUP trừ ĐÚNG kho của cửa hàng
      khách chọn nhận hàng (rõ ràng, không mơ hồ); HOME_DELIVERY thì dự án
      không có khái niệm "kho trung tâm" riêng nên coi CỬA HÀNG ĐẦU TIÊN
      (sort theo `id` để LUÔN ra cùng 1 cửa hàng mỗi lần gọi, không phụ
      thuộc thứ tự trả về ngẫu nhiên của DB) trong số cửa hàng đang hoạt
      động là kho tổng dùng chung — nếu không còn cửa hàng active nào thì
      BỎ QUA kiểm tra tồn kho (fail-open) thay vì chặn cứng toàn bộ
      HOME_DELIVERY, tránh 1 cấu hình thiếu sót làm sập cả luồng đặt hàng.
      `releaseStock()`: hoàn kho khi hủy đơn, tính lại ĐÚNG cùng 1 cửa hàng
      bằng lại đúng hàm suy luận trên (không cần lưu thêm field nào mới vì
      kết quả suy luận luôn ổn định — deliveryMethod/pickupStoreId của đơn
      không đổi sau khi tạo, nên luôn ra đúng lại cửa hàng đã trừ ban đầu).

      lib/orders.ts: `createOrderFromCart()` gọi `reserveStockOrThrow()`
      NGAY TRONG transaction tạo đơn, SAU KHI đã biết chắc `pickupStoreId`
      (STORE_PICKUP) và TRƯỚC khi tạo đơn — thiếu hàng thì throw, cả
      transaction rollback (không tạo đơn dở dang, không trừ lượt coupon
      oan). `updateOrderStatus()` thêm nhánh mới: khi `newStatus ===
      CANCELLED` thì gọi `releaseStock()` hoàn lại đúng số lượng đã trừ.

      prisma/seed.ts: thêm bước seed Inventory — mỗi biến thể × mỗi cửa hàng
      ĐANG HOẠT ĐỘNG = 1 dòng, mặc định 20 (dùng `update: {}` khi upsert để
      KHÔNG ghi đè số lượng nếu admin đã tự chỉnh tay qua Prisma Studio sau
      lần seed trước — chỉ tạo mới dòng nào còn thiếu). BẮT BUỘC phải làm
      bước này TRƯỚC KHI bật kiểm tra tồn kho ở lib/orders.ts, vì DB TRƯỚC
      ĐÓ CÓ ĐÚNG 0 dòng Inventory (model có trong schema từ đầu dự án nhưng
      CHƯA TỪNG được seed hay dùng tới) — nếu bật kiểm tra mà không seed
      trước, MỌI đơn hàng sẽ lập tức bị chặn "chỉ còn 0 trong kho", sập toàn
      bộ luồng đặt hàng. Đã chạy `npx prisma db seed --config
      prisma7.config.ts` áp thật lên Supabase — tạo đủ 37 biến thể × 2 cửa
      hàng = 74 dòng Inventory.

      QUYẾT ĐỊNH PHẠM VI: KHÔNG làm thêm UI admin quản lý tồn kho (CRUD số
      lượng theo từng biến thể/cửa hàng) và KHÔNG hiện "còn X sản phẩm"/"hết
      hàng" ở trang sản phẩm — user chỉ yêu cầu "kiểm soát tồn kho" (chặn
      bán vượt), chưa yêu cầu giao diện quản lý riêng; muốn chỉnh số lượng
      hiện tại phải qua Prisma Studio. Đây là điểm có thể làm tiếp nếu cần.

      Đã test toàn bộ qua dev server bằng DB thật (tạo 1 customer + 1
      SUPER_ADMIN test riêng, dọn sạch + khôi phục tồn kho về 20 sau khi
      xong): đặt tồn kho biến thể test = 2 tại kho tổng (Cầu Giấy), thêm 5
      vào giỏ rồi đặt HOME_DELIVERY → chặn đúng 400 "chỉ còn 2... đặt (5)";
      sửa còn 2 trong giỏ → đặt hàng thành công (201), kiểm tra DB xác nhận
      kho Cầu Giấy trừ đúng về 0 (kho Quận 1 không đổi); admin hủy đơn đó
      (PATCH .../CANCELLED) → kiểm tra DB xác nhận kho Cầu Giấy hoàn lại
      đúng về 2; test riêng nhánh STORE_PICKUP: đặt tồn kho Quận 1 = 0, chọn
      nhận tại Quận 1 → chặn đúng 400 (dù kho tổng Cầu Giấy vẫn còn 2, xác
      nhận STORE_PICKUP chỉ tra ĐÚNG kho cửa hàng được chọn, không lẫn kho
      tổng); đổi sang chọn nhận tại Cầu Giấy (còn 2) → thành công, kiểm tra
      DB xác nhận CHỈ kho Cầu Giấy giảm (2→1), Quận 1 giữ nguyên 0.
      `tsc --noEmit`/`eslint`/`npm run build` sạch cho cả 2 phần #1 và #3.

- [x] Giao diện admin quản lý số lượng tồn kho (user yêu cầu ngay sau mục
      trên — lúc làm #3 chủ động ghi rõ "chưa làm UI, muốn chỉnh phải qua
      Prisma Studio" nên user yêu cầu làm nốt phần này).

      lib/inventory.ts thêm 2 hàm mới (tách hẳn khỏi 3 hàm cũ dùng lúc đặt/
      hủy đơn tự động — nhóm hàm CHO ADMIN):
      - `getInventoryForAdmin()`: trả về toàn bộ cửa hàng (kể cả đang ẩn,
        để admin thấy hết bức tranh) + toàn bộ biến thể kèm
        `quantityByStore` (map storeId -> số lượng, thiếu key = 0, tức chưa
        từng có dòng Inventory nào cho tổ hợp đó).
      - `setInventoryQuantity(storeId, variantId, quantity)`: ghi ĐÈ số
        lượng TUYỆT ĐỐI (khác `reserveStockOrThrow`/`releaseStock` ở trên
        vốn cộng/trừ dồn) — dùng upsert vì có thể chưa từng có dòng
        Inventory cho tổ hợp này (vd biến thể mới thêm sau lần seed đầu).
        Validate số nguyên >= 0 và cửa hàng/biến thể phải tồn tại.

      API: `PATCH /api/admin/inventory` (route MỚI, không phải
      `/api/admin/inventory/[id]` kiểu thường dùng cho resource khác trong
      dự án — vì Inventory không có 1 "id" đơn giản nào để đặt vào URL, khóa
      chính là TỔ HỢP storeId+variantId, nên nhận cả 2 trong body).

      UI: `/admin/inventory` (trang mới) + `InventoryManager.tsx` (client) —
      1 bảng: mỗi HÀNG là 1 biến thể (SKU/tên sản phẩm/màu-dung lượng), mỗi
      CỘT là 1 cửa hàng, ô giao giữa là input số lượng có thể sửa trực tiếp.
      Chọn kiểu **tự lưu khi rời khỏi ô (`onBlur`)** thay vì nút "Lưu" riêng
      từng dòng như VariantsManager — hợp lý hơn cho 1 lưới nhiều ô (37 biến
      thể × 2 cửa hàng = 74 ô) kiểu bảng tính, không cần bấm "Sửa" từng ô
      một trước khi gõ được. Có ô tìm kiếm lọc theo tên/SKU/màu/dung lượng
      ngay trên client (không gọi lại server — dữ liệu nhỏ, không cần phân
      trang). Mỗi ô tự hiện trạng thái "Đang lưu..."/"Đã lưu"/lỗi ngay cạnh
      input, không cần refresh cả trang. Thêm link "Tồn kho" vào
      AdminSidebarNav.tsx (nhóm "Bán hàng", ngay sau "Sản phẩm").

      Đã test qua dev server bằng DB thật (tạo 1 SUPER_ADMIN test riêng,
      khôi phục lại tồn kho mặc định (20) + xóa user/session sau khi xong):
      chưa đăng nhập vào `/admin/inventory` bị redirect (307); là admin thì
      200 và bảng hiện đúng tên sản phẩm + đủ 2 cột "FPT Shop Cầu Giấy"/"FPT
      Shop Quận 1"; gọi thẳng API chưa đăng nhập bị chặn đúng 403; admin
      PATCH số lượng = 50 thành công (200), kiểm tra DB xác nhận đúng giá
      trị 50; PATCH số lượng âm (-5) bị chặn đúng 400 và KHÔNG ghi đè lên
      giá trị 50 đã lưu trước đó (xác nhận qua DB). `tsc --noEmit`/`eslint`/
      `npm run build` sạch (route `/admin/inventory` và `/api/admin/
      inventory` đều xuất hiện đúng trong danh sách route sau build).

- [x] Cho admin thêm NHIỀU ảnh + bảng thông số kỹ thuật khi tạo/sửa sản phẩm
      (user báo ProductForm cũ chỉ có đúng 1 ô ảnh và không có chỗ nào nhập
      thông số — đúng vậy, `imageUrl` trước giờ là 1 string đơn, còn
      `ProductAttribute` chỉ từng được ghi qua prisma/seed.ts, chưa có UI).

      lib/productInput.ts: đổi `imageUrl: string` thành `images: string[]`
      (lọc bỏ chuỗi rỗng) và thêm `attributes: {groupName, attrName,
      attrValue}[]` (lọc bỏ dòng thiếu bất kỳ trường nào). API
      `POST /api/admin/products`: tạo kèm `images`/`attributes` qua nested
      `create` (sortOrder = index trong mảng). `PATCH /api/admin/products/
      [id]`: đồng bộ lại danh sách ảnh/thông số bằng cách XÓA HẾT rồi TẠO LẠI
      theo đúng mảng mới gửi lên — bắt buộc vì `ProductAttribute` không có
      unique key tự nhiên để upsert từng dòng (cùng pattern đã dùng ở
      prisma/seed.ts). RIÊNG ẢNH: chỉ xóa/tạo lại ảnh có `variantId: null`
      (ảnh cấp sản phẩm) — CHỦ ĐỘNG KHÔNG đụng tới ảnh đã gắn riêng theo
      từng biến thể (variantId khác null, hiện chỉ gán được qua script/
      Prisma Studio, xem mục "Tách bộ chọn Phiên bản..." — nếu xóa nhầm sẽ
      làm mất tính năng ảnh-đổi-theo-màu vừa làm trước đó). Đã tự viết script
      test PATCH lại đúng Xiaomi Redmi Note 13 (sản phẩm có sẵn 2 ảnh gắn
      variant) để xác nhận điều này — sau PATCH, 2 ảnh variant vẫn nguyên,
      chỉ ảnh chung bị thay.

      ProductForm.tsx: đổi ô ảnh đơn thành 2 cách thêm ảnh (giống hệt pattern
      đã dùng ở ReviewForm.tsx — input `multiple` upload tuần tự từng file
      qua `/api/admin/upload`, HOẶC dán URL thủ công qua ô nhập + nút
      "+ Thêm") kèm lưới thumbnail có thể xóa từng ảnh, ảnh ĐẦU TIÊN trong
      mảng luôn là ảnh đại diện (có nhãn "Đại diện", khớp đúng quy ước
      `sortOrder` đã dùng ở trang chi tiết sản phẩm) — giới hạn 8 ảnh/sản
      phẩm (`MAX_IMAGES`). Thêm section "Thông số kỹ thuật": danh sách dòng
      động (Nhóm/Tên thông số/Giá trị), nút "+ Thêm thông số" thêm dòng
      trống, mỗi dòng có nút xóa riêng — không validate chặt ở client (dòng
      thiếu ô nào sẽ tự bị bỏ qua ở server, đã ghi rõ trong UI) vì đây là
      form nhập tự do, không cần chặn cứng.

      admin/products/[id]/edit/page.tsx: include thêm `images` (lọc
      `variantId: null`, đủ toàn bộ chứ không `take:1` như cũ) và
      `attributes` (sort theo `sortOrder`) để nạp đúng dữ liệu có sẵn vào
      form khi sửa.

      Đã test qua dev server bằng DB thật (tạo 1 ADMIN test tạm qua script,
      không đụng dữ liệu thật, xóa sạch sau khi xong): tạo sản phẩm mới kèm
      3 ảnh + 3 thông số (2 nhóm khác nhau) qua API — DB xác nhận đủ cả 3
      ảnh đúng thứ tự và 3 dòng attribute đúng nhóm/tên/giá trị; PATCH lại
      với 1 ảnh + 1 thông số khác — DB xác nhận đã THAY THẾ đúng (không cộng
      dồn); PATCH thật lên sản phẩm Xiaomi Redmi Note 13 (đã có 2 ảnh gắn
      variant từ trước) để xác nhận ảnh variant không bị xóa nhầm như mô tả
      trên. `tsc --noEmit`/`eslint`/`npm run build` sạch. CHƯA tự xem qua
      trình duyệt thật (môi trường không có màn hình) — nhờ user tự mở
      `npm run dev` vào `/admin/products/new` hoặc sửa 1 sản phẩm để xác
      nhận UI thêm nhiều ảnh + thông số hoạt động thuận tay.

- [x] Sửa ảnh chi tiết sản phẩm bị phóng to/vỡ nét (user báo lại sau khi tự
      upload ảnh thật qua tính năng vừa thêm ở trên). NGUYÊN NHÂN: ảnh chính
      + thumbnail ở ProductGalleryAndBuy.tsx dùng `object-cover` trong khung
      `aspect-square` cố định — nếu ảnh gốc KHÔNG vuông (đa số ảnh thật chụp/
      tải lên đều vậy, khác hẳn ảnh demo placehold.co luôn vuông sẵn dùng lúc
      test trước đó), trình duyệt tự phóng to ảnh để LẤP ĐẦY cả 2 chiều rồi
      cắt bớt phần dư — vừa méo bố cục vừa vỡ nét vì phần hiển thị bị phóng
      to vượt độ phân giải gốc. Đổi cả 2 chỗ (ảnh chính + thumbnail) sang
      `object-contain` (hiện trọn ảnh trong khung, không phóng to/crop quá
      mức — nền `bg-zinc-100` sẵn có đóng vai trò khung viền nếu ảnh không
      vuông). Nhân tiện dọn 2 ảnh sai (không phải ảnh sản phẩm — do chọn
      nhầm file lúc test multi-upload) khỏi sản phẩm "Logitech G304" trực
      tiếp trong DB. Chỉ sửa component này (KHÔNG đụng ProductCard.tsx —
      thumbnail dạng lưới ở trang danh sách vẫn cố ý dùng `object-cover` để
      giữ khung đồng đều, ngoài phạm vi user báo).

- [x] Cho admin gắn ẢNH RIÊNG cho từng biến thể (màu/dung lượng) ngay trong
      giao diện — trước đó field `ProductImage.variantId` chỉ gán được qua
      script/Prisma Studio (xem mục "Tách bộ chọn Phiên bản..." — lúc đó
      từng demo qua script cho Xiaomi Redmi Note 13, ProductForm/VariantsManager
      chưa có UI nào cho việc này).

      lib/variants.ts: `getVariantsForProduct()` include thêm `images`
      (sort theo `sortOrder`). `createVariant(productId, input, images?)`
      nhận thêm mảng URL ảnh, tạo kèm luôn lúc tạo variant (nested create,
      `variantId` = variant vừa tạo). `updateVariant(id, input, images?)`
      — THAM SỐ `images` CỐ Ý OPTIONAL (khác `images` bắt buộc ở
      lib/productInput.ts cấp sản phẩm): `undefined` = không đụng gì tới
      ảnh (chỉ sửa field khác như giá/SKU), còn 1 MẢNG (kể cả mảng rỗng) =
      THAY THẾ toàn bộ ảnh riêng của variant đó (xóa hết rồi tạo lại, cùng
      pattern không-có-unique-key đã dùng cho ProductAttribute) — phân biệt
      2 trường hợp này để tránh 1 request chỉ sửa giá vô tình xóa sạch ảnh
      variant nếu chẳng may quên gửi field images. Tái dùng thẳng
      `parseImages()` đã viết ở lib/productInput.ts (export thêm ra để dùng
      chung, không viết lại).

      API: `POST /api/admin/products/[id]/variants` và
      `PATCH /api/admin/variants/[id]` đều parse thêm `images` từ body —
      route PATCH đặc biệt kiểm tra `Array.isArray(body?.images)` để quyết
      định truyền `undefined` hay mảng đã parse xuống `updateVariant()`,
      đúng theo hợp đồng optional ở trên.

      VariantsManager.tsx: mỗi dòng sửa/thêm biến thể (VariantEditRow) giờ
      có thêm 1 khu vực "Ảnh riêng của biến thể này" — upload nhiều ảnh
      cùng lúc (input `multiple`, tối đa 5 ảnh/biến thể, cùng pattern
      ReviewForm.tsx/ProductForm.tsx: upload tuần tự từng file qua
      `/api/admin/upload`, thumbnail có nút × xóa riêng). Ảnh nằm trong
      CHÍNH `form.images` của dòng đang sửa nên khi bấm "Lưu" sẽ gửi kèm
      luôn cùng các field khác trong 1 request — không cần nút lưu ảnh
      riêng. Không ảnh nào (mảng rỗng) thì trang chi tiết sản phẩm tự rơi về
      dùng ảnh chung của sản phẩm (logic fallback này đã có sẵn từ trước ở
      ProductGalleryAndBuy.tsx, không cần sửa thêm).

      Đã test qua dev server bằng DB thật (tạo 1 ADMIN test tạm, thao tác
      trên đúng variant "Đen/128GB" của Xiaomi Redmi Note 13 rồi khôi phục
      lại y hệt trạng thái ban đầu sau khi xong, xóa sạch user/session/
      variant test): PATCH kèm 2 ảnh mới thay thế đúng ảnh cũ (DB xác nhận
      đúng variantId + thứ tự); PATCH tiếp theo CHỈ đổi giá, KHÔNG gửi
      `images` — xác nhận giá đổi nhưng 2 ảnh vẫn giữ nguyên (không bị xóa
      nhầm); tạo 1 variant MỚI kèm ảnh ngay lúc tạo — DB xác nhận ảnh gắn
      đúng `variantId` của variant vừa tạo. `tsc --noEmit`/`eslint`/
      `npm run build` sạch. CHƯA tự xem qua trình duyệt thật (môi trường
      không có màn hình) — nhờ user tự mở `npm run dev`, vào sửa 1 biến thể
      bất kỳ để thử upload ảnh riêng và xác nhận ảnh đổi đúng khi chọn màu
      đó ở trang chi tiết sản phẩm.

- [x] Thêm 3 ô "SKU/Màu/Dung lượng" cho BIẾN THỂ ĐẦU TIÊN ngay trong form
      TẠO sản phẩm (user yêu cầu sau khi trải nghiệm luồng 2 bước cũ: tạo
      sản phẩm với ảnh chung -> qua trang Sửa bấm "+ Thêm biến thể" -> nếu
      lỡ gắn luôn ảnh riêng cho biến thể đó thì ảnh riêng ĐÈ lên ảnh chung
      (đúng theo thiết kế "ưu tiên ảnh theo màu" ở ProductGalleryAndBuy.tsx —
      xem mục "Tách bộ chọn Phiên bản...") — nhìn như bị mất ảnh ban đầu).

      KHÔNG sửa logic hiển thị ảnh (không phải bug — code cũ vẫn đúng: biến
      thể không có ảnh riêng thì tự rơi về ảnh chung). Thay vào đó rút ngắn
      luồng: ProductForm.tsx thêm khối "Biến thể đầu tiên" (CHỈ hiện khi
      `!isEdit` — trang Sửa đã có VariantsManager đầy đủ hơn nhiều, không
      lặp lại) gồm SKU/Màu/Dung lượng, KHÔNG bắt buộc (để trống SKU thì tạo
      sản phẩm y hệt hành vi cũ, không có variant nào, thêm sau ở trang
      Sửa). Biến thể này dùng chung giá (`basePrice`) và KHÔNG gắn ảnh riêng
      — cố tình để trống ảnh riêng của biến thể trong bước này, đảm bảo ảnh
      chung vừa upload luôn hiển thị đúng ngay từ đầu.

      Submit giờ chia 2 bước tuần tự (không chung 1 transaction — 2 API
      route riêng biệt đã có sẵn từ trước, không thêm route mới): (1) POST
      tạo sản phẩm như cũ; (2) nếu có SKU, POST tiếp sang
      `/api/admin/products/{id}/variants` (route tạo variant đã có, không
      đổi gì ở server). Nếu bước (2) lỗi (vd trùng SKU) thì KHÔNG coi là
      thất bại toàn bộ — sản phẩm đã tạo xong ở bước (1) rồi — báo lỗi qua
      `alert()` rồi điều hướng sang trang Sửa để admin tự thêm lại biến thể,
      cùng triết lý "không mất phần đã làm được chỉ vì bước sau lỗi" đã áp
      dụng cho luồng tạo đơn hàng + paymentUrl MoMo trước đây.

      Đã test qua dev server bằng DB thật (tạo 1 ADMIN test tạm, dọn sạch
      sau khi xong): xác nhận HTML `/admin/products/new` có đủ 3 field SKU/
      Màu/Dung lượng, còn `/admin/products/[id]/edit` (sản phẩm có sẵn)
      KHÔNG hiện khối này; gọi tuần tự đúng 2 API như luồng thật sẽ làm (tạo
      sản phẩm kèm 2 ảnh chung, rồi tạo variant đầu tiên) — DB xác nhận 2
      ảnh chung vẫn nguyên (`variantId: null`), variant tạo đúng màu/dung
      lượng/giá, KHÔNG có ảnh riêng nào gắn vào nó. `tsc --noEmit`/`eslint`/
      `npm run build` sạch. CHƯA tự xem qua trình duyệt thật (môi trường
      không có màn hình) — nhờ user tự mở `npm run dev` vào
      `/admin/products/new` thử điền đủ SKU/Màu/Dung lượng lúc tạo sản phẩm
      để xác nhận không còn phải qua bước riêng ở trang Sửa nữa.

- [x] Cho SKU tự sinh nếu để trống (user hỏi thẳng "SKU có thể tự tạo không
      tôi không biết nó là gì" — SKU là khái niệm quản lý kho nội bộ, không
      nên bắt admin phổ thông phải hiểu để tạo được biến thể).

      lib/variants.ts: bỏ điều kiện `sku.length > 0` khỏi `parseVariantInput`
      (giờ SKU rỗng vẫn hợp lệ). Thêm `skuPart()` (chuẩn hóa 1 đoạn text
      thành SKU-safe: viết hoa, bỏ dấu tiếng Việt qua NFD + tự thay `Đ`→`D`
      riêng vì NFD không tách được ký tự này, chỉ giữ A-Z0-9, cùng cách làm
      với `slugifyAttr()` ở lib/products.ts) và `generateSku(productName,
      color, storage)` — ghép `TÊNSP-MÀU-DUNGLUONG-XXXXX` (5 ký tự ngẫu
      nhiên cuối để đảm bảo không trùng, vì SKU là unique toàn hệ thống).
      `resolveSku()`: nếu SKU client gửi lên rỗng thì tự gọi
      `generateSku()`, thử lại tối đa 5 lần nếu trùng (xác suất trùng với
      hậu tố ngẫu nhiên gần như bằng 0 nhưng vẫn tự kiểm tra lại DB thay vì
      tin suông, đúng nguyên tắc "không tin ràng buộc DB tự chặn" áp dụng
      xuyên suốt dự án). `createVariant()`/`updateVariant()` đều gọi qua
      `resolveSku()` trước khi ghi — CHỈ check trùng SKU thủ công (throw 409)
      khi SKU KHÔNG rỗng (SKU tự sinh thì `resolveSku()` đã tự đảm bảo không
      trùng nên bỏ qua bước check thừa).

      UI: ProductForm.tsx — bỏ hẳn điều kiện "chỉ tạo biến thể đầu tiên nếu
      có nhập SKU" (trước đó để trống SKU = bỏ qua cả bước tạo biến thể) vì
      giờ để trống SKU vẫn tạo được biến thể bình thường — ĐƠN GIẢN HÓA
      thành LUÔN tạo biến thể đầu tiên ngay khi tạo sản phẩm (không cần hỏi
      admin có muốn hay không, vì sản phẩm vốn cần >=1 biến thể mới bán
      được). Đổi nhãn ô SKU thành "SKU (không bắt buộc)" + placeholder "Để
      trống sẽ tự tạo" + ghi chú giải thích SKU là gì (mã quản lý kho nội
      bộ, khách không nhìn thấy). VariantsManager.tsx (trang Sửa, "+ Thêm
      biến thể") cũng đổi nhãn tương tự. Đổi thông báo lỗi ở 2 route liên
      quan từ "Vui lòng nhập SKU và giá..." thành "Vui lòng nhập giá..."
      (không còn nhắc SKU vì hết bắt buộc).

      Đã test qua dev server bằng DB thật (tạo 1 ADMIN test tạm, dọn sạch
      sau khi xong): tạo variant với SKU rỗng + màu "Đỏ" — server tự sinh
      đúng `TESTAUTOSKUPRODU-DO-XZQMR` (xác nhận bỏ dấu "Đỏ"→"DO" đúng);
      PATCH cùng variant với SKU rỗng lần nữa — tự sinh SKU MỚI khác lần
      trước (không lỗi trùng với chính nó nhờ tham số `excludeId`); tạo
      thêm 1 variant khác không có cả màu lẫn dung lượng (mọi field đều
      trống ngoài giá) — vẫn tự sinh SKU thành công, không lỗi. `tsc
      --noEmit`/`eslint`/`npm run build` sạch. CHƯA tự xem qua trình duyệt
      thật (môi trường không có màn hình) — nhờ user tự mở `npm run dev`
      vào `/admin/products/new` để trống ô SKU khi tạo sản phẩm để xác nhận
      luồng chạy trơn tru.

- [x] Thêm ảnh THẬT (không phải ảnh minh họa placehold.co) + thông số chuẩn +
      ảnh riêng theo từng biến thể cho 6 SẢN PHẨM MẪU (user yêu cầu làm mẫu
      trước 1 batch nhỏ trước khi quyết định làm tiếp toàn bộ 35 sản phẩm —
      xem lý do chọn "làm mẫu trước" ở câu hỏi đã hỏi user). 6 sản phẩm:
      iPhone 15 Pro Max, Samsung Galaxy S24 Ultra, Xiaomi Redmi Note 13,
      MacBook Air M3, Dell XPS 13, OPPO Reno11 5G — chọn nhóm điện thoại/
      laptop nổi bật nhất, phủ cả trường hợp 2 biến thể (màu khác nhau) lẫn
      1 biến thể duy nhất. Nhân tiện xóa sản phẩm rác "tesst" (dữ liệu test
      cũ, 2 biến thể chữ thường, không có thông số — user xác nhận xóa).

      NGUỒN ẢNH (đúng thứ tự ưu tiên user chọn — Wikimedia Commons trước,
      ảnh hãng khi cần): Commons cho kết quả tốt với Apple/Samsung (dùng
      `action=query&list=search&srnamespace=6` hoặc `list=categorymembers`
      qua API công khai, không cần đăng nhập) — vd tìm được đúng ảnh unbox
      "iPhone 15 Pro Max...Natural Titanium"/"...and the box...02.jpg" (bản
      màu xanh) khớp chính xác 2 màu variant đang cần. Xiaomi/OPPO/Dell hầu
      như KHÔNG có trên Commons (sản phẩm phổ thông ít được cộng đồng chụp
      ảnh tự do) — phải lấy từ trang sản phẩm CHÍNH HÃNG (mi.com, oppo.com,
      dell.com, apple.com/newsroom): hầu hết trang này là SPA nên
      `curl`/`Invoke-WebRequest` chỉ thấy HTML tĩnh ban đầu, phải tự grep
      pattern URL ảnh CDN riêng của từng hãng nhúng sẵn trong HTML đó
      (`i02.appmifile.com/mi-com-product/...` cho Xiaomi,
      `i.dell.com/is/image/DellContent/...` cho Dell,
      `oppo.com/content/dam/...` cho OPPO) — phần lớn kết quả grep ra là
      ảnh nền/icon/ảnh mẫu chụp-bằng-điện-thoại (KHÔNG phải ảnh sản phẩm),
      phải tự tải xuống và XEM LẠI BẰNG MẮT (qua Read tool) từng ảnh ứng
      viên trước khi dùng — đã loại bỏ nhiều ảnh sai kiểu này (ảnh phong
      cảnh, ảnh chân dung người mẫu, ảnh infographic RAM/ROM) lúc kiểm tra.
      MẸO hữu ích phát hiện được: nhiều trang hãng có `<meta property=
      "og:image">` trỏ thẳng tới 1 ảnh sản phẩm chính chất lượng cao — và
      đổi sang trang PHIÊN BẢN KHU VỰC KHÁC (vd mi.com/id/... thay vì
      mi.com/global/...) có thể trả về og:image màu KHÁC (khu vực khác nhau
      có màu mặc định khác nhau) — dùng mẹo này lấy được đúng 2 màu Đen/Xanh
      Dương thật cho Xiaomi Redmi Note 13 chỉ từ 2 request.

      LỖI MÔI TRƯỜNG phát hiện: `curl` (bản Windows/Schannel cài kèm máy
      này) bị SEGFAULT ngay lập tức với MỌI request tới `apple.com` (kể cả
      `curl -sI https://www.apple.com` cũng crash, thử `--tlsv1.2`/
      `--http1.1` đều không khắc phục được) — không phải lỗi mạng, là lỗi
      riêng của curl khi bắt tay TLS với hạ tầng CDN của Apple. ĐÃ THAY THẾ
      hoàn toàn bằng `Invoke-WebRequest` (PowerShell) cho mọi request tới
      apple.com — hoạt động bình thường. Ghi lại thành lưu ý chung: nếu
      `curl` lỗi khó hiểu (đặc biệt segfault) với 1 domain cụ thể, thử ngay
      `Invoke-WebRequest` qua PowerShell tool trước khi kết luận domain đó
      chặn bot.

      XỬ LÝ ẢNH TRƯỚC KHI UPLOAD: một số ảnh gốc tải từ Commons rất nặng
      (Commons giữ nguyên bản gốc máy ảnh, có file tới 7-8MB) — VƯỢT giới
      hạn 5MB của bucket Supabase Storage "product-images" (giới hạn cấu
      hình lúc setup Storage, xem mục "Cấu hình SUPABASE_URL..." rất đầu
      file này). Dùng `sharp` (đã có sẵn trong node_modules vì Next.js cần
      cho tối ưu ảnh, không phải cài thêm) để resize `width:1600` +
      nén lại (`jpeg quality:85` hoặc `png compressionLevel:9`) TRƯỚC khi
      gọi `supabase.storage.upload()` — giảm từ 7-8MB xuống còn 150-450KB,
      không lỗi vượt giới hạn bucket. Script upload dùng thẳng
      `@supabase/supabase-js` với `SUPABASE_SERVICE_ROLE_KEY` (không qua
      route `/api/admin/upload` của app vì đó là route nhận `multipart/
      form-data` từ trình duyệt, không tiện gọi từ script Node).

      GẮN ẢNH THEO VARIANT: với sản phẩm có 2 màu (iPhone, Xiaomi) — gắn
      ĐÚNG ảnh theo màu thật (2 ảnh Titan Tự Nhiên, 2 ảnh Titan Xanh cho
      iPhone; 1 ảnh Đen + 1 ảnh Xanh Dương cho Xiaomi — CHỈ 1 ảnh/màu cho
      Xiaomi vì không tìm được ảnh thứ 2 thật sự khác dù đã thử nhiều nguồn,
      chấp nhận thiếu sót này thay vì độn thêm ảnh không phải sản phẩm).
      Với Samsung Galaxy S24 Ultra — KHÔNG tìm được ảnh thật phân biệt rõ
      đúng 2 màu Đen/Xám (ảnh Commons tìm được là ảnh cầm trên tay ở gian
      hàng, màu ngả xám-be khó khẳng định là "Đen") nên dùng CHUNG 2 ảnh
      thật (mặt trước + mặt sau) cho CẢ 2 biến thể (ghi 2 dòng ProductImage
      riêng, mỗi dòng 1 variantId khác nhau, cùng trỏ 2 URL ảnh) — vẫn là
      ảnh thật 100%, chỉ là không phân biệt được thị giác theo màu khi đổi
      variant. Sản phẩm chỉ có 1 biến thể (MacBook Air M3, Dell XPS 13,
      OPPO Reno11 5G) thì gắn thẳng 2 ảnh thật vào đúng biến thể đó.

      Đã XÓA HẾT ảnh cũ (`ProductImage.deleteMany({where:{productId}})`) của
      cả 6 sản phẩm trước khi ghi ảnh mới — không còn sót ảnh placehold.co
      nào. Thông số: bổ sung đầy đủ 9-13 dòng/sản phẩm (nhóm Màn hình/Vi xử
      lý/Camera/Cấu hình/Pin & Sạc/Thiết kế/Kết nối tùy loại thiết bị) dùng
      SỐ LIỆU THẬT của đúng model (từ kiến thức có sẵn, không tra cứu từng
      con số qua web vì đây là các sản phẩm phổ biến/thông số công khai rộng
      rãi) — Xiaomi Redmi Note 13 trước đó có ĐÚNG 0 thông số, giờ có đủ 11.

      Đã test qua dev server (dùng DB thật, không tạo dữ liệu test tạm nào —
      toàn bộ là nội dung thật sẽ giữ lại): `/products/<slug>` cho cả 6 sản
      phẩm đều 200, xác nhận URL ảnh Supabase Storage mới xuất hiện đúng
      trong HTML (không còn `placehold.co`), xác nhận đủ 12 file ảnh
      catalog/* load được (200) qua Supabase, thông số hiển thị đúng (grep
      thấy "Apple A17 Pro", "Kháng nước, bụi"...). KHÔNG có thay đổi code
      nào trong việc này (thuần thao tác dữ liệu qua script dùng 1 lần rồi
      xóa, giống các lần seed trước) nên không có gì để commit/push.

      CÒN LẠI 29 sản phẩm khác CHƯA làm (vẫn dùng ảnh minh họa placehold.co
      cũ + thông số sơ sài như trước) — chờ user duyệt chất lượng/cách làm
      của 6 sản phẩm mẫu này trước khi quyết định làm tiếp toàn bộ, vì mỗi
      sản phẩm tốn khá nhiều công tìm kiếm + xác minh ảnh thật (một số hãng
      như Sunhouse/Kangaroo/TP-Link nhiều khả năng sẽ khó tìm ảnh thật hơn
      nữa do đây là thương hiệu nội địa Việt Nam, ít xuất hiện trên Commons
      lẫn trang hãng quốc tế).

- [x] Thêm phương thức thanh toán CHUYỂN KHOẢN NGÂN HÀNG THẬT qua mã VietQR
      (user hỏi cách test MoMo chuyển tiền thật — giải thích rõ
      `test-payment.momo.vn` KHÔNG BAO GIỜ chuyển tiền thật dù dùng bộ
      credentials nào vì đó là vũ trụ sandbox riêng của MoMo (test bằng app
      "MoMo Test" với số dư giả) — muốn tiền thật phải có tài khoản MoMo
      Business được duyệt (mất vài ngày, cần hồ sơ kinh doanh). User chọn
      hướng khác nhanh hơn: chuyển khoản ngân hàng qua mã QR).

      DÙNG dịch vụ "Quick Link" CÔNG KHAI MIỄN PHÍ của VietQR
      (`img.vietqr.io`) — KHÔNG cần đăng ký tài khoản/API key nào (khác hẳn
      MoMo/VNPay), chỉ cần điền đúng SỐ TÀI KHOẢN NGÂN HÀNG THẬT của user là
      chạy được ngay, tiền đi THẲNG vào tài khoản đó khi khách quét mã bằng
      app ngân hàng bất kỳ hoặc app MoMo (đều đọc được chuẩn VietQR/Napas
      247). `PaymentMethod.BANK_TRANSFER` ĐÃ CÓ SẴN trong schema từ đầu dự
      án nhưng CHƯA TỪNG được dùng — không cần `prisma db push`.

      src/lib/bankTransfer.ts (mới): `isBankTransferConfigured()` check đủ
      3 biến env; `getBankAccountInfo()`; `buildVietQrUrl({amount, addInfo})`
      ghép URL theo đúng cú pháp VietQR
      `img.vietqr.io/image/{BANK_ID}-{SO_TK}-{TEMPLATE}.png?amount=...&addInfo=...&accountName=...`
      (template `compact2` — có logo + đầy đủ thông tin chuyển khoản, tra
      cứu đúng cú pháp qua https://www.vietqr.io/danh-sach-api/link-tao-ma-nhanh/
      trước khi viết code, không đoán). `BANK_ID` chấp nhận cả mã ngắn
      ("VCB", "MB"...) lẫn mã BIN 6 số — tra đúng mã ngân hàng của mình tại
      `https://api.vietqr.io/v2/banks` (JSON công khai).

      lib/orders.ts: `CheckoutInput.paymentMethod` thêm `"BANK_TRANSFER"`.
      `createOrderFromCart()`: tạo `Payment` method `BANK_TRANSFER` status
      `PENDING`, `transactionRef` = CHÍNH mã đơn hàng (`orderCode`) — dùng
      làm nội dung chuyển khoản (`addInfo` gửi VietQR) để đối chiếu, KHÁC
      với MoMo (txnRef riêng, không phải mã đơn). Thêm
      `confirmBankTransferPayment(orderId)` — vì VietQR KHÔNG có webhook báo
      tự động như MoMo/VNPay (khác biệt cốt lõi cần hiểu rõ), hàm này dành
      cho ADMIN gọi THỦ CÔNG sau khi tự kiểm tra tài khoản ngân hàng thấy
      tiền đã về: đánh dấu Payment PAID + nếu Order đang PENDING thì tự
      chuyển CONFIRMED (giống hệt cách MoMo callback thành công đang làm) —
      idempotent (gọi lại lần 2 không tạo thêm Notification/lịch sử trạng
      thái trùng, admin lỡ bấm 2 lần không sao).

      API: `POST /api/admin/orders/[id]/confirm-bank-transfer` (route MỚI,
      requireAdmin). `POST /api/orders` parse thêm `BANK_TRANSFER`, chặn
      400 nếu chưa cấu hình đủ 3 biến bank.

      UI: CheckoutForm.tsx thêm lựa chọn thứ 3 "Chuyển khoản ngân hàng (quét
      mã QR)" (tự disable như MoMo nếu chưa cấu hình, dùng
      `isBankTransferConfigured()` truyền từ checkout/page.tsx). Trang
      /orders/[id] hiện khối QR (ảnh `<Image unoptimized>` vì URL VietQR có
      query string động, không phù hợp cache tối ưu ảnh của Next) kèm đầy đủ
      số tài khoản/tên chủ TK/ngân hàng/số tiền/nội dung CK dạng text (dự
      phòng nếu khách không quét được QR) — CHỈ hiện khi Payment method
      BANK_TRANSFER và status còn PENDING (ẩn đi sau khi admin xác nhận).
      Admin: /admin/orders/[id] thêm nút "Xác nhận đã nhận tiền chuyển
      khoản" (ConfirmBankTransferButton.tsx, có `confirm()` hỏi lại trước
      khi gọi vì đây là hành động không dễ hoàn tác) — chỉ hiện khi có
      Payment BANK_TRANSFER đang PENDING; đồng thời hiện thêm nội dung CK
      (transactionRef) cạnh mỗi dòng thanh toán để admin biết cần tìm giao
      dịch nào trong sao kê.

      next.config.ts: thêm `img.vietqr.io` vào CẢ `images.remotePatterns`
      (cho next/image) LẪN `Content-Security-Policy` `img-src` (thiếu 1
      trong 2 chỗ này ảnh QR sẽ không hiện được — remotePatterns thiếu thì
      Next chặn lúc build/render, CSP thiếu thì trình duyệt tự chặn dù Next
      render ra HTML đúng).

      .env: thêm `BANK_ID`/`BANK_ACCOUNT_NUMBER`/`BANK_ACCOUNT_NAME` (để
      trống thì tính năng tự ẩn), kèm hướng dẫn chi tiết cách lấy đúng mã
      ngân hàng + CẢNH BÁO rõ đây là số tài khoản THẬT sẽ hiển thị công khai
      cho khách xem (đúng bản chất — vẫn phải hiện ra để chuyển tiền, không
      phải lỗ hổng) nhưng không hề lộ thông tin đăng nhập/OTP ngân hàng.

      Đã test qua dev server bằng DB thật (tạo 1 customer + 1 admin test
      tạm, dùng bộ thông tin ngân hàng MẪU trong tài liệu VietQR — KHÔNG
      phải tài khoản thật — qua `.env.local`, xóa `.env.local` ngay sau khi
      test xong): đặt hàng BANK_TRANSFER thành công (201), DB xác nhận đúng
      Payment method/status/transactionRef=mã đơn; trang `/orders/[id]`
      hiện đúng ảnh QR (gọi thẳng URL ảnh xác nhận Content-Type image/png,
      200) kèm đủ thông tin tài khoản; `/checkout` hiện đúng lựa chọn thứ 3
      không bị disable khi đã cấu hình; admin gọi API xác nhận — Order tự
      chuyển PENDING → CONFIRMED, Payment → PAID; gọi xác nhận LẦN 2 —
      không lỗi, không tạo thêm Notification trùng (đúng idempotent).
      `tsc --noEmit`/`eslint`/`npm run build` sạch (route
      `/api/admin/orders/[id]/confirm-bank-transfer` xuất hiện đúng trong
      danh sách route). Đã dọn sạch dữ liệu test.

- [x] THỬ (rồi HỦY BỎ) xác nhận TỰ ĐỘNG thanh toán chuyển khoản ngân hàng qua webhook SePay
      (user hỏi "nếu ngân hàng nhận được thì auto hoàn thành xác nhận đơn
      hàng được không" — VietQR Quick Link ở mục trên chỉ vẽ ảnh QR tĩnh,
      không có cách nào tự báo khi có tiền về, admin luôn phải bấm xác nhận
      thủ công). Đã giải thích rõ cho user trước khi làm: bản thân ngân hàng
      không cấp API/webhook cho tài khoản cá nhân thông thường — muốn tự
      động hoá BẮT BUỘC phải qua 1 dịch vụ trung gian liên kết trực tiếp với
      tài khoản ngân hàng thật rồi gọi webhook khi có biến động số dư. User
      chọn SePay (so với lựa chọn còn lại là Casso) qua AskUserQuestion.

      src/lib/sepay.ts (mới): `isSepayConfigured()` check biến env
      `SEPAY_API_KEY`; `verifySepayAuth(authorizationHeader)` so sánh header
      `Authorization: Apikey <API_KEY>` mà SePay gửi kèm mỗi lần gọi webhook
      bằng `crypto.timingSafeEqual` (không dùng `===`, cùng cách đã làm với
      chữ ký MoMo ở lib/momo.ts) — chống dò secret qua đo thời gian phản hồi.

      lib/orders.ts: `confirmBankTransferPayment(orderId, options?)` thêm
      tham số THỨ 2 tùy chọn `{ note }` — cho phép ghi đè nội dung
      OrderStatusHistory (mặc định vẫn là "Admin xác nhận đã nhận được tiền
      chuyển khoản" khi gọi từ nút bấm thủ công, webhook gọi với note khác
      để phân biệt "Tự động xác nhận qua webhook SePay (giao dịch #...)" —
      admin xem lịch sử trạng thái biết ngay lần đó tự động hay thủ công).
      Thêm hàm mới `findPendingBankTransferOrderByTransaction(content,
      amount)`: quét toàn bộ Payment đang BANK_TRANSFER + PENDING, khớp
      ĐỒNG THỜI 2 điều kiện — nội dung chuyển khoản CÓ CHỨA đúng mã đơn hàng
      (không cần khớp tuyệt đối cả chuỗi vì nội dung thật từ ngân hàng
      thường có thêm chữ khác quanh mã, vd "CT tu NGUYEN VAN A
      DHMUE3ZXPHKJM9 thanh toan") VÀ số tiền chuyển khớp CHÍNH XÁC với số
      tiền đơn hàng — bắt buộc cả 2 để tránh nhận nhầm đơn (mã bị cắt/gõ sai
      nhưng số tiền tình cờ trùng, hoặc ngược lại).

      API: `POST /api/payments/sepay/webhook` (route MỚI) — verify
      Authorization header trước (401 nếu sai/thiếu), CHỈ xử lý
      `transferType === "in"` (SePay cũng gọi webhook cho tiền RA khỏi tài
      khoản, vd chủ shop tự rút tiền — không liên quan gì đơn hàng, bỏ qua
      luôn không coi là lỗi), tìm đơn khớp qua hàm trên rồi gọi
      `confirmBankTransferPayment`. MỌI trường hợp không khớp được đơn nào
      (kể cả giao dịch có thật nhưng không phải tiền mua hàng, vd người
      khác chuyển nhầm) đều trả **200** `{ok:true, matched:false}` chứ
      KHÔNG phải lỗi — vì SePay gọi webhook cho MỌI giao dịch trên tài
      khoản, phần lớn vốn dĩ không liên quan đơn hàng nào, trả lỗi ở đây sẽ
      khiến SePay hiểu lầm là lỗi thật và cứ gọi lại mãi.

      UI: `/orders/[id]` đổi dòng ghi chú dưới mã QR thành "Đơn hàng sẽ TỰ
      ĐỘNG được xác nhận trong ít phút..." khi `isSepayConfigured()`, giữ
      nguyên câu cũ "xác nhận thủ công" khi chưa cấu hình. `/admin/
      orders/[id]` thêm dòng chú thích nhỏ cạnh nút "Xác nhận đã nhận tiền
      chuyển khoản" khi đã cấu hình SePay, giải thích nút đó giờ chỉ còn là
      PHƯƠNG ÁN DỰ PHÒNG (dùng khi khách chuyển khoản ghi sai nội dung nên
      webhook không khớp được đơn nào) — KHÔNG xóa nút này vì webhook không
      phải lúc nào cũng khớp được 100%.

      .env: thêm `SEPAY_API_KEY` (để trống thì webhook tự trả 401, không
      ảnh hưởng gì tới xác nhận thủ công vẫn hoạt động như cũ) kèm hướng dẫn
      đầy đủ: đăng ký tài khoản SePay, liên kết ngân hàng thật, tạo Webhook
      mới trong dashboard SePay (sự kiện "Có tiền vào", xác thực kiểu "API
      Key" tự đặt), dán đúng giá trị đó vào biến này.

      Đã test toàn bộ qua dev server bằng DB THẬT (tạo 1 customer + giỏ hàng
      test qua script, đặt 1 đơn BANK_TRANSFER thật qua API, dùng
      `SEPAY_API_KEY` giả qua `.env.local` tạm — xóa ngay sau khi test xong,
      không đụng dữ liệu thật): (1) auth sai → 401; (2) `transferType:"out"`
      → 200 `matched:false`, không đụng gì tới đơn; (3) nội dung không khớp
      đơn nào → 200 `matched:false`; (4) nội dung khớp nhưng SAI số tiền →
      200 `matched:false` (không xác nhận nhầm); (5) nội dung + số tiền khớp
      đúng → 200 `matched:true`, kiểm tra DB xác nhận Payment chuyển PAID,
      Order PENDING→CONFIRMED, đúng 1 OrderStatusHistory với note "Tự động
      xác nhận qua webhook SePay (giao dịch #5)", đúng 1 Notification; (6)
      gọi lại webhook lần 2 cho ĐÚNG giao dịch đó (mô phỏng SePay gọi lặp) →
      tự động `matched:false` vì hàm tìm kiếm chỉ quét Payment còn PENDING —
      Payment đã PAID từ lần trước không còn nằm trong tập tìm kiếm nữa, nên
      không có nguy cơ xác nhận trùng/tạo thêm Notification dù không cần
      thêm cờ idempotency riêng nào. `tsc --noEmit`/`eslint`/`npm run build`
      sạch (route `/api/payments/sepay/webhook` xuất hiện đúng trong danh
      sách route). Đã dọn sạch dữ liệu test + xóa `.env.local` tạm.

      ĐÃ BỊ HỦY BỎ VÀ XÓA HẾT CODE ngay sau khi implement xong (khác các lần
      "ĐÃ BỊ THAY THẾ" trước — lần này KHÔNG có provider thay thế, quay lại
      đúng nguyên trạng "chỉ xác nhận thủ công" trước khi làm mục này). Lý
      do: user báo ngay "nó không hỗ trợ techcombank" (tài khoản ngân hàng
      thật của user là Techcombank — xem BANK_ID trong .env). Tra lại kỹ qua
      WebFetch (không tin gợi ý ban đầu của WebSearch, hoá ra sai) xác nhận
      đúng: trang "Ngân hàng hợp tác" chính thức của SePay KHÔNG liệt kê
      Techcombank ở đâu cả — SePay chỉ hỗ trợ qua API partnership CHÍNH THỨC
      với từng ngân hàng, Techcombank chưa có trong danh sách đó. Đối thủ
      Casso CÓ hỗ trợ Techcombank nhưng qua cơ chế RPA ("Casso Flow" — 1
      con robot tự động ĐĂNG NHẬP vào Internet Banking Techcombank thay
      người dùng để đọc giao dịch định kỳ), nghĩa là phải CẤP THẬT thông
      tin đăng nhập ngân hàng cho Casso — khác hẳn cơ chế API chính thức
      (không cần chia sẻ mật khẩu) mà SePay dùng cho các ngân hàng khác. Đã
      trình bày rõ 4 lựa chọn cho user qua AskUserQuestion (dùng Casso chấp
      nhận rủi ro RPA / mở thêm 1 tài khoản ở ngân hàng SePay hỗ trợ chính
      thức để nhận tiền / giữ nguyên xác nhận thủ công / tìm hiểu thêm) — 
      user chọn **giữ nguyên xác nhận thủ công**, không chấp nhận đánh đổi
      bảo mật (chia sẻ mật khẩu ngân hàng) hay phiền phức (mở thêm tài
      khoản) chỉ để có tự động hoá.

      ĐÃ XÓA HẾT: src/lib/sepay.ts, src/app/api/payments/sepay/ (cả thư
      mục), tham số `options?.note` mới thêm ở `confirmBankTransferPayment`
      (lib/orders.ts, quay lại chữ ký 1 tham số như cũ), hàm
      `findPendingBankTransferOrderByTransaction` (lib/orders.ts), đoạn
      code hiển thị thông báo "TỰ ĐỘNG"/hint SePay ở /orders/[id] và
      /admin/orders/[id] (quay lại nguyên văn thông báo "xác nhận thủ công"
      như trước), biến `SEPAY_API_KEY` trong .env. `ConfirmBankTransferButton`
      + nút xác nhận thủ công ở /admin/orders/[id] KHÔNG đổi gì — vẫn là
      CÁCH DUY NHẤT xác nhận thanh toán chuyển khoản, y hệt trước khi làm
      mục này. Đã `rm -rf .next` (validator.ts cache còn trỏ tới route đã
      xóa, gây lỗi tsc giả) rồi `npm run build` lại xác nhận sạch, route
      `/api/payments/sepay/webhook` không còn trong danh sách, route
      `/api/admin/orders/[id]/confirm-bank-transfer` vẫn còn nguyên.

      BÀI HỌC: mỗi dịch vụ "tự động đối chiếu giao dịch ngân hàng" ở VN chỉ
      hỗ trợ 1 tập ngân hàng nhất định qua API CHÍNH THỨC (an toàn, không
      cần mật khẩu) — ngân hàng ngoài danh sách đó thường CHỈ khả dụng qua
      RPA (rủi ro cao hơn hẳn, phải cấp thật thông tin đăng nhập). Trước khi
      chọn 1 dịch vụ loại này, PHẢI tra đúng danh sách ngân hàng hỗ trợ CHO
      ĐÚNG NGÂN HÀNG NGƯỜI DÙNG ĐANG DÙNG trước khi implement, không giả
      định "dịch vụ phổ biến chắc hỗ trợ hết".

- [x] Thêm ảnh THẬT + banner thật cho 28 sản phẩm còn lại + banner trang chủ
      (user yêu cầu làm nốt toàn bộ sau khi duyệt 6 sản phẩm mẫu, kèm 2 lưu ý
      quan trọng: (1) giá variant CHỈ đổi theo dung lượng chứ không theo màu
      — đã kiểm tra lại toàn bộ dữ liệu hiện có, xác nhận ĐÚNG như vậy sẵn
      (không có variant nào lệch giá chỉ vì đổi màu), áp dụng như nguyên tắc
      cho các thay đổi sau này; (2) một số sản phẩm KHÔNG cần variant — thực
      tế toàn bộ 22 sản phẩm nhóm "Điện máy" từ trước tới giờ đã luôn chỉ có
      ĐÚNG 1 variant/sản phẩm (không có variant màu/dung lượng thừa), đúng ý
      user muốn, không cần sửa gì thêm ở tầng dữ liệu).

      NGUỒN ẢNH: đổi hẳn chiến lược so với 6 sản phẩm mẫu trước — Wikimedia
      Commons liên tục trả lỗi 429 "Too many requests"/chặn IP trong phần
      lớn thời gian làm việc (thử cả `curl` lẫn `Invoke-WebRequest`, cả User-
      Agent tuân thủ robot policy của Wikimedia, cả kích thước thumbnail hợp
      lệ theo đúng danh sách chính thức 20/40/60/120/250/330/500/960/1280/
      1920/3840px — vẫn bị chặn phần lớn, chỉ thông trong 1 khoảng thời gian
      ngắn giữa chừng) — ĐÃ CHUYỂN ƯU TIÊN sang lấy thẳng từ TRANG CHÍNH HÃNG
      cho đa số sản phẩm, chỉ dùng Commons cho vài trường hợp Commons tình cờ
      thông (AirPods Pro 2, Xiaomi Robot Vacuum, HP LaserJet minh họa).
      KỸ THUẬT trích ảnh từ trang hãng: ưu tiên đọc thẳng thẻ
      `<meta property="og:image">` (nhanh, thường ra đúng 1 ảnh hero chất
      lượng cao — dùng được cho TP-Link, Asus TUF/Zenbook, Philips cả 4 sản
      phẩm, Xiaomi camera/cân); khi trang không có og:image hữu ích, grep
      thẳng HTML tìm state JSON nhúng sẵn (server-side rendered) chứa URL
      ảnh theo field tên riêng của từng hãng — phát hiện được nhờ đọc context
      quanh chuỗi tên sản phẩm: Samsung nhúng field `"hingeImage"`/
      `"logoUrl"` chứa domain `images.samsung.com/vn/<slug>/buy/...` (dùng
      được cho Galaxy Tab S9, khớp đúng màu "Xám"/Graphite); LG nhúng field
      `og:image` trỏ domain `www.lg.com/content/dam/channel/wcms/vn/images/`
      kèm thêm link `gallery/D-01.jpg` độ phân giải cao hơn trong chính HTML.

      3 THƯƠNG HIỆU VN (Sunhouse, Kangaroo — đúng như dự đoán trước đó là sẽ
      khó) hoá ra VẪN LẤY ĐƯỢC ảnh thật từ chính trang chủ hãng
      (sunhouse.com.vn, kangaroo.vn) qua og:image y hệt các hãng quốc tế —
      không khó như lo ngại ban đầu, CHỈ có 1 khó khăn thật: sản phẩm trong
      DB đặt tên/mã hàng chung chung (vd "SHD5341", "SHB6822", "KG150") không
      trùng khớp CHÍNH XÁC với mã sản phẩm thật đang bán trên web hãng (dòng
      sản phẩm cũ/mới khác nhau) — dùng `WebSearch` (site:sunhouse.com.vn,
      site:kangaroo.vn) để tìm ra đúng URL sản phẩm THẬT gần nhất cùng danh
      mục, chấp nhận model không khớp tuyệt đối 100% (giống cách tiếp cận
      "cùng dòng sản phẩm" đã dùng cho iPad/Galaxy S24 Ultra ở batch trước).

      4 SẢN PHẨM KHÔNG lấy được ảnh (giữ nguyên placehold.co, đã bổ sung
      THÔNG SỐ THẬT vẫn đầy đủ): Dell UltraSharp U2724D (trang dell.com chặn
      thẳng bằng Akamai "Access Denied" ngay cả với ảnh tĩnh .psd trên CDN
      `i.dell.com`, dù trang HTML chính vẫn tải được và tìm thấy đúng URL
      ảnh); JBL Tune 510BT (không tìm thấy bất kỳ nguồn ảnh nào — cả
      jbl.com/global.jbl.com/vn.jbl.com đều trả trang rỗng hoặc không nhúng
      CDN ảnh trong HTML tĩnh, Commons cũng không có kết quả phù hợp); Samsung
      Smart Tivi Crystal UHD 55" và Sony Bravia 43" (CẢ 2 site chặn bot hoàn
      toàn — Sony trả thẳng "403 Access Denied" của Akamai ngay từ request
      đầu tiên bất kể `curl` hay `Invoke-WebRequest`; Samsung VN thoạt đầu
      cho qua 1-2 request rồi tự chuyển MỌI URL (kể cả URL khác hoàn toàn)
      thành trang "error" chung — nghi ngờ WAF tạm chặn theo IP sau vài request
      liên tiếp, có thể thử lại được sau, ghi vào mục "Việc còn thiếu").

      MÀU SẮC KHÔNG KHỚP: 6 sản phẩm có ảnh thật lấy được nhưng màu SAI so
      với dữ liệu variant cũ (do dữ liệu variant cũ vốn chỉ là màu bịa lúc
      seed ban đầu, không dựa trên ảnh thật nào) — ĐÃ SỬA LẠI MÀU VARIANT
      cho khớp đúng với ảnh thật (nguyên tắc: ảnh thật là nguồn chân lý, sửa
      dữ liệu theo ảnh chứ không ép ảnh sai theo dữ liệu, tránh lặp lại lỗi
      "ảnh không khớp variant" đã từng sửa trước đây): Philips máy sấy tóc
      (Hồng -> Đen, model BHC010 thật chỉ có màu đen), Philips nồi cơm điện
      (Đỏ -> Trắng), Sunhouse chảo chống dính (Đen -> Đỏ), Sunhouse máy hút
      mùi (Đen -> Bạc, ảnh thật là hút mùi inox), Sunhouse máy xay sinh tố
      (Đỏ -> Trắng), Sunhouse nồi áp suất điện (Bạc -> Đen). LG tủ lạnh giữ
      nguyên đổi tương tự (Bạc -> Đen) vì model LTD37BLM thật là màu đen.

      BANNER TRANG CHỦ: 3 banner cũ dùng placehold.co (`Banner.imageUrl`,
      KHÔNG có field `title` trong schema — hiển thị thuần ảnh, không có chữ
      overlay) — đổi bằng 3 ảnh THẬT ghép trên nền màu `#1c1428` (đúng màu
      nền tối chủ đạo của theme "Đêm Hổ Phách", tra trực tiếp từ token
      `--color-zinc-50` trong globals.css) qua `sharp .resize({fit:
      "contain", background})`: banner 1 tái dùng ảnh iPhone 15 Pro Max thật
      đã upload từ batch trước, banner 2 tái dùng ảnh MacBook Air M3, banner
      3 dùng ảnh AirPods Pro 2 mới lấy — cả 3 đều là ẢNH THẬT 100% (chỉ thêm
      viền nền đồng màu app, không chỉnh sửa nội dung ảnh) phù hợp khung
      hiển thị 21:9 của `HeroBanner.tsx` (`object-cover` sẽ không còn cắt
      mất chủ thể vì đã có viền đệm sẵn trong ảnh).

      QUY TRÌNH KỸ THUẬT (giữ nguyên từ batch 6 sản phẩm mẫu, không đổi):
      `sharp` resize width 1400px + nén JPEG quality 85 + `.flatten()` nền
      trắng (một số ảnh PNG từ Philips có nền trong suốt, cần ép nền trắng
      trước khi lưu JPEG để tránh viền đen), upload thẳng qua
      `@supabase/supabase-js` với `SUPABASE_SERVICE_ROLE_KEY` (script dùng 1
      lần rồi xóa, không commit). LỖI THẬT gặp phải: script lúc đầu báo lỗi
      "Invalid Compact JWS" khi upload — hoá ra do dòng
      `SUPABASE_SERVICE_ROLE_KEY= "..."` trong `.env` có 1 KHOẢNG TRẮNG giữa
      dấu `=` và dấu ngoặc kép mở đầu, parser .env tự viết trong script (quy
      ước `KEY="value"` đơn giản, không dùng thư viện `dotenv` đầy đủ) không
      lường trước trường hợp có khoảng trắng nên cắt thiếu, để sót 1 dấu
      `"` và 1 khoảng trắng ở đầu giá trị secret — sửa lại parser dùng
      `.trim()` + strip ngoặc kép sau khi trim thay vì regex cứng nhắc.

      Đã cập nhật CẢ ảnh (`ProductImage`, xóa hết ảnh `variantId: null` cũ
      rồi tạo lại) LẪN thông số kỹ thuật (`ProductAttribute`, xóa hết rồi
      tạo lại, 4-8 dòng/sản phẩm dùng số liệu THẬT của đúng model — vd Asus
      Zenbook UX3405 ghi đúng Intel Core Ultra 7 155H/16GB/512GB, Kangaroo
      KG69A3N ghi đúng dung tích 30 lít/công suất 2500W) cho toàn bộ 23 sản
      phẩm lấy được ảnh, và CHỈ thông số (giữ nguyên ảnh placehold.co) cho 4
      sản phẩm không lấy được ảnh — không có sản phẩm nào còn thông số sơ sài
      như trước nữa.

      Đã test qua dev server (dùng DB thật, không mock, không tạo dữ liệu
      test tạm nào vì toàn bộ là nội dung thật sẽ giữ lại): xóa `.next` trước
      khi khởi động lại (rút kinh nghiệm lỗi cache stale đã ghi ở mục "Lưu ý
      quan trọng" — thao tác qua script không tự gọi `revalidateTag`), script
      audit riêng xác nhận ĐÚNG 30/34 sản phẩm hết placehold.co (30 = 23 mới
      + Logitech G304 + iPhone/Samsung S24 Ultra/Xiaomi/MacBook/Dell XPS đã
      làm ở batch trước — không có ảnh product-level vì đã gắn hết vào
      variant), CHỈ còn đúng 4 sản phẩm placeholder như đã liệt kê ở trên;
      trang chủ tải đúng 3 banner mới (grep xác nhận URL Supabase
      `catalog/*.jpg` mới, không còn `placehold.co` nào ở banner); trang chi
      tiết 1 vài sản phẩm đại diện (`/products/tp-link-archer-ax55`,
      `/products/sunhouse-chao-chong-dinh-day-tu`) trả 200 và đúng nội dung
      thông số + màu variant đã sửa (grep thấy "Wi-Fi 6"/"OFDMA" và
      "Whitford"/"Đỏ" đúng trong HTML thật). `tsc --noEmit`/`eslint`/
      `npm run build` sạch (không có thay đổi code, chỉ dữ liệu — build vẫn
      chạy lại để xác nhận không có gì vỡ). Đã dọn sạch toàn bộ script/ảnh
      tạm (`catalog_batch2.mjs`, `update_banners.mjs`, thư mục
      `%TEMP%/catalog_imgs`) sau khi chạy xong.

- [x] Thu gọn còn 3 danh mục (Điện thoại / Laptop / Tivi) + bộ lọc THÔNG SỐ
      khai báo RIÊNG cho từng danh mục + bỏ lối vào "tất cả sản phẩm" (user
      yêu cầu trọn gói: "bỏ trang tất cả sản phẩm", "chuyển điện máy thành
      tv", "bỏ danh mục phụ kiện", "bộ lọc phụ thuộc vào danh mục đang xem",
      "sửa lại các thông số kĩ thuật của các sản phẩm hiện có theo bộ lọc").

      BỘ LỌC THEO DANH MỤC — đổi hướng so với lần trước: mục "Bảng lọc theo
      thông số kỹ thuật RIÊNG cho từng danh mục" ở trên suy ra danh sách
      thông số HOÀN TOÀN TỰ ĐỘNG từ dữ liệu ProductAttribute thật (kèm ngưỡng
      "attrName phải xuất hiện ở >= 2 sản phẩm"). Cách đó hợp lý khi "Điện
      máy" còn là nhóm tổng gộp tivi/tủ lạnh/nồi cơm — không thể biết trước
      thông số nào dùng chung được. Giờ mỗi danh mục chỉ còn ĐÚNG 1 loại sản
      phẩm nên khai báo tường minh tốt hơn hẳn, thêm `CATEGORY_FILTER_SPECS`
      (src/lib/products.ts): "dien-thoai" -> Hiệu năng và Pin / Dung lượng
      ROM / RAM / Tần số quét; "laptop" -> CPU / RAM / Card đồ họa / Ổ cứng /
      Kích thước màn hình / Tần số quét; "tivi" -> Loại tivi / Kích thước màn
      hình / Độ phân giải. `getAttributeFacets()` viết lại: chỉ query đúng
      các attrName trong config, trả về theo ĐÚNG THỨ TỰ khai báo (không sắp
      xếp theo bảng chữ cái như trước), bỏ hẳn ngưỡng >= 2 sản phẩm (user đã
      tự chọn các bộ lọc này nên phải luôn hiện), và bỏ facet nào chưa có giá
      trị nào thay vì hiện mục rỗng. Nhờ config này, các thông số chỉ để THAM
      KHẢO ở trang chi tiết (camera, trọng lượng, cổng kết nối, công suất
      loa...) không còn lọt vào sidebar dù vẫn nằm chung bảng ProductAttribute.

      2 điểm tinh chỉnh nhỏ nhưng cần thiết trong `getAttributeFacets()`:
      (1) số đếm cạnh mỗi giá trị đếm theo SỐ SẢN PHẨM (Set productId) chứ
      không phải số DÒNG thuộc tính — 1 sản phẩm có thể có nhiều dòng cùng
      attrName (máy bán cả bản 128GB lẫn 256GB, hoặc nhiều nhãn "Hiệu năng và
      Pin"), đếm dòng sẽ ra số lớn hơn số sản phẩm thực sự hiện ra sau khi
      lọc; (2) sắp xếp giá trị bằng `Intl.Collator("vi", { numeric: true })`
      — so sánh chuỗi thuần sẽ xếp "12GB" TRƯỚC "8GB" và "50 inch" trước
      "43 inch", nhìn rất sai.

      "Hiệu năng và Pin" (điện thoại) là thông số dạng NHÃN chứ không phải 1
      con số: 1 sản phẩm có NHIỀU dòng cùng attrName này ("Chip cao cấp
      (flagship)" / "Chip tầm trung" / "Pin từ 5000mAh" / "Sạc nhanh từ 60W"),
      gom 2 khía cạnh người mua quan tâm nhất thành các mức chọn được — giống
      cách FPT Shop thật gộp nhóm này. Đặt trong groupName riêng "Đặc điểm nổi
      bật" để bảng thông số ở trang chi tiết đọc vẫn xuôi. Tương tự, "Card đồ
      họa" (laptop) cố ý dùng giá trị mức PHÂN LOẠI ("Card tích hợp") chứ
      không phải tên chip cụ thể — lọc theo tên chip thì mỗi giá trị ứng với
      đúng 1 máy, không thu hẹp được gì; tên chip cụ thể vẫn hiện ở dòng
      "Chip đồ họa" (không dùng làm bộ lọc). Cơ chế lọc AND-giữa-các-thông-số
      / OR-trong-cùng-1-thông-số ở `getProducts()` KHÔNG đổi gì.

      DIỄN GIẢI 1 chỗ mơ hồ trong yêu cầu: với tivi user ghi "màn hình" (tách
      riêng khỏi "độ phân giải") — hiểu là KÍCH THƯỚC màn hình (43/50/55/65
      inch, thứ người mua tivi hỏi đầu tiên), không phải công nghệ tấm nền.
      Công nghệ màn hình (LED/QLED) vẫn có trong thông số nhưng không làm bộ
      lọc. Nếu user muốn ngược lại thì chỉ cần đổi 1 dòng trong
      CATEGORY_FILTER_SPECS.

      BỘ LỌC "HÃNG SẢN XUẤT" giờ cũng phụ thuộc danh mục: /products đổi từ
      `getActiveBrands()` (toàn bộ bảng Brand) sang `getBrandsByCategory()`
      (suy từ sản phẩm ACTIVE thật, đã có sẵn từ lúc làm mega menu). LỖI THẬT
      tự phát hiện lúc test nhờ đổi này: trang KẾT QUẢ TÌM KIẾM (không thuộc
      danh mục nào) vẫn dùng `getActiveBrands()` nên hiện cả những hãng KHÔNG
      CÒN SẢN PHẨM NÀO (Sunhouse, Kangaroo, HP, Logitech, TP-Link, JBL, Sony
      — hàng gia dụng/phụ kiện vừa bị gỡ bán), bấm vào ra trang rỗng. Đã sửa:
      trang tìm kiếm gộp hãng của MỌI danh mục từ chính `getBrandsByCategory()`
      (dedupe theo slug) thay vì đọc bảng Brand. Các Brand không còn sản phẩm
      VẪN GIỮ trong DB (không xóa — admin vẫn quản lý/dùng lại được, và xóa
      là thao tác phá hủy không được yêu cầu), chỉ là không hiện ra ở bộ lọc.
      `FilterSidebar` đổi type `BrandLite` bỏ field `id` (getBrandsByCategory
      chỉ trả name+slug), key theo `slug`.

      DỮ LIỆU — 3 danh mục, 13 sản phẩm: "Điện máy" đổi thẳng slug/tên thành
      "Tivi" (updateMany trên chính bản ghi cũ, GIỮ NGUYÊN id — không tạo
      category mới rồi xóa cái cũ, tránh phải di chuyển sản phẩm/ghi đè khóa
      ngoại). Xóa danh mục "Phụ kiện". Xóa 23 sản phẩm không còn thuộc danh
      mục nào (19 đồ gia dụng + 4 phụ kiện) — user đã chọn "xóa hẳn" qua
      AskUserQuestion sau khi được hỏi rõ (xóa hẳn / ẩn đi / để tự quyết).

      LỖI TIỀM ẨN đã chặn được nhờ tự kiểm tra trước khi xóa (đúng nguyên tắc
      "không tin ràng buộc DB tự chặn" áp dụng xuyên suốt dự án): script tự
      đếm OrderItem tham chiếu tới các biến thể sắp xóa TRƯỚC — phát hiện 1
      đơn hàng THẬT của chính user (DHMUDZOQM4NBCJ, trạng thái CONFIRMED, đơn
      test chuyển khoản hôm trước) đang chứa "Sunhouse Chảo chống dính đáy
      từ". Xóa sẽ vi phạm khóa ngoại (OrderItem.variantId là quan hệ BẮT
      BUỘC) và quan trọng hơn là mất dữ liệu đơn hàng thật. Đã xử lý: sản
      phẩm nào nằm trong đơn hàng thì GIỮ bản ghi nhưng đặt `status:
      DISCONTINUED` — mọi truy vấn hiển thị (getProducts/getAttributeFacets/
      getBrandsByCategory/getProductsForCompare) đều lọc theo ACTIVE nên nó
      biến mất hoàn toàn khỏi site, còn đơn hàng cũ vẫn nguyên vẹn. Đã xác
      minh lại bằng curl: không còn xuất hiện ở trang chủ/danh mục/tìm kiếm.

      THÊM 6 TIVI MỚI kèm ẢNH THẬT (user chọn phương án này qua
      AskUserQuestion, thay vì để danh mục Tivi chỉ có 1 sản phẩm): Samsung
      QLED 4K Q60D 65" / LG UHD 4K UQ8000 55" / TCL Google Tivi QLED 4K C655
      50" (thêm brand TCL mới) / Xiaomi Google Tivi A Pro 43" / Xiaomi Google
      Tivi A Pro 55" / Philips Google Tivi LED 6900 Series 43". Chọn CÓ CHỦ Ý
      để 3 bộ lọc đều có nhiều giá trị thật: Loại tivi Google(4)/Smart(2),
      kích thước 43(2)/50(1)/55(2)/65(1), độ phân giải 4K(5)/Full HD(1) —
      riêng Philips 43" được chọn chính vì nó là máy Full HD duy nhất, nếu
      không bộ lọc "Độ phân giải" chỉ có 1 giá trị.

      NGUỒN ẢNH (đều là ảnh chính hãng, tải về xem lại BẰNG MẮT qua Read tool
      trước khi dùng, rồi sharp resize 1400px + JPEG q85 + upload Supabase):
      LG lấy og:image rồi đổi đuôi sang `gallery/D-01.jpg` (bản 1600px, thay
      vì `450-0.jpg` nhỏ trong og:image); Xiaomi og:image ở mi.com/vn dùng
      được ngay; Philips og:image kèm tham số `?$png$&wid=1400` để lấy bản
      lớn; TCL og:image là ảnh share CHUNG vô dụng nên phải grep HTML tìm
      `aws-obg-image-lb-*.tcl.com/.../c655/id-images/50-2.png`; Samsung phải
      grep HTML tìm URL `images.samsung.com/.../gallery/...?$Q90_1368_1094_F_JPG$`.
      LƯU Ý MỚI: CDN của TCL trả về nội dung nén gzip kể cả khi không xin —
      `curl` không có `--compressed` sẽ lưu ra file gzip (Read tool báo
      "unrecognized bytes 1f 8b"), tưởng là bị chặn nhưng thực ra chỉ thiếu
      cờ giải nén; thêm `--compressed` là xong.

      CHẶN BOT (cập nhật so với ghi chú lần trước): Sony (sony.com.vn) vẫn
      403 ngay từ request đầu, không qua được. Samsung VN thì cho qua ĐÚNG 1
      request đầu tiên rồi mọi request sau (kể cả URL khác hẳn, kể cả đổi
      sang PowerShell Invoke-WebRequest) đều trả trang `<title>error</title>`
      — nghĩa là chặn theo IP trong 1 khoảng thời gian chứ không phải chặn
      URL. Nhờ vậy vẫn lấy được ảnh Q60D (request đầu), nhưng KHÔNG lấy được
      ảnh cho "Samsung Smart Tivi Crystal UHD 55 inch" (sản phẩm cũ vốn đã
      dùng ảnh placehold.co từ trước). Quyết định: XÓA hẳn sản phẩm đó thay
      vì giữ 1 ảnh minh họa lạc lõng giữa 6 tivi ảnh thật — danh mục Tivi giờ
      100% ảnh thật, và đã có Samsung Q60D đại diện cho Samsung.

      SỬA LẠI THÔNG SỐ TOÀN BỘ 13 SẢN PHẨM cho khớp bộ lọc (viết thẳng vào
      prisma/seed.ts, không dùng script rời — seed vốn đã xóa-rồi-tạo-lại
      attributes mỗi lần chạy nên nó là nguồn chân lý cho bảng thông số).
      QUAN TRỌNG: attrName trong seed phải khớp CHÍNH XÁC chuỗi trong
      CATEGORY_FILTER_SPECS, sai 1 chữ là bộ lọc đó không có giá trị nào để
      chọn — đã viết script audit riêng kiểm tra CẢ 2 chiều: mỗi bộ lọc đều
      có >= 1 giá trị, VÀ mọi sản phẩm ACTIVE đều có đủ từng thông số dùng làm
      bộ lọc (thiếu 1 thông số thì lọc theo nó sẽ làm sản phẩm biến mất khỏi
      kết quả một cách khó hiểu). Kết quả audit: 0 thiếu sót.

      BỎ LỐI VÀO "TẤT CẢ SẢN PHẨM" (user chọn phương án "bỏ lối vào", không
      phải redirect): URL /products VẪN TỒN TẠI và vẫn chạy bình thường —
      bắt buộc, vì đó cũng là trang hiện KẾT QUẢ TÌM KIẾM và trang lọc theo
      danh mục. Chỉ gỡ các ĐƯỜNG DẪN tới nó khi không kèm danh mục: link
      "Sản phẩm" ở thanh nav phụ của Header đổi thành 3 link danh mục thật
      (render động từ `categories` Header vốn đã fetch sẵn cho mega menu —
      cần thiết vì mega menu bị ẩn dưới md, nếu chỉ dựa vào nó thì mobile mất
      hẳn đường vào trang sản phẩm), "Tất cả sản phẩm" ở Footer đổi thành 3
      link danh mục, nút "Xem tất cả sản phẩm" cuối trang chủ xóa hẳn. Các
      nút phụ ở trạng thái rỗng (giỏ hàng trống, wishlist trống, trang so
      sánh trống) đổi về "/" ; nút "+ Thêm sản phẩm" ở trang so sánh trỏ vào
      ĐÚNG danh mục của sản phẩm đang so sánh; breadcrumb trang chi tiết sản
      phẩm đổi gốc "Sản phẩm" -> "Trang chủ" (trước đó 2 cấp đầu đều trỏ
      /products, giờ cấp 1 là trang chủ, cấp 2 là danh mục). Tiêu đề h1 của
      /products giờ hiện TÊN DANH MỤC đang xem thay vì chữ "Sản phẩm" chung
      chung. Mega menu: đổi key icon "dien-may" -> "tivi" (icon tivi vốn đã
      vẽ sẵn, chỉ đổi tên key), xóa icon "phu-kien".

      LỖI THẬT tự phát hiện lúc test (không đợi user báo): banner thứ 3 ở
      trang chủ có `linkUrl` trỏ `/products?category=phu-kien` — danh mục vừa
      bị xóa nên bấm vào ra trang rỗng. Banner không có trang admin quản lý
      nên đã sửa linkUrl thẳng trong DB sang `?category=tivi` (ảnh banner giữ
      nguyên, vẫn là ảnh thật đã làm ở đợt trước).

      Đã test qua dev server (xóa `.next` + restart trước khi test vì thay
      đổi dữ liệu qua script/seed không tự gọi `revalidateTag`; dùng DB thật,
      không mock): `tsc --noEmit`/`eslint`/`npm run build` sạch. Xác nhận
      từng danh mục hiện ĐÚNG bộ lọc user yêu cầu và ĐÚNG THỨ TỰ (grep các
      thẻ `<summary>` trong HTML thật). Lọc thật qua curl, đếm sản phẩm trả
      về: `spec_ram=8gb` loại đúng Samsung (12GB) còn 3 máy;
      `spec_hieu-nang-va-pin=sac-nhanh-tu-60w` ra đúng 1 máy (OPPO);
      `spec_dung-luong-rom=128gb` ra đúng 2 máy có bản 128GB; tivi
      `spec_loai-tivi=smart-tivi` ra đúng Samsung+LG; `spec_do-phan-giai=
      full-hd-1920-x-1080` ra đúng Philips; AND 2 thông số (google-tivi +
      43-inch) ra đúng 2 máy; OR trong 1 thông số (43-inch,65-inch) ra đúng 3
      máy; `brand=xiaomi` trong danh mục tivi ra đúng 2 máy. Xác nhận danh
      sách hãng ở sidebar đúng theo từng danh mục (dien-thoai: Apple/OPPO/
      Samsung/Xiaomi — không có Dell; laptop: Apple/Asus/Dell; tivi: LG/
      Philips/Samsung/TCL/Xiaomi) bằng cách chỉ trích phần `<aside>` (lần đầu
      grep cả trang cho kết quả SAI vì dính luôn các link brand trong mega
      menu của Header). Xác nhận 6 trang chi tiết tivi mới đều 200, đều load
      ảnh Supabase và KHÔNG còn placehold.co ở bất kỳ trang nào. Đã dọn sạch
      toàn bộ script dùng 1 lần + ảnh tạm sau khi chạy xong.

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
- [x] Đã điền BANK_ID/BANK_ACCOUNT_NUMBER/BANK_ACCOUNT_NAME bằng thông tin
      tài khoản ngân hàng thật của user trong .env local — lựa chọn chuyển
      khoản đã hiện ở /checkout. CHƯA thêm 3 biến này vào Environment
      Variables trên Vercel (production vẫn chưa hoạt động được cho tới khi
      làm bước này).
- [x] Mục "CHƯA có ảnh thật cho 4 sản phẩm (Dell UltraSharp, JBL Tune 510BT,
      Samsung Crystal UHD 55, Sony Bravia 43)" KHÔNG còn nữa — cả 4 đã bị xóa
      khỏi DB khi thu gọn về 3 danh mục (xem mục "Thu gọn còn 3 danh mục +
      bộ lọc thông số theo từng danh mục" ở trên). Toàn bộ 13 sản phẩm còn
      lại đều đã có ảnh THẬT, site không còn ảnh placehold.co nào.
- [ ] Danh mục Điện thoại (4 sản phẩm) và Laptop (3 sản phẩm) hơi mỏng nên
      vài bộ lọc gần như không thu hẹp được gì: "Tần số quét" của điện thoại
      chỉ có đúng 1 giá trị (120Hz — cả 4 máy đều 120Hz thật), "CPU" của
      laptop có 3 giá trị nhưng mỗi giá trị đúng 1 máy, "Card đồ họa" chỉ có
      "Card tích hợp" (chưa có laptop gaming nào). Không phải lỗi — chỉ là
      dữ liệu còn ít; thêm vài máy tầm trung (90Hz/60Hz) và 1-2 laptop gaming
      card rời là các bộ lọc này có ý nghĩa ngay, không cần sửa code.
- [ ] Polish CẤU TRÚC (không phải màu sắc — màu đã tự động đổi theo theme
      mới) cho phần còn lại của admin (danh mục, thương hiệu, người dùng,
      cửa hàng, khuyến mãi, bảo hành, thu cũ đổi mới, hỗ trợ, trang tĩnh,
      FAQ) — mới làm mẫu bố cục .card/.btn-primary ở danh sách sản phẩm +
      đơn hàng, xem mục "Làm đẹp giao diện toàn site" ở trên

## Lưu ý quan trọng
- Trên máy Windows này, `pkill -f "next dev"` (Git Bash) KHÔNG kill được tiến
  trình `next dev` thật — process vẫn chạy ngầm giữ nguyên biến môi trường cũ
  trong bộ nhớ dù terminal tưởng đã tắt (đã gặp thật lúc test override
  MOMO_ENDPOINT). Nếu cần chắc chắn tắt hẳn dev server đang chạy, dùng
  `taskkill //PID <pid> //F` (lấy PID qua `ps aux | grep node` hoặc từ dòng
  "Port 3000 is in use by process <pid>" mà `next dev` tự in ra khi phát
  hiện cổng đã bị chiếm).
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
- Sửa dữ liệu TRỰC TIẾP qua seed script/Prisma Studio (bỏ qua các hàm
  mutation của app như createCategory()/createProduct() — những hàm DUY
  NHẤT có gọi revalidateTag) sẽ KHÔNG tự làm mới cache của category/brand/
  store/promotion/FAQ/sản phẩm — trang vẫn hiện dữ liệu cũ dù DB đã đúng
  (đã gặp thật: seed thêm category "Điện máy" xong không hiện ra, phải xóa
  hẳn thư mục `.next` rồi restart `npm run dev` mới thấy). Local thì xóa
  `.next` là xong; trên Vercel thì cứ đợi hết TTL (`revalidate: 60` ở
  getProducts/getActivePromotions) hoặc deploy lại (build mới luôn sạch
  cache) — không cần và không nên cố gọi revalidateTag thủ công từ ngoài
  app cho việc này.