## 1. `ReturnType<T>` (Trích xuất kiểu giá trị trả về của Hàm)
Tương tự như `Parameters`, có những trường hợp bạn sử dụng một hàm phức tạp từ thư viện bên ngoài và muốn định nghĩa kiểu dữ liệu cho một biến lưu trữ kết quả đầu ra của hàm đó, nhưng thư viện không cung cấp sẵn kiểu dữ liệu này.

**`ReturnType<T>`** nhận vào kiểu dữ liệu của một hàm `T` và trích xuất ra kiểu dữ liệu của **giá trị trả về (return value)** từ hàm đó.

### Định nghĩa dưới lớp vỏ:
```typescript
type MyReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;
```
*Ý nghĩa:* Tự động dò tìm và suy luận (`infer`) ra kiểu dữ liệu trả về `R` của hàm.

### Ví dụ ứng dụng thực tế:
```typescript
function createUserFactory(role: "admin" | "user") {
  return {
    id: Math.random(),
    role,
    permissions: role === "admin" ? ["read", "write"] : ["read"],
    settings: {
      theme: "dark" as const
    }
  };
}

// Trích xuất kiểu trả về của hàm factory:
type UserObject = ReturnType<typeof createUserFactory>;
/*
  Kiểu UserObject tự động được suy luận là:
  {
    id: number;
    role: "admin" | "user";
    permissions: string[];
    settings: { theme: "dark" };
  }
*/

// Sử dụng kiểu dữ liệu trích xuất được để gán cho biến lưu trữ
let adminUser: UserObject = createUserFactory("admin");
```

---

## 2. `Awaited<T>` (Giải nén kiểu của Promise)
Trong JavaScript/TypeScript hiện đại, hầu hết các tác vụ xử lý Backend (như truy vấn cơ sở dữ liệu, gọi HTTP Request, đọc ghi file...) đều là các tác vụ bất đồng bộ và trả về đối tượng `Promise<Type>`.

Khi sử dụng cú pháp `async/await`, kết quả thực tế nhận được khi chạy hàm không phải là `Promise` mà là **giá trị đã được giải nén bên trong Promise đó**.

**`Awaited<T>`** mô phỏng chính xác hành vi giải nén này ở mức độ kiểu dữ liệu: nó bóc lớp vỏ `Promise` ra để lấy kiểu dữ liệu thực tế bên trong (và tự động đệ quy bóc tách nếu có nhiều lớp Promise lồng nhau).

### Ví dụ ứng dụng thực tế:
```typescript
async function fetchUserFromDB(id: number) {
  return { id, name: "Alice", email: "alice@db.com" };
}

// Kiểu trả về của hàm fetchUserFromDB là: Promise<{ id: number, name: string, email: string }>
type RawFetchType = ReturnType<typeof fetchUserFromDB>;

// Giải nén Promise để lấy kiểu dữ liệu thực tế sau khi await:
// Kiểu UserEntity tương đương với: { id: number, name: string, email: string }
type UserEntity = Awaited<RawFetchType>;

// Sử dụng kiểu thực tế này để lưu trữ hoặc truyền đi nơi khác:
const currentUser: UserEntity = {
  id: 1,
  name: "Alice",
  email: "alice@db.com"
};
```
*Mẹo:* `Awaited` cực kỳ hữu dụng khi bạn cần khai báo kiểu dữ liệu cho dữ liệu đầu vào của các bộ kiểm thử tự động (Unit Tests) để giả lập (mock) dữ liệu trả về từ Database.
