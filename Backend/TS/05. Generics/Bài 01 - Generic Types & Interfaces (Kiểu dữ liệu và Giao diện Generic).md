## 1. Khái niệm cơ bản
Ở phần **02. Function (Bài 03)**, bạn đã làm quen với Hàm Generic. 

Trong TypeScript, sức mạnh của Generic không chỉ dừng lại ở Hàm mà còn có thể áp dụng trực tiếp cho **Type Aliases** và **Interfaces**. Điều này cho phép bạn định nghĩa các khuôn mẫu cấu trúc dữ liệu cực kỳ linh hoạt và có khả năng tái sử dụng cao.

---

## 2. Cú pháp khai báo

Bạn sử dụng cặp ngoặc nhọn `<T>` ngay sau tên Interface hoặc Type Alias:

### a. Đối với Interface:
```typescript
interface Box<T> {
  contents: T; // Kiểu của contents sẽ do người dùng truyền vào quyết định
}

const stringBox: Box<string> = { contents: "hello" };
const numberBox: Box<number> = { contents: 100 };
```

### b. Đối với Type Alias:
```typescript
type KeyValuePair<K, V> = {
  key: K;
  value: V;
};

const entry: KeyValuePair<string, number> = { key: "age", value: 25 };
```

---

## 3. Ứng dụng nâng cao thực tế: Chuẩn hóa phản hồi API (API Response Wrapping)

Trong phát triển Backend (như NestJS), bạn thường phải trả về một cấu trúc phản hồi API đồng nhất nhưng có phần dữ liệu (`data`) thay đổi tùy theo tài nguyên (ví dụ: danh sách users, thông tin product, v.v.). 

Generic Interfaces là giải pháp hoàn hảo để chuẩn hóa trường hợp này:

```typescript
// Định nghĩa cấu trúc chuẩn hóa cho mọi Response từ Server
interface ApiResponse<T> {
  status: "success" | "error";
  data: T; // Dữ liệu thực tế linh hoạt theo kiểu T
  message?: string;
}

// Cấu trúc dữ liệu cụ thể
interface User {
  id: number;
  name: string;
}
interface Product {
  sku: string;
  price: number;
}

// Tái sử dụng ApiResponse với các kiểu dữ liệu khác nhau:
const userResponse: ApiResponse<User> = {
  status: "success",
  data: { id: 1, name: "Alice" }
};

const productResponse: ApiResponse<Product[]> = {
  status: "success",
  data: [
    { sku: "PROD-01", price: 150000 },
    { sku: "PROD-02", price: 200000 }
  ]
};
```

---

## 4. Các Lưu ý quan trọng khi sử dụng

> [!IMPORTANT]
> ### 1. Phải truyền tham số kiểu khi sử dụng kiểu dữ liệu
> Không giống như hàm Generic (TypeScript có thể tự suy luận kiểu dựa vào đối số truyền vào), đối với Generic Type/Interface, bạn **bắt buộc phải chỉ định tham số kiểu cụ thể** khi dùng nó để khai báo biến, trừ khi kiểu đó có định nghĩa giá trị mặc định (sẽ học ở Bài 04).
>
> ```typescript
> // ❌ Lỗi compile: Generic type 'Box<T>' requires 1 type argument(s).
> // const myBox: Box = { contents: "hello" }; 
> 
> // ✅ Hợp lệ
> const myBox: Box<string> = { contents: "hello" };
> ```

> [!CAUTION]
> ### 2. Tránh lạm dụng Generic quá đà (Over-engineering)
> Chỉ sử dụng Generic khi cấu trúc dữ liệu thực sự cần chứa các kiểu dữ liệu biến động khác nhau. Nếu cấu trúc của bạn cố định, hãy khai báo kiểu tĩnh thông thường. Việc tạo ra quá nhiều Generic lồng nhau (`Box<KeyValuePair<string, ApiResponse<User>>>`) sẽ làm code trở nên cực kỳ khó đọc và bảo trì.
