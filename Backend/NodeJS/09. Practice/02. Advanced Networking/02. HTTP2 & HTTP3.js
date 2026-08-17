// Bài tập 02: HTTP/2
// Yêu cầu: Khởi chạy HTTP/2 Secure Server sử dụng mô-đun `http2`.

const http2 = require('http2');
const fs = require('fs');

// 1. Hãy cấu hình và khởi tạo một HTTP/2 Secure Server chạy trên port 8443.
// Sử dụng file key.pem và cert.pem đã tạo ở bài tập 1.
//
// 2. Viết handler cho sự kiện 'stream':
// - Trả về status 200 và nội dung HTML "<h1>HTTP/2 Working!</h1>".
// - Thử dùng trình duyệt truy cập `https://localhost:8443` (hoặc dùng curl -k --http2) để kiểm tra.
