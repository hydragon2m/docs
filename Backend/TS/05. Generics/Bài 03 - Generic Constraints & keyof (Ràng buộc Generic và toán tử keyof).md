## 1. Toán tử `keyof` (Bộ gom nhóm Keys của Object)
Trong TypeScript, toán tử **`keyof`** là một toán tử mức kiểu dữ liệu (type operator) nhận vào một kiểu đối tượng và trả về một **Union Type chứa toàn bộ các key (thuộc tính) dạng chuỗi hoặc số** của đối tượng đó.

### Ví dụ cơ bản:
```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// Kiểu UserKeys sẽ là union: "id" | "name" | "email"
type UserKeys = keyof User; 

let key: UserKeys = "name";  // ✅ Hợp lệ
// let key: UserKeys = "phone"; // ❌ Lỗi compile!
```

---

## 2. Kết hợp Generic Constraints và `keyof`

Sự kết hợp giữa Generic Constraints (Ràng buộc Generic bằng `extends`) và toán tử `keyof` tạo ra một trong những kỹ thuật kiểm soát kiểu dữ liệu mạnh mẽ nhất của TypeScript: **Ràng buộc một tham số kiểu phải là key hợp lệ của một tham số kiểu khác**.

### Cú pháp nâng cao:
```typescript
<T, K extends keyof T>
```
*Ý nghĩa:* `T` là một đối tượng bất kỳ, và `K` bắt buộc phải là một trong những tên thuộc tính (key) hợp lệ thuộc cấu trúc của `T`.

---

## 3. Ứng dụng kinh điển: Hàm lấy thuộc tính an toàn (`getProperty`)

Hãy viết một hàm nhận vào một đối tượng và một tên key, sau đó trả về giá trị của key đó.

### Nếu viết không dùng ràng buộc:
```typescript
function getProperty(obj: any, key: string) {
  return obj[key]; // Trả về any, mất hoàn toàn an toàn kiểu dữ liệu
}
```

### Nếu viết sử dụng Generic và `keyof`:
```typescript
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]; // Trả về đúng kiểu dữ liệu của thuộc tính đó (T[K])
}

const user = {
  id: 1,
  name: "Alice",
  isAdmin: true
};

// TypeScript tự động suy luận:
// - T là kiểu { id: number, name: string, isAdmin: boolean }
// - K là kiểu literal "name" (hợp lệ vì "name" là key của T)
// - Kiểu trả về T[K] tương ứng chính xác là 'string'
const userName = getProperty(user, "name"); // userName có kiểu là string

// ❌ Lỗi compile lập tức! "phone" không nằm trong tập hợp keyof T
// const userPhone = getProperty(user, "phone"); 
```

---

## 4. Các Lưu ý quan trọng khi sử dụng

> [!IMPORTANT]
> ### Kiểu trả về Lookup Type (`T[K]`)
> Cú pháp `T[K]` được gọi là **Indexed Access Type** (Kiểu truy cập theo chỉ mục). Nó giúp TypeScript tự động ánh xạ kiểu trả về khớp 100% với kiểu thực tế của thuộc tính.
>
> Như ví dụ trên:
> * Nếu truyền key là `"id"`, giá trị trả về tự động là kiểu `number`.
> * Nếu truyền key là `"isAdmin"`, giá trị trả về tự động là kiểu `boolean`.
>
> Kỹ thuật này giúp bạn viết code thư viện, framework hoặc tiện ích (utils) cực kỳ linh hoạt nhưng không bao giờ lo lắng về việc bị mất dấu kiểu dữ liệu.
