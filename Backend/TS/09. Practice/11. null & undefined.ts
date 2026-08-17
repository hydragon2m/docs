// Bài tập 11: null & undefined
// Yêu cầu: Viết code an toàn, giải quyết các trường hợp dữ liệu có thể bị null/undefined.

// 1. Khai báo biến `dbConnectionString` có kiểu dữ liệu cho phép chứa chuỗi kết nối (string) hoặc có thể chưa có (null).
// Khởi tạo giá trị ban đầu là null.


// 2. Sử dụng toán tử Nullish Coalescing (??)
// Viết hàm `greetWithNickname` nhận vào `username` (string) và `nickname` (string hoặc undefined).
// Hàm trả về chuỗi chào mừng:
// - Nếu có nickname: "Hello, [nickname]"
// - Nếu nickname là undefined: "Hello, [username]"
function greetWithNickname(username, nickname) {
  // Thực hiện viết logic tại đây
}


// 3. Sử dụng Optional Chaining (?.)
// Định nghĩa interface `ICustomer` có thuộc tính `name` (string) và `contact` (optional, chứa đối tượng { email: string }).
// Viết hàm `getCustomerEmail` nhận vào `customer` kiểu `ICustomer` và trả về email của khách hàng đó (hoặc undefined nếu không có).
function getCustomerEmail(customer) {
  // Thực hiện viết logic tại đây
}
