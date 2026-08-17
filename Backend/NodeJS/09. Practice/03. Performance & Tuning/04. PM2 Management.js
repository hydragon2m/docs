// Bài tập 04: Production Process Management with PM2
// Yêu cầu: Viết một script và viết file `ecosystem.config.js` đi kèm để chạy PM2.

// 1. Hãy tạo file `ecosystem.config.js` cùng thư mục chứa cấu hình chạy ở chế độ Cluster.
// 2. Viết code xử lý Graceful Shutdown:
//    - Lắng nghe sự kiện `SIGINT`.
//    - Log thông tin đóng kết nối an toàn.
//    - Gọi `process.exit(0)` sau 1 giây.

const http = require('http');

const server = http.createServer((req, res) => {
  res.end(`App running with PID: ${process.pid}`);
});

server.listen(3000, () => console.log('Server running on port 3000'));

// Viết code xử lý SIGINT tại đây
process.on('SIGINT', () => {
  console.log('Graceful shutdown starting...');
  // Thực hiện close server
});
