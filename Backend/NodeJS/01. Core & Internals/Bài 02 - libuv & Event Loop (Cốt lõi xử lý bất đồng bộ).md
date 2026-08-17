## I. KHÁI QUÁT (OVERVIEW)

### 1. Bản chất đơn luồng (Single-threaded) của Node.js
Một trong những đặc điểm nổi tiếng nhất của Node.js là nó chạy trên mô hình **đơn luồng (Single-thread)**. Có nghĩa là, tại một thời điểm, chỉ có duy nhất một CPU Thread thực thi mã nguồn JavaScript của bạn. 

Tuy nhiên, Node.js lại có khả năng chịu tải hàng nghìn yêu cầu I/O (đọc file, gọi database, gọi HTTP) cùng một lúc mà không bị treo. Sức mạnh này có được là nhờ kiến trúc **Non-blocking I/O (Không nghẽn)** được quản lý bởi **libuv** thông qua công cụ cốt lõi: **Event Loop**.

---

### 2. Thư viện libuv là gì?
**libuv** là một thư viện đa nền tảng viết bằng C++, ban đầu được phát triển riêng cho Node.js. Nhiệm vụ chính của libuv là cung cấp cơ chế bất đồng bộ dựa trên sự kiện (Event-driven asynchronous I/O). 

libuv chịu trách nhiệm quản lý:
* **Event Loop** (Vòng lặp sự kiện).
* **Thread Pool** (Bể luồng để chạy các tác vụ nặng).
* Tương tác với cơ chế thông báo I/O bất đồng bộ của hệ điều hành (như `epoll` trên Linux, `kqueue` trên macOS, và `IOCP` trên Windows).

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Cấu trúc 6 pha của Event Loop

Event Loop không phải là một vòng lặp `while (true)` chạy hỗn loạn. Nó là một quy trình lặp đi lặp lại gồm **6 pha (phases) có thứ tự nghiêm ngặt**. Mỗi pha sở hữu một hàng đợi (Queue) chứa các hàm callback cần thực thi:

```text
       ┌──────────────────────────────────────────────┐
 ───►  │ 1. TIMERS (setTimeout, setInterval)          │
       └──────────────────────┬───────────────────────┘
       ┌──────────────────────▼───────────────────────┐
       │ 2. PENDING CALLBACKS (Trì hoãn I/O)          │
       └──────────────────────┬───────────────────────┘
       ┌──────────────────────▼───────────────────────┐
       │ 3. IDLE, PREPARE (Sử dụng nội bộ)            │
       └──────────────────────┬───────────────────────┘
       ┌──────────────────────▼───────────────────────┐
       │ 4. POLL (Nhận sự kiện I/O mới & chạy cb)     │ ◄─── (Kết nối mới...)
       └──────────────────────┬───────────────────────┘
       ┌──────────────────────▼───────────────────────┐
       │ 5. CHECK (setImmediate)                      │
       └──────────────────────┬───────────────────────┘
       ┌──────────────────────▼───────────────────────┐
       │ 6. CLOSE CALLBACKS (Ví dụ: socket.on('close'))│
       └──────────────────────────────────────────────┘
```

#### Pha 1: Timers
* **Nhiệm vụ:** Thực thi các callback đã quá hạn được lên lịch bởi `setTimeout()` và `setInterval()`.
* *Lưu ý:* Thời gian hẹn giờ chỉ là khoảng thời gian *tối thiểu* trước khi callback được gọi, không phải là thời gian chạy chính xác tuyệt đối.

#### Pha 2: Pending Callbacks
* **Nhiệm vụ:** Thực thi các I/O callbacks bị trì hoãn từ vòng lặp trước (ví dụ: lỗi mạng TCP hệ điều hành báo về).

#### Pha 3: Idle, Prepare
* **Nhiệm vụ:** Chỉ được sử dụng nội bộ bởi Node.js để chuẩn bị cho pha tiếp theo.

#### Pha 4: Poll (Thăm dò)
* **Nhiệm vụ:** Đây là pha quan trọng nhất, nơi Node.js dành phần lớn thời gian ở đó. 
  1. Tính toán thời gian Event Loop sẽ bị chặn (block) và thăm dò các sự kiện I/O mới.
  2. Thực thi các callback liên quan đến I/O (đọc ghi file, kết nối mạng...).
  * Nếu hàng đợi Poll trống:
    * Nếu có `setImmediate()` đã lên lịch, Event Loop sẽ kết thúc pha Poll và chuyển sang pha **Check**.
    * Nếu không có `setImmediate()`, Event Loop sẽ **đợi** tại pha này cho đến khi có sự kiện I/O mới hoặc các Timer sắp hết hạn.

#### Pha 5: Check
* **Nhiệm vụ:** Thực thi ngay lập tức các callback được lên lịch bởi **`setImmediate()`**.

#### Pha 6: Close Callbacks
* **Nhiệm vụ:** Thực thi các callback liên quan đến sự kiện đóng kết nối, ví dụ: `socket.on('close', ...)`.

---

### 2. Các hàng đợi đặc biệt: Next Tick Queue và Microtask Queue

