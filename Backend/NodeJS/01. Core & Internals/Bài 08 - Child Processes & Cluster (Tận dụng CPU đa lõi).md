## I. KHÁI QUÁT (OVERVIEW)

### 1. Giới hạn đơn nhân CPU của Node.js
Như bạn đã học ở các bài trước, tiến trình (Process) Node.js chạy mã JavaScript của bạn trên một luồng duy nhất. Do đó, dù bạn thuê một máy chủ Cloud Server vô cùng đắt tiền có CPU 16 nhân (16 Cores), thì một ứng dụng Node.js thông thường cũng **chỉ chạy trên duy nhất 1 nhân**, để lãng phí hoàn toàn 15 nhân còn lại.

Để giải quyết bài toán tối ưu hóa phần cứng và tận dụng sức mạnh đa nhân của CPU, Node.js cung cấp hai giải pháp:
1. **`child_process`**: Cho phép tạo các tiến trình con độc lập chạy các lệnh hệ điều hành hoặc file script.
2. **`cluster`**: Cho phép nhân bản (fork) tiến trình Node.js hiện tại thành nhiều tiến trình con chạy song song và **chia sẻ chung một cổng mạng (port)**.

---

### 2. Sự khác biệt cốt lõi: Multi-threading (Đa luồng) vs Multi-processing (Đa tiến trình)
* **Worker Threads (Đa luồng):** Các luồng chạy chung trong một tiến trình, **chia sẻ chung vùng nhớ RAM**. Thích hợp cho các tác vụ tính toán CPU nặng nhưng cần chia sẻ dữ liệu nhanh.
* **Child Processes / Cluster (Đa tiến trình):** Mỗi tiến trình con là một chương trình độc lập chạy trên một vùng nhớ RAM **hoàn toàn cô lập**. Chúng giao tiếp với nhau qua cơ chế IPC (Inter-Process Communication). Thích hợp cho việc scale ứng dụng Web Server.

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Mô-đun `child_process` và các phương thức khởi tạo

Mô-đun `child_process` cung cấp 4 phương thức chính để tạo tiến trình con:

#### a. `spawn()` (Stream-based - Tốc độ cao)
* **Đặc điểm:** Khởi chạy tiến trình con và trả về dữ liệu dạng **Stream** (Readable).
* **Ứng dụng:** Lý tưởng cho các tác vụ trả về lượng dữ liệu cực lớn hoặc chạy liên tục thời gian dài (ví dụ: chạy một script backup dữ liệu, convert video).

```javascript
const { spawn } = require('child_process');
const ls = spawn('ls', ['-lh', '/usr']); // Chạy lệnh ls liệt kê file

ls.stdout.on('data', (data) => {
  console.log(`Dữ liệu chảy về: ${data}`);
});
```

---

#### b. `exec()` (Buffer-based - Tiện dụng)
* **Đặc điểm:** Khởi chạy tiến trình con, gom toàn bộ kết quả đầu ra vào một **Buffer** trong bộ nhớ và trả về thông qua một hàm callback.
* **Ứng dụng:** Thích hợp cho các lệnh hệ điều hành chạy nhanh và trả về ít kết quả.
* *Cảnh báo:* Dễ bị tràn bộ nhớ nếu dữ liệu trả về lớn hơn giới hạn đệm (mặc định 1MB).

```javascript
const { exec } = require('child_process');
exec('node -v', (error, stdout, stderr) => {
  if (error) return console.error(error);
  console.log(`Phiên bản Node: ${stdout.trim()}`);
});
```

---

#### c. `fork()` (Mô-đun hóa tiến trình Node.js)
* **Đặc điểm:** Là một trường hợp đặc biệt của `spawn` chuyên dùng để **chạy một file script Node.js khác**.
* **Ưu điểm:** Tự động thiết lập kênh giao tiếp hai chiều **IPC** giúp tiến trình cha và con có thể gửi tin nhắn qua lại dễ dàng bằng hàm `.send()` và sự kiện `.on('message')`.

---

### 2. Mô-đun `cluster` và cơ chế chia sẻ Port mạng

