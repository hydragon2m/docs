## 1. Vấn đề của việc khai báo Object trực tiếp (Inline Object Types)
Ở **Bài 04**, khi muốn khai báo hai đối tượng có cấu trúc giống nhau, chúng ta phải viết lặp lại kiểu dữ liệu của chúng:

```typescript
let user1: { name: string; age: number } = { name: "Alice", age: 25 };
let user2: { name: string; age: number } = { name: "Bob", age: 30 };
```

Nếu cấu trúc này được dùng ở nhiều nơi khác nhau, code sẽ bị trùng lặp rất nhiều. Khi cần thay đổi cấu trúc, ta phải đi sửa thủ công ở mọi nơi. Để giải quyết vấn đề này, TypeScript giới thiệu **Type Alias (Bí danh kiểu dữ liệu)**.

---

## 2. Type Alias là gì?
**Type Alias** đơn giản là cách bạn đặt một cái tên mới (bí danh) đại diện cho một kiểu dữ liệu bất kỳ (Object, Primitive, Union...). Sau đó, bạn chỉ cần dùng cái tên này để khai báo thay vì viết lại toàn bộ cấu trúc.

### Cú pháp:
Sử dụng từ khóa `type`, tên bí danh đặt theo quy tắc viết hoa chữ cái đầu (**PascalCase**), dấu bằng `=`, và định nghĩa kiểu dữ liệu ở vế phải.

```typescript
type User = {
  name: string;
  age: number;
};
```

---

## 3. Khả năng mở rộng của Type Alias (Không chỉ dành cho Object)

Khác với `Interface` (chỉ chuyên dùng cho Object), **Type Alias** cực kỳ linh hoạt và có thể đại diện cho bất kỳ kiểu dữ liệu nào:

### a. Đặt bí danh cho kiểu nguyên thủy (Primitive Type)
```typescript
type ID = string;
type Year = number;

let userId: ID = "usr_1002";
```

### b. Đặt bí danh cho kiểu kết hợp (Union Type)
Giúp giới hạn các giá trị cụ thể được phép gán cho biến:
```typescript
type NetworkStatus = "online" | "offline" | "connecting";
let currentStatus: NetworkStatus = "online"; // ✅ Hợp lệ
// let currentStatus: NetworkStatus = "unknown"; // ❌ Lỗi biên dịch
```

### c. Gộp kiểu dữ liệu (Intersection Type - `&`)
Bạn có thể kết hợp nhiều Type Alias lại với nhau để tạo ra một kiểu mới chứa toàn bộ thuộc tính của các kiểu cũ:
```typescript
type Person = {
  name: string;
};

type Contact = {
  email: string;
  phone: string;
};

// Kiểu Employee sẽ chứa thuộc tính của cả Person và Contact
type Employee = Person & Contact;

let emp: Employee = {
  name: "John",
  email: "john@example.com",
  phone: "0901234567"
};
```

---

## 4. Các Lưu ý quan trọng (Đặc biệt cần nhớ)

> [!IMPORTANT]
> ### 1. Bản chất chỉ là "Tên giả" (Alias)
> Type Alias không tạo ra một kiểu dữ liệu mới thực sự trong hệ thống. Nó chỉ là tên tham chiếu (shortcut) cho kiểu thực tế. Khi biên dịch sang JavaScript, toàn bộ các dòng khai báo `type` sẽ bị xóa bỏ hoàn toàn (Type Erasure) và không để lại dấu vết gì ở runtime.
>
> ### 2. Không thể khai báo trùng tên (Không hỗ trợ Declaration Merging)
> Bạn không thể khai báo hai Type Alias trùng tên trong cùng một phạm vi (scope). Điểm này khác hoàn toàn với `Interface` (chúng ta sẽ học ở Bài 06).
> ```typescript
> type Animal = { name: string };
> type Animal = { age: number }; // ❌ Lỗi: Duplicate identifier 'Animal'.
> ```
>
> ### 3. Định nghĩa đệ quy (Recursive Type Alias)
> Type Alias có thể tự tham chiếu đến chính nó. Điều này rất hữu ích khi định nghĩa cấu trúc dữ liệu dạng cây (Tree) hoặc danh sách liên kết (Linked List).
> ```typescript
> type TreeNode = {
>   value: string;
>   left?: TreeNode;  // Tham chiếu đệ quy đến chính TreeNode
>   right?: TreeNode;
> };
> ```
>
> ### 4. Cơ chế structural typing (Duck Typing)
> TypeScript so sánh kiểu dựa trên **cấu trúc** (hình dáng dữ liệu) chứ không phải dựa trên **tên gọi**. 
> ```typescript
> type Point2D = { x: number; y: number };
> type Vector2D = { x: number; y: number };
> 
> let point: Point2D = { x: 5, y: 10 };
> let vector: Vector2D = point; // ✅ Hoàn toàn hợp lệ! 
> // Dù tên kiểu khác nhau (Point2D và Vector2D), cấu trúc của chúng giống hệt nhau.
> ```
