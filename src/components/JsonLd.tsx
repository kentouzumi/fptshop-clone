/**
 * Nhúng dữ liệu có cấu trúc schema.org (JSON-LD) — Google dùng để hiện rich
 * result: giá, tình trạng còn hàng, số sao đánh giá ngay trong kết quả tìm
 * kiếm, và breadcrumb thay cho URL trần.
 *
 * Bắt buộc phải dùng `dangerouslySetInnerHTML`: JSON-LD phải là nội dung THÔ
 * bên trong <script>, nếu để React render như text con thì mọi dấu ngoặc kép
 * bị escape thành &quot; và Google không parse được. Đây là chỗ DUY NHẤT trong
 * dự án dùng API này (trước đó rà soát bảo mật ghi rõ "không
 * dangerouslySetInnerHTML") nên xử lý cẩn thận:
 *
 * - Nguồn dữ liệu luôn là object do chính server dựng, đi qua JSON.stringify
 *   nên không thể chèn thẻ HTML nào khác.
 * - Vẫn escape thêm "<" thành <: nếu tên sản phẩm (admin nhập) chứa đúng
 *   chuỗi "</script>" thì trình duyệt sẽ đóng thẻ script sớm và phần còn lại
 *   thành HTML thật — đây là đường XSS lưu trữ kinh điển của JSON-LD.
 *   "<" vẫn là "<" hợp lệ với JSON parser, chỉ khác cách viết.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
