## I. KHÁI QUÁT (OVERVIEW)

Node.js ban đầu được thiết kế và viết bằng ngôn ngữ JavaScript thuần, không có hệ thống kiểm soát kiểu dữ liệu tĩnh. Tuy nhiên, khi lập trình Node.js bằng TypeScript, chúng ta cần trình biên dịch hiểu được cấu trúc và kiểu dữ liệu của toàn bộ các API tích hợp sẵn (Core Modules) như `fs`, `path`, `events`, `crypto`...

Để giải quyết vấn đề này, cộng đồng đã xây dựng gói thư viện định nghĩa kiểu dữ liệu **`@types/node`** (nằm trong dự án DefinitelyTyped). Khi cài đặt gói này, TypeScript Compiler sẽ tự động nạp toàn bộ định nghĩa kiểu của các mô-đun cốt lõi của Node.js, cho phép chúng ta lập trình Node.js Backend một cách an toàn và tối ưu hiệu năng phát triển.

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Định kiểu cho File System Module (`fs`)
Mô-đun `fs` cung cấp 3 phong cách lập trình có kiểu dữ liệu trả về khác nhau hoàn toàn:

```typescript
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';

const filePath = './config.json';

// A. Phong cách Synchronous (Đồng bộ)
// Kiểu trả về: Buffer (nếu không truyền encoding) hoặc string (nếu có encoding)
const dataSync: Buffer = fs.readFileSync(filePath);
const dataSyncStr: string = fs.readFileSync(filePath, 'utf8');

// B. Phong cách Callback (Bất đồng bộ truyền thống)
fs.readFile(filePath, 'utf8', (err: NodeJS.ErrnoException | null, data: string) => {
  if (err) {
    console.error(err.code); // Có sẵn các thuộc tính hệ thống như 'code', 'errno'
    return;
  }
  console.log(data);
});

// C. Phong cách Promises (Bất đồng bộ hiện đại - Khuyên dùng)
// Kiểu trả về: Promise<string>
async function loadConfig(): Promise<string> {
  const content = await fsPromises.readFile(filePath, 'utf8');
  return content;
}
```

---

### 2. Xây dựng Typed EventEmitter (Emitter an toàn kiểu dữ liệu)
Mặc định, mô-đun `events` của Node.js sử dụng kiểu dữ liệu `any` cho payload của các sự kiện, rất dễ gây ra lỗi runtime nếu truyền sai tham số:

```typescript
import { EventEmitter } from 'events';
const emitter = new EventEmitter();
emitter.emit('user_login', { userId: 123 }); // Chạy được nhưng không an toàn kiểu
```

#### Giải pháp: Định nghĩa Typed EventEmitter chuyên nghiệp trong TypeScript:
Bằng cách tận dụng kế thừa lớp và định nghĩa cấu trúc sự kiện qua Interface:

```typescript
import { EventEmitter } from 'events';

// 1. Định nghĩa danh sách sự kiện và kiểu payload tương ứng
interface AppEvents {
  userLogin: [data: { userId: string; role: string }];
  userLogout: [userId: string];
  errorOccurred: [err: Error];
}

// 2. Định nghĩa Interface ép kiểu cho EventEmitter
declare interface TypedEventEmitter<T> {
  on<K extends keyof T>(event: K, listener: (...args: T[K]) => void): this;
  emit<K extends keyof T>(event: K, ...args: T[K]): boolean;
}

// 3. Class kế thừa EventEmitter và ép kiểu TypedEventEmitter
class AppNotificationCenter extends EventEmitter {}
interface AppNotificationCenter extends TypedEventEmitter<AppEvents> {}

// Chạy thử nghiệm
const notifier = new AppNotificationCenter();

// Đăng ký sự kiện (Tự động gợi ý tên sự kiện và kiểm soát kiểu dữ liệu payload)
notifier.on("userLogin", (data) => {
  console.log(`User ${data.userId} logged in with role ${data.role}`);
});

notifier.emit("userLogin", { userId: "usr-01", role: "admin" }); // ✅ Hợp lệ
// notifier.emit("userLogin", "usr-01"); // ❌ Lỗi biên dịch: Argument of type 'string' is not assignable to parameter
```

---

