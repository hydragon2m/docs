// Bài tập 03: WebSockets
// Yêu cầu: Sử dụng thư viện `ws` để khởi tạo WebSocket server và xử lý tin nhắn.

// 1. Cài đặt thư viện: `npm install ws` (hoặc chạy ngầm giả lập nếu thư viện có sẵn).
// 
// 2. Viết mã khởi tạo một WebSocket Server lắng nghe trên port 8080.
// - Khi có kết nối mới:
//   - Đăng ký lắng nghe sự kiện 'message'.
//   - Khi có tin nhắn dạng chuỗi gửi lên, hãy parse JSON (ví dụ: { event: "chat", data: "hello" }).
//   - Gửi phản hồi lại cho client.
// - Triển khai thêm sự kiện 'close' để in ra log.
