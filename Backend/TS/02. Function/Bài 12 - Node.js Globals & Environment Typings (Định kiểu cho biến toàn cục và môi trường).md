## I. KHÁI QUÁT (OVERVIEW)

Bên cạnh các mô-đun tích hợp sẵn cần phải import, môi trường chạy Node.js cung cấp một tập hợp các đối tượng, biến và hàm toàn cục (**Global Objects & Variables**) luôn có sẵn ở mọi nơi trong mã nguồn (ví dụ: `process`, `Buffer`, `setTimeout()`, `console`...).

Khi viết mã nguồn TypeScript, nếu không định kiểu chặt chẽ cho các thực thể toàn cục này (đặc biệt là biến môi trường `process.env`), chúng ta sẽ mất đi tính Type-safety, dễ gán sai kiểu dữ liệu (vì `process.env` mặc định luôn trả về kiểu `string | undefined`) và không tận dụng được tính năng gợi ý code tự động (Autocomplete) của IDE.

Bài học này sẽ hướng dẫn chi tiết cách khai báo, mở rộng kiểu dữ liệu cho các biến toàn cục của Node.js một cách chuyên nghiệp.

---

## II. CHI TIẾT KỸ THUẬT (DETAILED DEEP DIVE)

### 1. Khai báo mở rộng kiểu cho `process.env` (Declaration Merging)
Mặc định, thuộc tính `process.env` trong TypeScript có kiểu dữ liệu là `NodeJS.ProcessEnv`, trong đó tất cả các key đều được suy luận ở kiểu `string | undefined`. Điều này dẫn đến 2 hạn chế:
1.  Không gợi ý được tên biến môi trường (ví dụ: `process.env.DATABASE_URL` phải gõ tay hoàn toàn).
2.  Không kiểm soát được các biến môi trường bắt buộc của ứng dụng.

#### Giải pháp chuyên nghiệp (Declaration Merging):
Chúng ta sẽ tạo một tệp định nghĩa kiểu toàn cục (thường đặt tên là `global.d.ts` hoặc `environment.d.ts` nằm trong thư mục `./src`) để gộp và mở rộng không gian tên `NodeJS`:

```typescript
// environment.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Định nghĩa kiểu cho các biến môi trường của dự án
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
      DATABASE_URL: string;
      JWT_SECRET: string;
      ENABLE_LOGS?: 'true' | 'false'; // Thuộc tính tùy chọn
    }
  }
}

// Bắt buộc phải có dòng này để file được đối xử như một module định nghĩa kiểu toàn cục
export {};
```

Sau khi khai báo file này, bất kỳ nơi nào trong dự án khi bạn gõ `process.env.` đều sẽ được IDE **tự động gợi ý** và kiểm tra kiểu dữ liệu nghiêm ngặt:

```typescript
const port = parseInt(process.env.PORT, 10); // ✅ Hợp lệ và có autocomplete
// const env = process.env.INVALID_VAR; // ❌ Lỗi biên dịch: Property 'INVALID_VAR' does not exist on type 'ProcessEnv'
```

---

### 2. Định kiểu cho Buffer (Mảng dữ liệu nhị phân)
`Buffer` là một lớp toàn cục (Global Class) của Node.js chuyên dùng để thao tác với các luồng dữ liệu nhị phân thô (raw binary streams).

```typescript
// 1. Tạo Buffer từ một chuỗi văn bản
const buf: Buffer = Buffer.from("Hello", "utf8");

// 2. Chuyển đổi Buffer ngược lại thành chuỗi
const text: string = buf.toString("utf8");

// 3. Đọc dữ liệu nhị phân thô của Buffer
const byteLength: number = buf.length;
const firstByte: number = buf[0]; // Trả về mã ASCII của chữ 'H' (72)
```

---

### 3. Định kiểu cho Global Timers: Node.js vs Trình duyệt
Một lỗi biên dịch cực kỳ kinh điển khi chia sẻ code giữa Frontend và Backend (Isomorphic JavaScript) là kiểu dữ liệu trả về của các hàm thiết lập thời gian (`setTimeout`, `setInterval`).

*   **Môi trường Trình duyệt (Browser):** `setTimeout` trả về một số nguyên định danh kiểu `number`.
*   **Môi trường Node.js Backend:** `setTimeout` trả về một đối tượng hẹn giờ kiểu `NodeJS.Timeout`.

