## 1. Type Annotation là gì?
**Type Annotation** (chú thích kiểu dữ liệu) là cách bạn chủ động chỉ định kiểu dữ liệu cho một biến, tham số hàm, hoặc giá trị trả về của hàm trong TypeScript. 

Đây là công cụ cốt lõi giúp TypeScript kiểm tra lỗi ngay trong lúc viết code (compile-time) trước khi chuyển đổi thành JavaScript để chạy (runtime).

---

## 2. Cú pháp cơ bản
Sử dụng dấu hai chấm `:` sau tên biến hoặc tham số, theo sau là kiểu dữ liệu mong muốn.

```typescript
let tên_biến: kiểu_dữ_liệu = giá_trị;
```

### Ví dụ với các kiểu dữ liệu cơ bản (Primitive Types):
```typescript
let age: number = 25;
let name: string = "Alice";
let isActive: boolean = true;
```

---

## 3. Các vị trí áp dụng Type Annotation

### a. Cho Biến (Variables)
```typescript
let score: number = 100;
```

### b. Cho Tham số của Hàm (Function Parameters)
Nếu không khai báo kiểu dữ liệu cho tham số, TypeScript sẽ cảnh báo lỗi (hoặc coi nó là kiểu `any` nếu không cấu hình chặt chẽ).
```typescript
function greet(name: string) {
  return "Hello " + name;
}
```

### c. Cho Giá trị trả về của Hàm (Function Return Types)
Đặt chú thích kiểu sau dấu ngoặc đơn của danh sách tham số:
```typescript
function add(a: number, b: number): number {
  return a + b;
}
```

---

## 4. Compile-time vs Runtime

> [!IMPORTANT]
> Đây là một khái niệm cực kỳ quan trọng trong TypeScript:
> - **Compile-time (Lúc biên dịch):** TypeScript kiểm tra kiểu dữ liệu dựa trên Type Annotation của bạn. Nếu gán sai kiểu, trình biên dịch sẽ báo lỗi ngay lập tức.
> - **Runtime (Lúc chạy code):** Khi biên dịch sang JavaScript, toàn bộ các Type Annotation sẽ bị loại bỏ hoàn toàn (Type Erasure). Trình duyệt hoặc Node.js chỉ chạy code JavaScript thuần và không hề biết về các kiểu dữ liệu này.

Ví dụ, code TypeScript:
```typescript
let price: number = 100;
```
Khi biên dịch sang JavaScript sẽ chỉ còn:
```javascript
let price = 100;
```

---

## 5. Tại sao cần dùng Type Annotation?
1. **Tránh lỗi ngớ ngẩn:** Ngăn chặn việc vô tình gán sai kiểu dữ liệu (ví dụ: gán chuỗi vào biến tính toán số học).
2. **Tự động gợi ý (Autocompletion):** IDE (VS Code, Cursor...) hiểu rõ biến có thuộc tính/phương thức gì để gợi ý chính xác.
3. **Tài liệu tự giải thích (Self-documenting):** Giúp người đọc code sau này dễ dàng hiểu mục đích và định dạng của dữ liệu.