Bên cạnh 6 pha chính của Event Loop, Node.js còn sở hữu hai hàng đợi đặc biệt chạy ở tốc độ cao:
1. **Next Tick Queue:** Chứa các callback đăng ký qua `process.nextTick()`.
2. **Microtask Queue:** Chứa các callback xử lý `Promise.then/catch/finally` và `queueMicrotask()`.

> [!IMPORTANT]
> ### Quy luật xen kẽ (Execution Priority)
> Hai hàng đợi này **không thuộc về bất kỳ pha nào** của Event Loop.
> 
> Thay vào đó, ngay sau khi kết thúc một tác vụ hiện tại trong bất kỳ pha nào, và trước khi chuyển sang pha tiếp theo, Node.js sẽ **dừng lại** và thực thi toàn bộ các callback trong **Next Tick Queue** trước, sau đó là **Microtask Queue**.
>
> Thứ tự ưu tiên: `process.nextTick()` > `Promise` callbacks.

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH THỨ TỰ CHẠY (CODE ANALYSIS)

Hãy cùng phân tích thứ tự in ra console của đoạn code bất đồng bộ kinh điển sau:

```javascript
const fs = require('fs');

console.log("1. Start");

setTimeout(() => {
  console.log("2. Timeout");
}, 0);

setImmediate(() => {
  console.log("3. Immediate");
});

fs.readFile(__filename, () => {
  console.log("4. Read File");
  
  setTimeout(() => {
    console.log("5. Nested Timeout");
  }, 0);
  
  setImmediate(() => {
    console.log("6. Nested Immediate");
  });
});

process.nextTick(() => {
  console.log("7. Next Tick");
});

Promise.resolve().then(() => {
  console.log("8. Promise");
});

console.log("9. End");
```

### Kết quả in ra thực tế:
```text
1. Start
9. End
7. Next Tick
8. Promise
2. Timeout  (hoặc 3. Immediate - không cố định khi chạy ở global)
3. Immediate
4. Read File
6. Nested Immediate
5. Nested Timeout
```

### Phân tích chi tiết dòng chảy (Control Flow):
1. Code đồng bộ chạy trước: In ra `1. Start` và `9. End`.
2. Hết đoạn code đồng bộ, trước khi vào Event Loop, Node.js dọn dẹp các hàng đợi ưu tiên:
   * Chạy **Next Tick Queue** -> In ra `7. Next Tick`.
   * Chạy **Microtask Queue** -> In ra `8. Promise`.
3. Event Loop bắt đầu chạy:
   * **Pha 1 (Timers):** Chạy callback của `setTimeout` -> In ra `2. Timeout`.
   * **Pha 5 (Check):** Chạy callback của `setImmediate` -> In ra `3. Immediate`.
4. Khi I/O đọc file hoàn thành, callback của `fs.readFile` được đưa vào hàng đợi:
   * **Pha 4 (Poll):** Thực thi callback đọc file -> In ra `4. Read File`.
   * Bên trong callback này, ta đăng ký thêm 1 `setTimeout` và 1 `setImmediate`.
   * Sau khi hoàn thành pha Poll, vì có `setImmediate` đã đăng ký, Event Loop bắt buộc phải nhảy sang **Pha 5 (Check)** trước.
   * **Pha 5 (Check) lúc này:** Chạy callback `setImmediate` mới -> In ra `6. Nested Immediate`.
   * Vòng lặp tiếp tục xoay sang vòng mới và đến **Pha 1 (Timers)** -> Chạy `setTimeout` mới -> In ra `5. Nested Timeout`.

---

## IV. LƯU Ý, CẠM BẪY VÀ QUY TẮC CỐT LÕI (BEST PRACTICES)

> [!CAUTION]
> ### 1. Cấm tuyệt đối việc chặn Event Loop (Block the Event Loop)
> Vì JavaScript chạy đơn luồng, nếu bạn chạy một thuật toán tính toán CPU quá nặng (ví dụ: parse file JSON dung lượng 500MB, hoặc chạy vòng lặp tính số Fibonacci vô tận), luồng chính sẽ bị nghẽn.
> 
> Khi luồng chính nghẽn, Event Loop không thể di chuyển sang các pha tiếp theo để nhận các Request HTTP mới, khiến toàn bộ Server bị "đơ" đối với tất cả người dùng khác.
>
> **Quy tắc cốt lõi:**
> - Tránh các tác vụ đồng bộ nặng.
> - Đẩy các tác vụ nặng về CPU sang **Worker Threads** (đa luồng thực tế trong Node.js) hoặc tách thành các dịch vụ microservice riêng biệt.

> [!WARNING]
> ### 2. Sự không cố định giữa `setTimeout(fn, 0)` và `setImmediate`
> Nếu bạn gọi cả 2 hàm này ở phạm vi toàn cục (global scope), thứ tự chạy của chúng không được đảm bảo cố định mà phụ thuộc vào tốc độ khởi tạo của hệ điều hành.
>
> Tuy nhiên, nếu gọi cả 2 hàm này **bên trong một callback I/O** (ví dụ bên trong `fs.readFile`), **`setImmediate` luôn luôn chạy trước `setTimeout`** do vòng lặp đi từ pha Poll sang pha Check trước khi quay lại pha Timers.
