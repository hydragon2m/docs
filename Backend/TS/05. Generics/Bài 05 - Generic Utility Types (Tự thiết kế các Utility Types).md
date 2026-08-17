## 1. Utility Types là gì?
TypeScript cung cấp sẵn một tập hợp các công cụ hữu ích gọi là **Utility Types** (như `Partial`, `Readonly`, `Pick`, `Omit`, `Record`...) để giúp bạn biến đổi kiểu dữ liệu một cách nhanh chóng.

Bản chất của toàn bộ các Utility Types này đều được xây dựng dựa trên **Generic kết hợp với Mapped Types (Kiểu ánh xạ)**. 

Trong bài này, chúng ta sẽ tự thiết kế (tái cấu trúc) các Utility Types cơ bản từ con số 0 để hiểu rõ tường tận cơ chế hoạt động của chúng.

---

## 2. Tự thiết kế các Utility Types cơ bản

### a. Tự viết `MyPartial<T>` (Biến tất cả thuộc tính thành optional)
Hàm `Partial<T>` biến tất cả các thuộc tính của đối tượng `T` thành tùy chọn (`?`).

#### Cú pháp tự định nghĩa:
```typescript
type MyPartial<T> = {
  [P in keyof T]?: T[P];
};
```
*Giải thích chi tiết:*
* `keyof T`: Lấy ra toàn bộ các key (thuộc tính) của `T`.
* `P in keyof T`: Vòng lặp duyệt qua từng key `P` trong danh sách keys.
* `?:`: Thêm dấu hỏi chấm biến thuộc tính đó thành tùy chọn.
* `T[P]`: Lookup Type lấy ra kiểu dữ liệu gốc của thuộc tính tương ứng.

#### Thử nghiệm:
```typescript
interface User { id: number; name: string }
type PartialUser = MyPartial<User>; 
// Kiểu mới tương đương với: { id?: number; name?: string }
```

---

### b. Tự viết `MyReadonly<T>` (Biến tất cả thuộc tính thành chỉ đọc)
Biến mọi thuộc tính của đối tượng `T` thành `readonly`.

#### Cú pháp tự định nghĩa:
```typescript
type MyReadonly<T> = {
  readonly [P in keyof T]: T[P];
};
```

#### Thử nghiệm:
```typescript
type ReadonlyUser = MyReadonly<User>;
// Kiểu mới tương đương với: { readonly id: number; readonly name: string }
```

---

### c. Tự viết `MyRecord<K, T>` (Tạo đối tượng map key-value)
Tạo ra một đối tượng có danh sách keys thuộc kiểu `K` và giá trị thuộc kiểu `T`.

#### Cú pháp tự định nghĩa:
```typescript
// Ràng buộc: K phải có thể làm key của Object (string | number | symbol)
type MyRecord<K extends keyof any, T> = {
  [P in K]: T;
};
```

#### Thử nghiệm:
```typescript
type UserPage = "home" | "profile" | "settings";
type PageConfig = MyRecord<UserPage, { title: string }>;

const pages: PageConfig = {
  home: { title: "Trang chủ" },
  profile: { title: "Hồ sơ" },
  settings: { title: "Cấu hình" }
};
```

---

## 3. Các Lưu ý quan trọng khi thiết kế nâng cao

> [!IMPORTANT]
> ### 1. Toán tử xóa bỏ Modifiers (`-` modifier)
> Trong thiết kế nâng cao, bạn có thể xóa bỏ các modifier như `?` hoặc `readonly` bằng cách thêm dấu trừ `-` trước chúng.
>
> Ví dụ: Tự viết `MyRequired<T>` (Biến các thuộc tính optional thành bắt buộc bằng cách xóa đi dấu `?`):
> ```typescript
> type MyRequired<T> = {
>   [P in keyof T]-?: T[P]; // Dấu -? nghĩa là xóa bỏ trạng thái optional
> };
> ```

> [!WARNING]
> ### 2. Ứng dụng thực tế
> Việc hiểu cách tự xây dựng các Utility Types giúp bạn tự tin viết các hàm biến đổi dữ liệu vô cùng phức tạp, thường xuất hiện khi thiết kế Base Services, ORM Database Layer, hoặc các decorators tùy chỉnh trong NestJS.
