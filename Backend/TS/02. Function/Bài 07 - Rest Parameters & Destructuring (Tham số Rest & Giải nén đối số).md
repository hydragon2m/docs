## 1. Rest Parameters (Tham số Rest)
Trong JavaScript, bạn có thể định nghĩa một hàm nhận vào một số lượng đối số không giới hạn bằng cách sử dụng toán tử Rest `...`. Toàn bộ các đối số dư thừa truyền vào sẽ được gộp lại thành một mảng duy nhất.

Trong TypeScript, chúng ta gán kiểu cho tham số Rest này dưới dạng **một kiểu mảng (Array Type)**.

### Cú pháp cơ bản:
```typescript
function sumAll(...numbers: number[]): number {
  return numbers.reduce((total, num) => total + num, 0);
}

console.log(sumAll(1, 2));       // Output: 3
console.log(sumAll(1, 2, 3, 4)); // Output: 10
```

---

## 2. Kiến thức nâng cao: Rest Parameters kết hợp với Tuple Types
TypeScript cho phép bạn truyền vào một **Tuple Type** làm kiểu cho tham số Rest. Điều này giúp định nghĩa các hàm nhận vào một danh sách tham số cố định và có kiểm tra kiểu tại từng vị trí tương tự như khai báo tham số thông thường, nhưng xử lý dưới dạng mảng bên trong thân hàm.

```typescript
type UserArgs = [id: number, name: string, isAdmin?: boolean];

function registerUser(...args: UserArgs): void {
  const [id, name, isAdmin] = args; // Trích xuất từ mảng args
  console.log(`Đang đăng ký: ID=${id}, Name=${name}, Admin=${isAdmin ?? false}`);
}

// Gọi hàm giống hệt như hàm nhận 3 tham số thông thường:
registerUser(101, "Alice");       // ✅ Hợp lệ
registerUser(102, "Bob", true);   // ✅ Hợp lệ
// registerUser("103", "Charlie"); // ❌ Lỗi compile: Argument of type 'string' is not assignable to 'number'.
```

---

## 3. Destructuring Arguments (Giải nén đối số)
Kỹ thuật giải nén (Destructuring) giúp trích xuất trực tiếp các thuộc tính của đối tượng truyền vào làm biến cục bộ trong hàm mà không cần dùng cú pháp dấu chấm truy xuất nhiều lần.

> [!CAUTION]
> ### Cạm bẫy cú pháp lỗi kinh điển khi gán kiểu
> Nhiều người mới học thường viết nhầm cú pháp gán kiểu dữ liệu ngay bên trong phần giải nén đối tượng.
>
> **Ví dụ SAI:**
> ```typescript
> // ❌ SAI hoàn toàn! JavaScript sẽ hiểu đây là cú pháp đổi tên biến (renaming):
> // gán giá trị của thuộc tính 'a' cho một biến mới tên là 'number'.
> function draw({ a: number, b: string }) { ... }
> ```
>
> **Ví dụ ĐÚNG (Tách biệt phần giải nén và phần khai báo kiểu):**
> ```typescript
> function draw({ a, b }: { a: number; b: string }): void {
>   console.log(`Vẽ với giá trị A: ${a}, B: ${b}`);
> }
> ```

Bạn cũng có thể kết hợp với Type Alias để viết chữ ký hàm gọn gàng hơn:
```typescript
type Position = { x: number; y: number; label?: string };

function printPos({ x, y, label = "Tọa độ" }: Position): void {
  console.log(`${label}: [${x}, ${y}]`);
}

printPos({ x: 10, y: 20 }); // Output: Tọa độ: [10, 20]
```
