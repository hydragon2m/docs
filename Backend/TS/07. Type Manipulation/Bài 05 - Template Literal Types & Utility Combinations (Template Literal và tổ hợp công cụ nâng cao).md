## 1. Bản chất và Các công cụ Intrinsic String Manipulation
**Template Literal Types** là tính năng đỉnh cao giúp bạn thao tác với các chuỗi ký tự ngay ở mức kiểu dữ liệu.

TypeScript tích hợp sẵn 4 Utility Types chuyên biệt để biến đổi chuỗi chữ hoa/chữ thường (gọi là Intrinsic Types):
1. **`Uppercase<StringType>`**: Chuyển toàn bộ chuỗi sang chữ HOA.
2. **`Lowercase<StringType>`**: Chuyển toàn bộ chuỗi sang chữ thường.
3. **`Capitalize<StringType>`**: Viết hoa chữ cái đầu tiên của chuỗi.
4. **`Uncapitalize<StringType>`**: Viết thường chữ cái đầu tiên của chuỗi.

---

## 2. Tổ hợp nâng cao: Mapped Types + Conditional Types + Template Literals

Bằng cách kết hợp cả 3 công cụ mạnh nhất này, bạn có thể tạo ra các hệ thống kiểu dữ liệu tự động hóa hoàn hảo tương tự như các thư viện lớn như Vuex, Redux Toolkit, hoặc TypeORM.

### Ví dụ thực tế: Tự động hóa sự kiện lắng nghe thay đổi dữ liệu (Event Emitter)
Chúng ta có một đối tượng chứa dữ liệu cấu hình. Chúng ta muốn tự động sinh ra kiểu dữ liệu cho một hệ thống Event Emitter có khả năng lắng nghe sự kiện thay đổi của **từng thuộc tính cụ thể** dạng: `on[Tên_Thuộc_Tính]Change`.

```typescript
interface UserProfile {
  username: string;
  age: number;
  avatarUrl: string;
}

// Thiết kế kiểu lắng nghe sự kiện thay đổi thuộc tính:
type PropListener<T> = {
  // Ánh xạ đổi tên key: chuyển username thành onUsernameChange, age thành onAgeChange...
  // Vế phải: callback nhận vào giá trị mới có cùng kiểu dữ liệu với thuộc tính gốc (T[P])
  on(
    eventName: `on${Capitalize<string & keyof T>}Change`, 
    callback: (newValue: T[keyof T]) => void
  ): void;
};

// Sử dụng:
const profileWatcher: PropListener<UserProfile> = {
  on(event, callback) {
    console.log(`Lắng nghe sự kiện: ${event}`);
  }
};

// Gọi thử:
profileWatcher.on("onUsernameChange", (newVal) => {
  // newVal sẽ có kiểu: string | number
});
```

---

## 3. Ứng dụng nâng cao: Lọc thuộc tính theo Kiểu dữ liệu (Property Filtering)
Bạn có thể kết hợp Mapped Types và Conditional Types để **chỉ lấy ra các thuộc tính có kiểu mong muốn** (ví dụ: chỉ lấy các thuộc tính kiểu `string` của đối tượng).

```typescript
type PickByType<T, ValueType> = {
  // Nếu kiểu của thuộc tính T[P] tương thích với ValueType, giữ nguyên key P, ngược lại biến key thành never
  [P in keyof T as T[P] extends ValueType ? P : never]: T[P];
};

interface Device {
  id: number;
  name: string;
  isActive: boolean;
  model: string;
}

// Lọc đối tượng Device chỉ giữ lại các trường kiểu string:
// Kiểu StringFields tương đương với: { name: string; model: string; }
type StringFields = PickByType<Device, string>;
```
*Giải thích cơ chế:* Khi một key được ánh xạ thành kiểu `never` bằng mệnh đề `as never`, TypeScript sẽ tự động **loại bỏ (filter out)** key đó ra khỏi cấu trúc đối tượng kết quả. Đây là một mẹo thiết kế kiểu cực kỳ kinh điển trong TypeScript nâng cao.
