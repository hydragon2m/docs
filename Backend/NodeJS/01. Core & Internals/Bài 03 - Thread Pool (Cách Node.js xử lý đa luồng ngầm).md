## I. KHÁI QUÁT (OVERVIEW)

### 1. Tại sao Node.js đơn luồng lại có Đa luồng chạy ngầm?
Mặc dù luồng chính thực thi JavaScript (V8 Engine) là đơn luồng, nhưng trong thực tế, có nhiều tác vụ máy tính bắt buộc phải tốn thời gian xử lý và không thể thực hiện bất đồng bộ ở mức độ phần cứng của hệ điều hành (ví dụ: băm mật khẩu bằng thuật toán phức tạp, giải nén file ZIP, hoặc đọc ghi ổ cứng HDD/SSD).

Nếu luồng chính thực hiện các việc này, Server sẽ bị nghẽn (block). Để giải quyết, **libuv** duy trì một hệ thống đa luồng chạy ngầm viết bằng C++ gọi là **Thread Pool (Bể luồng)** để gánh vác toàn bộ các tác vụ nặng nề này ra khỏi luồng JavaScript chính.

---

### 2. Sự khác biệt cốt lõi: Kernel I/O vs Thread Pool I/O

libuv xử lý các tác vụ bất đồng bộ theo hai cơ chế hoàn toàn khác nhau:

1. **Cơ chế Network (Không dùng Thread Pool):** Các hoạt động liên quan đến mạng (Network I/O như TCP, HTTP Socket) được libuv ủy quyền trực tiếp cho **Lõi hệ điều hành (OS Kernel)** xử lý thông qua cơ chế thông báo mạng của OS (như `epoll` trên Linux). Các tác vụ này hoàn toàn **không tốn luồng** của Thread Pool.
2. **Cơ chế File System & Cryptography (Dùng Thread Pool):** Các hệ điều hành không hỗ trợ đầy đủ cơ chế bất đồng bộ cho việc đọc ghi file hoặc tính toán toán học nặng. Lúc này, libuv bắt buộc phải sử dụng các luồng trong **Thread Pool** để xử lý đồng thời.

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Cấu trúc hoạt động của libuv Thread Pool

Mặc định, libuv khởi tạo một Thread Pool gồm **4 luồng (workers)** chạy song song dưới nền C++:

```mermaid
flowchart TD
    MainJS["Luồng chính JS (V8)"] -->|Gọi tác vụ nặng (ví dụ: fs.readFile)| libuv["libuv nhận yêu cầu và đẩy vào Hàng đợi"]
    libuv --> ThreadPool
    
    subgraph ThreadPool["LIBUV THREAD POOL"]
        T1["Thread 1<br/>(Đang xử lý)"]
        T2["Thread 2<br/>(Đang xử lý)"]
        T3["Thread 3<br/>(Rảnh rỗi)"]
        T4["Thread 4<br/>(Rảnh rỗi)"]
    end

    ThreadPool -->|Tác vụ chạy xong dưới nền| PollQueue["Đẩy Callback vào Hàng đợi Poll of Event Loop"]
    PollQueue --> Done["Chạy callback trên luồng chính"]
```

---

### 2. Các tác vụ sử dụng Thread Pool trong Node.js

Chỉ có 4 nhóm mô-đun chính sau đây trong Node.js sử dụng Thread Pool để xử lý:

1. **File System (fs):** Tất cả các phương thức đọc ghi file bất đồng bộ (như `fs.readFile`, `fs.writeFile`, ngoại trừ các phiên bản đồng bộ `fs.readFileSync`).
2. **Cryptography (crypto):** Các hàm băm mật khẩu và mã hóa nặng như `crypto.pbkdf2()`, `crypto.scrypt()`, `crypto.randomBytes()`.
3. **Compression (zlib):** Các tác vụ nén và giải nén dữ liệu (`zlib.gzip()`, `zlib.unzip()`).
4. **DNS (dns):** Phương thức phân giải tên miền thành IP `dns.lookup()`.

---

### 3. Cấu hình kích thước bể luồng: `UV_THREADPOOL_SIZE`

Vì Thread Pool mặc định chỉ có 4 luồng, nếu ứng dụng của bạn thực hiện đồng thời 5 tác vụ nặng (ví dụ: băm 5 mật khẩu cùng lúc), tác vụ thứ 5 bắt buộc phải **đợi** cho đến khi một trong 4 tác vụ trước hoàn thành và giải phóng luồng.