```typescript
// ❌ Lỗi biên dịch trong môi trường Node.js Backend
// const timerId: number = setTimeout(() => {}, 1000); 
// Error: Type 'Timeout' is not assignable to type 'number'.

// ✅ Cách khai báo đúng trong Node.js Backend
const timerId: NodeJS.Timeout = setTimeout(() => {
  console.log("Thực thi sau 1 giây");
}, 1000);

// Xóa timer
clearTimeout(timerId);
```

---

## III. VÍ DỤ MINH HỌA VÀ PHÂN TÍCH CODE (CODE EXAMPLES & ANALYSIS)

### 1. Hàm Khởi chạy và Validate Biến môi trường khi Startup
Trong thực tế, `process.env` luôn trả về kiểu `string`. Chúng ta cần viết hàm kiểm tra và chuyển đổi kiểu dữ liệu (Validation & Parsing) ngay khi ứng dụng khởi chạy để tránh lỗi sập hệ thống về sau:

```typescript
interface AppConfiguration {
  port: number;
  databaseUrl: string;
  isProduction: boolean;
}

function bootstrapConfig(): AppConfiguration {
  const portStr = process.env.PORT;
  const dbUrl = process.env.DATABASE_URL;

  // Kiểm tra thiếu biến bắt buộc
  if (!portStr || !dbUrl) {
    throw new Error("❌ Thiếu cấu hình môi trường bắt buộc (PORT hoặc DATABASE_URL)");
  }

  return {
    port: parseInt(portStr, 10),
    databaseUrl: dbUrl,
    isProduction: process.env.NODE_ENV === "production"
  };
}
```

---

## IV. LƯU Ý CẠM BẪY VÀ QUY TẮC CỐT LÕI (PITFALLS & CORE RULES)

### 1. Tránh sử dụng kiểu `any` khi ép kiểu biến môi trường
Do `process.env` trả về `string | undefined`, nhiều lập trình viên chọn cách ép kiểu nhanh bằng `any` hoặc `as string` mà không kiểm tra dữ liệu thực tế.
*   **Hậu quả:** Nếu biến môi trường đó bị cấu hình thiếu trên server production, ứng dụng sẽ chạy sai logic hoặc crash tại những dòng code sâu bên trong.
*   **Quy tắc:** Luôn viết hàm validate giá trị đầu vào (fail-fast) hoặc cung cấp giá trị mặc định:
    ```typescript
    const port = process.env.PORT || "3000"; // Có giá trị fallback an toàn
    ```

### 2. Cạm bẫy sử dụng `global` variable bừa bãi
Mặc dù bạn có thể khai báo thêm các biến toàn cục mới bằng cách mở rộng interface `globalThis` trong file định nghĩa kiểu:
```typescript
declare global {
  var myGlobalConfig: string;
}
```
*   **Quy tắc:** Hạn chế tối đa việc lạm dụng cơ chế này. Việc sử dụng biến toàn cục tự chế (Global Variables) là một Anti-pattern nguy hiểm, làm code khó debug, khó viết Unit Test và dễ bị xung đột luồng chạy.

---

## 💡 5 QUY TẮC VÀNG KHI XỬ LÝ NODE.JS GLOBALS
1.  **Luôn khai báo Declaration Merging cho process.env:** Tạo tệp `environment.d.ts` ngay khi bắt đầu dự án để quản lý tập trung và nhận autocomplete cho toàn bộ biến môi trường.
2.  **Tuyệt đối không hardcode giá trị nhạy cảm (Secrets):** Đưa toàn bộ API keys, JWT secret, database credentials vào `process.env` và không bao giờ commit các file cấu hình `.env` lên Git.
3.  **Validate cấu hình ngay khi startup (Fail-Fast):** Viết hàm validate cấu hình môi trường ngay dòng đầu tiên của file `index.ts`/`main.ts` để ứng dụng sập ngay lập tức nếu thiếu cấu hình, tránh việc chạy chập chờn về sau.
4.  **Định kiểu chính xác cho Timers:** Luôn ghi rõ kiểu trả về là `NodeJS.Timeout` hoặc `NodeJS.Timer` khi làm việc với setTimeout/setInterval trong Node.js.
5.  **Dùng Buffer một cách an toàn:** Khi chuyển đổi Buffer sang string, luôn chỉ rõ bảng mã chuyển đổi (ví dụ: `buf.toString('utf8')` hoặc `buf.toString('base64')`) để tránh lỗi mã hóa ký tự đặc biệt. Sob.
