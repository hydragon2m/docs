## 1. Mapped Types là gì?
Khi bạn không muốn viết lặp lại các cấu trúc đối tượng gần giống nhau, hoặc muốn tự động biến đổi toàn bộ thuộc tính của một đối tượng sẵn có sang định dạng khác (ví dụ: biến toàn bộ thuộc tính thành optional, chuyển thành kiểu hàm getter...), **Mapped Types (Kiểu ánh xạ)** là giải pháp tối ưu nhất.

Mapped Types hoạt động tương tự như phương thức `.map()` của mảng trong JavaScript: **nó duyệt qua từng thuộc tính của đối tượng cũ để ánh xạ và tạo ra các thuộc tính mới**.

---

## 2. Cú pháp cơ bản
Chúng ta sử dụng cú pháp vòng lặp `in keyof` bên trong dấu ngoặc nhọn `{}`:

```typescript
type MappedType<T> = {
  [K in keyof T]: T[K]; // Duyệt qua từng key K trong T, giữ nguyên kiểu dữ liệu T[K]
};
```

### Ví dụ thực tế: Biến mọi thuộc tính của đối tượng thành kiểu `boolean`
```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

type OptionsFlags<T> = {
  [Property in keyof T]: boolean;
};

// Kiểu UserFlags tương đương: { id: boolean; name: boolean; email: boolean }
type UserFlags = OptionsFlags<User>; 
```

---

## 3. Các khía cạnh nâng cao của Mapped Types

### a. Thêm/Xóa Modifiers (`+` và `-`)
Bạn có thể điều khiển hành vi của từ khóa `readonly` và toán tử tùy chọn `?` bằng cách sử dụng tiền tố cộng `+` (thêm vào - mặc định) hoặc trừ `-` (xóa bỏ đi).

```typescript
// Xóa bỏ trạng thái readonly ở mọi thuộc tính
type CreateMutable<T> = {
  -readonly [P in keyof T]: T[P];
};

interface ReadonlyUser {
  readonly id: number;
  readonly name: string;
}

type MutableUser = CreateMutable<ReadonlyUser>; // Kiểu: { id: number; name: string }
```

---

### b. Key Remapping bằng từ khóa `as` (Đổi tên Keys động)
Từ phiên bản TypeScript 4.1, bạn có thể **đổi tên** các key trong quá trình ánh xạ bằng cách sử dụng từ khóa **`as`** kết hợp với **Template Literal Types** (sẽ học kỹ ở Bài 05).

#### Ví dụ nâng cao: Tự động tạo hàm Getter cho mọi thuộc tính của đối tượng
Chúng ta có đối tượng `User` và muốn tự động tạo kiểu cho class chứa các hàm `getId()`, `getName()`, `getEmail()`:

```typescript
type Getters<T> = {
  // Ánh xạ key 'P', đổi tên thành 'get[Tên_Key]' viết hoa chữ cái đầu (Capitalize), 
  // và biến value thành một hàm trả về T[P]
  [P in keyof T as `get${Capitalize<string & P>}`]: () => T[P];
};

interface User {
  id: number;
  name: string;
}

// Kiểu UserGetters tương đương: { getId: () => number; getName: () => string; }
type UserGetters = Getters<User>; 

const userAPI: UserGetters = {
  getId: () => 101,
  getName: () => "Alice"
};
```
*Lưu ý:* `Capitalize` là một Utility Type có sẵn của TS để viết hoa chữ cái đầu của chuỗi. Toán tử `string & P` dùng để ép TypeScript hiểu `P` ở đây là một chuỗi chữ (vì key của object trong lý thuyết có thể là symbol hoặc number).