### 3. Định kiểu cho Path Module & Crypto Module
Các mô-đun xử lý đường dẫn và mã hóa cũng được định kiểu chặt chẽ:

```typescript
import * as path from 'path';
import * as crypto from 'crypto';

// Path Module
const parsedPath: path.ParsedPath = path.parse('/usr/local/bin/index.js');
// parsedPath có sẵn các thuộc tính: root, dir, base, ext, name

// Crypto Module (Mã hóa)
const hash: crypto.Hash = crypto.createHash('sha256');
hash.update('my-password-123');
const hashResult: string = hash.digest('hex');
```

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE EXAMPLES & ANALYSIS)

### 1. Xử lý Lỗi Hệ thống của Node.js (System Errors)
Khi tương tác với hệ điều hành (file system, network socket), Node.js ném ra các lỗi hệ thống đặc thù. Chúng ta cần ép kiểu về `NodeJS.ErrnoException` để đọc mã lỗi một cách an toàn:

```typescript
import { promises as fs } from 'fs';

async function safeReadFile(path: string): Promise<string | null> {
  try {
    return await fs.readFile(path, 'utf8');
  } catch (error) {
    // Ép kiểu lỗi hệ thống
    const err = error as NodeJS.ErrnoException;
    
    if (err.code === 'ENOENT') {
      console.warn(`File không tồn tại tại đường dẫn: ${path}`);
    } else if (err.code === 'EACCES') {
      console.error(`Không có quyền truy cập file: ${path}`);
    } else {
      console.error(`Lỗi hệ thống không xác định: ${err.message}`);
    }
    return null;
  }
}
```

---

## IV. LƯU Ý CẠM BẪY VÀ QUY TẮC CỐT LÕI (PITFALLS & CORE RULES)

### 1. Phân biệt kiểu Buffer vs String
Các hàm đọc file hoặc nhận dữ liệu qua stream mặc định trả về kiểu `Buffer` (mảng byte nhị phân) chứ không phải `string`.
*   **Cạm bẫy:** Gọi trực tiếp các hàm xử lý chuỗi trên Buffer sẽ gây lỗi biên dịch.
*   **Quy tắc:** Luôn chỉ định rõ ràng `encoding` (ví dụ `'utf8'`) nếu muốn nhận về kiểu `string`, hoặc phải gọi `.toString('utf8')` trên đối tượng Buffer.

### 2. Sự cần thiết của `@types/node`
*   Nếu bạn khởi tạo dự án TypeScript và import `fs` hay `path` mà chưa cài đặt thư viện `@types/node`, trình biên dịch sẽ báo lỗi ngay lập tức: `Cannot find module 'fs' or its corresponding type declarations.`
*   **Giải pháp:** Luôn cài đặt `@types/node` dưới dạng devDependency:
    ```bash
    npm install -D @types/node
    ```

---

## 💡 5 QUY TẮC VÀNG KHI SỬ DỤNG NODE.JS CORE APIS
1.  **Luôn cài đặt đúng phiên bản @types/node:** Đảm bảo phiên bản của `@types/node` khớp với phiên bản runtime Node.js của môi trường production (ví dụ: Node 20 thì cài `@types/node@20`).
2.  **Ưu tiên dùng fs.promises thay cho callback/sync:** Sử dụng API Promises để code sạch sẽ, tránh tắc nghẽn luồng xử lý (Event Loop block) và dễ dàng quản lý kiểu trả về.
3.  **Luôn xây dựng Typed EventEmitter:** Tránh xa việc sử dụng `EventEmitter` mặc định của Node.js mà không có ép kiểu, hãy khai báo interface sự kiện riêng biệt để tránh rò rỉ hoặc sai lệch sự kiện.
4.  **Bắt buộc ép kiểu NodeJS.ErrnoException khi catch lỗi file/network:** Giúp bạn đọc được các thuộc tính hệ thống quan trọng như `.code` (ENOENT, EADDRINUSE) một cách an toàn mà không bị lỗi kiểu `unknown`.
5.  **Chỉ rõ encoding khi đọc file:** Luôn truyền rõ ràng cấu hình `'utf8'` khi đọc file văn bản để TypeScript suy luận kiểu trả về là `string` thay vì `Buffer`.
