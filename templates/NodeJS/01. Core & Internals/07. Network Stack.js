// Bài tập 07: Network Stack (TCP & HTTP Sockets)
// Yêu cầu: Tạo một TCP echo server đơn giản.

const net = require('net');

// 1. Hãy tạo một TCP Server bằng mô-đun `net`:
// - Lắng nghe trên port 8888.
// - Khi có client kết nối (socket):
//   - Gửi lời chào: "Hello from TCP Echo Server!\n".
//   - Khi có dữ liệu gửi lên (sự kiện 'data'): ghi ngược lại chính dữ liệu đó về cho client (Echo).
//   - Khi client ngắt kết nối (sự kiện 'end'): in ra log.
//
// 2. Chạy thử nghiệm bằng terminal:
// - Chạy server: `node "07. Network Stack.js"`
// - Dùng telnet hoặc nc để kết nối: `nc localhost 8888` và gõ chữ gửi thử.
