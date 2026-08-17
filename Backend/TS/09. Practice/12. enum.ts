// Bài tập 12: enum (Kiểu liệt kê)
// Yêu cầu: Sử dụng Enum của TypeScript để giải quyết các trường hợp liệt kê hằng số.

// 1. Tạo một Numeric Enum tên là `UserStatus` gồm 3 trạng thái tự động tăng:
// - Pending (bắt đầu từ số 1)
// - Active
// - Banned
// Thử in ra console giá trị của `UserStatus.Active` và in ra tên trạng thái bằng Reverse Mapping của giá trị 3.


// 2. Tạo một String Enum tên là `LogLevel` gồm các cấp độ log hệ thống:
// - Info (giá trị "INFO")
// - Warn (giá trị "WARN")
// - Error (giá trị "ERROR")
// Viết một hàm `logMessage` nhận vào `message` (string) và `level` kiểu `LogLevel` và in ra dạng: "[LEVEL] message".


// 3. Sử dụng Object + as const thay thế Enum (Đọc và tự triển khai)
// Hãy tạo một đối tượng hằng số `OrderStatus` bằng cách sử dụng `as const` chứa các trạng thái:
// - Processing: "processing"
// - Shipped: "shipped"
// - Delivered: "delivered"
// Trích xuất kiểu dữ liệu của đối tượng trên thành Type Alias `OrderStatusType` bằng cách dùng typeof.
