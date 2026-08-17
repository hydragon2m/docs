## 1. Type Inference là gì?
**Type Inference** (Suy luận kiểu dữ liệu) là khả năng của TypeScript tự động đoán và gán kiểu dữ liệu cho một biến mà không cần bạn phải viết rõ cú pháp Type Annotation (chú thích kiểu).

TypeScript làm việc này bằng cách nhìn vào **giá trị ban đầu** bạn gán cho biến đó.

---

## 2. Cách hoạt động

Khi bạn khai báo một biến và gán giá trị ngay lập tức, TypeScript sẽ tự suy luận kiểu:

```typescript
let age = 25; // TypeScript tự hiểu 'age' có kiểu là 'number'
let name = "Alice"; // TypeScript tự hiểu 'name' có kiểu là 'string'
let isActive = true; // TypeScript tự hiểu 'isActive' có kiểu là 'boolean'
```

Nếu sau đó bạn cố tình gán một giá trị sai kiểu, TypeScript sẽ báo lỗi ngay ở compile-time giống hệt như khi dùng Type Annotation:

```typescript
let age = 25;
age = "ba mươi"; // Lỗi: Type 'string' is not assignable to type 'number'.
```

---

## 3. Khác biệt giữa Annotation và Inference

| Đặc điểm | Type Annotation (Bài 1) | Type Inference (Bài 2) |
| :--- | :--- | :--- |
| **Cách viết** | Tường minh (Ví dụ: `let x: number = 10;`) | Ngầm định (Ví dụ: `let x = 10;`) |
| **Thời điểm** | Do người viết code chỉ định | Do TypeScript compiler tự động đoán |
| **Công sức** | Phải gõ nhiều code hơn | Code ngắn gọn, sạch sẽ hơn |

---

## 4. Trường hợp suy luận thất bại: Lỗi "Implicit any"

Nếu bạn khai báo biến mà **không gán giá trị ban đầu** và **không chú thích kiểu**, TypeScript sẽ không thể suy luận được và gán cho nó kiểu mặc định là `any` (kiểu dữ liệu chấp nhận mọi thứ, làm mất đi sức mạnh của TypeScript).

```typescript
let score; // Kiểu suy luận lúc này là 'any'

score = 10; // Không lỗi
score = "hello"; // Không lỗi luôn (mất an toàn kiểu dữ liệu)
```

> [!WARNING]
> Hạn chế tối đa việc để biến rơi vào trạng thái suy luận ra kiểu `any`. Nếu chưa gán giá trị ngay, hãy dùng **Type Annotation** để giữ an toàn kiểu:
> ```typescript
> let score: number;
> ```

---

## 5. Khi nào nên dùng cái nào? (Best Practices)

Để code vừa sạch (clean) vừa an toàn (safe), hãy tuân thủ nguyên tắc sau:

1. **NÊN dùng Type Inference (để tự suy luận):**
   * Cho các biến local đơn giản được gán giá trị ngay: `let count = 0;`, `let user = "John";`.
   * Tránh viết dư thừa như `let name: string = "Alice";` (viết thế này được gọi là "noisy code" - code bị rác).

2. **BẮT BUỘC dùng Type Annotation (khai báo tường minh):**
   * Tham số của hàm: `function add(a: number, b: number)`.
   * Biến khai báo trước nhưng gán giá trị sau: `let total: number;`.
   * Khi muốn ép kiểu rộng hơn hoặc hẹp hơn giá trị khởi tạo (sẽ học ở các bài sau).
