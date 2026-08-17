## 1. Phân biệt: Nhóm Đối Tượng vs Nhóm Union Types
Một lỗi nhầm lẫn cực kỳ phổ biến của lập trình viên là sử dụng sai công cụ giữa các nhóm Utility Types:
* **`Pick` & `Omit`**: Chuyên dùng để tác động lên **thuộc tính của một Object** (chọn/bỏ key của đối tượng).
* **`Exclude` & `Extract`**: Chuyên dùng để tác động lên **các thành phần của một Union Type** (loại bỏ/nhặt ra các kiểu dữ liệu trong phép hợp `|`).

---

## 2. Chi tiết và Ứng dụng thực tế

### a. `Exclude<UnionType, ExcludedMembers>` (Loại bỏ thành phần khỏi Union)
* **Ý nghĩa:** Loại trừ toàn bộ các kiểu dữ liệu có thể gán được cho `ExcludedMembers` ra khỏi kiểu kết hợp `UnionType`.

```typescript
type Status = "pending" | "processing" | "success" | "failed";

// Loại bỏ trạng thái thành công và thất bại để lấy các trạng thái đang hoạt động
type ActiveStatus = Exclude<Status, "success" | "failed">;
// Kiểu ActiveStatus tương đương với: "pending" | "processing"
```

---

### b. `Extract<UnionType, ExtractedMembers>` (Trích lọc thành phần từ Union)
* **Ý nghĩa:** Chỉ giữ lại (trích lọc) các kiểu dữ liệu xuất hiện ở cả `UnionType` và `ExtractedMembers`.

```typescript
type TaskEvents = "create" | "update" | "delete" | "archive";
type TargetEvents = "update" | "delete" | "restore";

// Trích xuất các sự kiện chung xuất hiện ở cả 2 tập hợp
type SharedEvents = Extract<TaskEvents, TargetEvents>;
// Kiểu SharedEvents tương đương với: "update" | "delete"
```

---

## 3. Bản chất hoạt động dưới lớp vỏ (Distributive Conditional Types)

`Exclude` và `Extract` được xây dựng dựa trên cơ chế **Conditional Types có tính phân phối** (chúng ta sẽ học sâu ở chương sau).

### Định nghĩa của `Exclude`:
```typescript
type MyExclude<T, U> = T extends U ? never : T;
```
*Cách hoạt động:* TypeScript sẽ duyệt qua từng thành phần `T` trong Union. Nếu `T` có thể gán được cho `U`, nó sẽ bị biến thành `never` (bị loại bỏ), ngược lại giữ nguyên `T`.

### Định nghĩa của `Extract`:
```typescript
type MyExtract<T, U> = T extends U ? T : never;
```
*Cách hoạt động:* Ngược lại với `Exclude`. Nếu `T` có thể gán được cho `U`, giữ nguyên `T`, ngược lại biến thành `never`.

---

## 4. Ví dụ ứng dụng nâng cao kết hợp

Bạn có thể kết hợp `Exclude` với `keyof` để tự xây dựng một phiên bản `Omit` tùy chỉnh hoặc lọc thuộc tính của đối tượng:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
}

// Lọc tất cả các key của User, loại trừ đi key 'id' và 'role'
type UserDataKeys = Exclude<keyof User, "id" | "role">; 
// UserDataKeys tương đương với: "name" | "email"
```
 Kỹ thuật này giúp bạn viết code xử lý tự động hóa siêu linh hoạt khi cần thiết lập các quy trình mapping dữ liệu động từ Database lên Entity.
