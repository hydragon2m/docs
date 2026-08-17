## I. KHÁI QUÁT (OVERVIEW)

### 1. Vị trí của Node.js trong mô hình mạng OSI
Để xây dựng các hệ thống Backend có khả năng mở rộng (scale) tốt và xử lý hàng triệu kết nối thời gian thực (Real-time), bạn không thể chỉ dừng lại ở giao thức HTTP truyền thống.

Node.js cung cấp các mô-đun cấp thấp giúp bạn can thiệp trực tiếp vào các tầng mạng khác nhau:
* **Tầng 7 (Application Layer):** Mô-đun **`http`** và **`https`** (Dành cho REST APIs, WebSockets).
* **Tầng 4 (Transport Layer):** Mô-đun **`net`** (Dành cho giao thức hướng kết nối **TCP**) và **`dgram`** (Dành cho giao thức không hướng kết nối **UDP**).

---

### 2. Cách libuv quản lý Network I/O (Sử dụng OS Kernel)
Như đã đề cập ở Bài 03, các tác vụ mạng (Network I/O) trong Node.js **không sử dụng Thread Pool** của libuv. Thay vào đó:
1. Khi có kết nối mới hoặc dữ liệu gửi đến, hệ điều hành (OS Kernel) sẽ quản lý các **file descriptors (Sockets)** ở mức phần cứng.
2. libuv sử dụng các cơ chế thăm dò hệ thống hiệu năng cao (như `epoll` trên Linux, `kqueue` trên macOS) để lắng nghe sự kiện từ các Socket này.
3. Khi OS báo hiệu có dữ liệu mới, libuv sẽ lấy dữ liệu đó ra, bọc thành Buffer và gửi về luồng JavaScript chính thực thi callback.
*Nhờ cơ chế này, Node.js có thể xử lý đồng thời hàng vạn kết nối Socket mở (như WebSockets) mà hầu như không tốn tài nguyên luồng CPU.*

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. TCP Sockets với mô-đun `net`

TCP là giao thức hướng kết nối, đảm bảo dữ liệu truyền đi chính xác, đầy đủ và đúng thứ tự (thông qua cơ chế bắt tay 3 bước - 3-way handshake).

#### Cú pháp tạo TCP Server:
```javascript
const net = require('net');

const server = net.createServer((socket) => {
  console.log('Client đã kết nối!');
  
  // socket thực chất là một Duplex Stream (vừa đọc vừa ghi được)
  socket.write('Chào mừng bạn đến với TCP Server!\n');
  
  socket.on('data', (data) => {
    console.log('Dữ liệu nhận được từ Client:', data.toString());
  });
  
  socket.on('end', () => {
    console.log('Client đã ngắt kết nối.');
  });
});

server.listen(8080, () => console.log('TCP Server đang chạy trên port 8080'));
```

---

### 2. UDP Sockets với mô-đun `dgram`

UDP là giao thức truyền tin nhanh, không cần thiết lập kết nối trước, không đảm bảo dữ liệu đến đích hoặc đúng thứ tự. Phù hợp cho các ứng dụng livestreaming, voice chat, game online.

#### Cú pháp tạo UDP Socket:
```javascript
const dgram = require('dgram');
const server = dgram.createSocket('udp4');

server.on('message', (msg, rinfo) => {
  console.log(`Nhận được tin nhắn từ ${rinfo.address}:${rinfo.port}: ${msg}`);
});

server.bind(41234);
```

---

### 3. Giao thức HTTP Sockets

Giao thức HTTP thực chất là một ứng dụng chạy đè lên trên **TCP Sockets**. Mỗi khi Client gửi một HTTP Request, thực chất là nó đang mở một kết nối TCP Socket tới Server, gửi gói tin văn bản định dạng HTTP, nhận lại phản hồi, và đóng kết nối (hoặc giữ lại kết nối nếu dùng `Keep-Alive`).

Trong Node.js, class `http.Server` kế thừa trực tiếp từ `net.Server`.

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE ANALYSIS)

Hãy cùng xem quy trình hoạt động khi tạo một HTTP Server thô bằng mô-đun `http` để hiểu rõ bản chất luồng dữ liệu:

```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  // req: thuộc class http.IncomingMessage (là một Readable Stream)
  // res: thuộc class http.ServerResponse (là một Writable Stream)
  
  let body = '';
  req.on('data', (chunk) => {
    body += chunk; // Đọc từng chunk dữ liệu body gửi lên từ client
  });
  
  req.on('end', () => {
    console.log("Đã đọc xong toàn bộ Body Request:", body);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello from HTTP Server!'); // Kết thúc ghi dữ liệu và đóng socket
  });
});

server.listen(3000);
```

---

## IV. LƯU Ý, CẠM BẪY VÀ QUY TẮC CỐT LÕI (BEST PRACTICES)

> [!CAUTION]
> ### 1. Cạm bẫy cạn kiệt File Descriptors (EMFILE: too many open files)
> Trên hệ điều hành Linux, mọi kết nối mạng (Socket) và mọi file được mở đều được quản lý dưới dạng một **File Descriptor (FD)**. Hệ điều hành luôn giới hạn số lượng tối đa FD mà một tiến trình Node.js được mở đồng thời (mặc định thường là 1024).
> 
> Nếu bạn mở quá nhiều kết nối TCP/HTTP hoặc đọc quá nhiều file cùng lúc mà không đóng chúng lại khi hoàn thành, Node.js sẽ bị sập nguồn kèm lỗi: `Error: EMFILE: too many open files`.
>
> **Quy tắc cốt lõi:**
> - Luôn đặt thời gian chờ (Timeout) cho các kết nối Socket rảnh rỗi (`socket.setTimeout(ms)`).
> - Chủ động đóng các kết nối không hoạt động để trả lại tài nguyên FD cho hệ thống.

> [!WARNING]
> ### 2. Cấu hình HTTP Keep-Alive
> Mặc định trong các phiên bản cũ, Node.js không bật Keep-Alive dài hạn cho các HTTP Agent, nghĩa là mỗi request sẽ tạo mới 1 kết nối TCP và đóng ngay lập tức, làm tăng chi phí bắt tay TCP Handshake.
>
> Trong các ứng dụng NestJS giao tiếp microservice nội bộ, hãy luôn sử dụng một `http.Agent` có cấu hình `{ keepAlive: true }` để tái sử dụng các kết nối TCP có sẵn, giúp tăng tốc độ gọi API lên gấp nhiều lần.
