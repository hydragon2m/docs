// Bài tập 01: HTTPS & SSL/TLS
// Yêu cầu: Khởi chạy một HTTPS Server và dùng HTTPS Client để truy vấn qua chứng chỉ tự ký.

const https = require('https');
const fs = require('fs');

// 1. Hãy thực hiện tạo các file chứng chỉ `key.pem` và `cert.pem` bằng lệnh OpenSSL đã học ở lý thuyết Bài 01.
// 
// 2. Hoàn thành cấu hình khởi tạo một HTTPS Server chạy trên port 4433.
// Đọc file key và cert từ ổ cứng nạp vào options.

const options = {
  // Điền key và cert tại đây
};

function startServer() {
  const server = https.createServer(options, (req, res) => {
    res.writeHead(200);
    res.end("HTTPS Connection Secured!\n");
  });
  
  server.listen(4433, () => console.log("HTTPS Server listening on port 4433"));
}

// 3. Viết mã gọi request:
// Hãy viết một đoạn code sử dụng `https.get` kết nối tới `https://localhost:4433`.
// Nhớ cấu hình `rejectUnauthorized: false` trong Agent để bỏ qua cảnh báo chứng chỉ tự ký.
function makeRequest() {
  // Viết logic gửi request tại đây
}
