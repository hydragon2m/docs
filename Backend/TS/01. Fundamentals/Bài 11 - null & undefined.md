## 1. Khái niệm cơ bản
Trong JavaScript, `null` và `undefined` là hai giá trị đặc biệt đại diện cho sự vắng mặt của dữ liệu:
* **`undefined`**: Đại diện cho một giá trị chưa được khởi tạo, chưa được gán hoặc không tồn tại (mặc định của JS).
* **`null`**: Đại diện cho sự vắng mặt **chủ ý** của bất kỳ giá trị đối tượng nào (lập trình viên chủ động gán để báo hiệu "không có gì").

Trong TypeScript, cả hai giá trị này đều có kiểu dữ liệu tương ứng trùng tên là `null` và `undefined`.

---

## 2. Cấu hình cực kỳ quan trọng: `strictNullChecks`
Sự an toàn của TypeScript đối với `null` và `undefined` phụ thuộc hoàn toàn vào cấu hình `"strictNullChecks"` trong file cấu hình `tsconfig.json`.

### a. Khi `strictNullChecks: false` ❌ (Không an toàn)
TypeScript cho phép bạn gán `null` và `undefined` cho bất kỳ kiểu dữ liệu nào khác (`string`, `number`, `object`) mà không báo lỗi. Điều này dễ dẫn đến lỗi crash chương trình huyền thoại ở runtime: `Cannot read properties of null (reading '...')`.

```typescript
let username: string = "Alice";
username = null;      // ✅ Không báo lỗi khi compile!
username = undefined; // ✅ Không báo lỗi khi compile!
```

### b. Khi `strictNullChecks: true` ✅ (Khuyên dùng - Mặc định trong NestJS/dự án hiện đại)
TypeScript cấm việc gán `null` và `undefined` vào các kiểu dữ liệu khác. Muốn dùng, bạn bắt buộc phải khai báo tường minh dưới dạng **Union Type**:

```typescript
let username: string = "Alice";
// username = null; // ❌ Lỗi compile ngay lập tức!

let email: string | null = null; // ✅ Hợp lệ (email có thể chứa string hoặc null)
```

---

## 3. Các cách xử lý an toàn khi giá trị có thể là null/undefined

Khi bật `strictNullChecks`, bạn phải xử lý code cẩn thận để tránh lỗi compile:

### a. Sử dụng Optional Chaining (`?.`)
Tránh lỗi crash khi gọi phương thức của đối tượng có khả năng bị `null` hoặc `undefined`:
```typescript
type User = { name: string; profile?: { bio: string } };

let user: User = { name: "Bob" };
console.log(user.profile?.bio); // ✅ Hợp lệ (Sẽ in ra undefined thay vì crash chương trình)
```

### b. Toán tử Nullish Coalescing (`??`)
Cung cấp một giá trị mặc định dự phòng (fallback) nếu giá trị kiểm tra là `null` hoặc `undefined`:
```typescript
let input: string | null = null;
let displayName = input ?? "Khách viếng thăm"; // Nếu input là null/undefined, lấy giá trị bên phải
console.log(displayName); // Output: "Khách viếng thăm"
```

### c. Toán tử khẳng định chắc chắn (Non-null Assertion Operator - `!`)
Bạn đặt dấu chấm than `!` sau một biến để khẳng định với TypeScript rằng: *"Tôi chắc chắn biến này không thể bị null hoặc undefined lúc runtime, hãy bỏ qua việc kiểm tra đi"*.

```typescript
let element = document.getElementById("my-button"); // Kiểu trả về là HTMLElement | null
element!.click(); // ✅ Bỏ qua lỗi check null (Dùng dấu !)
```

> [!CAUTION]
> Hãy cực kỳ cẩn thận khi sử dụng toán tử `!`. Nếu lúc chạy chương trình (runtime) giá trị đó thực sự bị `null` hoặc `undefined`, ứng dụng của bạn sẽ bị crash ngay lập tức. Chỉ dùng khi bạn có cơ sở chắc chắn 100% ngoài khả năng tự phân tích của TypeScript.
