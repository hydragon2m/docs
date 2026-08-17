// Bài tập 03: Primitive Types (Các kiểu dữ liệu cơ bản)
// Yêu cầu: Thêm chú thích kiểu nguyên thủy chính xác cho các biến dưới đây và giải quyết yêu cầu.

// 1. Thêm kiểu dữ liệu cho biến `username` và biến `age`
let username = "john_doe";
let age = 30;

// 2. Thêm kiểu dữ liệu cho biến cờ trạng thái `isVerified`
let isVerified = false;

// 3. Khai báo một hàm `formatPrice` nhận vào `price` (number) và trả về một chuỗi dạng "$X" (string)
// Ví dụ: formatPrice(10) -> "$10"
function formatPrice(price) {
  return `$${price}`;
}

// 4. Đoạn khai báo kiểu dữ liệu sau đây có một lỗi nghiêm trọng về Best Practice trong TS. Hãy sửa lại cho đúng.
let adminEmail: String = "admin@example.com";
