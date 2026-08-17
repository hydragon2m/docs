## I. KHÁI QUÁT (OVERVIEW)

### 1. Tại sao cần WebSockets?
Giao thức HTTP hoạt động theo mô hình **Request - Response (Yêu cầu - Phản hồi)**: Client gửi yêu cầu thì Server mới trả lời, Server không thể tự động chủ động gửi dữ liệu về cho Client khi có cập nhật mới (ví dụ: tin nhắn chat mới, biến động giá cổ phiếu).

Trước đây, lập trình viên phải dùng các kỹ thuật lách luật như **Short Polling** (client liên tục gửi request sau mỗi 2 giây) hoặc **Long Polling** (giữ kết nối HTTP mở cho đến khi có data mới). Các cách này gây trễ và làm lãng phí băng thông cực kỳ lớn do phải gửi liên tục các gói tin HTTP Header cồng kềnh.

**WebSockets** (ra đời năm 2011) giải quyết triệt để vấn đề này bằng cách thiết lập một kết nối **hai chiều song song toàn phần (Full-duplex)**, tồn tại lâu dài trên duy nhất một kết nối TCP.

---

### 2. Quy trình nâng cấp kết nối (WebSocket Handshake)

Kết nối WebSocket ban đầu bắt đầu bằng một HTTP request thông thường, sau đó nâng cấp lên WebSocket thông qua quá trình bắt tay:

```text
  [Client]                                              [Server]
     │                                                     │
     ├────────── 1. HTTP GET /chat ───────────────────────►│
     │            Headers:                                 │
     │            - Upgrade: websocket                     │
     │            - Connection: Upgrade                    │
     │            - Sec-WebSocket-Key: dGhlIHNhbXBsZ...     │
     │                                                     │
     │◄───────── 2. HTTP 101 Switching Protocols ──────────┤
     │            Headers:                                 │
     │            - Upgrade: websocket                     │
     │            - Connection: Upgrade                    │
     │            - Sec-WebSocket-Accept: s3pPLMBiT...     │
     │                                                     │
  [Kênh truyền dữ liệu hai chiều WebSockets (TCP thô)]
```

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Triển khai WebSockets bằng thư viện `ws` trong Node.js

Thư viện **`ws`** là thư viện WebSocket phổ biến và nhẹ nhất trong hệ sinh thái Node.js (đây cũng là thư viện chạy dưới nền của cổng WebSocket Gateway trong NestJS).

#### Cú pháp tạo WebSocket Server:
```javascript
const WebSocket = require('ws');

// Khởi tạo WS Server lắng nghe trên port 8080
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws, req) => {
  // IP của client có sẵn trong req.socket.remoteAddress
  console.log('Client mới đã kết nối!');

  // Lắng nghe tin nhắn gửi lên từ Client
  ws.on('message', (message) => {
    console.log(`Nhận được tin: ${message}`);
    
    // Gửi phản hồi ngược lại cho client
    ws.send(`Server đã nhận: ${message}`);
  });

  ws.on('close', () => {
    console.log('Client đã ngắt kết nối.');
  });
});
```

---

### 2. Cơ chế nhịp tim (Heartbeat - Ping/Pong)

Một trong những vấn đề nghiêm trọng nhất của WebSockets ở Production là **"Kết nối ma" (Ghost Connections)**. Đó là khi thiết bị của Client bị mất mạng đột ngột (đi vào hầm, tắt wifi), Server không nhận được gói tin ngắt kết nối và vẫn tưởng Client đang online, làm rò rỉ tài nguyên bộ nhớ.

Để khắc phục, chúng ta sử dụng cơ chế **Ping/Pong (Heartbeat)** để kiểm tra định kỳ trạng thái sống sót của kết nối:

```javascript
// Thiết lập cờ isAlive cho từng client
wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => ws.isAlive = true); // Client phản hồi Pong -> vẫn sống
});

// Chạy vòng lặp kiểm tra định kỳ mỗi 30 giây
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log('Phát hiện kết nối chết. Đang ngắt kết nối...');
      return ws.terminate(); // Chủ động ngắt kết nối chết
    }
    
    ws.isAlive = false; // Tạm thời đánh dấu là chết
    ws.ping(); // Gửi gói tin Ping yêu cầu phản hồi
  });
}, 30000);

wss.on('close', () => clearInterval(interval));
```

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE ANALYSIS)

Hãy cùng viết một hàm **Broadcast** để gửi tin nhắn của một người dùng tới tất cả những người dùng khác đang online (cơ chế cơ bản của phòng chat):

```javascript
wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    const payload = JSON.parse(data);
    
    // Phát tin cho tất cả client khác đang mở kết nối
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          user: payload.user,
          text: payload.text
        }));
      }
    });
  });
});
```

---

## IV. LƯU Ý, CẠM BẪY VÀ QUY TẮC CỐT LÕI (BEST PRACTICES)

> [!CAUTION]
> ### 1. Cạm bẫy mở rộng hệ thống (Clustering & Scaling WebSockets)
> Vì WebSockets duy trì kết nối trạng thái (Stateful), nếu bạn chạy Server Node.js ở chế độ Cluster hoặc chạy trên nhiều Node Server khác nhau ở tầng Prod:
> * User A kết nối tới Node 1.
> * User B kết nối tới Node 2.
> * Khi User A gửi tin nhắn cho User B, Node 1 hoàn toàn không biết User B ở đâu để chuyển tin nhắn.
>
> **Quy tắc cốt lõi:** Bắt buộc phải sử dụng một bộ chuyển tiếp tin nhắn tập trung (**Pub/Sub của Redis**) ở giữa. Khi Node 1 nhận được tin, nó đẩy tin lên Redis Pub/Sub, các Node khác đăng ký nghe kênh đó sẽ nhận được tin và tự gửi xuống cho các client tương ứng của mình.

> [!WARNING]
> ### 2. Bảo vệ cổng WebSocket (DDoS & Rate Limit)
> Do duy trì kết nối lâu dài, WebSockets rất dễ làm cạn kiệt bộ nhớ Server nếu bị tấn công DDoS (kết nối hàng vạn socket ảo).
>
> Hãy cấu hình giới hạn dung lượng tin nhắn gửi lên (`maxPayload`) trên thư viện `ws` để tránh bị tấn công tràn bộ nhớ đệm (buffer overflow).
