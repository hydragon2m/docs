// Bài tập 01: Type Annotation
// Yêu cầu: Thêm Type Annotation (chú thích kiểu dữ liệu) cho các biến và hàm dưới đây.

// 1. Khai báo biến productName kiểu string với giá trị "Laptop"
let productName;

// 2. Khai báo biến quantity kiểu number với giá trị 10
let quantity;

// 3. Khai báo biến isAvailable kiểu boolean với giá trị true
let isAvailable;

// 4. Khai báo hàm calculateTotal nhận vào price (number), qty (number) và trả về tổng tiền (number)
function calculateTotal(price, qty) {
  return price * qty;
}

// 5. Khai báo hàm showProductInfo nhận vào name (string), status (boolean) và không trả về gì (void)
// In ra màn hình console thông tin sản phẩm
function showProductInfo(name, status) {
  console.log(`Product: ${name}, Available: ${status}`);
}