Để nâng cao hiệu năng cho Server có nhiều nhân CPU, bạn có thể thay đổi số lượng luồng của Thread Pool bằng cách cấu hình biến môi trường **`UV_THREADPOOL_SIZE`** trước khi chạy ứng dụng:

* **Giá trị mặc định:** `4`
* **Giá trị tối đa:** `1024`

```bash
# Trên Linux/macOS
export UV_THREADPOOL_SIZE=8
node server.js

# Trên Windows (PowerShell)
$env:UV_THREADPOOL_SIZE=8
node server.js
```

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH HIỆU NĂNG (PERFORMANCE ANALYSIS)

Hãy xem đoạn code băm mật khẩu đồng thời bằng thư viện `crypto` dưới đây để thấy rõ nút thắt cổ chai (bottleneck) của Thread Pool:

```javascript
const crypto = require('crypto');

const start = Date.now();

function hash() {
  crypto.pbkdf2('password', 'salt', 100000, 512, 'sha512', () => {
    console.log(`Hash finished in: ${Date.now() - start} ms`);
  });
}

// Chạy đồng thời 5 tác vụ băm mật khẩu nặng
hash(); // Tác vụ 1
hash(); // Tác vụ 2
hash(); // Tác vụ 3
hash(); // Tác vụ 4
hash(); // Tác vụ 5
```

### Kết quả đo lường thực tế (với Thread Pool size mặc định = 4):
```text
Hash finished in: 210 ms
Hash finished in: 215 ms
Hash finished in: 220 ms
Hash finished in: 225 ms
Hash finished in: 425 ms  <─── Tác vụ 5 tốn thời gian GẤP ĐÔI!
```

### Phân tích nguyên nhân:
* 4 tác vụ đầu tiên được phân bổ ngay vào 4 luồng của Thread Pool và chạy song song, hoàn thành sau khoảng **210ms - 225ms**.
* Tác vụ thứ 5 không còn luồng trống nào, buộc phải nằm chờ trong hàng đợi.
* Ngay khi luồng 1 chạy xong ở giây thứ 210ms, tác vụ 5 mới được nạp vào luồng đó và mất thêm 200ms nữa để băm, dẫn đến tổng thời gian hoàn thành là **425ms**.

*Nếu bạn cấu hình `process.env.UV_THREADPOOL_SIZE = 5` trước khi chạy, cả 5 tác vụ sẽ hoàn thành đồng thời sau khoảng 220ms.*

---

## IV. LƯU Ý, CẠM BẪY VÀ QUY TẮC CỐT LÕI (BEST PRACTICES)

> [!CAUTION]
> ### 1. Cạm bẫy thiết lập kích thước Thread Pool quá lớn
> Bạn có thể nghĩ: *"Vậy thì cứ set UV_THREADPOOL_SIZE lên 100 hay 1000 cho nhanh?"*. Đây là quan điểm sai lầm.
> 
> Việc tạo ra một Thread ngủ đông tốn tài nguyên bộ nhớ của OS. Hơn nữa, việc chuyển đổi ngữ cảnh (Context Switching) giữa quá nhiều luồng trên một CPU có số lượng nhân thực tế giới hạn (ví dụ chip chỉ có 4 nhân hoặc 8 nhân) sẽ làm tiêu tốn rất nhiều tài nguyên CPU, khiến tổng hiệu năng hệ thống bị **suy giảm nghiêm trọng**.
>
> **Quy tắc cốt lõi:** Kích thước Thread Pool tối ưu nhất thường bằng **số lượng nhân vật lý (Physical Cores)** của CPU của Server.

> [!WARNING]
> ### 2. Phân biệt `dns.lookup` vs `dns.resolve`
> * **`dns.lookup()`**: Sử dụng Thread Pool vì nó gọi trực tiếp API đồng bộ `getaddrinfo()` của hệ điều hành dưới nền C++. Hàm này dễ làm nghẽn Thread Pool nếu mạng chậm.
> * **`dns.resolve()`**: Thực hiện truy vấn mạng không nghẽn bằng mã JavaScript thuần, hoàn toàn **không sử dụng Thread Pool**. Hãy ưu tiên dùng `dns.resolve` nếu bạn cần hiệu năng cao.
