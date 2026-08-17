## 1. Tổng quan
Trong phát triển ứng dụng (đặc biệt là Backend), một thực thể dữ liệu gốc (Entity) thường chứa rất nhiều thuộc tính (ví dụ: thực thể `User` chứa `id`, `name`, `email`, `passwordHash`, `createdAt`, `updatedAt`).

Tuy nhiên, ở các ngữ cảnh khác nhau, bạn chỉ cần sử dụng hoặc hiển thị một phần thuộc tính đó. TypeScript cung cấp hai Utility Types đắc lực để xử lý trường hợp này:
* **`Pick<T, K>`**: **Chọn lọc** một tập hợp các thuộc tính `K` từ đối tượng `T`.
* **`Omit<T, K>`**: **Loại bỏ** các thuộc tính `K` khỏi đối tượng `T` và giữ lại các phần còn lại.

---

## 2. Chi tiết và Ứng dụng thực tế

### a. `Pick<T, K>` (Chọn lọc thuộc tính)
* **Ý nghĩa:** Tạo ra kiểu dữ liệu mới chỉ chứa các thuộc tính được liệt kê cụ thể trong danh sách `K`.
* **Cú pháp:** `K` bắt buộc phải kế thừa `keyof T` (là các key hợp lệ của `T`).

```typescript
interface User {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

// Tạo kiểu UserPreview chỉ chứa id và username để hiển thị danh sách rút gọn
type UserPreview = Pick<User, "id" | "username">;

const user: UserPreview = {
  id: 1,
  username: "alice_dev" // ✅ Chỉ chấp nhận id và username
};
```

---

### b. `Omit<T, K>` (Loại bỏ thuộc tính)
* **Ý nghĩa:** Tạo ra kiểu dữ liệu mới chứa toàn bộ các thuộc tính của `T` ngoại trừ những thuộc tính được liệt kê trong `K`.
* **Cú pháp:** Khác với `Pick`, tham số kiểu `K` trong `Omit` có thể là bất kỳ key nào (không bắt buộc phải kế thừa `keyof T`).

```typescript
// Tạo kiểu dữ liệu để phản hồi về Client: Loại bỏ hoàn toàn passwordHash nhạy cảm
type UserResponse = Omit<User, "passwordHash">;

const responseData: UserResponse = {
  id: 1,
  username: "alice_dev",
  email: "alice@gmail.com",
  createdAt: new Date() // ✅ passwordHash đã bị loại bỏ hoàn toàn
};
```

---

## 3. Bản chất định nghĩa dưới lớp vỏ của `Pick` và `Omit`

Hiểu được cách hoạt động bên trong sẽ giúp bạn làm chủ TypeScript nâng cao:

### Định nghĩa của `Pick`:
```typescript
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};
```
*Cơ chế:* Vòng lặp `P in K` chỉ duyệt qua các key được chỉ định trong union `K`.

### Định nghĩa của `Omit`:
```typescript
type MyOmit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
```
*Cơ chế:* `Omit` thực chất là sự kết hợp của `Pick` và `Exclude` (học ở Bài 03). Nó lấy toàn bộ key của `T` (`keyof T`), loại bỏ đi các key thuộc `K` bằng `Exclude`, sau đó dùng `Pick` để nhặt ra các key còn lại.

---

## 4. Các Lưu ý quan trọng khi sử dụng

> [!IMPORTANT]
> ### Sự khác nhau về tính an toàn khi Refactor code
> * **`Pick` an toàn hơn:** Vì `K` bắt buộc phải là `keyof T`. Nếu bạn đổi tên một trường trong `User` (ví dụ đổi `username` thành `name`), TypeScript sẽ lập tức báo đỏ ở dòng khai báo `Pick<User, "username">` để báo hiệu bạn cần cập nhật.
> * **`Omit` dễ bị bỏ sót:** Vì `K` trong `Omit` chấp nhận bất kỳ chuỗi nào. Nếu bạn đổi tên `passwordHash` thành `password` trong `User`, dòng khai báo `Omit<User, "passwordHash">` **sẽ không báo lỗi compile** mà âm thầm bỏ qua, khiến thuộc tính mới `password` vô tình bị lộ ra ngoài API Response.
>
> **Lời khuyên:** Hãy ưu tiên sử dụng `Pick` bất cứ khi nào có thể vì nó có tính chất kiểm tra an toàn chặt chẽ hơn.
