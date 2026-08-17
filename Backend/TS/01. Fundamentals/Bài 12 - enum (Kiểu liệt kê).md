## 1. Enum là gì?
**Enum (Kiểu liệt kê)** là một tính năng đặc biệt của TypeScript (không có sẵn trong JavaScript thuần) cho phép bạn định nghĩa một tập hợp các **hằng số có tên đặt sẵn** (named constants).

Sử dụng enum giúp code rõ ràng hơn bằng cách thay thế các giá trị ma thuật (magic numbers/magic strings) thành các tên gọi tự giải thích rõ nghĩa.

---

## 2. Phân loại Enum

### a. Numeric Enum (Enum dạng số)
Mặc định, các phần tử của numeric enum sẽ được gán giá trị tự động tăng bắt đầu từ số `0`:

```typescript
enum Direction {
  Up,     // Tương ứng giá trị 0
  Down,   // Tương ứng giá trị 1
  Left,   // Tương ứng giá trị 2
  Right   // Tương ứng giá trị 3
}

let move = Direction.Up; // move có giá trị là 0
```

Bạn có thể thay đổi số bắt đầu bằng cách gán giá trị cho phần tử đầu tiên:
```typescript
enum ResponseStatus {
  Success = 200,
  NotFound = 404, // Các phần tử sau nếu không gán sẽ tự tăng từ giá trị liền trước
  InternalError = 500
}
```

#### Tính năng độc quyền: Reverse Mapping (Ánh xạ ngược)
Chỉ riêng Numeric Enum hỗ trợ ánh xạ ngược từ giá trị số tìm lại tên hằng số:
```typescript
let statusName = ResponseStatus[200];
console.log(statusName); // Output: "Success"
```

---

### b. String Enum (Enum dạng chuỗi)
Mỗi phần tử trong string enum bắt buộc phải được gán giá trị cụ thể bằng chuỗi văn bản. String enum không hỗ trợ tự động tăng và không hỗ trợ ánh xạ ngược (Reverse Mapping).

```typescript
enum UserRole {
  Admin = "ADMIN",
  User = "USER",
  Guest = "GUEST"
}

let role = UserRole.Admin; // role có giá trị là "ADMIN"
```
*String enum được khuyên dùng nhiều hơn vì giá trị của nó khi hiển thị ra log hoặc lưu vào cơ sở dữ liệu sẽ dễ đọc và mang nhiều ý nghĩa hơn là các con số vô hồn.*

---

## 3. Các khía cạnh nâng cao và So sánh thực tế

### a. Sự khác biệt về Runtime (Bản chất biên dịch)
Khác với hầu hết các tính năng kiểu dữ liệu khác của TS (bị xóa bỏ hoàn toàn khi compile), **Enum thực sự sinh ra code JavaScript chạy ở runtime**.

Ví dụ, enum này:
```typescript
enum Status { Active, Inactive }
```
Sẽ được biên dịch sang JavaScript thành một hàm tự kích hoạt IIFE phức tạp để tạo cấu trúc map hai chiều:
```javascript
var Status;
(function (Status) {
    Status[Status["Active"] = 0] = "Active";
    Status[Status["Inactive"] = 1] = "Inactive";
})(Status || (Status = {}));
```

---

### b. Giải pháp tối ưu hiệu năng: `const enum`
Để loại bỏ hoàn toàn chi phí tạo đối tượng JavaScript ở runtime của enum, TypeScript cung cấp từ khóa **`const enum`**.

```typescript
const enum Direction {
  Up,
  Down
}
let move = Direction.Up;
```
Khi biên dịch sang JS, định nghĩa `const enum` sẽ bị biến mất hoàn toàn và giá trị sẽ được **thay thế trực tiếp (inlined)** vào nơi gọi:
```javascript
let move = 0; // Được thay thế trực tiếp giá trị vào code JS đầu ra
```

---

### c. So sánh thực tế: Enum vs Object `as const`
Trong TypeScript hiện đại, nhiều lập trình viên lớn và các thư viện nổi tiếng có xu hướng **thay thế Enum bằng cách sử dụng Object kết hợp `as const`** (gọi tắt là POJO - Plain Old JavaScript Object) vì lý do tương thích hoàn toàn với JS tiêu chuẩn và tránh các hành vi biên dịch phức tạp của Enum.

#### So sánh cách viết:
```typescript
// CÁCH 1: Dùng Enum truyền thống
enum RoleEnum { Admin = "ADMIN", User = "USER" }

// CÁCH 2: Dùng Object + as const (Modern TS)
const RoleObject = {
  Admin: "ADMIN",
  User: "USER"
} as const;

// Cách sử dụng kiểu dữ liệu từ Object:
type RoleType = typeof RoleObject[keyof typeof RoleObject]; // Kiểu: "ADMIN" | "USER"
```

> [!TIP]
> **Khuyên dùng:**
> * Hãy dùng **Enum** khi dự án của bạn đã có sẵn tiêu chuẩn sử dụng enum từ trước, hoặc khi bạn cực kỳ cần tính năng Reverse Mapping (ánh xạ ngược) của số.
> * Hãy dùng **Object `as const`** cho các dự án mới, hướng hiện đại để code biên dịch tối giản, tương thích tốt nhất với hệ sinh thái JavaScript.