Mô-đun `cluster` hoạt động theo mô hình **Primary/Master và Worker**:
1. **Primary Process (Tiến trình chính):** Không trực tiếp nhận Request. Nhiệm vụ duy nhất của nó là khởi tạo và quản lý vòng đời của các tiến trình Worker.
2. **Worker Processes (Tiến trình làm việc):** Mỗi Worker là một tiến trình Node.js độc lập chạy trên một nhân CPU riêng. Tất cả các Worker sẽ cùng lắng nghe chung trên một cổng mạng (ví dụ port 3000) nhờ cơ chế điều phối của Primary.

#### Cơ chế điều phối (Load Balancing):
Mặc định trên các hệ thống phi Windows (Linux, macOS), tiến trình Primary sử dụng thuật toán **Round-Robin** để phân bổ đều các kết nối HTTP mới đến các Worker đang rảnh rỗi, tránh tình trạng một Worker bị quá tải trong khi các Worker khác rảnh rỗi.

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE ANALYSIS)

Dưới đây là mã nguồn xây dựng một Cluster Server chuẩn hóa có khả năng tự động nhân bản theo số lượng nhân CPU thực tế của máy:

```javascript
const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length; // Lấy số lượng nhân CPU thực tế

if (cluster.isPrimary) {
  console.log(`[Primary] Tiến trình chính đang chạy với PID: ${process.pid}`);
  console.log(`[Primary] Phát hiện CPU có ${numCPUs} nhân. Đang tạo các Worker...`);

  // Nhân bản tiến trình tương ứng với số nhân CPU
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Lắng nghe nếu có Worker nào bị crash đột ngột
  cluster.on('exit', (worker, code, signal) => {
    console.log(`[Primary] Worker ${worker.process.pid} bị sập. Đang khởi tạo lại...`);
    cluster.fork(); // Tự động hồi sinh Worker mới (High Availability)
  });

} else {
  // Các tiến trình làm việc (Workers) sẽ chạy đoạn code này
  http.createServer((req, res) => {
    res.writeHead(200);
    res.end(`Phản hồi từ Worker PID: ${process.pid}\n`);
  }).listen(3000);

  console.log(`[Worker] Khởi tạo thành công Worker với PID: ${process.pid}`);
}
```

---

## IV. LƯU Ý, CẠM BẪY VÀ QUY TẮC CỐT LÕI (BEST PRACTICES)

> [!CAUTION]
> ### 1. Cạm bẫy "Không chia sẻ bộ nhớ" (Shared State Issue)
> Vì các Worker trong Cluster là các tiến trình hoàn toàn độc lập, chúng **không hề chia sẻ chung vùng nhớ RAM**.
> 
> Nếu bạn lưu trữ Session đăng nhập hoặc bộ đệm dữ liệu (Cache) trong một biến JavaScript cục bộ:
> * Khi Request 1 đến Worker A, thông tin được lưu.
> * Khi Request 2 đến Worker B, Worker B hoàn toàn không biết thông tin đó, khiến người dùng bị văng đăng nhập.
>
> **Quy tắc cốt lõi:**
> - Tuyệt đối không lưu trữ các dữ liệu cần đồng nhất (Stateful data) trong bộ nhớ RAM cục bộ của Node.js khi chạy Cluster.
> - Bắt buộc phải sử dụng các dịch vụ lưu trữ ngoài tập trung như **Redis** hoặc cơ sở dữ liệu để chia sẻ State giữa các tiến trình con.

> [!TIP]
> ### 2. Ứng dụng thực tế: Sử dụng PM2 trong Production
> Việc tự viết code quản lý bằng mô-đun `cluster` như ví dụ trên thường tốn công sức bảo trì. 
> 
> Trong thực tế, các doanh nghiệp thường viết code Server Node.js dạng đơn luồng thông thường, sau đó sử dụng một công cụ quản lý tiến trình chuyên nghiệp là **PM2** để chạy ở chế độ Cluster tự động bằng lệnh:
> `pm2 start app.js -i max` (Tự động tạo số lượng tiến trình tối đa tương ứng với nhân CPU).
