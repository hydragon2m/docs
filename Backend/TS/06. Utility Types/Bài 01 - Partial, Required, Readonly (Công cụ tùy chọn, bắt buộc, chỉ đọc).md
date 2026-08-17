## 1. Tổng quan về Utility Types nhóm Modifiers
Ba Utility Types: **`Partial<T>`**, **`Required<T>`**, và **`Readonly<T>`** được gọi là nhóm Modifiers vì chúng thay đổi các thuộc tính sửa đổi (`?` và `readonly`) trên toàn bộ thuộc tính của kiểu đối tượng `T`.

---

## 2. Chi tiết và Ứng dụng thực tế

### a. `Partial<T>` (Biến mọi thuộc tính thành tùy chọn)
* **Ý nghĩa:** Chuyển tất cả các thuộc tính của `T` thành optional (`?`).
* **Ứng dụng thực tế:** Cực kỳ phổ biến khi viết API Update (PATCH request) hoặc hàm cập nhật trạng thái (State Update), nơi người dùng chỉ cần truyền vào một vài trường cần cập nhật thay vì toàn bộ đối tượng.

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// Hàm update thông tin User chỉ cần nhận vào các trường cần thay đổi
function updateUser(id: number, fieldsToUpdate: Partial<User>) {
  // fieldsToUpdate có kiểu: { name?: string; email?: string; id?: number }
  console.log(`Cập nhật User ID: ${id}`);
}

updateUser(1, { email: "new_email@gmail.com" }); // ✅ Hợp lệ
```

---

### b. `Required<T>` (Biến mọi thuộc tính thành bắt buộc)
* **Ý nghĩa:** Loại bỏ hoàn toàn dấu hỏi chấm `?` ở tất cả các thuộc tính của `T`.
* **Ứng dụng thực tế:** Khi một đối tượng có các trường optional lúc khai báo ban đầu (ví dụ cấu hình tùy chọn), nhưng khi đi qua một hàm khởi tạo / xử lý thì bắt buộc tất cả các trường đó phải được điền đầy đủ.

```typescript
interface AppConfig {
  dbHost?: string;
  dbPort?: number;
}

// Sau khi đã kiểm tra và nạp giá trị mặc định, cấu hình bắt buộc phải đầy đủ
const activeConfig: Required<AppConfig> = {
  dbHost: "localhost",
  dbPort: 5432 // ✅ Bắt buộc phải khai báo đầy đủ các trường
};
```

---

### c. `Readonly<T>` (Biến mọi thuộc tính thành chỉ đọc)
* **Ý nghĩa:** Thêm từ khóa `readonly` vào trước toàn bộ thuộc tính của `T`.
* **Ứng dụng thực tế:** Bảo vệ trạng thái ứng dụng (như Redux State, Configurations) không bị ghi đè ngẫu nhiên ở runtime.

```typescript
const systemConfig: Readonly<User> = {
  id: 99,
  name: "System Admin",
  email: "admin@system.com"
};

// systemConfig.name = "New Name"; // ❌ Lỗi compile! Cannot assign to 'name' because it is a read-only property.
```

---

## 3. Kiến thức nâng cao cực hạn: Vấn đề "Nông" (Shallow) và cách tự viết `Deep`

> [!CAUTION]
> ### Cảnh báo: Cả 3 Utility Types trên đều chỉ tác động ở cấp độ BỀ MẶT (Shallow)
> Nếu kiểu đối tượng `T` chứa các đối tượng con lồng nhau bên trong, các đối tượng con đó **hoàn toàn không** bị ảnh hưởng bởi `Partial`, `Required` hay `Readonly`.
>
> **Ví dụ lỗi:**
> ```typescript
> interface NestedUser {
>   id: number;
>   profile: {
>     bio: string;
>     avatar: string;
>   }
> }
> 
> let readOnlyUser: Readonly<NestedUser> = {
>   id: 1,
>   profile: { bio: "Hello", avatar: "link" }
> };
> 
> // readOnlyUser.id = 2; // ❌ Báo lỗi compile (Ok)
> readOnlyUser.profile.bio = "New Bio"; // ✅ Vẫn sửa được bình thường! (Vì profile con không được tự động hóa readonly)
> ```

### Giải pháp nâng cao: Tự viết `DeepReadonly<T>` đệ quy
Để bảo vệ đối tượng ở mọi tầng lồng nhau, chúng ta sử dụng kiểu đệ quy (Recursive Types) kết hợp với Conditional Types (sẽ học kỹ ở chương sau):

```typescript
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

let strictUser: DeepReadonly<NestedUser> = {
  id: 1,
  profile: { bio: "Hello", avatar: "link" }
};

// strictUser.profile.bio = "New Bio"; // ❌ Báo lỗi compile ngay lập tức ở cả tầng con!
```
*(Cú pháp `T[P] extends object ? ... : ...` hoạt động như toán tử ba ngôi: Nếu giá trị con là một object, tiếp tục đệ quy gọi DeepReadonly trên nó, ngược lại giữ nguyên kiểu).*
