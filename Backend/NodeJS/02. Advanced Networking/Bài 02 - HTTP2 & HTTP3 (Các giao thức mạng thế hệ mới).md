## I. KHÁI QUÁT (OVERVIEW)

### 1. Giới hạn của HTTP/1.1
Giao thức **HTTP/1.1** (ra đời năm 1997) là tiêu chuẩn mạng chạy phần lớn trang web hiện tại. Tuy nhiên, nó gặp phải một nút thắt cổ chai hiệu năng nghiêm ngặt gọi là **Head-of-Line (HoL) Blocking**:
* Trên một kết nối TCP, HTTP/1.1 chỉ cho phép gửi một Request duy nhất và phải đợi phản hồi trả về hoàn tất mới được gửi tiếp Request thứ 2.
* Để load nhanh các tài nguyên (JS, CSS, Ảnh) của trang web, các trình duyệt phải lách luật bằng cách mở đồng thời 6 kết nối TCP song song tới Server, gây tiêu tốn rất nhiều tài nguyên kết nối của hệ thống.

---

### 2. Sự nâng cấp của HTTP/2 và HTTP/3
* **HTTP/2 (2015):** Giải quyết triệt để HoL Blocking ở tầng ứng dụng bằng kỹ thuật **Multiplexing (Dồn kênh)**, cho phép gửi và nhận hàng trăm Request/Response đồng thời trên **duy nhất một kết nối TCP**.
* **HTTP/3 (2022):** Thay thế hoàn toàn giao thức TCP ở tầng vận chuyển bằng giao thức **QUIC** (chạy trên nền **UDP**). Việc này loại bỏ hiện tượng HoL Blocking ở cả tầng mạng và cho phép kết nối cực nhanh (0-RTT Handshake).

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Các tính năng cốt lõi của HTTP/2

#### a. Multiplexing (Dồn kênh)
Dữ liệu truyền tải được chia nhỏ thành các **Frames** (khung tin nhị phân) và gộp chung chảy qua một đường truyền TCP duy nhất. Trình duyệt có thể gửi đồng thời nhiều file ảnh, CSS và JS mà không cần chờ đợi nhau.

#### b. Header Compression (Nén Header - HPACK)
HTTP/1.1 truyền các trường Header dạng văn bản lặp đi lặp lại (như `User-Agent`, `Cookie`). HTTP/2 sử dụng thuật toán **HPACK** nén các Header này và duy trì một bảng tra cứu tĩnh/động giữa Client và Server, giúp giảm tới 85% dung lượng gói tin Header.

#### c. Server Push
Cho phép Server chủ động gửi tài nguyên (như file `style.css`) về cho Client trước khi Client phân tích cú pháp HTML và gửi yêu cầu tải file đó.

---

### 2. HTTP/3 và Giao thức QUIC (UDP)
Dù HTTP/2 dồn kênh rất tốt, nhưng nếu có **1 gói tin TCP bị mất dọc đường**, toàn bộ kết nối TCP sẽ bị dừng lại để đợi truyền lại gói tin đó (HoL Blocking ở tầng TCP).

HTTP/3 chạy trên **QUIC (Quick UDP Internet Connections)**:
* Không dùng TCP, dùng **UDP** nên các luồng truyền tải hoàn toàn độc lập. Gói tin này mất không ảnh hưởng đến gói tin khác.
* Tích hợp sẵn mã hóa TLS 1.3 giúp thiết lập kết nối an toàn chỉ sau 1 vòng bắt tay (1-RTT) hoặc 0 vòng (0-RTT nếu đã kết nối trước đó).

---

### 3. Tạo HTTP/2 Server trong Node.js

Node.js cung cấp sẵn mô-đun **`http2`** để bạn khởi chạy Server HTTP/2 (bắt buộc phải chạy đè lên HTTPS vì các trình duyệt chỉ hỗ trợ HTTP/2 khi có bảo mật):

```javascript
const http2 = require('http2');
const fs = require('fs');

const server = http2.createSecureServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
});

server.on('stream', (stream, headers) => {
  // Đối tượng 'stream' thay thế cho cặp (req, res) truyền thống
  console.log(`Nhận request tại path: ${headers[':path']}`);
  
  stream.respond({
    'content-type': 'text/html; charset=utf-8',
    ':status': 200
  });
  
  stream.end('<h1>Kết nối HTTP/2 thành công!</h1>');
});

server.listen(8443, () => console.log('HTTP/2 Server đang chạy trên port 8443'));
```

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE ANALYSIS)

Hãy cùng xem cách triển khai tính năng **Server Push** trong HTTP/2 để gửi kèm file CSS về cho Client trước khi họ yêu cầu:

```javascript
const http2 = require('http2');
const fs = require('fs');

const server = http2.createSecureServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
});

server.on('stream', (stream, headers) => {
  const path = headers[':path'];

  if (path === '/') {
    // 1. Gửi file HTML chính
    stream.respond({
      'content-type': 'text/html; charset=utf-8',
      ':status': 200
    });
    stream.write('<html><head><link rel="stylesheet" href="/style.css"></head><body><h1>Hello HTTP/2</h1></body></html>');
    
    // 2. Chủ động Push file CSS đi kèm
    stream.pushStream({ ':path': '/style.css' }, (err, pushStream) => {
      if (err) return console.error(err);
      
      pushStream.respond({
        'content-type': 'text/css',
        ':status': 200
      });
      pushStream.end('h1 { color: red; }'); // Gửi nội dung file CSS
    });
    
    stream.end();
  }
});

server.listen(8443);
```

---

## IV. LƯU Ý, CẠM BẪY VÀ QUY TẮC CỐT LÕI (BEST PRACTICES)

> [!CAUTION]
> ### 1. Cạm bẫy lạm dụng Server Push
> Server Push có vẻ rất tuyệt nhưng nếu lạm dụng, bạn sẽ làm lãng phí băng thông của Client. Nếu Client đã lưu file `style.css` trong bộ nhớ đệm (Browser Cache) từ lần truy cập trước, việc Server cố tình Push lại file đó sẽ gây thừa thãi.
> 
> **Quy tắc cốt lõi:** Chỉ dùng Server Push cho các file tài nguyên tối quan trọng và có dung lượng cực nhỏ cần thiết để hiển thị trang web lập tức.

> [!TIP]
> ### 2. Mẹo triển khai thực tế: ALPN (Application-Layer Protocol Negotiation)
> Khi chạy cổng HTTP/2, Server Node.js sử dụng cơ chế **ALPN** để tự động đàm phán với trình duyệt.
> * Nếu trình duyệt hỗ trợ HTTP/2, Server sẽ giao tiếp bằng HTTP/2.
> * Nếu trình duyệt cũ không hỗ trợ, Server sẽ tự động hạ cấp xuống giao tiếp bằng **HTTP/1.1** thông thường để đảm bảo tính tương thích cao nhất.
