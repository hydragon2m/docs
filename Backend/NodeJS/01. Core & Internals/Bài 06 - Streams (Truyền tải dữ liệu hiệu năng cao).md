## I. KHÁI QUÁT (OVERVIEW)

### 1. Vấn đề khi đọc dữ liệu lớn thông thường
Khi sử dụng phương thức đọc file thông thường như `fs.readFile()` để phục vụ người dùng tải xuống một file dung lượng 2GB:
1. Node.js bắt buộc phải đọc **toàn bộ 2GB dữ liệu** đó vào bộ nhớ RAM.
2. Sau đó mới gửi cục dữ liệu 2GB này qua HTTP Response về cho Client.

> [!CAUTION]
> Cách làm này cực kỳ nguy hiểm. Nếu có 10 người dùng tải file cùng lúc, Server sẽ tốn 20GB RAM, dẫn đến tràn bộ nhớ và crash Server lập tức. Hơn nữa, người dùng phải đợi Server đọc xong toàn bộ file vào RAM mới bắt đầu nhận được byte dữ liệu đầu tiên (độ trễ cao).

Để giải quyết triệt để bài toán hiệu năng này, Node.js sử dụng cơ chế **Streams (Luồng dữ liệu)**.

---

### 2. Định nghĩa Streams
**Streams** là cơ chế xử lý dữ liệu bằng cách chia nhỏ tệp tin/gói tin thành các phần rất nhỏ gọi là **chunks (khối dữ liệu)**, và xử lý tuần tự từng chunk một. 

* *Ví dụ tương tự:* Xem phim trên Youtube (Streaming) - bạn không cần tải toàn bộ bộ phim 4K dung lượng 10GB về máy rồi mới xem, mà xem đến đâu, Youtube tải các chunks dữ liệu đến đó.

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Bốn loại Streams cơ bản

TypeScript/Node.js cung cấp 4 loại Stream chính:

| Loại Stream | Tính chất | Ví dụ thực tế |
| :--- | :--- | :--- |
| **`Readable`** | Chỉ cho phép **Đọc** dữ liệu ra. | `fs.createReadStream()`, Incoming HTTP Request (`req`). |
| **`Writable`** | Chỉ cho phép **Ghi** dữ liệu vào. | `fs.createWriteStream()`, Outgoing HTTP Response (`res`). |
| **`Duplex`** | Cho phép cả **Đọc và Ghi** song song. | `net.Socket` (kết nối mạng hai chiều TCP). |
| **`Transform`** | Là Duplex Stream nhưng tự động **biến đổi dữ liệu** khi đi qua. | `zlib.createGzip()` (nén dữ liệu thành file gzip). |

---

### 2. Cơ chế truyền luồng: `.pipe()` và `pipeline`

#### a. Phương thức `.pipe()` truyền thống
Phương thức `.pipe()` kết nối đầu ra của một `Readable` Stream vào đầu vào của một `Writable` Stream, giúp dữ liệu tự động chảy qua.

```javascript
const fs = require('fs');

const readStream = fs.createReadStream('input.txt');
const writeStream = fs.createWriteStream('output.txt');

readStream.pipe(writeStream); // Dữ liệu tự động chảy từ input sang output
```

---

#### b. Hàm `pipeline()` hiện đại (Khuyên dùng)
Mặc dù `.pipe()` rất tiện, nhưng nó có một nhược điểm lớn: **không tự động quản lý lỗi**. Nếu một trong hai stream gặp lỗi (ví dụ file input bị xóa giữa chừng), `.pipe()` sẽ bị rò rỉ file descriptor và không đóng các stream còn lại.

Hàm **`pipeline`** từ mô-đun `stream` giải quyết triệt để lỗi này bằng cách tự động dọn dẹp và hủy toàn bộ các stream trong chuỗi nếu có bất kỳ lỗi nào xảy ra:

```javascript
const { pipeline } = require('stream');
const fs = require('fs');
const zlib = require('zlib');

pipeline(
  fs.createReadStream('large_file.txt'),
  zlib.createGzip(), // Nén dữ liệu trực tiếp khi đang chảy qua
  fs.createWriteStream('large_file.txt.gz'),
  (err) => {
    if (err) {
      console.error('Quy trình Pipeline bị lỗi:', err);
    } else {
      console.log('Nén file thành công và an toàn!');
    }
  }
);
```

---

### 3. Kiến thức nâng cao cực hạn: Khái niệm Sức cản ngược (Backpressure)

> [!IMPORTANT]
> ### Vấn đề chênh lệch tốc độ
> Điều gì xảy ra khi bạn đọc dữ liệu từ một ổ cứng SSD siêu nhanh (Readable Stream trả về 500MB/s) và ghi vào một ổ đĩa mạng hoặc gửi qua kết nối Internet 3G siêu chậm (Writable Stream chỉ ghi được 5MB/s)?
>
> Nếu cứ tiếp tục đọc, các chunks dữ liệu sẽ bị ứ đọng lại trong bộ nhớ RAM chờ được ghi, dẫn đến việc RAM bị phình to (Memory Bloat).

**Backpressure (Sức cản ngược)** là cơ chế tự động của Node.js:
1. Khi Writable Stream bị quá tải (buffer ghi bị đầy), nó sẽ trả về giá trị `false` khi gọi hàm `.write()`.
2. Khi nhận tín hiệu `false`, Readable Stream sẽ **tự động tạm dừng (pause)** việc đọc dữ liệu từ ổ cứng.
3. Khi Writable Stream đã tiêu thụ hết dữ liệu trong buffer và sẵn sàng nhận tiếp, nó phát ra sự kiện `'drain'`.
4. Readable Stream nghe sự kiện `'drain'` và **tiếp tục (resume)** việc đọc dữ liệu.
*Cơ chế này giúp giữ lượng RAM chiếm dụng của Node.js luôn ở mức cực kỳ thấp và ổn định khi truyền dữ liệu.*

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH HIỆU NĂNG (CODE ANALYSIS)

Hãy xem cách viết một Server gửi file cực lớn cho client sử dụng Stream giúp tối ưu RAM vượt trội:

```javascript
const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
  // Tạo Readable Stream đọc file dung lượng lớn
  const src = fs.createReadStream('./huge_movie.mp4');
  
  // Truyền trực tiếp vào HTTP Response (Writable Stream)
  src.pipe(res); 
});

server.listen(3000);
```
### Phân tích bộ nhớ:
Khi Client tải file, Server chỉ tốn khoảng **vài chục Megabytes RAM** (chỉ chứa một vài chunks dữ liệu đang chảy qua đệm), thay vì tốn toàn bộ dung lượng file phim.
