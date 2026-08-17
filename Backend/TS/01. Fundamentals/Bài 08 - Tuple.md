## 1. Tuple trong TypeScript là gì?
Trong JavaScript, không có khái niệm Tuple. Tất cả chỉ đơn giản là mảng (Array) thông thường.

Trong TypeScript, **Tuple (Mảng cố định)** là một dạng mảng đặc biệt giúp bạn ràng buộc:
1. **Số lượng phần tử** cố định.
2. **Kiểu dữ liệu** cụ thể và nghiêm ngặt tại **từng vị trí (index)** trong mảng.

---

## 2. Cú pháp khai báo

Bạn sử dụng cặp ngoặc vuông `[]` và liệt kê kiểu dữ liệu tương ứng cho từng vị trí:

```typescript
let tên_biến: [kiểu_vị_trí_0, kiểu_vị_trí_1, ...] = [giá_trị_0, giá_trị_1, ...];
```

### Ví dụ thực tế:
```typescript
// Một Tuple biểu diễn thông tin User gồm: [id, name, isActive]
let user: [number, string, boolean] = [1, "Alice", true];

// Truy cập phần tử bằng index:
console.log(user[0]); // 1 (kiểu number)
console.log(user[1]); // "Alice" (kiểu string)
```

---

## 3. Các khía cạnh nâng cao của Tuple

### a. Named Tuples (Tuple có nhãn)
Để code tự giải thích rõ ràng hơn, TypeScript cho phép bạn đặt tên (label) cho từng vị trí phần tử trong Tuple. Điều này cực kỳ hữu ích khi bạn sử dụng các tính năng tự động gợi ý (Autocomplete) của IDE.

```typescript
// Định nghĩa Tuple có nhãn mô tả tọa độ địa lý
type GeoLocation = [latitude: number, longitude: number];

let myPosition: GeoLocation = [10.762622, 106.660172];
```
*Lưu ý: Các nhãn (`latitude`, `longitude`) chỉ mang tính chất tài liệu hướng dẫn và không ảnh hưởng đến cách bạn truy cập phần tử.*

---

### b. Phần tử tùy chọn trong Tuple (Optional Tuple Elements)
Bạn có thể khai báo một phần tử là tùy chọn (có thể có hoặc không) bằng dấu hỏi chấm `?` ở cuối kiểu dữ liệu. Phần tử tùy chọn **bắt buộc phải đứng ở cuối cùng** của Tuple.

```typescript
type ConnectionConfig = [host: string, port: number, useSSL?: boolean];

let localConfig: ConnectionConfig = ["localhost", 3000]; // ✅ Hợp lệ (không dùng SSL)
let prodConfig: ConnectionConfig = ["12.34.56.78", 443, true]; // ✅ Hợp lệ
```

---

### c. Cảnh báo nguy hiểm: Phương thức làm thay đổi mảng (`.push()`, `.pop()`)

> [!CAUTION]
> Dưới bản chất runtime của JavaScript, Tuple thực tế vẫn chỉ là một Array thông thường.
>
> Vì vậy, TypeScript **không thể ngăn chặn** các phương thức như `.push()`, `.pop()`, `.shift()` thay đổi độ dài của Tuple ở runtime, mặc dù điều này vi phạm khai báo ban đầu.
>
> ```typescript
> let score: [number, string] = [10, "A"];
> score.push("B"); // ✅ Không bị lỗi compile!
> console.log(score); // Output: [10, "A", "B"] (Độ dài đã thành 3 phần tử!)
> ```
> Tuy nhiên, TypeScript sẽ ngăn bạn truy cập trực tiếp vào phần tử thứ 3 này:
> ```typescript
> console.log(score[2]); // ❌ Lỗi compile: Tuple type '[number, string]' of length '2' has no element at index '2'.
> ```

---

### d. Giải pháp an toàn: Readonly Tuple
Để tránh hoàn toàn bẫy lỗi ở phần (c), hãy luôn khai báo Tuple là **`readonly`** nếu bạn không có ý định thay đổi dữ liệu của nó.

```typescript
let score: readonly [number, string] = [10, "A"];

score.push("B"); // ❌ Lỗi compile lập tức! Property 'push' does not exist on type 'readonly [number, string]'.
```

---

## 4. Sự khác biệt giữa Array và Tuple

| Đặc điểm | Array (Mảng) | Tuple (Mảng cố định) |
| :--- | :--- | :--- |
| **Số lượng phần tử** | Không giới hạn (độ dài động) | Cố định (độ dài xác định trước) |
| **Kiểu dữ liệu** | Thường đồng nhất (ví dụ: toàn bộ là `number[]`) | Khác nhau tại từng vị trí chỉ định |
| **Ứng dụng phổ biến** | Lưu danh sách dữ liệu (danh sách user, danh sách sản phẩm...) | Lưu các bộ dữ liệu ngắn gọn, cấu trúc cứng (Tọa độ `[x, y]`, mã màu `[r, g, b]`, phản hồi API `[error, result]`...) |
