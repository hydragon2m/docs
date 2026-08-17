// Bài tập 09: Optional & readonly Properties (Thuộc tính tùy chọn & chỉ đọc)
// Yêu cầu: Sử dụng modifiers `?` và `readonly` để cấu trúc và bảo vệ các thuộc tính của đối tượng.

// 1. Thuộc tính tùy chọn (Optional Properties)
// Hãy định nghĩa một interface `IUserConfig` mô tả cấu hình người dùng gồm:
// - theme (string)
// - language (string)
// - notificationsEnabled (boolean - thuộc tính tùy chọn)
// - fontSize (number - thuộc tính tùy chọn)
// Khai báo một biến `myConfig` kiểu `IUserConfig` và gán giá trị hợp lệ mà không dùng các thuộc tính tùy chọn.


// 2. Thuộc tính chỉ đọc (readonly Properties)
// Hãy định nghĩa một interface `ISystemToken` đại diện cho một token hệ thống bảo mật cao gồm:
// - hash (string và là readonly)
// - createdTime (string và là readonly)
// Khai báo biến `currentToken` kiểu `ISystemToken`.
// Thử gán lại giá trị cho thuộc tính `hash` sau khi khởi tạo và ghi comment giải thích thông báo lỗi của TS.


// 3. Khác biệt giữa const và readonly (Đọc hiểu và giải thích)
const systemSettings = {
  version: "1.0.0",
  environment: "production"
};
// Dòng dưới đây có bị lỗi compile trong TS không? Tại sao?
systemSettings.version = "1.0.1";
// Giải thích (comment ở đây):
