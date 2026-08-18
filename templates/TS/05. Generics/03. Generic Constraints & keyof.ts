// Bài tập 03: Generic Constraints & keyof
// Yêu cầu: Sử dụng ràng buộc Generic và toán tử keyof để lấy thuộc tính đối tượng an toàn kiểu.

// 1. Dùng keyof:
interface IAppConfig {
  dbHost: string;
  dbPort: number;
  apiToken: string;
}
// Hãy tạo một Type Alias `ConfigKeys` chứa tập hợp các key của `IAppConfig` bằng cách dùng keyof.


// 2. Viết hàm `getValue`:
// Nhận vào một đối tượng `obj` kiểu `T`, và một `key` kiểu `K extends keyof T`.
// Hàm trả về giá trị `obj[key]` với kiểu dữ liệu chính xác tương ứng (sử dụng Lookup Type T[K]).
function getValue(obj, key) {
  // Viết logic
}
