## 1. Phân biệt `typeof` ở runtime (JS) vs `typeof` ở mức kiểu (TS)
Trong JavaScript, `typeof` là toán tử runtime trả về chuỗi mô tả kiểu cơ bản của một giá trị.

Trong TypeScript, **`typeof`** còn có thể được sử dụng **ở ngữ cảnh khai báo kiểu (type context)** để trích xuất kiểu dữ liệu tĩnh của một biến, đối tượng, hoặc một hàm đang tồn tại, giúp bạn nhân bản cấu trúc dữ liệu đó mà không cần viết lại.

### Ví dụ thực tế:
```typescript
const appSettings = {
  host: "localhost",
  port: 8080,
  enableLogs: true
};

// Trích xuất kiểu tĩnh của đối tượng appSettings
type SettingsType = typeof appSettings;
/*
  SettingsType tương đương với:
  {
    host: string;
    port: number;
    enableLogs: boolean;
  }
*/

let newSettings: SettingsType = {
  host: "127.0.0.1",
  port: 3000,
  enableLogs: false
};
```

---

## 2. Toán tử `keyof` nâng cao (Index Signatures và Class)

Ở chương Generics, bạn đã biết `keyof` dùng để lấy ra danh sách key của một Interface/Object Type. Dưới đây là các hành vi nâng cao của `keyof`:

### a. `keyof` trên đối tượng có Index Signature (Thuộc tính động)
Nếu đối tượng có index signature dạng số (`[key: number]: any`) hoặc chuỗi (`[key: string]: any`), `keyof` sẽ trả về kiểu tương ứng:

```typescript
type StringMap = { [key: string]: boolean };
type StringMapKeys = keyof StringMap; // Kiểu: string | number
// Lưu ý: Trong JS, key số sẽ tự động được convert thành string khi truy xuất, 
// nên keyof của string index signature luôn là string | number.

type NumberMap = { [key: number]: boolean };
type NumberMapKeys = keyof NumberMap; // Kiểu duy nhất là: number
```

### b. `keyof` trên Class (Lớp)
Khi dùng `keyof` trên tên Class, nó sẽ lấy các thuộc tính thuộc về **instance (thực thể)** của class đó, chứ không phải các phương thức static.

```typescript
class User {
  id!: number;
  name!: string;
  static roles: string[];
}

type UserKeys = keyof User; // Kiểu: "id" | "name" (Không chứa "roles" tĩnh)
```

---

## 3. Sự kết hợp kinh điển: `keyof typeof`

Khi bạn muốn lấy danh sách key của một **đối tượng giá trị JavaScript thực tế** (Value), bạn bắt buộc phải dùng kết hợp `keyof typeof` vì `keyof` chỉ chạy trên Kiểu dữ liệu (Type), không chạy trực tiếp trên Giá trị.

```typescript
const colors = {
  red: "#ff0000",
  green: "#00ff00",
  blue: "#0000ff"
};

// Bước 1: typeof colors -> Lấy ra kiểu đối tượng
// Bước 2: keyof kiểu_đó -> Lấy ra union các key
type ColorNames = keyof typeof colors; // Kiểu: "red" | "green" | "blue"

function selectColor(color: ColorNames) {
  return colors[color]; // ✅ An toàn kiểu dữ liệu 100%
}
```
 Kỹ thuật này giúp bạn giữ vững nguyên lý Single Source of Truth (Một nguồn sự thật duy nhất): Chỉ cần cập nhật đối tượng JavaScript gốc, hệ thống kiểu tự động cập nhật theo mà không cần khai báo lại.
