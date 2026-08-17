## 1. Thuộc tính tùy chọn (Optional Properties)
Khi làm việc với các đối tượng (Objects), đôi khi có một số thuộc tính không bắt buộc phải xuất hiện (ví dụ: mô tả sản phẩm, số điện thoại phụ, tuổi tác...).

Trong TypeScript, bạn có thể đánh dấu một thuộc tính là **tùy chọn (optional)** bằng cách thêm dấu hỏi chấm `?` ngay sau tên thuộc tính khi khai báo cấu trúc.

### Cú pháp:
```typescript
interface User {
  name: string;
  age?: number; // Thuộc tính tùy chọn, có thể có hoặc không
}
```

### Ví dụ thực tế:
```typescript
let u1: User = { name: "Alice", age: 25 }; // ✅ Hợp lệ
let u2: User = { name: "Bob" };            // ✅ Hợp lệ (không cần khai báo age)
```

### Bản chất của Optional:
Khi bạn đánh dấu `age?: number`, TypeScript sẽ hiểu kiểu của thuộc tính `age` thực chất là `number | undefined`. Vì vậy, nếu bạn không truyền giá trị, giá trị của thuộc tính đó khi truy cập sẽ là `undefined`.

---

## 2. Thuộc tính chỉ đọc (readonly Properties)
Trong lập trình, việc giữ cho dữ liệu không bị thay đổi ngoài ý muốn (Immutability) là một nguyên lý rất quan trọng giúp giảm thiểu lỗi phát sinh ngoài dự kiến.

Từ khóa **`readonly`** được đặt trước tên thuộc tính trong TypeScript để chỉ định thuộc tính đó chỉ được phép gán giá trị **một lần duy nhất lúc khởi tạo**, và cấm mọi hành vi ghi đè hoặc thay đổi giá trị sau đó.

### Cú pháp:
```typescript
interface Point {
  readonly x: number;
  readonly y: number;
}
```

### Ví dụ thực tế:
```typescript
let p1: Point = { x: 10, y: 20 };
// p1.x = 15; // ❌ Lỗi compile: Cannot assign to 'x' because it is a read-only property.
```

---

## 3. Các khía cạnh nâng cao và Lưu ý quan trọng

> [!IMPORTANT]
> ### 1. Khác biệt giữa `const` và `readonly`
> Nhiều lập trình viên thường nhầm lẫn giữa hai khái niệm này vì chúng đều dùng để tạo ra các giá trị không thể ghi đè.
> - **`const`**: Dùng cho **biến** (variables) để ngăn chặn việc gán lại biến đó cho một đối tượng khác.
> - **`readonly`**: Dùng cho **thuộc tính** (properties) của một đối tượng hoặc mảng để ngăn chặn việc sửa đổi giá trị bên trong thuộc tính đó.
>
> ```typescript
> const user = { name: "Alice" }; // Dùng const cho biến
> user.name = "Bob"; // ✅ Vẫn chạy bình thường! const chỉ cấm gán lại biến 'user', không cấm sửa đổi thuộc tính bên trong.
> 
> interface StrictUser {
>   readonly name: string;
> }
> let user2: StrictUser = { name: "Alice" };
> // user2.name = "Bob"; // ❌ Lỗi compile! readonly cấm sửa thuộc tính 'name'.
> ```

> [!WARNING]
> ### 2. `readonly` chỉ hoạt động ở lớp bề mặt (Shallow Readonly)
> Từ khóa `readonly` của TypeScript chỉ bảo vệ các thuộc tính trực tiếp của đối tượng. Nếu thuộc tính đó trỏ đến một đối tượng khác, các thuộc tính của đối tượng con bên trong vẫn có thể bị sửa đổi.
>
> ```typescript
> interface Company {
>   readonly name: string;
>   readonly details: {
>     address: string;
>   };
> }
> 
> let myCompany: Company = {
>   name: "Google",
>   details: { address: "1600 Amphitheatre Pkwy" }
> };
> 
> // myCompany.name = "Alphabet"; // ❌ Lỗi compile (thuộc tính trực tiếp)
> myCompany.details.address = "New Address"; // ✅ Hoàn toàn hợp lệ! (đối tượng con bên trong không tự động readonly)
> ```
> *Lưu ý: Để giải quyết vấn đề này, bạn phải đánh dấu `readonly` cho tất cả các đối tượng con ở các tầng bên dưới, hoặc sử dụng Utility Type `Readonly<Type>` (sẽ học ở chương sau).*

### 3. Check thuộc tính tồn tại trước khi dùng (Optional Chaining)
Vì các thuộc tính optional có thể trả về `undefined`, bạn bắt buộc phải kiểm tra sự tồn tại của nó trước khi gọi các phương thức đi kèm bằng dấu chấm hỏi `?.` (Optional Chaining):

```typescript
interface User {
  name: string;
  age?: number;
}

let u: User = { name: "Bob" };
// console.log(u.age.toFixed()); // ❌ Lỗi compile: 'u.age' is possibly 'undefined'.
console.log(u.age?.toFixed());  // ✅ Hợp lệ (Sẽ trả về undefined thay vì crash chương trình)
```
